import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IconName, getIconPath } from '../../core/navigation';
import { ApiService, ApiStudent, StudentEnrollment } from '../../core/services/api.service';

interface DetailStat {
  label: string;
  value: string;
  note: string;
  icon: IconName;
  tone: string;
}

interface DetailRow {
  label: string;
  value: string;
}

interface StudentDetails {
  initials: string;
  name: string;
  admissionNo: string;
  className: string;
  age: string;
  enrolled: string;
  guardian: string;
  phone: string;
  email: string;
  address: string;
  feeStatus: 'Paid' | 'Partial' | 'Unpaid';
  termFee: string;
  paid: string;
  outstanding: string;
  progress: number;
}

const tones = ['purple', 'blue', 'pink', 'emerald', 'amber', 'red'];

function formatGHS(amount: number): string {
  return `GHS ${amount.toLocaleString('en-GH', { maximumFractionDigits: 0 })}`;
}

function percent(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Math.min(100, Math.round((numerator / denominator) * 100));
}

@Component({
  selector: 'app-student-details-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './student-details.component.html',
  styleUrl: './student-details.component.css'
})
export class StudentDetailsComponent implements OnInit {
  readonly getIconPath = getIconPath;

  loading = true;
  error = '';
  student: StudentDetails | null = null;
  rawRows: DetailRow[] = [];
  stats: DetailStat[] = [];
  enrollments: StudentEnrollment[] = [];
  currentEnrollment: StudentEnrollment | null = null;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.loadStudent();
  }

  getFeeStatusClass(status: StudentDetails['feeStatus']): string {
    return `status-${status.toLowerCase()}`;
  }

  private loadStudent(): void {
    const routeId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loading = true;
    this.error = '';

    this.api.getStudents().subscribe({
      next: (list) => {
        const match = list.find((student, index) => this.studentRouteId(student, index) === routeId);

        if (!match) {
          this.error = 'Student details could not be found.';
          this.loading = false;
          return;
        }

        this.student = this.toDetails(match);
        this.rawRows = this.flattenStudent(match);
        this.stats = this.buildStats(match, this.student);
        this.loadEnrollments(this.getText(match, ['_id', 'id']));
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load student details', err);
        this.error = 'Could not load this student from the server.';
        this.loading = false;
      }
    });
  }

  enrollmentClassName(enrollment: StudentEnrollment | null): string {
    const classRecord = enrollment?.classId as any;
    return classRecord?.displayName || classRecord?.name || classRecord?.className || '-';
  }

  enrollmentYear(enrollment: StudentEnrollment | null): string {
    const year = enrollment?.academicYearId as any;
    return year?.name || '-';
  }

  private toDetails(raw: ApiStudent): StudentDetails {
    const name = this.studentName(raw);
    const termFee = this.getNumber(raw, ['termFee', 'fee.termFee', 'fees.termFee']);
    const paid = this.getNumber(raw, ['amountPaid', 'paid', 'fee.amountPaid', 'fees.amountPaid']);
    const outstanding = termFee > 0
      ? Math.max(0, termFee - paid)
      : this.getNumber(raw, ['outstanding', 'balance', 'fee.outstanding', 'fees.outstanding']);

    return {
      initials: this.initials(name),
      name,
      admissionNo: this.getText(raw, ['admissionNumber', 'admissionNo', 'studentId', 'id', '_id']) || '-',
      className: this.className(raw),
      age: this.getText(raw, ['age', 'studentAge']) || '-',
      enrolled: this.formatDate(this.getText(raw, ['createdAt', 'enrolledAt', 'dateEnrolled', 'admissionDate'])),
      guardian: this.getText(raw, ['parentName', 'guardianName', 'motherName', 'fatherName', 'parent.name', 'guardian.name']) || '-',
      phone: this.getText(raw, ['parentPhone', 'guardianPhone', 'phone', 'parent.phone', 'guardian.phone']) || '-',
      email: this.getText(raw, ['email', 'parentEmail', 'guardianEmail', 'parent.email', 'guardian.email']) || '-',
      address: this.getText(raw, ['address', 'homeAddress', 'residentialAddress', 'parent.address', 'guardian.address']) || '-',
      feeStatus: this.mapFeeStatus(raw),
      termFee: termFee > 0 ? formatGHS(termFee) : '-',
      paid: paid > 0 ? formatGHS(paid) : '-',
      outstanding: outstanding > 0 ? formatGHS(outstanding) : 'GHS 0',
      progress: percent(paid, termFee)
    };
  }

  private buildStats(raw: ApiStudent, details: StudentDetails): DetailStat[] {
    return [
      { label: 'Class', value: details.className, note: 'Current class', icon: 'students', tone: 'purple' },
      { label: 'Fee Status', value: details.feeStatus, note: details.outstanding === 'GHS 0' ? 'No balance' : `${details.outstanding} due`, icon: 'wallet', tone: 'amber' },
      { label: 'Attendance', value: `${this.getNumber(raw, ['attendance', 'attendancePercent']) || 0}%`, note: 'Recorded attendance', icon: 'attendance', tone: 'emerald' },
      { label: 'Guardian', value: details.guardian, note: details.phone, icon: 'teachers', tone: 'blue' }
    ];
  }

  private loadEnrollments(studentId: string): void {
    if (!studentId) return;
    this.api.getStudentCurrentEnrollment(studentId).subscribe({
      next: (enrollment) => this.currentEnrollment = enrollment,
      error: () => this.currentEnrollment = null
    });
    this.api.getStudentEnrollments(studentId).subscribe({
      next: (enrollments) => this.enrollments = enrollments,
      error: () => this.enrollments = []
    });
  }

  private flattenStudent(source: unknown, prefix = ''): DetailRow[] {
    if (!source || typeof source !== 'object') return [];

    return Object.entries(source as Record<string, unknown>).flatMap(([key, value]) => {
      const label = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return this.flattenStudent(value, label);
      }

      return [{
        label: this.humanize(label),
        value: this.formatValue(value, label)
      }];
    }).filter((row) => row.value !== '-');
  }

  private mapFeeStatus(student: ApiStudent): 'Paid' | 'Partial' | 'Unpaid' {
    const status = this.getText(student, ['feeStatus', 'status', 'fee.status', 'fees.status']).toLowerCase();
    if (['paid', 'complete', 'settled'].includes(status)) return 'Paid';
    if (['partial', 'partially paid'].includes(status)) return 'Partial';

    const termFee = this.getNumber(student, ['termFee', 'fee.termFee', 'fees.termFee']);
    const paid = this.getNumber(student, ['amountPaid', 'paid', 'fee.amountPaid', 'fees.amountPaid']);
    if (termFee > 0 && paid >= termFee) return 'Paid';
    if (paid > 0) return 'Partial';
    return 'Unpaid';
  }

  private studentRouteId(student: ApiStudent, index: number): string {
    return this.getText(student, ['_id', 'id', 'studentId', 'admissionNumber', 'admissionNo']) || String(index);
  }

  private studentName(student: ApiStudent): string {
    const direct = this.getText(student, ['name', 'fullName', 'studentName']);
    if (direct) return direct;

    const parts = [
      this.getText(student, ['firstName']),
      this.getText(student, ['middleName']),
      this.getText(student, ['lastName'])
    ].filter(Boolean);

    return parts.join(' ') || 'Unknown student';
  }

  private className(student: ApiStudent): string {
    return this.getText(student, ['class', 'className', 'grade', 'section', 'currentClass']) || '-';
  }

  private initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
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

  private formatDate(value: string): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private formatValue(value: unknown, label = ''): string {
    if (value === null || value === undefined || value === '') return '-';
    if (Array.isArray(value)) return value.map((item) => this.formatValue(item, label)).join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'string' && /(date|at)$/i.test(label)) return this.formatDate(value);
    return String(value);
  }

  private humanize(value: string): string {
    return value
      .replace(/\./g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
}
