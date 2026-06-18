import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ApiService, TeacherDirectoryRow } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-teachers-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teachers.component.html',
  styleUrl: './teachers.component.css'
})
export class TeachersComponent implements OnInit {
  loading = true;
  importing = false;
  error = '';
  actionMessage = '';
  sourceLabel = 'Teacher communication directory';
  teachers: TeacherDirectoryRow[] = [];

  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadTeachers();
  }

  get telegramLinkedCount(): number {
    return this.teachers.filter((teacher) => teacher.channelIdentityStatus === 'connected').length;
  }

  get classReferenceCount(): number {
    return this.teachers.filter((teacher) => teacher.assignedClasses.length > 0).length;
  }

  get subjectCount(): number {
    return this.teachers.filter((teacher) => Boolean(teacher.subject?.trim())).length;
  }

  hasPermission(permission: string): boolean {
    return this.auth.hasPermission(permission);
  }

  importTeachers(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    this.importing = true;
    this.actionMessage = 'Importing teacher directory...';

    this.api.importTeachers(formData).subscribe({
      next: (result) => {
        this.actionMessage = `Teacher import complete. ${result.imported} added, ${result.updated} updated, ${result.skipped} skipped.`;
        this.importing = false;
        input.value = '';
        this.loadTeachers();
      },
      error: (err) => {
        console.error('Failed to import teachers', err);
        this.actionMessage = 'Teacher import failed. Please check the file columns.';
        this.importing = false;
        input.value = '';
      }
    });
  }

  formatDate(value?: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  private loadTeachers(): void {
    this.loading = true;
    this.error = '';
    this.api.getTeachers().subscribe({
      next: (teachers) => {
        this.teachers = teachers;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load teacher directory', err);
        this.error = 'Could not load teacher directory.';
        this.loading = false;
      }
    });
  }
}
