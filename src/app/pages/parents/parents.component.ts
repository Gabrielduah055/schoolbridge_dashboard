import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, ApiStudent } from '../../core/services/api.service';

interface ParentRow {
  name: string;
  phone: string;
  email: string;
  students: string[];
  classes: string[];
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
  parents: ParentRow[] = [];

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
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
        classes: []
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
