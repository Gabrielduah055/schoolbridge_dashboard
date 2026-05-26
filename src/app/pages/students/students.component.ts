import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IconName, getIconPath } from '../../core/navigation';
import { ApiService, ApiStudent } from '../../core/services/api.service';

interface StudentStat {
  label: string;
  value: string;
  note: string;
  icon: IconName;
  tone: string;
}

interface StudentRow {
  initials: string;
  name: string;
  admissionNo: string;
  className: string;
  parent: string;
  phone: string;
  feeStatus: 'Paid' | 'Partial' | 'Unpaid';
  tone: string;
  rawIndex: number;
  routeId: string;
}

interface ClassOverview {
  name: string;
  label: string;
  teacher: string;
  students: number;
  attendance: number;
  feeCollection: number;
  tone: string;
  active?: boolean;
}

const tones = ['purple', 'blue', 'pink', 'emerald', 'amber', 'red'];

function percent(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Math.min(100, Math.round((numerator / denominator) * 100));
}

@Component({
  selector: 'app-students-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './students.component.html',
  styleUrl: './students.component.css'
})
export class StudentsComponent implements OnInit {
  readonly getIconPath = getIconPath;

  loading = true;
  importing = false;
  error = '';
  actionMessage = '';
  searchTerm = '';
  classFilter = '';
  statusFilter = '';

  stats: StudentStat[] = [
    { label: 'Total Students', value: '-', note: 'Loading...', icon: 'students', tone: 'purple' },
    { label: 'Total Parents Registered', value: '-', note: 'Loading...', icon: 'teachers', tone: 'blue' },
    { label: 'Students With Fee Issues', value: '-', note: 'Outstanding this term', icon: 'wallet', tone: 'amber' },
    { label: 'New This Term', value: '-', note: 'Newly enrolled', icon: 'events', tone: 'emerald' }
  ];

  students: StudentRow[] = [];
  classOverview: ClassOverview[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadStudents();
  }

  get filteredStudents(): StudentRow[] {
    const query = this.searchTerm.trim().toLowerCase();

    return this.students.filter((student) =>
      (!query || [student.name, student.admissionNo, student.parent, student.phone]
        .some((value) => value.toLowerCase().includes(query))) &&
      (!this.classFilter || student.className === this.classFilter) &&
      (!this.statusFilter || student.feeStatus === this.statusFilter)
    );
  }

  get classOptions(): string[] {
    return Array.from(new Set(this.students.map((student) => student.className)))
      .filter((className) => className !== '-')
      .sort((a, b) => a.localeCompare(b));
  }

  importStudents(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    this.importing = true;
    this.actionMessage = 'Importing students...';

    this.api.importStudents(formData).subscribe({
      next: () => {
        this.actionMessage = 'Students imported successfully.';
        this.importing = false;
        input.value = '';
        this.loadStudents();
      },
      error: (err) => {
        console.error('Failed to import students', err);
        this.actionMessage = 'Student import failed. Please try again.';
        this.importing = false;
        input.value = '';
      }
    });
  }

  getFeeStatusClass(status: StudentRow['feeStatus']): string {
    return `status-${status.toLowerCase()}`;
  }

  private loadStudents(): void {
    this.loading = true;
    this.error = '';

    this.api.getStudents().subscribe({
      next: (list) => {
        this.students = list.map((student, index) => this.toStudentRow(student, index));
        this.classOverview = this.buildClassOverview(list);
        this.updateStats(list);
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load students', err);
        this.error = 'Could not load students from the server.';
        this.loading = false;
      }
    });
  }

  private toStudentRow(student: ApiStudent, index: number): StudentRow {
    const name = this.studentName(student);
    const parentName = this.getText(student, ['parentName', 'guardianName', 'motherName', 'fatherName', 'parent.name', 'guardian.name']) || '-';
    const phone = this.getText(student, ['parentPhone', 'guardianPhone', 'phone', 'parent.phone', 'guardian.phone']) || '-';

    return {
      initials: this.initials(name),
      name,
      admissionNo: this.getText(student, ['admissionNumber', 'admissionNo', 'studentId', 'id', '_id']) || '-',
      className: this.className(student),
      parent: parentName,
      phone,
      feeStatus: this.mapFeeStatus(student),
      tone: tones[index % tones.length],
      rawIndex: index,
      routeId: this.studentRouteId(student, index)
    };
  }

  private updateStats(list: ApiStudent[]): void {
    const total = list.length;
    const withParent = list.filter((student) =>
      Boolean(this.getText(student, ['parentPhone', 'guardianPhone', 'phone', 'parent.phone', 'guardian.phone']))
    ).length;
    const feeIssues = list.filter((student) => this.mapFeeStatus(student) !== 'Paid').length;
    const newThisTerm = list.filter((student) => this.isRecent(this.getText(student, ['createdAt', 'enrolledAt', 'dateEnrolled']))).length;

    this.stats = [
      { label: 'Total Students', value: String(total), note: total === 1 ? '1 enrolled' : `${total} enrolled`, icon: 'students', tone: 'purple' },
      { label: 'Total Parents Registered', value: String(withParent), note: 'With contact details', icon: 'teachers', tone: 'blue' },
      { label: 'Students With Fee Issues', value: String(feeIssues), note: 'Outstanding this term', icon: 'wallet', tone: 'amber' },
      { label: 'New This Term', value: String(newThisTerm), note: 'From backend enrollment dates', icon: 'events', tone: 'emerald' }
    ];
  }

  private buildClassOverview(list: ApiStudent[]): ClassOverview[] {
    const byClass = new Map<string, { students: number; teacher: string; paid: number; termFee: number; attendanceTotal: number; attendanceCount: number }>();

    for (const student of list) {
      const className = this.className(student);
      const current = byClass.get(className) ?? {
        students: 0,
        teacher: this.getText(student, ['teacherName', 'teacher.name', 'classTeacher']) || 'Not assigned',
        paid: 0,
        termFee: 0,
        attendanceTotal: 0,
        attendanceCount: 0
      };

      current.students += 1;
      current.paid += this.getNumber(student, ['amountPaid', 'paid', 'fee.amountPaid', 'fees.amountPaid']);
      current.termFee += this.getNumber(student, ['termFee', 'fee.termFee', 'fees.termFee']);

      const attendance = this.getNumber(student, ['attendance', 'attendancePercent']);
      if (attendance > 0) {
        current.attendanceTotal += attendance;
        current.attendanceCount += 1;
      }

      byClass.set(className, current);
    }

    return Array.from(byClass.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([className, data], index) => ({
        name: className,
        label: this.classLabel(className),
        teacher: data.teacher,
        students: data.students,
        attendance: data.attendanceCount ? Math.round(data.attendanceTotal / data.attendanceCount) : 0,
        feeCollection: percent(data.paid, data.termFee),
        tone: tones[index % tones.length],
        active: index === 0
      }));
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

  private studentRouteId(student: ApiStudent, index: number): string {
    return this.getText(student, ['_id', 'id', 'studentId', 'admissionNumber', 'admissionNo']) || String(index);
  }

  private classLabel(className: string): string {
    const numberMatch = className.match(/\d+[A-Za-z]?/);
    if (numberMatch) return numberMatch[0].toUpperCase();

    const words = className.split(/\s+/).filter(Boolean);
    return words
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
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

  private isRecent(value: string): boolean {
    if (!value) return false;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    const days = (Date.now() - date.getTime()) / 1000 / 60 / 60 / 24;
    return days <= 120;
  }
}
