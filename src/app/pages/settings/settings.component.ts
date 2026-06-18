import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { AuthService, AuthUser } from '../../core/services/auth.service';
import { AcademicYear, ApiService, Subject } from '../../core/services/api.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  readonly apiUrl = environment.apiUrl;
  user: AuthUser | null = null;
  academicYears: AcademicYear[] = [];
  subjects: Subject[] = [];
  setupMessage = '';
  academicYearForm = { name: '', startDate: '', endDate: '', isActive: true };
  subjectForm = { name: '', code: '' };

  constructor(
    private readonly auth: AuthService,
    private readonly api: ApiService
  ) {}

  ngOnInit(): void {
    this.user = this.auth.currentUser();
    this.auth.loadMe().subscribe({
      next: ({ user }) => this.user = user,
      error: () => this.user = this.auth.currentUser()
    });
    this.loadAcademicSettings();
  }

  logout(): void {
    this.auth.logout();
  }

  permissionPreview(): string {
    const permissions = this.user?.permissions || [];
    return permissions.length > 8
      ? `${permissions.slice(0, 8).join(', ')} and ${permissions.length - 8} more`
      : permissions.join(', ');
  }

  hasPermission(permission: string): boolean {
    return this.auth.hasPermission(permission);
  }

  createAcademicYear(): void {
    if (!this.academicYearForm.name || !this.academicYearForm.startDate || !this.academicYearForm.endDate) return;
    this.api.createAcademicYear(this.academicYearForm).subscribe({
      next: () => {
        this.setupMessage = 'Academic year saved.';
        this.academicYearForm = { name: '', startDate: '', endDate: '', isActive: true };
        this.loadAcademicSettings();
      },
      error: () => this.setupMessage = 'Could not save academic year.'
    });
  }

  setActiveYear(year: AcademicYear): void {
    const id = year._id || year.id;
    if (!id) return;
    this.api.setActiveAcademicYear(id).subscribe({
      next: () => this.loadAcademicSettings(),
      error: () => this.setupMessage = 'Could not activate academic year.'
    });
  }

  closeYear(year: AcademicYear): void {
    const id = year._id || year.id;
    if (!id) return;
    this.api.closeAcademicYear(id).subscribe({
      next: () => this.loadAcademicSettings(),
      error: () => this.setupMessage = 'Could not close academic year.'
    });
  }

  createSubject(): void {
    if (!this.subjectForm.name.trim()) return;
    this.api.createSubject({ name: this.subjectForm.name.trim(), code: this.subjectForm.code.trim() }).subscribe({
      next: () => {
        this.setupMessage = 'Subject saved.';
        this.subjectForm = { name: '', code: '' };
        this.loadAcademicSettings();
      },
      error: () => this.setupMessage = 'Could not save subject.'
    });
  }

  formatDate(value?: string): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private loadAcademicSettings(): void {
    this.api.getAcademicYears().subscribe({ next: (years) => this.academicYears = years, error: () => undefined });
    this.api.getSubjects().subscribe({ next: (subjects) => this.subjects = subjects, error: () => undefined });
  }
}
