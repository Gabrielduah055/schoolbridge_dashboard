import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  ApiService,
  ChannelAccount,
  Conversation,
  HandoverTicket
} from '../../core/services/api.service';

interface Metric {
  label: string;
  value: string;
  note: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  loading = true;
  error = '';

  metrics: Metric[] = [
    { label: 'Messages today', value: '-', note: 'Incoming and outgoing messages' },
    { label: 'Open conversations', value: '-', note: 'Active admin inbox threads' },
    { label: 'Pending handovers', value: '-', note: 'Need human attention' },
    { label: 'Failed deliveries', value: '-', note: 'Requires retry or review' },
    { label: 'Broadcasts sent', value: '-', note: 'Completed announcements' }
  ];

  conversations: Conversation[] = [];
  handovers: HandoverTicket[] = [];
  channelAccounts: ChannelAccount[] = [];

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.loadOverview();
  }

  get telegramStatus(): ChannelAccount | undefined {
    return this.channelAccounts.find((account) => account.channel === 'telegram');
  }

  get whatsappStatus(): ChannelAccount | undefined {
    return this.channelAccounts.find((account) => account.channel === 'whatsapp');
  }

  get recentConversations(): Conversation[] {
    return this.conversations.slice(0, 6);
  }

  get recentHandovers(): HandoverTicket[] {
    return this.handovers.slice(0, 6);
  }

  statusClass(value?: string | null): string {
    return `status-${(value || 'unknown').replace(/_/g, '-').replace(/\s+/g, '-').toLowerCase()}`;
  }

  displayId(value?: string | null): string {
    return value ? value.slice(-6).toUpperCase() : '-';
  }

  formatDate(value?: string | null): string {
    if (!value) return 'No activity yet';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  private loadOverview(): void {
    this.loading = true;
    this.error = '';

    forkJoin({
      metrics: this.api.getDashboardMetrics(),
      channels: this.api.getChannelAccounts()
    }).subscribe({
      next: ({ metrics, channels }) => {
        this.conversations = metrics.recentConversations;
        this.handovers = metrics.recentHandovers;
        this.channelAccounts = channels;
        this.metrics = [
          { label: 'Messages today', value: String(metrics.messagesToday), note: 'From backend message records' },
          { label: 'Open conversations', value: String(metrics.openConversations), note: 'Active admin inbox threads' },
          { label: 'Pending handovers', value: String(metrics.pendingHandovers), note: 'Need human attention' },
          { label: 'Failed deliveries', value: String(metrics.failedDeliveries), note: 'Requires retry or review' },
          { label: 'Broadcasts sent', value: String(metrics.broadcastsSentToday), note: 'Sent today' }
        ];
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load communication overview', err);
        this.error = 'Could not load communication data. Add your admin API key in Settings if this is a protected environment.';
        this.loading = false;
      }
    });
  }
}
