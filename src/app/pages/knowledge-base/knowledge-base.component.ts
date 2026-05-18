import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconName, getIconPath } from '../../core/navigation';
import { ApiKnowledgeItem, ApiService } from '../../core/services/api.service';

interface KnowledgeStat {
  kicker: string;
  label: string;
  value: string;
  note: string;
  icon: IconName;
  tone: string;
}

interface DocumentCard {
  title: string;
  subtitle: string;
  fileName?: string;
  fileType?: string;
  fileSize?: string;
  uploadedAt?: string;
  status?: string;
  action: string;
  note: string;
  icon: IconName;
  tone: string;
  empty?: boolean;
  warning?: string;
}

interface TrainingItem {
  label: string;
  tone: string;
  complete: boolean;
}

interface QuestionRow {
  text: string;
  asked: number;
  answered: boolean;
  note?: string;
}

interface ChatMessage {
  sender: 'Bot' | 'You';
  text: string;
}

const recommendedDocuments = [
  'Fee Structure',
  'Student Records',
  'School Calendar',
  'School Policies & Handbook',
  'Exam Timetable',
  'Class Timetable'
];

const tones = ['purple', 'blue', 'pink', 'emerald', 'amber', 'red'];

@Component({
  selector: 'app-knowledge-base-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './knowledge-base.component.html',
  styleUrl: './knowledge-base.component.css'
})
export class KnowledgeBaseComponent implements OnInit {
  readonly getIconPath = getIconPath;

  loading = true;
  uploading = false;
  sending = false;
  error = '';
  uploadMessage = '';
  selectedFile: File | null = null;
  chatInput = '';
  readonly sessionId = `knowledge-test-${Date.now()}`;

  stats: KnowledgeStat[] = [
    { kicker: '1', label: 'Documents Uploaded', value: '-', note: 'Loading...', icon: 'file', tone: 'purple' },
    { kicker: '2', label: 'Bot Accuracy', value: '-', note: 'Waiting for backend data', icon: 'check', tone: 'emerald' },
    { kicker: 'Cards', label: 'Questions Answered', value: '-', note: 'Waiting for backend data', icon: 'message', tone: 'blue' },
    { kicker: 'Last Trained', label: 'Training Time', value: '-', note: 'Auto trains on upload', icon: 'clock', tone: 'amber' }
  ];

  documents: DocumentCard[] = [];
  trainingLog: TrainingItem[] = recommendedDocuments.map((label, index) => ({
    label,
    tone: tones[index % tones.length],
    complete: false
  }));
  trainingProgress = 0;
  brainSummary = 'Loading documents from the backend...';

  readonly questions: QuestionRow[] = [
    { text: 'Has child paid...', asked: 15, answered: false },
    { text: 'When closing...', asked: 7, answered: false, note: 'Upload exam timetable to answer this question' },
    { text: 'What time...', asked: 8, answered: false, note: 'Upload exam timetable to answer this question' },
    { text: 'When are exams...', asked: 2, answered: false },
    { text: 'Who Class 3...', asked: 5, answered: false }
  ];

  performance = [
    { label: 'Questions Answered', value: '-', detail: 'Waiting for backend data', tone: 'purple' },
    { label: 'Accuracy Rate', value: '-', detail: 'Waiting for feedback', tone: 'emerald' },
    { label: 'Unanswered Questions', value: '-', detail: 'Not exposed by backend yet', tone: 'amber' },
    { label: 'Most Asked', value: '-', detail: 'Not exposed by backend yet', tone: 'gray' }
  ];

