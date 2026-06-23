import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService, ChannelAccount, DeliveryLog, WebhookEvent } from '../../core/services/api.service';

@Component({
  selector: 'app-channels-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './channels.component.html',
  styleUrl: './channels.component.css'
})
export class ChannelsComponent implements OnInit {
  loading = true;
  error = '';
  accounts: ChannelAccount[] = [];
  deliveryLogs: DeliveryLog[] = [];
  webhookEvents: WebhookEvent[] = [];

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.loadChannels();
  }

  get telegram(): ChannelAccount | undefined {
    return this.accounts.find((account) => account.channel === 'telegram');
  }

  get whatsapp(): ChannelAccount | undefined {
    return this.accounts.find((account) => account.channel === 'whatsapp');
  }

  get failedOrPendingLogs(): DeliveryLog[] {
    return this.deliveryLogs.filter((log) => ['failed', 'queued', 'unknown'].includes(log.status));
  }

  get recentLogs(): DeliveryLog[] {
    return this.deliveryLogs.slice(0, 30);
  }

  get recentWebhookEvents(): WebhookEvent[] {
    return this.webhookEvents.slice(0, 10);
  }

  statusClass(value?: string | null): string {
    return `status-${(value || 'unknown').replace(/_/g, '-').replace(/\s+/g, '-').toLowerCase()}`;
  }

  formatDate(value?: string | null): string {
    if (!value) return 'No activity yet';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  private loadChannels(): void {
    this.loading = true;
    this.error = '';
    forkJoin({
      accounts: this.api.getChannelAccounts(),
      deliveryLogs: this.api.getDeliveryLogs(),
      webhookEvents: this.api.getWebhookEvents()
    }).subscribe({
      next: ({ accounts, deliveryLogs, webhookEvents }) => {
        this.accounts = accounts;
        this.deliveryLogs = deliveryLogs;
        this.webhookEvents = webhookEvents;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load channel data', err);
        this.error = 'Could not load channel data. Check the admin API key in Settings.';
        this.loading = false;
      }
    });
  }
}
