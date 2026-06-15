import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService, Conversation, HandoverTicket } from '../../core/services/api.service';

@Component({
  selector: 'app-handover-queue-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './handover-queue.component.html',
  styleUrl: './handover-queue.component.css'
})
export class HandoverQueueComponent implements OnInit {
  loading = true;
  resolvingId = '';
  error = '';
  tickets: HandoverTicket[] = [];
  conversationsById = new Map<string, Conversation>();

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  get openTickets(): HandoverTicket[] {
    return this.tickets.filter((ticket) => ticket.status !== 'resolved' && ticket.status !== 'closed');
  }

  get urgentCount(): number {
    return this.tickets.filter((ticket) => ticket.priority === 'urgent' || ticket.priority === 'high').length;
  }

  get resolvedCount(): number {
    return this.tickets.filter((ticket) => ticket.status === 'resolved').length;
  }

  statusClass(value: string): string {
    return `status-${value.replace(/_/g, '-').toLowerCase()}`;
  }

  displayId(value?: string | null): string {
    return value ? value.slice(-6).toUpperCase() : '-';
  }

  participant(ticket: HandoverTicket): string {
    const conversation = this.conversationsById.get(ticket.conversationId);
    return conversation?.participantName || conversation?.participantPhone || 'Unknown participant';
  }

  channel(ticket: HandoverTicket): string {
    return this.conversationsById.get(ticket.conversationId)?.channel || '-';
  }

  formatDate(value?: string): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  resolve(ticket: HandoverTicket): void {
    const id = ticket._id || ticket.id;
    if (!id) return;
    this.resolvingId = id;
    this.api.resolveHandoverTicket(id, 'Resolved from dashboard handover queue.').subscribe({
      next: (updated) => {
        this.tickets = this.tickets.map((item) => (item._id || item.id) === id ? updated : item);
        this.resolvingId = '';
      },
      error: (err) => {
        console.error('Failed to resolve handover ticket', err);
        this.error = 'Could not resolve the ticket. Please try again.';
        this.resolvingId = '';
      }
    });
  }

  private loadTickets(): void {
    this.loading = true;
    this.error = '';
    forkJoin({
      tickets: this.api.getHandoverTickets(),
      conversations: this.api.getConversations()
    }).subscribe({
      next: ({ tickets, conversations }) => {
        this.tickets = tickets;
        this.conversationsById = new Map(conversations.map((conversation) => [conversation._id || conversation.id || '', conversation]));
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load handover tickets', err);
        this.error = 'Could not load handover tickets. Check the admin API key in Settings.';
        this.loading = false;
      }
    });
  }
}
