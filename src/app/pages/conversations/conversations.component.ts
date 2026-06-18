import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService, Conversation, Message } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-conversations-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './conversations.component.html',
  styleUrl: './conversations.component.css'
})
export class ConversationsComponent implements OnInit, OnDestroy {
  loading = true;
  messagesLoading = false;
  error = '';
  messageError = '';
  actionMessage = '';
  replyText = '';
  assigningTo = '';
  sendingReply = false;
  runningAction = false;
  selectedConversationId = '';
  messages: Message[] = [];

  filters = {
    channel: '',
    role: '',
    status: '',
    handover: '',
    search: ''
  };

  conversations: Conversation[] = [];
  private routeSubscription?: Subscription;

  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      this.selectedConversationId = params.get('id') || this.selectedConversationId;
      if (this.selectedConversationId) {
        this.loadMessages(this.selectedConversationId);
      }
    });
    this.loadConversations();
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  get filteredConversations(): Conversation[] {
    const search = this.filters.search.trim().toLowerCase();
    return this.conversations.filter((conversation) => {
      const isHandover = ['needs_human', 'assigned'].includes(conversation.status);
      const searchable = [
        conversation.participantName,
        conversation.participantPhone,
        conversation.participantRole,
        conversation.channel,
        conversation.assignedTo,
        conversation.externalChatId,
        conversation.studentId,
        conversation.classId
      ].join(' ').toLowerCase();

      return (!this.filters.channel || conversation.channel === this.filters.channel)
        && (!this.filters.role || conversation.participantRole === this.filters.role)
        && (!this.filters.status || conversation.status === this.filters.status)
        && (!this.filters.handover || (this.filters.handover === 'yes' ? isHandover : !isHandover))
        && (!search || searchable.includes(search));
    });
  }

  get selectedConversation(): Conversation | undefined {
    return this.conversations.find((conversation) => this.conversationId(conversation) === this.selectedConversationId)
      || this.filteredConversations[0];
  }

  selectConversation(conversation: Conversation): void {
    const id = this.conversationId(conversation);
    if (!id) return;
    this.selectedConversationId = id;
    this.router.navigate(['/conversations', id]);
    this.loadMessages(id);
  }

  resetFilters(): void {
    this.filters = { channel: '', role: '', status: '', handover: '', search: '' };
  }

  hasPermission(permission: string): boolean {
    return this.auth.hasPermission(permission);
  }

  sendReply(): void {
    const conversation = this.selectedConversation;
    const id = conversation ? this.conversationId(conversation) : '';
    const body = this.replyText.trim();
    if (!id || !body || this.sendingReply) return;

    this.sendingReply = true;
    this.actionMessage = 'Sending reply...';
    this.api.replyToConversation(id, body).subscribe({
      next: () => {
        this.replyText = '';
        this.actionMessage = 'Reply sent through Telegram.';
        this.sendingReply = false;
        this.loadMessages(id);
        this.loadConversations();
      },
      error: (err) => {
        console.error('Failed to send reply', err);
        this.actionMessage = 'Could not send the reply.';
        this.sendingReply = false;
      }
    });
  }

  assignSelected(): void {
    const conversation = this.selectedConversation;
    const id = conversation ? this.conversationId(conversation) : '';
    const assignedTo = this.assigningTo.trim();
    if (!id || !assignedTo || this.runningAction) return;

    this.runConversationAction(() => this.api.assignConversation(id, assignedTo), id, 'Conversation assigned.');
  }

  resolveSelected(): void {
    const id = this.selectedConversation ? this.conversationId(this.selectedConversation) : '';
    if (!id || this.runningAction) return;
    this.runConversationAction(() => this.api.resolveConversation(id), id, 'Conversation resolved.');
  }

  reopenSelected(): void {
    const id = this.selectedConversation ? this.conversationId(this.selectedConversation) : '';
    if (!id || this.runningAction) return;
    this.runConversationAction(() => this.api.reopenConversation(id), id, 'Conversation reopened.');
  }

  markNeedsHuman(): void {
    const id = this.selectedConversation ? this.conversationId(this.selectedConversation) : '';
    if (!id || this.runningAction) return;
    this.runningAction = true;
    this.actionMessage = 'Creating handover ticket...';
    this.api.markConversationNeedsHuman(id).subscribe({
      next: () => {
        this.runningAction = false;
        this.actionMessage = 'Conversation marked for human attention.';
        this.loadConversations();
      },
      error: (err) => {
        console.error('Failed to mark conversation needs human', err);
        this.runningAction = false;
        this.actionMessage = 'Could not mark this conversation.';
      }
    });
  }

  conversationId(conversation: Conversation): string {
    return conversation._id || conversation.id || '';
  }

  statusClass(value?: string | null): string {
    return `status-${(value || 'unknown').replace(/_/g, '-').replace(/\s+/g, '-').toLowerCase()}`;
  }

  bodyPreview(conversation: Conversation): string {
    const lastEmbedded = conversation.messages?.[conversation.messages.length - 1]?.content;
    return lastEmbedded || conversation.externalChatId || 'No preview available';
  }

  messageBody(message: Message): string {
    return message.body || message.message || 'No message body';
  }

  messageActorLabel(message: Message): string {
    if (message.direction === 'outgoing' && !message.aiGenerated && message.senderName) {
      const role = message.senderRole?.replace(/_/g, ' ') || 'staff';
      return `${this.titleCase(role)} replied`;
    }

    if (message.aiGenerated) return 'SchoolBridge AI';
    return message.senderName || message.senderRole || message.direction;
  }

  formatDate(value?: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  private titleCase(value: string): string {
    return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private loadConversations(): void {
    this.loading = true;
    this.error = '';
    this.api.getConversations().subscribe({
      next: (conversations) => {
        this.conversations = conversations;
        this.loading = false;
        const selected = this.selectedConversation;
        const selectedId = selected ? this.conversationId(selected) : '';
        if (!this.selectedConversationId && selectedId) {
          this.selectedConversationId = selectedId;
          this.loadMessages(selectedId);
        }
      },
      error: (err) => {
        console.error('Failed to load conversations', err);
        this.error = 'Could not load conversations. Check the admin API key in Settings.';
        this.loading = false;
      }
    });
  }

  private runConversationAction(request: () => ReturnType<ApiService['resolveConversation']>, id: string, success: string): void {
    this.runningAction = true;
    this.actionMessage = 'Updating conversation...';
    request().subscribe({
      next: () => {
        this.runningAction = false;
        this.actionMessage = success;
        this.loadConversations();
        this.loadMessages(id);
      },
      error: (err) => {
        console.error('Conversation action failed', err);
        this.runningAction = false;
        this.actionMessage = 'Could not update this conversation.';
      }
    });
  }

  private loadMessages(conversationId: string): void {
    this.messagesLoading = true;
    this.messageError = '';
    this.api.getConversationMessages(conversationId).subscribe({
      next: (messages) => {
        this.messages = messages;
        this.messagesLoading = false;
      },
      error: (err) => {
        console.error('Failed to load conversation messages', err);
        this.messages = [];
        this.messageError = 'Could not load this conversation thread.';
        this.messagesLoading = false;
      }
    });
  }
}
