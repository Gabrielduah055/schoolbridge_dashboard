import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, map, of } from 'rxjs';
import { ApiService, ApiStudent, Broadcast, BroadcastMetrics, BroadcastRecipientPreview, MessageRecipient } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

interface BroadcastDraftForm {
  title: string;
  audienceType: Broadcast['audienceType'];
  originalText: string;
  targetClass: string;
  recipientStudentId: string;
  recipientPhone: string;
  telegram: boolean;
}

interface StudentOption {
  id: string;
  name: string;
  className: string;
  parentName: string;
}

@Component({
  selector: 'app-broadcasts-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './broadcasts.component.html',
  styleUrl: './broadcasts.component.css'
})
export class BroadcastsComponent implements OnInit {
  loading = true;
  saving = false;
  actionId = '';
  error = '';
  actionMessage = '';
  broadcasts: Broadcast[] = [];
  students: StudentOption[] = [];
  metrics: BroadcastMetrics | null = null;
  recipientCounts = new Map<string, number>();
  deliverySummaries = new Map<string, string>();
  editedDrafts = new Map<string, string>();
  selectedAttachment: File | null = null;
  preview: BroadcastRecipientPreview | null = null;
  previewLoading = false;
  previewMessage = '';

  draft: BroadcastDraftForm = {
    title: '',
    audienceType: 'whole_school',
    originalText: '',
    targetClass: '',
    recipientStudentId: '',
    recipientPhone: '',
    telegram: true
  };

  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadBroadcasts();
  }

  get sentCount(): number {
    return this.metrics?.sentTotal ?? this.broadcasts.filter((broadcast) => ['sent', 'partially_failed'].includes(broadcast.status)).length;
  }

  get pendingApprovalCount(): number {
    return this.metrics?.pendingApprovalCount ?? this.broadcasts.filter((broadcast) => broadcast.approvalStatus === 'pending_approval' || broadcast.approvalStatus === 'draft').length;
  }

  get failedCount(): number {
    return this.metrics?.failedCount ?? this.broadcasts.filter((broadcast) => broadcast.status === 'failed').length;
  }

  get attachmentLabel(): string {
    return this.selectedAttachment ? `${this.selectedAttachment.name} (${this.fileSize(this.selectedAttachment.size)})` : 'No document attached';
  }

  get requiresClass(): boolean {
    return this.draft.audienceType === 'class';
  }

  get requiresRecipientPhone(): boolean {
    return false;
  }

  get requiresStudentRecipient(): boolean {
    return ['individual', 'individual_parent'].includes(this.draft.audienceType);
  }

  get selectedStudent(): StudentOption | undefined {
    return this.students.find((student) => student.id === this.draft.recipientStudentId);
  }

  statusClass(value?: string | null): string {
    return `status-${(value || 'unknown').replace(/_/g, '-').replace(/\s+/g, '-').toLowerCase()}`;
  }

  formatDate(value?: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  broadcastId(broadcast: Broadcast): string {
    return broadcast._id || broadcast.id || '';
  }

  recipientCount(broadcast: Broadcast): string {
    const id = this.broadcastId(broadcast);
    return this.recipientCounts.has(id) ? String(this.recipientCounts.get(id)) : '-';
  }

  deliverySummary(broadcast: Broadcast): string {
    return this.deliverySummaries.get(this.broadcastId(broadcast)) || 'Recipient details unavailable';
  }

  editableText(broadcast: Broadcast): string {
    const id = this.broadcastId(broadcast);
    return this.editedDrafts.get(id) ?? broadcast.draftedText ?? broadcast.originalText ?? '';
  }

  setEditedDraft(broadcast: Broadcast, value: string): void {
    const id = this.broadcastId(broadcast);
    if (id) this.editedDrafts.set(id, value);
  }

  attachmentSummary(broadcast: Broadcast): string {
    const count = broadcast.attachments?.length ?? 0;
    if (count === 0) return '';
    if (count === 1) {
      const attachment = broadcast.attachments?.[0];
      return `${attachment?.originalName || 'document'} - ${attachment?.mimeType || 'file'} - ${this.fileSize(attachment?.size || 0)}`;
    }
    return `${count} attachments`;
  }

  hasPermission(permission: string): boolean {
    return this.auth.hasPermission(permission);
  }

  createDraft(): void {
    const originalText = this.draft.originalText.trim();
    if (!originalText) {
      this.actionMessage = 'Write a broadcast message before creating a draft.';
      return;
    }

    if (this.requiresClass && !this.draft.targetClass.trim()) {
      this.actionMessage = 'Enter the class name for this broadcast.';
      return;
    }

    if (this.requiresStudentRecipient && !this.draft.recipientStudentId) {
      this.actionMessage = 'Select the child whose parent should receive this broadcast.';
      return;
    }

    const channels: Array<'telegram'> = [];
    if (this.draft.telegram) channels.push('telegram');

    this.saving = true;
    this.actionMessage = 'Creating draft...';
    this.api.createBroadcastDraft({
      audienceType: this.draft.audienceType,
      title: this.draft.title.trim(),
      originalText,
      targetClass: this.draft.targetClass.trim(),
      recipientStudentId: this.draft.recipientStudentId,
      recipientStudentName: this.selectedStudent?.name,
      recipientPhone: this.draft.recipientPhone.trim(),
      channels: channels.length ? channels : ['telegram'],
      attachment: this.selectedAttachment
    }).subscribe({
      next: () => {
        this.saving = false;
        this.actionMessage = 'Broadcast draft created.';
        this.draft = {
          title: '',
          audienceType: 'whole_school',
          originalText: '',
          targetClass: '',
          recipientStudentId: '',
          recipientPhone: '',
          telegram: true
        };
        this.selectedAttachment = null;
        this.preview = null;
        this.previewMessage = '';
        this.loadBroadcasts();
      },
      error: (err) => {
        console.error('Failed to create broadcast draft', err);
        this.saving = false;
        this.actionMessage = 'Could not create the broadcast draft.';
      }
    });
  }

  previewRecipients(): void {
    if (this.requiresClass && !this.draft.targetClass.trim()) {
      this.previewMessage = 'Enter the class name before previewing recipients.';
      return;
    }

    if (this.requiresStudentRecipient && !this.draft.recipientStudentId) {
      this.previewMessage = 'Select the child before previewing recipients.';
      return;
    }

    this.previewLoading = true;
    this.previewMessage = 'Checking Telegram reachability...';
    this.api.previewBroadcastRecipients({
      audienceType: this.draft.audienceType,
      targetClass: this.draft.targetClass.trim(),
      recipientStudentId: this.draft.recipientStudentId,
      recipientPhone: this.draft.recipientPhone.trim(),
      channels: this.draft.telegram ? ['telegram'] : []
    }).subscribe({
      next: (preview) => {
        this.preview = preview;
        this.previewLoading = false;
        this.previewMessage = preview.reachableNow === 0
          ? 'No selected contacts can receive this broadcast on Telegram right now.'
          : `${preview.reachableNow} of ${preview.totalContacts} contacts can receive this broadcast now.`;
      },
      error: (err) => {
        console.error('Failed to preview broadcast recipients', err);
        this.preview = null;
        this.previewLoading = false;
        this.previewMessage = 'Could not preview recipients.';
      }
    });
  }

  approve(broadcast: Broadcast): void {
    const currentText = this.editableText(broadcast).trim();
    if (!currentText) {
      this.actionMessage = 'Review message cannot be empty.';
      return;
    }
    this.runBroadcastAction(broadcast, 'approve', currentText);
  }

  send(broadcast: Broadcast): void {
    this.runBroadcastAction(broadcast, 'send');
  }

  audienceLabel(broadcast: Broadcast): string {
    if (broadcast.audienceType === 'class') return `Class: ${broadcast.targetClass || broadcast.classId || '-'}`;
    if (['individual', 'individual_parent'].includes(broadcast.audienceType)) {
      return `Child: ${broadcast.recipientStudentName || broadcast.recipientPhone || '-'}`;
    }
    return broadcast.audienceType.replace(/_/g, ' ');
  }

  canSend(broadcast: Broadcast): boolean {
    return broadcast.approvalStatus === 'approved' &&
      !['sent', 'partially_failed', 'failed', 'sending'].includes(broadcast.status);
  }

  statusExplanation(broadcast: Broadcast): string {
    if (broadcast.status === 'partially_failed') {
      return 'Some recipients received this broadcast, but others could not be reached.';
    }
    if (broadcast.status === 'failed') {
      return 'No recipients were reached, or sending failed completely.';
    }
    if (broadcast.status === 'approved') {
      return 'Approved and ready to send.';
    }
    return '';
  }

  auditLine(label: string, name?: string, role?: string, date?: string | null): string {
    if (!name) return '';
    const roleText = role ? ` (${role})` : '';
    const dateText = date ? ` - ${this.formatDate(date)}` : '';
    return `${label} ${name}${roleText}${dateText}`;
  }

  onAttachmentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedAttachment = input.files?.[0] ?? null;
  }

  clearAttachment(input: HTMLInputElement): void {
    input.value = '';
    this.selectedAttachment = null;
  }

  private runBroadcastAction(broadcast: Broadcast, action: 'approve' | 'send', draftedText?: string): void {
    const id = this.broadcastId(broadcast);
    if (!id) return;
    this.actionId = id;
    this.actionMessage = action === 'approve' ? 'Approving broadcast...' : 'Sending broadcast...';

    if (action === 'approve') {
      this.api.approveBroadcast(id, draftedText).subscribe({
        next: (updated) => {
          this.broadcasts = this.broadcasts.map((item) => this.broadcastId(item) === id ? updated : item);
          this.editedDrafts.set(id, updated.draftedText || draftedText || '');
          this.actionId = '';
          this.actionMessage = 'Broadcast approved.';
          this.loadMetrics();
          this.loadRecipientSummaries(this.broadcasts);
        },
        error: (err) => {
          console.error('Failed to approve broadcast', err);
          this.actionId = '';
          this.actionMessage = 'Could not approve broadcast.';
        }
      });
      return;
    }

    this.api.sendBroadcast(id).subscribe({
      next: (updated) => {
        this.broadcasts = this.broadcasts.map((item) => this.broadcastId(item) === id ? updated.broadcast : item);
        this.recipientCounts.set(id, updated.deliverySummary.totalRecipients);
        this.deliverySummaries.set(
          id,
          `Sent: ${updated.deliverySummary.sentCount} / Failed: ${updated.deliverySummary.failedCount + updated.deliverySummary.pendingCount} / Total: ${updated.deliverySummary.totalRecipients}`
        );
        this.actionId = '';
        this.actionMessage = 'Broadcast send completed.';
        this.loadMetrics();
        this.loadRecipientSummaries(this.broadcasts);
      },
      error: (err) => {
        console.error('Failed to send broadcast', err);
        this.actionId = '';
        this.actionMessage = 'Could not send broadcast.';
      }
    });
  }

  private loadBroadcasts(): void {
    this.loading = true;
    this.error = '';
    this.loadMetrics();
    this.loadStudents();
    this.api.getBroadcasts().subscribe({
      next: (broadcasts) => {
        this.broadcasts = broadcasts;
        this.seedEditedDrafts(broadcasts);
        this.loading = false;
        this.loadRecipientSummaries(broadcasts);
      },
      error: (err) => {
        console.error('Failed to load broadcasts', err);
        this.error = 'Could not load broadcasts. Please sign in again or check your permissions.';
        this.loading = false;
      }
    });
  }

  private loadMetrics(): void {
    this.api.getBroadcastMetrics().subscribe({
      next: (metrics) => {
        this.metrics = metrics;
      },
      error: (err) => {
        console.error('Failed to load broadcast metrics', err);
      }
    });
  }

  private loadStudents(): void {
    this.api.getStudents().subscribe({
      next: (students) => {
        this.students = students
          .map((student) => this.toStudentOption(student))
          .filter((student): student is StudentOption => Boolean(student?.id && student.name))
          .sort((a, b) => a.name.localeCompare(b.name));
      },
      error: (err) => {
        console.error('Failed to load students for broadcast recipient picker', err);
      }
    });
  }

  private loadRecipientSummaries(broadcasts: Broadcast[]): void {
    const requests = broadcasts
      .slice(0, 25)
      .map((broadcast) => {
        const id = this.broadcastId(broadcast);
        return this.api.getBroadcastRecipients(id).pipe(
          map((recipients) => ({ id, recipients })),
          catchError(() => of({ id, recipients: [] as MessageRecipient[] }))
        );
      });

    if (requests.length === 0) return;

    forkJoin(requests).subscribe((results) => {
      for (const result of results) {
        this.recipientCounts.set(result.id, result.recipients.length);
        const failed = result.recipients.filter((recipient) => recipient.status === 'failed').length;
        const delivered = result.recipients.filter((recipient) => ['sent', 'delivered', 'read'].includes(recipient.status)).length;
        const skipped = result.recipients.filter((recipient) => recipient.status === 'skipped').length;
        this.deliverySummaries.set(result.id, `Sent: ${delivered} / Failed: ${failed + skipped} / Total: ${result.recipients.length}`);
      }
    });
  }

  private seedEditedDrafts(broadcasts: Broadcast[]): void {
    for (const broadcast of broadcasts) {
      const id = this.broadcastId(broadcast);
      if (id && !this.editedDrafts.has(id)) {
        this.editedDrafts.set(id, broadcast.draftedText || broadcast.originalText || '');
      }
    }
  }

  private fileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private toStudentOption(student: ApiStudent): StudentOption | null {
    const record = student as Record<string, unknown>;
    const id = this.readText(record, ['_id', 'id']);
    const name = this.readText(record, ['name']);
    if (!id || !name) return null;

    return {
      id,
      name,
      className: this.readText(record, ['class', 'className']) || 'Unassigned',
      parentName: this.readText(record, ['parentName']) || 'Parent'
    };
  }

  private readText(record: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
      const value = record[key];
      if (value !== undefined && value !== null) return String(value);
    }
    return '';
  }
}
