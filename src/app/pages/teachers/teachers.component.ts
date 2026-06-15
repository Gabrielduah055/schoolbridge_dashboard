import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, ApiStudent } from '../../core/services/api.service';

interface TeacherRow {
  name: string;
  classes: string[];
  students: number;
  phone: string;
}

@Component({
  selector: 'app-teachers-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './teachers.component.html',
  styleUrl: './teachers.component.css'
})
export class TeachersComponent implements OnInit {
  loading = true;
  error = '';
  teachers: TeacherRow[] = [];

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.api.getStudents().subscribe({
      next: (students) => {
        this.teachers = this.toTeachers(students);
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load teacher context', err);
        this.error = 'Could not load teacher context. Check the admin API key in Settings.';
        this.loading = false;
      }
    });
  }

  private toTeachers(students: ApiStudent[]): TeacherRow[] {
    const rows = new Map<string, TeacherRow>();
    for (const student of students) {
      const teacherName = this.text(student, ['teacherName', 'classTeacher', 'teacher.name']);
      if (!teacherName) continue;
      const row = rows.get(teacherName) ?? {
        name: teacherName,
        classes: [],
        students: 0,
        phone: this.text(student, ['teacherPhone', 'teacher.phone'])
      };
      const className = this.text(student, ['class', 'className', 'grade']) || 'Unassigned';
      if (!row.classes.includes(className)) row.classes.push(className);
      row.students += 1;
      rows.set(teacherName, row);
    }
    return Array.from(rows.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  private text(source: unknown, keys: string[]): string {
    for (const key of keys) {
      const value = key.split('.').reduce<unknown>((target, part) => {
        if (!target || typeof target !== 'object') return undefined;
        return (target as Record<string, unknown>)[part];
      }, source);
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (typeof value === 'number') return String(value);
    }
    return '';
  }
}
