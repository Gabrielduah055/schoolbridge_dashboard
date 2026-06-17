import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, ApiStudent, ClassDirectoryRow } from '../../core/services/api.service';

interface ClassRow {
  name: string;
  students: number;
  parents: number;
  teacher: string;
  recentBroadcasts: number;
}

@Component({
  selector: 'app-classes-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './classes.component.html',
  styleUrl: './classes.component.css'
})
export class ClassesComponent implements OnInit {
  loading = true;
  error = '';
  sourceLabel = 'Class directory';
  classes: ClassRow[] = [];

  constructor(private readonly api: ApiService) {}

  get totalStudents(): number {
    return this.classes.reduce((total, classItem) => total + classItem.students, 0);
  }

  get totalParents(): number {
    return this.classes.reduce((total, classItem) => total + classItem.parents, 0);
  }

  ngOnInit(): void {
    this.loadClasses();
  }

  private loadClasses(): void {
    this.api.getClasses().subscribe({
      next: (classes) => {
        if (classes.length > 0) {
          this.classes = classes.map((classItem) => this.fromDirectory(classItem));
          this.loading = false;
          return;
        }
        this.loadFromStudents('');
      },
      error: (err) => {
        console.error('Failed to load class directory', err);
        this.loadFromStudents('Could not load class directory. Showing student fallback.');
      }
    });
  }

  private loadFromStudents(message: string): void {
    this.sourceLabel = 'Student fallback';
    this.error = message;
    this.api.getStudents().subscribe({
      next: (students) => {
        this.classes = this.toClasses(students);
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load classes', err);
        this.error = 'Could not load class data. Check the admin API key in Settings.';
        this.loading = false;
      }
    });
  }

  private fromDirectory(classItem: ClassDirectoryRow): ClassRow {
    return {
      name: classItem.className,
      students: classItem.studentCount,
      parents: classItem.parentContactCount,
      teacher: classItem.teacher,
      recentBroadcasts: classItem.recentBroadcastCount
    };
  }

  private toClasses(students: ApiStudent[]): ClassRow[] {
    const rows = new Map<string, { students: number; phones: Set<string>; teacher: string }>();
    for (const student of students) {
      const className = this.text(student, ['class', 'className', 'grade']) || 'Unassigned';
      const row = rows.get(className) ?? { students: 0, phones: new Set<string>(), teacher: this.text(student, ['teacherName', 'classTeacher', 'teacher.name']) || 'Not assigned' };
      row.students += 1;
      const phone = this.text(student, ['parentPhone', 'guardianPhone', 'phone']);
      if (phone) row.phones.add(phone);
      rows.set(className, row);
    }
    return Array.from(rows.entries())
      .map(([name, row]) => ({ name, students: row.students, parents: row.phones.size, teacher: row.teacher, recentBroadcasts: 0 }))
      .sort((a, b) => a.name.localeCompare(b.name));
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