  chat: ChatMessage[] = [
    { sender: 'Bot', text: 'Ask a parent-style question to test the backend chat.' }
  ];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadKnowledge();
  }

  selectKnowledgeFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
    this.uploadMessage = this.selectedFile ? `${this.selectedFile.name} ready to upload.` : '';
  }

  uploadKnowledge(): void {
    if (!this.selectedFile) {
      this.uploadMessage = 'Choose a document first.';
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    this.uploading = true;
    this.uploadMessage = 'Uploading and training...';

    this.api.uploadKnowledge(formData).subscribe({
      next: () => {
        this.uploading = false;
        this.uploadMessage = 'Document uploaded. Refreshing library...';
        this.selectedFile = null;
        this.loadKnowledge();
      },
      error: (err) => {
        console.error('Failed to upload knowledge document', err);
        this.uploading = false;
        this.uploadMessage = 'Upload failed. Please try again.';
      }
    });
  }

  sendTestMessage(): void {
    const message = this.chatInput.trim();
    if (!message || this.sending) return;

    this.chat = [...this.chat, { sender: 'You', text: message }];
    this.chatInput = '';
    this.sending = true;

    this.api.sendMessage(this.sessionId, message, 'parent', 'Dashboard tester').subscribe({
      next: (response) => {
        this.chat = [...this.chat, { sender: 'Bot', text: this.extractReply(response) }];
        this.sending = false;
      },
      error: (err) => {
        console.error('Failed to send test message', err);
        this.chat = [...this.chat, { sender: 'Bot', text: 'The backend chat endpoint did not respond.' }];
        this.sending = false;
      }
    });
  }

  private loadKnowledge(): void {
    this.loading = true;
    this.error = '';

    this.api.getKnowledge().subscribe({
      next: (list) => {
        this.documents = list.map((item, index) => this.toDocumentCard(item, index));
        this.updateStats(list);
        this.updateTraining(list);
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load knowledge base', err);
        this.error = 'Could not load knowledge base from the server.';
        this.brainSummary = 'Could not reach the backend knowledge library.';
        this.loading = false;
      }
    });
  }

  private toDocumentCard(item: ApiKnowledgeItem, index: number): DocumentCard {
    const fileName = this.getText(item, ['fileName', 'originalName', 'name', 'filename']) || 'Uploaded document';
    const title = this.getText(item, ['title', 'name']) || this.titleFromFile(fileName);
    const category = this.getText(item, ['category', 'type', 'documentType']) || 'Document';
    const created = this.getText(item, ['updatedAt', 'createdAt', 'uploadedAt']);

    return {
      title,
      subtitle: category,
      fileName,
      fileType: this.fileType(fileName),
      fileSize: this.fileSize(this.getNumber(item, ['size', 'fileSize'])),
      uploadedAt: this.formatDate(created),
      status: this.getText(item, ['status']) || 'Active',
      action: 'Trained source',
      note: created ? `Updated ${this.timeAgo(new Date(created))}` : 'Bot trained',
      icon: 'file',
      tone: tones[index % tones.length]
    };
  }

  private updateStats(list: ApiKnowledgeItem[]): void {
    const latest = list
      .map((item) => this.getText(item, ['updatedAt', 'createdAt', 'uploadedAt']))
      .filter(Boolean)
      .map((value) => new Date(value))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    const latestText = latest ? this.timeAgo(latest) : '-';
    this.stats = [
      { ...this.stats[0], value: String(list.length), note: list.length === 1 ? '1 backend document' : `${list.length} backend documents` },
      { ...this.stats[1], value: list.length > 0 ? 'Live' : '-', note: list.length > 0 ? 'Ready to answer from uploads' : 'Upload documents to train' },
      { ...this.stats[2], value: '-', note: 'Question analytics not exposed yet' },
      { ...this.stats[3], value: latestText, note: latest ? 'Auto trains on upload' : 'No uploads yet' }
    ];

    this.performance = [
      { ...this.performance[0], value: '-', detail: 'Question analytics not exposed yet' },
      { ...this.performance[1], value: list.length > 0 ? 'Live' : '-', detail: list.length > 0 ? 'Backend knowledge loaded' : 'Waiting for uploads' },
      { ...this.performance[2], value: '-', detail: 'Not exposed by backend yet' },
      { ...this.performance[3], value: list[0] ? this.documents[0]?.title ?? '-' : '-', detail: list[0] ? 'Most recent source' : 'No source yet' }
    ];

    this.brainSummary = list.length > 0
      ? `Your AI bot is trained on ${list.length} backend document${list.length === 1 ? '' : 's'}. Last updated ${latestText}.`
      : 'Your AI bot has no backend documents yet. Upload a document to train it.';
  }

  private updateTraining(list: ApiKnowledgeItem[]): void {
    const searchable = list
      .map((item) => [
        this.getText(item, ['title', 'name']),
        this.getText(item, ['fileName', 'originalName', 'filename']),
        this.getText(item, ['category', 'type', 'documentType'])
      ].join(' ').toLowerCase())
      .join(' ');

    this.trainingLog = recommendedDocuments.map((label, index) => ({
      label,
      tone: tones[index % tones.length],
      complete: searchable.includes(label.toLowerCase().split(' ')[0])
    }));

    const complete = this.trainingLog.filter((item) => item.complete).length;
    this.trainingProgress = Math.round((complete / this.trainingLog.length) * 100);
  }

  private extractReply(response: unknown): string {
    if (typeof response === 'string' && response.trim()) return response;
    if (!response || typeof response !== 'object') return 'No reply text returned.';

    const record = response as Record<string, unknown>;
    for (const key of ['reply', 'message', 'answer', 'response', 'text']) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) return value;
    }

    return 'The backend returned a response without display text.';
  }

  private getText(source: unknown, paths: string[]): string {
    for (const path of paths) {
      const value = this.getValue(source, path);
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (typeof value === 'number') return String(value);
    }
    return '';
  }

  private getNumber(source: unknown, paths: string[]): number {
    for (const path of paths) {
      const value = this.getValue(source, path);
      const parsed = typeof value === 'number' ? value : Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    return 0;
  }

  private getValue(source: unknown, path: string): unknown {
    return path.split('.').reduce<unknown>((value, key) => {
      if (!value || typeof value !== 'object') return undefined;
      return (value as Record<string, unknown>)[key];
    }, source);
  }

  private fileType(name: string): string {
    const extension = name.split('.').pop()?.toLowerCase();
    return extension || 'file';
  }

  private titleFromFile(name: string): string {
    return name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Untitled';
  }

  private fileSize(bytes: number): string {
    if (!bytes) return 'Size unavailable';
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  private formatDate(value: string): string {
    if (!value) return 'Date unavailable';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private timeAgo(date: Date): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000 / 60);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff} mins ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hrs ago`;
    return `${Math.floor(diff / 1440)} days ago`;
  }
}
