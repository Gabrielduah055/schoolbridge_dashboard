import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IconName, getIconPath } from '../../core/navigation';
import { ApiService } from '../../core/services/api.service';

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
  fileType?: 'pdf' | 'xlsx';
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

@Component({
  selector: 'app-knowledge-base-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './knowledge-base.component.html',
  styleUrl: './knowledge-base.component.css'
})
export class KnowledgeBaseComponent implements OnInit {
  readonly getIconPath = getIconPath;

  loading = true;
  error = '';

  readonly stats: KnowledgeStat[] = [
    { kicker: '1', label: 'Documents Uploaded', value: '—', note: 'Loading...', icon: 'file', tone: 'purple' },
    { kicker: '2', label: 'Bot Accuracy', value: '94%', note: 'Based on parent feedback', icon: 'check', tone: 'emerald' },
    { kicker: 'Cards', label: 'Questions Answered', value: '1,247', note: 'This term automatically', icon: 'message', tone: 'blue' },
    { kicker: 'Last Trained', label: 'Training Time', value: '—', note: 'Auto trains on upload', icon: 'clock', tone: 'amber' }
  ];

  documents: DocumentCard[] = [];

  readonly trainingLog: TrainingItem[] = [
    { label: 'Fee Structure', tone: 'amber', complete: true },
    { label: 'Student Records', tone: 'blue', complete: true },
    { label: 'School Calendar', tone: 'pink', complete: true },
    { label: 'School Policies & Handbook', tone: 'emerald', complete: true },
    { label: 'Exam Timetable', tone: 'red', complete: false },
    { label: 'Class Timetable', tone: 'blue', complete: true }
  ];

  readonly questions: QuestionRow[] = [
    { text: 'Has child paid...', asked: 15, answered: false },
    { text: 'When closing...', asked: 7, answered: false, note: 'Upload exam timetable to answer this question' },
    { text: 'What time...', asked: 8, answered: false, note: 'Upload exam timetable to answer this question' },
    { text: 'When are exams...', asked: 2, answered: false },
    { text: 'Who Class 3...', asked: 5, answered: false }
  ];

  readonly performance = [
    { label: 'Questions Answered', value: '1,247', detail: '+23%', tone: 'purple' },
    { label: 'Accuracy Rate', value: '94%', detail: 'liked by parents', tone: 'emerald' },
    { label: 'Unanswered Questions', value: '76', detail: "Bot couldn't find data", tone: 'amber' },
    { label: 'Most Asked', value: 'Fee balance', detail: 'Parent finance topic', tone: 'gray' }
  ];

  readonly chat: ChatMessage[] = [
    { sender: 'You', text: 'Has Kofi paid...' },
    { sender: 'Bot', text: 'Yes! Kofi Mensah and uncommon: your fee balance is in context Accra Academy.' },
    { sender: 'You', text: 'When is holiday?' },
    { sender: 'Bot', text: 'Mid-Term break from school: Accra Academy.' }
  ];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getKnowledge().subscribe({
      next: (data: any) => {
        const list: any[] = Array.isArray(data) ? data : [];

        if (list.length > 0) {
          // Map backend knowledge items → DocumentCard
          this.documents = list.map((item: any) => ({
            title: item.title ?? item.fileName ?? 'Untitled',
            subtitle: item.category ?? item.type ?? 'Document',
            fileName: item.fileName ?? item.originalName ?? undefined,
            fileType: this.guessFileType(item.fileName ?? item.originalName ?? ''),
            status: item.status ?? 'Active',
            action: item.title ?? 'View',
            note: item.note ?? 'Bot trained',
            icon: 'file' as IconName,
            tone: 'purple'
          }));

          // Update doc count stat
          this.stats[0] = {
            ...this.stats[0],
            value: String(list.length),
            note: `Across ${list.length} document(s)`
          };

          // Update last trained stat if available
          const latest = list
            .filter(i => i.updatedAt || i.createdAt)
            .sort((a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime())[0];

          if (latest) {
            const ago = this.timeAgo(new Date(latest.updatedAt ?? latest.createdAt));
            this.stats[3] = { ...this.stats[3], value: ago, note: 'Auto trains on upload' };
          }
        } else {
          // No documents yet — show empty state placeholder
          this.documents = [];
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load knowledge base', err);
        this.error = 'Could not load knowledge base from the server.';
        this.loading = false;
      }
    });
  }

  private guessFileType(name: string): 'pdf' | 'xlsx' | undefined {
    if (name.endsWith('.pdf')) return 'pdf';
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) return 'xlsx';
    return undefined;
  }

  private timeAgo(date: Date): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000 / 60);
    if (diff < 60) return `${diff} mins ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hrs ago`;
    return `${Math.floor(diff / 1440)} days ago`;
  }
}
