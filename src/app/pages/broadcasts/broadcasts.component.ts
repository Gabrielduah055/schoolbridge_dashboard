import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, map, of } from 'rxjs';
import { ApiService, Broadcast, MessageRecipient } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

interface BroadcastDraftForm {
  title: string;
  audienceType: Broadcast['audienceType'];
  originalText: string;
  targetClass: string;
  recipientPhone: string;
  telegram: boolean;
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
  recipientCounts = new Map<string, number>();
  deliverySummaries = new Map<string, string>();

  draft: BroadcastDraftForm = {
    title: '',
    audienceType: 'whole_school',
    originalText: '',
    targetClass: '',
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
    return this.broadcasts.filter((broadcast) => broadcast.status === 'sent').length;
  }

  get pendingApprovalCount(): number {
    return this.broadcasts.filter((broadcast) => broadcast.approvalStatus === 'pending_approval' || broadcast.approvalStatus === 'draft').length;
  }

  get failedCount(): number {
    return this.broadcasts.filter((broadcast) => ['failed', 'partial', 'partially_failed'].includes(broadcast.status)).length;
  }

  get requiresClass(): boolean {
    return this.draft.audienceType === 'class';
  }

  get requiresRecipientPhone(): boolean {
    return ['individual', 'individual_parent'].includes(this.draft.audienceType);
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

    if (this.requiresRecipientPhone && !this.draft.recipientPhone.trim()) {
      this.actionMessage = 'Enter the recipient phone number for this broadcast.';
      return;
    }

    const channels: Array<'telegram'> = [];
    if (this.draft.telegram) channels.push('telegram');

    this.saving = true;
    this.actionMessage = 'Creating draft...';
    this.api.createBroadcastDraft({
      createdByRole: 'admin',
      audienceType: this.draft.audienceType,
      title: this.draft.title.trim(),
      originalText,
      targetClass: this.draft.targetClass.trim(),
      recipientPhone: this.draft.recipientPhone.trim(),
      channels: channels.length ? channels : ['telegram']
    }).subscribe({
      next: () => {
        this.saving = false;
        this.actionMessage = 'Broadcast draft created.';
        this.draft = {
          title: '',
          audienceType: 'whole_school',
          originalText: '',
          targetClass: '',
          recipientPhone: '',
          telegram: true
        };
        this.loadBroadcasts();
      },
      error: (err) => {
        console.error('Failed to create broadcast draft', err);
        this.saving = false;
        this.actionMessage = 'Could not create the broadcast draft.';
      }
    });
  }

  approve(broadcast: Broadcast): void {
    const currentText = broadcast.draftedText || broadcast.originalText || '';
    const editedText = window.prompt('Review or edit the final broadcast message before approval.', currentText);
    if (editedText === null) return;
    this.runBroadcastAction(broadcast, 'approve', editedText.trim() || currentText);
  }

  send(broadcast: Broadcast): void {
    this.runBroadcastAction(broadcast, 'send');
  }

  audienceLabel(broadcast: Broadcast): string {
    if (broadcast.audienceType === 'class') return `Class: ${broadcast.targetClass || broadcast.classId || '-'}`;
    if (['individual', 'individual_parent'].includes(broadcast.audienceType)) return `Individual: ${broadcast.recipientPhone || '-'}`;
    return broadcast.audienceType.replace(/_/g, ' ');
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
          this.actionId = '';
          this.actionMessage = 'Broadcast approved.';
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
          `${updated.deliverySummary.sentCount} sent, ${updated.deliverySummary.failedCount} failed, ${updated.deliverySummary.pendingCount} pending`
        );
        this.actionId = '';
        this.actionMessage = 'Broadcast send completed.';
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
    this.api.getBroadcasts().subscribe({
      next: (broadcasts) => {
        this.broadcasts = broadcasts;
        this.loading = false;
        this.loadRecipientSummaries(broadcasts);
      },
      error: (err) => {
        console.error('Failed to load broadcasts', err);
        this.error = 'Could not load broadcasts. Check the admin API key in Settings.';
        this.loading = false;
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
        this.deliverySummaries.set(result.id, `${delivered} sent or delivered${failed ? `, ${failed} failed` : ''}`);
      }
    });
  }
}
