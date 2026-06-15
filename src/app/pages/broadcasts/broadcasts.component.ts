import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, map, of } from 'rxjs';
import { ApiService, Broadcast, MessageRecipient } from '../../core/services/api.service';

interface BroadcastDraftForm {
  title: string;
  audienceType: Broadcast['audienceType'];
  originalText: string;
  telegram: boolean;
  whatsapp: boolean;
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
    telegram: true,
    whatsapp: false
  };

  constructor(private readonly api: ApiService) {}

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
    return this.broadcasts.filter((broadcast) => broadcast.status === 'failed' || broadcast.status === 'partial').length;
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

  createDraft(): void {
    const originalText = this.draft.originalText.trim();
    if (!originalText) {
      this.actionMessage = 'Write a broadcast message before creating a draft.';
      return;
    }

    const channels: Array<'telegram' | 'whatsapp'> = [];
    if (this.draft.telegram) channels.push('telegram');
    if (this.draft.whatsapp) channels.push('whatsapp');

    this.saving = true;
    this.actionMessage = 'Creating draft...';
    this.api.createBroadcastDraft({
      createdByRole: 'admin',
      audienceType: this.draft.audienceType,
      title: this.draft.title.trim(),
      originalText,
      channels: channels.length ? channels : ['telegram']
    }).subscribe({
      next: () => {
        this.saving = false;
        this.actionMessage = 'Broadcast draft created.';
        this.draft = { title: '', audienceType: 'whole_school', originalText: '', telegram: true, whatsapp: false };
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
    this.runBroadcastAction(broadcast, 'approve');
  }

  send(broadcast: Broadcast): void {
    this.runBroadcastAction(broadcast, 'send');
  }

  private runBroadcastAction(broadcast: Broadcast, action: 'approve' | 'send'): void {
    const id = this.broadcastId(broadcast);
    if (!id) return;
    this.actionId = id;
    const request = action === 'approve' ? this.api.approveBroadcast(id) : this.api.sendBroadcast(id);
    request.subscribe({
      next: (updated) => {
        this.broadcasts = this.broadcasts.map((item) => this.broadcastId(item) === id ? updated : item);
        this.actionId = '';
        this.actionMessage = action === 'approve' ? 'Broadcast approved.' : 'Broadcast send started.';
        this.loadRecipientSummaries(this.broadcasts);
      },
      error: (err) => {
        console.error(`Failed to ${action} broadcast`, err);
        this.actionId = '';
        this.actionMessage = `Could not ${action} broadcast.`;
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
