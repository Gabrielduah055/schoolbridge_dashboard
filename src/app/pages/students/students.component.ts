import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IconName, getIconPath } from '../../core/navigation';
import { ApiService } from '../../core/services/api.service';

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
  selected?: boolean;
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

const tones = ['purple', 'blue', 'pink', 'emerald', 'amber', 'red'];

@Component({
  selector: 'app-students-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './students.component.html',
  styleUrl: './students.component.css'
})
export class StudentsComponent implements OnInit {
  readonly getIconPath = getIconPath;

  loading = true;
  error = '';

  stats: StudentStat[] = [
    { label: 'Total Students', value: '—', note: 'Loading...', icon: 'students', tone: 'purple' },
    { label: 'Total Parents Registered', value: '—', note: 'Loading...', icon: 'teachers', tone: 'blue' },
    { label: 'Students With Fee Issues', value: '—', note: 'Outstanding this term', icon: 'wallet', tone: 'amber' },
    { label: 'New This Term', value: '—', note: 'Newly enrolled', icon: 'events', tone: 'emerald' }
  ];

  students: StudentRow[] = [];

  readonly classOverview: ClassOverview[] = [
    { name: '1A', section: '1A', teacher: 'Teacher Name', students: 45, attendance: 75, feeCollection: 30, tone: 'pink' },
    { name: '5B', section: '5B', teacher: 'Teacher Name', students: 45, attendance: 70, feeCollection: 60, tone: 'amber' },
    { name: '6A', section: '4A', teacher: 'Teacher Name', students: 45, attendance: 60, feeCollection: 70, tone: 'blue', active: true },
    { name: '6B', section: '6B', teacher: 'Teacher Name', students: 45, attendance: 70, feeCollection: 60, tone: 'emerald' }
  ];

  readonly unregisteredParents: UnregisteredParent[] = [
    { initials: 'K', name: 'Kofi Mensah', admissionNo: 'Admission No', tone: 'pink' },
    { initials: 'A', name: 'Ama Owusu', admissionNo: 'Admission No', tone: 'blue' },
    { initials: 'K', name: 'Kwame Asante', admissionNo: 'Admission No', tone: 'red' }
  ];

  selectedStudent: any = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getStudents().subscribe({
      next: (data: any) => {
        const list: any[] = Array.isArray(data) ? data : [];

        // Map backend student objects → StudentRow
        this.students = list.map((s, i) => ({
          initials: s.name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) ?? '?',
          name: s.name ?? 'Unknown',
          admissionNo: s.admissionNumber ?? '—',
          className: s.class ?? '—',
          parent: s.parentName ?? '—',
          phone: s.parentPhone ?? '—',
          feeStatus: this.mapFeeStatus(s.feeStatus),
          tone: tones[i % tones.length]
        }));

        // Update stat cards with real counts
        const total = list.length;
        const withParent = list.filter(s => s.parentPhone).length;
        const feeIssues = list.filter(s => s.feeStatus && s.feeStatus !== 'paid').length;

        this.stats = [
          { label: 'Total Students', value: String(total), note: `${total} enrolled`, icon: 'students', tone: 'purple' },
          { label: 'Total Parents Registered', value: String(withParent), note: `${total - withParent} unregistered`, icon: 'teachers', tone: 'blue' },
          { label: 'Students With Fee Issues', value: String(feeIssues), note: 'Outstanding this term', icon: 'wallet', tone: 'amber' },
          { label: 'New This Term', value: '—', note: 'Newly enrolled', icon: 'events', tone: 'emerald' }
        ];

        if (this.students.length > 0) {
          const s = list[0];
          this.selectedStudent = {
            initials: this.students[0].initials,
            name: s.name,
            className: s.class,
            admissionNo: s.admissionNumber,
            classDetail: s.class,
            enrolled: s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
            age: s.age ?? '—',
            guardian: s.parentName ?? '—',
            termFee: '—',
            paid: '—',
            outstanding: '—',
            progress: 0
          };
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load students', err);
        this.error = 'Could not load students from the server.';
        this.loading = false;
      }
    });
  }

  private mapFeeStatus(status: string): 'Paid' | 'Partial' | 'Unpaid' {
    if (!status) return 'Unpaid';
    const s = status.toLowerCase();
    if (s === 'paid') return 'Paid';
    if (s === 'partial') return 'Partial';
    return 'Unpaid';
  }

  getFeeStatusClass(status: StudentRow['feeStatus']): string {
    return `status-${status.toLowerCase()}`;
  }
}
