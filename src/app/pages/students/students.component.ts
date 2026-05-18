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
}

interface ClassOverview {
  name: string;
  section: string;
  teacher: string;
  students: number;
  attendance: number;
  feeCollection: number;
  tone: string;
  active?: boolean;
}

interface UnregisteredParent {
  initials: string;
  name: string;
  admissionNo: string;
  tone: string;
}

interface SelectedStudent {
  initials: string;
  name: string;
  className: string;
  admissionNo: string;
  classDetail: string;
  enrolled: string;
  age: string;
  guardian: string;
  phone: string;
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

  stats: StudentStat[] = [
    { label: 'Total Students', value: '-', note: 'Loading...', icon: 'students', tone: 'purple' },
    { label: 'Total Parents Registered', value: '-', note: 'Loading...', icon: 'teachers', tone: 'blue' },
    { label: 'Students With Fee Issues', value: '-', note: 'Outstanding this term', icon: 'wallet', tone: 'amber' },
    { label: 'New This Term', value: '-', note: 'Newly enrolled', icon: 'events', tone: 'emerald' }
  ];

  students: StudentRow[] = [];
  rawStudents: ApiStudent[] = [];
  classOverview: ClassOverview[] = [];
  unregisteredParents: UnregisteredParent[] = [];
  selectedStudent: SelectedStudent | null = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadStudents();
  }

  get filteredStudents(): StudentRow[] {
    const query = this.searchTerm.trim().toLowerCase();
    if (!query) return this.students;

    return this.students.filter((student) =>
      [student.name, student.admissionNo, student.className, student.parent, student.phone]
        .some((value) => value.toLowerCase().includes(query))
    );
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

  closeStudentPanel(): void {
    this.selectedStudent = null;
  }

  selectStudent(row: StudentRow, raw: ApiStudent): void {
    const termFee = this.getNumber(raw, ['termFee', 'fee.termFee', 'fees.termFee']);
    const paid = this.getNumber(raw, ['amountPaid', 'paid', 'fee.amountPaid', 'fees.amountPaid']);
    const outstanding = termFee > 0
      ? Math.max(0, termFee - paid)
      : this.getNumber(raw, ['outstanding', 'balance', 'fee.outstanding', 'fees.outstanding']);

    this.selectedStudent = {
      initials: row.initials,
      name: row.name,
      className: row.className,
      admissionNo: row.admissionNo,
      classDetail: row.className,
      enrolled: this.formatDate(this.getText(raw, ['createdAt', 'enrolledAt', 'dateEnrolled'])),
      age: this.getText(raw, ['age']) || '-',
      guardian: row.parent,
      phone: row.phone,
      termFee: termFee > 0 ? formatGHS(termFee) : '-',
      paid: paid > 0 ? formatGHS(paid) : '-',
      outstanding: outstanding > 0 ? formatGHS(outstanding) : 'GHS 0',
      progress: percent(paid, termFee)
    };
  }

  getFeeStatusClass(status: StudentRow['feeStatus']): string {
    return `status-${status.toLowerCase()}`;
  }

  private loadStudents(): void {
    this.loading = true;
    this.error = '';

    this.api.getStudents().subscribe({
      next: (list) => {
        this.rawStudents = list;
        this.students = list.map((student, index) => this.toStudentRow(student, index));
        this.classOverview = this.buildClassOverview(list);
        this.unregisteredParents = this.buildUnregisteredParents(list);
        this.updateStats(list);
        this.selectedStudent = null;
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
      rawIndex: index
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
      { label: 'Total Parents Registered', value: String(withParent), note: `${Math.max(0, total - withParent)} unregistered`, icon: 'teachers', tone: 'blue' },
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
        section: className,
        teacher: data.teacher,
        students: data.students,
        attendance: data.attendanceCount ? Math.round(data.attendanceTotal / data.attendanceCount) : 0,
        feeCollection: percent(data.paid, data.termFee),
        tone: tones[index % tones.length],
        active: index === 0
      }));
  }

  private buildUnregisteredParents(list: ApiStudent[]): UnregisteredParent[] {
    return list
      .filter((student) => !this.getText(student, ['parentPhone', 'guardianPhone', 'phone', 'parent.phone', 'guardian.phone']))
      .slice(0, 5)
      .map((student, index) => {
        const name = this.studentName(student);
        return {
          initials: this.initials(name),
          name,
          admissionNo: this.getText(student, ['admissionNumber', 'admissionNo', 'studentId', 'id', '_id']) || '-',
          tone: tones[index % tones.length]
        };
      });
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
