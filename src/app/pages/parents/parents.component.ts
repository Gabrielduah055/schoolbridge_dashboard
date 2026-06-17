import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, ApiStudent, ParentDirectoryRow } from '../../core/services/api.service';

interface ParentRow {
  name: string;
  phone: string;
  email: string;
  students: string[];
  classes: string[];
  channelIdentityStatus: string;
  lastConversationAt: string | null;
}

@Component({
  selector: 'app-parents-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './parents.component.html',
  styleUrl: './parents.component.css'
})
export class ParentsComponent implements OnInit {
  loading = true;
  error = '';
  sourceLabel = 'Communication directory';
  parents: ParentRow[] = [];

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.loadParents();
  }

  formatDate(value?: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  private loadParents(): void {
    this.api.getParents().subscribe({
      next: (parents) => {
        if (parents.length > 0) {
          this.parents = parents.map((parent) => this.fromDirectory(parent));
          this.loading = false;
          return;
        }
        this.loadFromStudents('');
      },
      error: (err) => {
        console.error('Failed to load parent directory', err);
        this.loadFromStudents('Could not load parent directory. Showing student contact fallback.');
      }
    });
  }

  private loadFromStudents(message: string): void {
    this.sourceLabel = 'Student contact fallback';
    this.error = message;
    this.api.getStudents().subscribe({
      next: (students) => {
        this.parents = this.toParents(students);
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load parent data', err);
        this.error = 'Could not load parent contact data. Check the admin API key in Settings.';
        this.loading = false;
      }
    });
  }

  private fromDirectory(parent: ParentDirectoryRow): ParentRow {
    return {
      name: parent.name || 'Parent',
      phone: parent.phone,
      email: parent.email,
      students: parent.linkedStudents.map((student) => student.name).filter(Boolean),
      classes: parent.classes,
      channelIdentityStatus: parent.channelIdentityStatus,
      lastConversationAt: parent.lastConversationAt
    };
  }

  private toParents(students: ApiStudent[]): ParentRow[] {
    const rows = new Map<string, ParentRow>();
    for (const student of students) {
      const phone = this.text(student, ['parentPhone', 'guardianPhone', 'phone']);
      if (!phone) continue;
      const row = rows.get(phone) ?? {
        name: this.text(student, ['parentName', 'guardianName', 'motherName', 'fatherName']) || 'Parent',
        phone,
        email: this.text(student, ['parentEmail', 'guardianEmail', 'email']),
        students: [],
        classes: [],
        channelIdentityStatus: 'unknown',
        lastConversationAt: null
      };
      const studentName = this.text(student, ['name', 'fullName', 'studentName']) || 'Unknown student';
      const className = this.text(student, ['class', 'className', 'grade']) || '-';
      if (!row.students.includes(studentName)) row.students.push(studentName);
      if (!row.classes.includes(className)) row.classes.push(className);
      rows.set(phone, row);
    }
    return Array.from(rows.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  private text(source: unknown, keys: string[]): string {
    for (const key of keys) {
      const value = (source as Record<string, unknown>)?.[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (typeof value === 'number') return String(value);
    }
    return '';
  }
}
