import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IconName, getIconPath } from '../../core/navigation';

interface TeacherStat {
  label: string;
  value: string;
  note: string;
  icon: IconName;
  tone: string;
}

interface TeacherRow {
  initials: string;
  name: string;
  className: string;
  subject: string;
  phone: string;
  messages: number;
  status: 'Active' | 'Absent' | 'On Leave';
  tone: string;
}

interface CoverageItem {
  label: string;
  title: string;
  subject: string;
  teacher: string;
  tone: string;
}

interface ActivityItem {
  title: string;
  meta: string;
  tone: string;
}

@Component({
  selector: 'app-teachers-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teachers.component.html',
  styleUrl: './teachers.component.css'
})
export class TeachersComponent {
  readonly getIconPath = getIconPath;

  readonly stats: TeacherStat[] = [
    { label: 'Total Teachers', value: '24', note: 'Across 18 classes', icon: 'teachers', tone: 'purple' },
    { label: 'Active Today', value: '21', note: '3 absent today', icon: 'check', tone: 'emerald' },
    { label: 'Messages Sent Today', value: '47', note: 'To parents via bot', icon: 'chat', tone: 'blue' },
    { label: 'Pending Actions', value: '8', note: 'Awaiting parent responses', icon: 'clock', tone: 'amber' }
  ];

  readonly teachers: TeacherRow[] = [
    { initials: 'KM', name: 'Mr. Kofi Boateng', className: 'Class 4B', subject: 'Mathematics', phone: '+233244XXXXXX', messages: 12, status: 'Active', tone: 'pink' },
    { initials: 'M', name: 'Mrs. Ama Tetteh', className: 'Class 3A', subject: 'English', phone: '+233557XXXXXX', messages: 8, status: 'Active', tone: 'red' },
    { initials: 'KM', name: 'Mr. Kwame Asante', className: 'Class 5B', subject: 'Mathematics', phone: '+233244XXXXXX', messages: 7, status: 'Absent', tone: 'pink' },
    { initials: 'Y', name: 'Mr. Abena Darko', className: 'Class 2B', subject: 'English', phone: '+233777XXXXXX', messages: 6, status: 'Active', tone: 'purple' },
    { initials: 'Y', name: 'Mrs. Ama Tettko', className: 'Class 4B', subject: 'English', phone: '+233557XXXXXX', messages: 6, status: 'Active', tone: 'emerald' },
    { initials: 'KM', name: 'Mr. Kofi Boateng', className: 'Class 4B', subject: 'Mathematics', phone: '+233244XXXXXX', messages: 4, status: 'On Leave', tone: 'pink' },
    { initials: 'M', name: 'Mrs. Ama Tetteh', className: 'Class 3A', subject: 'English', phone: '+233557XXXXXX', messages: 8, status: 'Active', tone: 'red' }
  ];

  readonly chartBars = [
    { day: 'Mon', value: 34 },
    { day: 'Tue', value: 52 },
    { day: 'Wed', value: 68 },
    { day: 'Thu', value: 42 },
    { day: 'Fri', value: 63 }
  ];

  readonly coverage: CoverageItem[] = [
    { label: '1A', title: 'Class 4B', subject: 'Subject', teacher: 'Teacher Name', tone: 'pink' },
    { label: '5B', title: 'Class 3A', subject: 'Subject', teacher: 'Teacher Name', tone: 'amber' },
    { label: '6B', title: 'Class 3A', subject: 'English', teacher: 'Teacher Name', tone: 'blue' }
  ];

  readonly coverageList = [
    { initials: 'KM', name: 'Mr. Kofi Boateng', note: 'Admission No', tone: 'pink', alert: true },
    { initials: 'M', name: 'Mrs. Ama Tetteh', note: 'Admission No', tone: 'blue' },
    { initials: 'Y', name: 'Abena Boating', note: 'Admission No', tone: 'purple' }
  ];

  readonly activity: ActivityItem[] = [
    { title: 'Mr. Akcsua Mathama...', meta: '4 recent activity ago', tone: 'purple' },
    { title: 'Oct Acraua Methatha...', meta: '4 recent activity ago', tone: 'amber' },
    { title: 'Oct Batang Activity F...', meta: '4 recent activity ago', tone: 'orange' },
    { title: 'Teacher follow-up sent', meta: '1 recent activity ago', tone: 'emerald' }
  ];

  readonly selectedTeacher = {
    initials: 'KM',
    name: 'Kofi Mensah',
    className: 'Class 4B',
    admissionNo: 'GHS12003',
    classDetail: '3A',
    enrolled: '17 Jan 2023',
    age: 29,
    guardian: 'Kwame Asante, Shaanta',
    responseRate: 75,
    correctionRate: 75,
    riskRate: 20
  };

  getStatusClass(status: TeacherRow['status']): string {
    return status.toLowerCase().replace(' ', '-');
  }
}
