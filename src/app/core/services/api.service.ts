import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ApiStudent {
  [key: string]: unknown;
}

export interface ApiKnowledgeItem {
  [key: string]: unknown;
}

export type CommunicationChannel = 'telegram' | 'whatsapp' | 'dashboard';
export type AdminRole = 'headmaster';
export type ParticipantRole = 'parent' | 'teacher' | 'admin' | AdminRole | 'visitor' | 'unregistered';

export interface ChannelAccount {
  _id?: string;
  id?: string;
  schoolId: string;
  channel: 'telegram' | 'whatsapp';
  provider: string;
  displayName: string;
  identifier: string;
  status: 'connected' | 'disconnected' | 'needs_scan' | 'active' | 'error' | 'unknown';
  lastInboundAt: string | null;
  lastOutboundAt: string | null;
  lastError: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Conversation {
  _id?: string;
  id?: string;
  schoolId: string;
  channel: CommunicationChannel;
  externalChatId: string;
  participantRole: ParticipantRole;
  participantName: string;
  participantPhone: string;
  parentId?: string | null;
  teacherId?: string | null;
  parentPhone?: string;
  studentId?: string | null;
  classId?: string | null;
  assignedTo: string;
  lastMessageAt?: string | null;
  type: 'parent_bot' | 'teacher_parent' | 'admin_broadcast';
  messages?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    senderName: string;
    timestamp: string;
  }>;
  status: 'active' | 'open' | 'ai_replied' | 'needs_human' | 'assigned' | 'resolved' | 'failed' | 'failed_delivery';
  resolvedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  _id?: string;
  id?: string;
  conversationId?: string | null;
  schoolId: string;
  channel: CommunicationChannel;
  direction: 'incoming' | 'outgoing';
  senderRole: ParticipantRole | 'assistant' | 'system';
  senderUserId?: string | null;
  senderName: string;
  body: string;
  messageType: 'text' | 'image' | 'file' | 'audio' | 'system';
  providerMessageId: string;
  aiGenerated: boolean;
  senderType?: 'teacher' | 'parent';
  senderId?: string | null;
  recipientType?: 'broadcast' | 'individual' | 'teacher';
  targetClass?: string;
  studentId?: string | null;
  teacherId?: string | null;
  message?: string;
  deliveredTo?: string[];
  failedTo?: string[];
  status: 'received' | 'queued' | 'sent' | 'delivered' | 'read' | 'partial' | 'failed';
  sentAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HandoverTicket {
  _id?: string;
  id?: string;
  schoolId: string;
  conversationId: string;
  reason: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'assigned' | 'resolved' | 'closed';
  assignedTo: string;
  assignedBy?: string | null;
  assignedByName?: string;
  assignedByRole?: AdminRole | '';
  assignedAt?: string | null;
  internalNotes: string;
  notes?: Array<{ text: string; createdBy?: string | null; createdByName?: string; createdByRole?: AdminRole | ''; createdAt: string }>;
  aiSuggestedReply: string;
  resolvedAt: string | null;
  resolvedBy?: string | null;
  resolvedByName?: string;
  resolvedByRole?: AdminRole | '';
  createdAt?: string;
  updatedAt?: string;
}

export interface Broadcast {
  _id?: string;
  id?: string;
  schoolId: string;
  createdBy?: string | null;
  createdByName?: string;
  createdByRole: AdminRole | 'admin';
  lastEditedBy?: string | null;
  lastEditedByName?: string;
  lastEditedByRole?: AdminRole | 'admin' | '';
  lastEditedAt?: string | null;
  audienceType: 'whole_school' | 'class' | 'individual' | 'individual_parent' | 'teachers' | 'parents';
  classId?: string | null;
  recipientStudentId?: string | null;
  recipientStudentName?: string;
  targetClass?: string;
  recipientPhone?: string;
  title: string;
  originalText: string;
  draftedText: string;
  attachments?: Array<{
    originalName: string;
    fileName: string;
    filePath: string;
    mimeType: string;
    size: number;
  }>;
  approvalStatus: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  status: 'draft' | 'pending_approval' | 'approved' | 'sending' | 'sent' | 'partially_failed' | 'failed' | 'cancelled';
  channels: Array<'telegram' | 'whatsapp'>;
  approvedBy?: string | null;
  approvedByName?: string;
  approvedByRole?: AdminRole | 'admin' | '';
  approvedAt?: string | null;
  sentBy?: string | null;
  sentByName?: string;
  sentByRole?: AdminRole | 'admin' | '';
  sentAt: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface MessageRecipient {
  _id?: string;
  id?: string;
  broadcastId?: string | null;
  messageId?: string | null;
  recipientId?: string | null;
  recipientName: string;
  recipientPhone: string;
  recipientRole: 'parent' | 'teacher' | 'admin' | 'visitor';
  studentId?: string | null;
  classId?: string | null;
  channel: 'telegram' | 'whatsapp';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'skipped';
  providerMessageId: string;
  errorMessage: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeliveryLog {
  _id?: string;
  id?: string;
  messageId?: string | null;
  broadcastId?: string | null;
  recipientId?: string | null;
  schoolId: string;
  channel: 'telegram' | 'whatsapp';
  provider: string;
  providerMessageId: string;
  eventType: string;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'received' | 'unknown';
  errorMessage: string;
  rawPayload?: Record<string, unknown> | null;
  createdAt?: string;
}

export interface WebhookEvent {
  _id?: string;
  id?: string;
  schoolId: string;
  channel: 'telegram' | 'whatsapp';
  provider: string;
  providerEventId: string;
  eventType: string;
  rawPayload: Record<string, unknown>;
  processedAt: string | null;
  status: 'received' | 'processed' | 'failed' | 'ignored';
  errorMessage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BroadcastDraftPayload {
  audienceType: Broadcast['audienceType'];
  originalText: string;
  title?: string;
  draftedText?: string;
  classId?: string;
  recipientStudentId?: string;
  recipientStudentName?: string;
  targetClass?: string;
  recipientPhone?: string;
  channels?: Array<'telegram' | 'whatsapp'>;
  schoolId?: string;
  attachment?: File | null;
}

export interface BroadcastRecipientPreviewItem {
  name: string;
  role: 'parent' | 'teacher';
  phone: string;
  studentName: string;
  className: string;
  telegramLinked: boolean;
  telegramChatId: string | null;
  canReceiveNow: boolean;
  reasonIfNotReachable: string | null;
}

export interface BroadcastRecipientPreview {
  audienceType: Broadcast['audienceType'];
  totalContacts: number;
  telegramReachable: number;
  telegramMissing: number;
  whatsappReachable: number;
  whatsappMissing: number;
  reachableNow: number;
  unreachableNow: number;
  recipients: BroadcastRecipientPreviewItem[];
}

export interface BroadcastMetrics {
  totalBroadcasts: number;
  sentTotal: number;
  sentToday: number;
  draftCount: number;
  pendingApprovalCount: number;
  approvedCount: number;
  failedCount: number;
  recipientSummary: {
    sent: number;
    failed: number;
    skipped: number;
  };
}

export interface DashboardMetrics {
  messagesToday: number;
  openConversations: number;
  pendingHandovers: number;
  failedDeliveries: number;
  broadcastsSentToday: number;
  telegramStatus: string;
  whatsappStatus: string;
  recentConversations: Conversation[];
  recentHandovers: HandoverTicket[];
}

export interface BroadcastSendResult {
  broadcast: Broadcast;
  deliverySummary: {
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
    pendingCount: number;
  };
}

export interface ParentDirectoryRow {
  name: string;
  phone: string;
  email: string;
  linkedStudents: Array<{ id: string; name: string; class: string; admissionNumber: string }>;
  classes: string[];
  preferredChannel: string;
  channelIdentityStatus: string;
  lastConversationAt: string | null;
}

export interface TeacherDirectoryRow {
  id: string;
  _id?: string;
  name: string;
  phone: string;
  email: string;
  assignedClasses: string[];
  subject: string;
  channelIdentityStatus: string;
  lastConversationAt: string | null;
}

export interface ClassDirectoryRow {
  id: string;
  _id?: string;
  name?: string;
  className: string;
  level?: string;
  section?: string;
  displayName?: string;
  active?: boolean;
  teacher: string;
  studentCount: number;
  parentContactCount: number;
  recentBroadcastCount: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Knowledge Base
  uploadKnowledge(formData: FormData) {
    return this.http.post(`${this.api}/api/knowledge/upload`, formData, this.authOptions());
  }

  getKnowledge(): Observable<ApiKnowledgeItem[]> {
    return this.http
      .get<unknown>(`${this.api}/api/knowledge`, this.authOptions())
      .pipe(map((response) => this.extractArray<ApiKnowledgeItem>(response, ['knowledge', 'documents', 'data', 'items', 'results'])));
  }

  // Students
  getStudents(): Observable<ApiStudent[]> {
    return this.http
      .get<unknown>(`${this.api}/api/students`, this.authOptions())
      .pipe(map((response) => this.extractArray<ApiStudent>(response, ['students', 'data', 'items', 'results'])));
  }

  addStudent(student: any) {
    return this.http.post(`${this.api}/api/students`, student, this.authOptions());
  }

  importStudents(formData: FormData) {
    return this.http.post(`${this.api}/api/students/import`, formData, this.authOptions());
  }

  importTeachers(formData: FormData) {
    return this.http.post<{ imported: number; updated: number; skipped: number; total: number; errors?: string[] }>(
      `${this.api}/api/teachers/import`,
      formData,
      this.authOptions()
    );
  }

  importClasses(formData: FormData) {
    return this.http.post<{ imported: number; updated: number; skipped: number; total: number; errors?: string[] }>(
      `${this.api}/api/classes/import`,
      formData,
      this.authOptions()
    );
  }

  // Chat
  sendMessage(
    sessionId: string,
    message: string,
    userRole: string,
    userName: string,
    userPhone = 'dashboard-test',
    modelKey = 'best'
  ) {
    return this.http.post(`${this.api}/api/chat/message`, {
      sessionId, message, userRole, userName, userPhone, modelKey
    });
  }

  resetChat(sessionId: string) {
    return this.http.post(`${this.api}/api/chat/reset`, { sessionId });
  }

  // Conversations (for Messages Today count)
  getConversations(filters: { channel?: string; status?: string } = {}): Observable<Conversation[]> {
    return this.http
      .get<unknown>(`${this.api}/api/conversations`, { ...this.authOptions(), params: this.cleanParams(filters) })
      .pipe(map((response) => this.extractArray<Conversation>(response, ['conversations', 'messages', 'data', 'items', 'results'])));
  }

  getConversation(id: string): Observable<Conversation> {
    return this.http.get<Conversation>(`${this.api}/api/conversations/${id}`, this.authOptions());
  }

  getConversationMessages(id: string): Observable<Message[]> {
    return this.http
      .get<unknown>(`${this.api}/api/conversations/${id}/messages`, this.authOptions())
      .pipe(map((response) => this.extractArray<Message>(response, ['messages', 'data', 'items', 'results'])));
  }

  replyToConversation(id: string, body: string): Observable<Message> {
    return this.http.post<Message>(`${this.api}/api/conversations/${id}/reply`, { body }, this.authOptions());
  }

  assignConversation(id: string, assignedTo: string): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.api}/api/conversations/${id}/assign`, { assignedTo }, this.authOptions());
  }

  resolveConversation(id: string): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.api}/api/conversations/${id}/resolve`, {}, this.authOptions());
  }

