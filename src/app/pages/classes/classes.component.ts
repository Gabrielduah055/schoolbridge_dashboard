import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, ClassDirectoryRow } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-classes-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './classes.component.html',
  styleUrl: './classes.component.css'
})
export class ClassesComponent implements OnInit {
  loading = true;
  saving = false;
  error = '';
  actionMessage = '';
  sourceLabel = 'Academic class directory';
  classes: ClassDirectoryRow[] = [];
  newClass = { name: '', level: '', section: '' };

  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService
  ) {}

  get totalStudents(): number {
    return this.classes.reduce((total, classItem) => total + (classItem.studentCount || 0), 0);
  }

  get totalParents(): number {
    return this.classes.reduce((total, classItem) => total + (classItem.parentContactCount || 0), 0);
  }

  ngOnInit(): void {
    this.loadClasses();
  }

  hasPermission(permission: string): boolean {
    return this.auth.hasPermission(permission);
  }

  createClass(): void {
    const name = this.newClass.name.trim();
    if (!name || this.saving) return;
    this.saving = true;
    this.actionMessage = 'Creating class...';
    this.api.createClass({
      name,
      level: this.newClass.level.trim(),
      section: this.newClass.section.trim()
    }).subscribe({
      next: () => {
        this.newClass = { name: '', level: '', section: '' };
        this.saving = false;
        this.actionMessage = 'Class created.';
        this.loadClasses();
      },
      error: (err) => {
        console.error('Failed to create class', err);
        this.saving = false;
        this.actionMessage = 'Could not create class.';
      }
    });
  }

  classId(classItem: ClassDirectoryRow): string {
    return classItem._id || classItem.id || '';
  }

  teacherName(classItem: ClassDirectoryRow): string {
    const teacher = classItem.classTeacher?.teacherId as any;
    return teacher?.fullName || teacher?.name || classItem.teacher || 'Not assigned';
  }

  warningText(classItem: ClassDirectoryRow): string {
    if (classItem.warnings?.noActiveAcademicYear) return 'No active academic year is set. Class relationships and broadcasts may not work correctly.';
    if (classItem.warnings?.noClassTeacher) return 'No active class teacher assigned.';
    if (classItem.warnings?.noActiveStudents) return 'No active student enrollments found for this class.';
    return '';
  }

  private loadClasses(): void {
    this.loading = true;
    this.error = '';
    this.api.getClasses().subscribe({
      next: (classes) => {
        this.classes = classes;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load class directory', err);
        this.error = 'Could not load class directory.';
        this.loading = false;
      }
    });
  }
}
