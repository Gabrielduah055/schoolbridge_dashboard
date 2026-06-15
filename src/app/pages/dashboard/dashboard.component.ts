import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  ApiService,
  Broadcast,
  ChannelAccount,
  Conversation,
  DeliveryLog,
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
  broadcasts: Broadcast[] = [];
  channelAccounts: ChannelAccount[] = [];
  deliveryLogs: DeliveryLog[] = [];

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.loadOverview();
  }

  get telegramStatus(): ChannelAccount | undefined {
    return this.channelAccounts.find((account) => account.channel === 'telegram');
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
      conversations: this.api.getConversations(),
      handovers: this.api.getHandoverTickets(),
      broadcasts: this.api.getBroadcasts(),
      channels: this.api.getChannelAccounts(),
      deliveryLogs: this.api.getDeliveryLogs()
    }).subscribe({
      next: ({ conversations, handovers, broadcasts, channels, deliveryLogs }) => {
        this.conversations = conversations;
        this.handovers = handovers;
        this.broadcasts = broadcasts;
        this.channelAccounts = channels;
        this.deliveryLogs = deliveryLogs;
        this.updateMetrics();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load communication overview', err);
        this.error = 'Could not load communication data. Add your admin API key in Settings if this is a protected environment.';
        this.loading = false;
      }
    });
  }

  private updateMetrics(): void {
    const today = new Date();
    const isToday = (value?: string | null) => {
      if (!value) return false;
      const date = new Date(value);
      return !Number.isNaN(date.getTime()) && date.toDateString() === today.toDateString();
    };

    const messagesToday = this.conversations
      .flatMap((conversation) => conversation.messages ?? [])
      .filter((message) => isToday(message.timestamp)).length;

    this.metrics = [
      { label: 'Messages today', value: String(messagesToday), note: messagesToday ? 'From embedded conversation summaries' : 'No message activity exposed today' },
      { label: 'Open conversations', value: String(this.conversations.filter((item) => !['resolved', 'failed'].includes(item.status)).length), note: 'Active, assigned, or AI-replied threads' },
      { label: 'Pending handovers', value: String(this.handovers.filter((item) => ['open', 'assigned'].includes(item.status)).length), note: 'Tickets waiting on staff' },
      { label: 'Failed deliveries', value: String(this.deliveryLogs.filter((item) => item.status === 'failed').length), note: 'From delivery log events' },
      { label: 'Broadcasts sent', value: String(this.broadcasts.filter((item) => item.status === 'sent').length), note: 'Successfully completed broadcasts' }
    ];
  }
}