  reopenConversation(id: string): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.api}/api/conversations/${id}/reopen`, {}, this.authOptions());
  }

  markConversationNeedsHuman(id: string, reason = 'Marked for human attention by dashboard') {
    return this.http.post<{ conversation: Conversation; ticket: HandoverTicket }>(
      `${this.api}/api/conversations/${id}/mark-needs-human`,
      { reason },
      this.authOptions()
    );
  }

  getChannelAccounts(): Observable<ChannelAccount[]> {
    return this.http
      .get<unknown>(`${this.api}/api/channel-accounts`, this.authOptions())
      .pipe(map((response) => this.extractArray<ChannelAccount>(response, ['accounts', 'channelAccounts', 'data', 'items', 'results'])));
  }

  getDashboardMetrics(): Observable<DashboardMetrics> {
    return this.http.get<DashboardMetrics>(`${this.api}/api/dashboard/metrics`, this.authOptions());
  }

  getParents(): Observable<ParentDirectoryRow[]> {
    return this.http
      .get<unknown>(`${this.api}/api/parents`, this.authOptions())
      .pipe(map((response) => this.extractArray<ParentDirectoryRow>(response, ['parents', 'data', 'items', 'results'])));
  }

  getTeachers(): Observable<TeacherDirectoryRow[]> {
    return this.http
      .get<unknown>(`${this.api}/api/teachers`, this.authOptions())
      .pipe(map((response) => this.extractArray<TeacherDirectoryRow>(response, ['teachers', 'data', 'items', 'results'])));
  }

  getClasses(): Observable<ClassDirectoryRow[]> {
    return this.http
      .get<unknown>(`${this.api}/api/classes`, this.authOptions())
      .pipe(map((response) => this.extractArray<ClassDirectoryRow>(response, ['classes', 'data', 'items', 'results'])));
  }

  getHandoverTickets(status?: string): Observable<HandoverTicket[]> {
    return this.http
      .get<unknown>(`${this.api}/api/handover-tickets`, { ...this.authOptions(), params: this.cleanParams({ status }) })
      .pipe(map((response) => this.extractArray<HandoverTicket>(response, ['tickets', 'handoverTickets', 'data', 'items', 'results'])));
  }

  resolveHandoverTicket(id: string, internalNotes = ''): Observable<HandoverTicket> {
    return this.http.post<HandoverTicket>(`${this.api}/api/handover-tickets/${id}/resolve`, { internalNotes }, this.authOptions());
  }

  assignHandoverTicket(id: string, assignedTo: string): Observable<HandoverTicket> {
    return this.http.post<HandoverTicket>(`${this.api}/api/handover-tickets/${id}/assign`, { assignedTo }, this.authOptions());
  }

  addHandoverNote(id: string, note: string): Observable<HandoverTicket> {
    return this.http.post<HandoverTicket>(`${this.api}/api/handover-tickets/${id}/note`, { note }, this.authOptions());
  }

  getBroadcasts(): Observable<Broadcast[]> {
    return this.http
      .get<unknown>(`${this.api}/api/broadcasts`, this.authOptions())
      .pipe(map((response) => this.extractArray<Broadcast>(response, ['broadcasts', 'data', 'items', 'results'])));
  }

  getBroadcastMetrics(): Observable<BroadcastMetrics> {
    return this.http.get<BroadcastMetrics>(`${this.api}/api/broadcasts/metrics`, this.authOptions());
  }

  createBroadcastDraft(payload: BroadcastDraftPayload): Observable<Broadcast> {
    if (payload.attachment) {
      const formData = new FormData();
      formData.append('audienceType', payload.audienceType);
      formData.append('originalText', payload.originalText);
      if (payload.title) formData.append('title', payload.title);
      if (payload.draftedText) formData.append('draftedText', payload.draftedText);
      if (payload.classId) formData.append('classId', payload.classId);
      if (payload.recipientStudentId) formData.append('recipientStudentId', payload.recipientStudentId);
      if (payload.recipientStudentName) formData.append('recipientStudentName', payload.recipientStudentName);
      if (payload.targetClass) formData.append('targetClass', payload.targetClass);
      if (payload.recipientPhone) formData.append('recipientPhone', payload.recipientPhone);
      if (payload.schoolId) formData.append('schoolId', payload.schoolId);
      if (payload.channels?.length) formData.append('channels', payload.channels.join(','));
      formData.append('attachment', payload.attachment);
      return this.http.post<Broadcast>(`${this.api}/api/broadcasts/draft`, formData, this.authOptions());
    }

    return this.http.post<Broadcast>(`${this.api}/api/broadcasts/draft`, payload, this.authOptions());
  }

  approveBroadcast(id: string, draftedText?: string): Observable<Broadcast> {
    return this.http.post<Broadcast>(
      `${this.api}/api/broadcasts/${id}/approve`,
      draftedText ? { draftedText } : {},
      this.authOptions()
    );
  }

  sendBroadcast(id: string): Observable<BroadcastSendResult> {
    return this.http.post<BroadcastSendResult>(`${this.api}/api/broadcasts/${id}/send`, {}, this.authOptions());
  }

  getBroadcastRecipients(id: string): Observable<MessageRecipient[]> {
    return this.http
      .get<unknown>(`${this.api}/api/broadcasts/${id}/recipients`, this.authOptions())
      .pipe(map((response) => this.extractArray<MessageRecipient>(response, ['recipients', 'data', 'items', 'results'])));
  }

  previewBroadcastRecipients(payload: {
    audienceType: Broadcast['audienceType'];
    classId?: string;
    targetClass?: string;
    recipientStudentId?: string;
    recipientPhone?: string;
    channels?: Array<'telegram' | 'whatsapp'>;
  }): Observable<BroadcastRecipientPreview> {
    return this.http.post<BroadcastRecipientPreview>(`${this.api}/api/broadcasts/preview-recipients`, payload, this.authOptions());
  }

  getDeliveryLogs(): Observable<DeliveryLog[]> {
    return this.http
      .get<unknown>(`${this.api}/api/delivery-logs`, this.authOptions())
      .pipe(map((response) => this.extractArray<DeliveryLog>(response, ['logs', 'deliveryLogs', 'data', 'items', 'results'])));
  }

  getWebhookEvents(): Observable<WebhookEvent[]> {
    return this.http
      .get<unknown>(`${this.api}/api/webhook-events`, this.authOptions())
      .pipe(map((response) => this.extractArray<WebhookEvent>(response, ['events', 'webhookEvents', 'data', 'items', 'results'])));
  }

  private extractArray<T>(response: unknown, keys: string[]): T[] {
    if (Array.isArray(response)) {
      return response as T[];
    }

    if (!response || typeof response !== 'object') {
      return [];
    }

    const record = response as Record<string, unknown>;
    for (const key of keys) {
      const value = record[key];
      if (Array.isArray(value)) {
        return value as T[];
      }
    }

    return [];
  }

  private authOptions(): Record<string, never> {
    return {};
  }

  private cleanParams(params: Record<string, string | undefined>): Record<string, string> {
    return Object.fromEntries(Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1])));
  }
}
