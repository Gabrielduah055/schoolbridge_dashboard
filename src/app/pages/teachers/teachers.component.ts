import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AcademicYear, ApiService, ClassDirectoryRow, Subject, TeacherAssignment, TeacherDirectoryRow } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

interface TeacherRow extends TeacherDirectoryRow {
  classTeacherAssignments: TeacherAssignment[];
  subjectTeacherAssignments: TeacherAssignment[];
}

@Component({
  selector: 'app-teachers-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './teachers.component.html',
  styleUrl: './teachers.component.css'
})
export class TeachersComponent implements OnInit {
  loading = true;
  saving = false;
  error = '';
  actionMessage = '';
  sourceLabel = 'Teacher directory';
  teachers: TeacherRow[] = [];
  classes: ClassDirectoryRow[] = [];
  subjects: Subject[] = [];
  activeYear: AcademicYear | null = null;

  classTeacherForm = { teacherId: '', classId: '' };
  subjectTeacherForm = { teacherId: '', classId: '', subjectId: '' };

  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadTeachers();
  }

  hasPermission(permission: string): boolean {
    return this.auth.hasPermission(permission);
  }

  formatDate(value?: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  teacherId(teacher: TeacherDirectoryRow): string {
    return teacher._id || teacher.id || '';
  }

  className(value: unknown): string {
    const record = value as any;
    return record?.displayName || record?.name || record?.className || '-';
  }

  subjectName(assignment: TeacherAssignment): string {
    const subject = assignment.subjectId as any;
    return subject?.name || assignment.subjectName || 'Subject';
  }

  assignClassTeacher(): void {
    if (!this.activeYear || !this.classTeacherForm.teacherId || !this.classTeacherForm.classId || this.saving) return;
    this.saving = true;
    this.api.replaceClassTeacher({
      academicYearId: this.activeYear._id || this.activeYear.id || '',
      newTeacherId: this.classTeacherForm.teacherId,
      classId: this.classTeacherForm.classId,
      reason: 'Assigned from dashboard'
    }).subscribe({
      next: () => {
        this.saving = false;
        this.actionMessage = 'Class teacher assignment saved.';
        this.loadTeachers();
      },
      error: (err) => {
        console.error('Failed to assign class teacher', err);
        this.saving = false;
        this.actionMessage = 'Could not assign class teacher.';
      }
    });
  }

  assignSubjectTeacher(): void {
    if (!this.activeYear || !this.subjectTeacherForm.teacherId || !this.subjectTeacherForm.classId || !this.subjectTeacherForm.subjectId || this.saving) return;
    this.saving = true;
    this.api.assignSubjectTeacher({
      academicYearId: this.activeYear._id || this.activeYear.id || '',
      teacherId: this.subjectTeacherForm.teacherId,
      classId: this.subjectTeacherForm.classId,
      subjectId: this.subjectTeacherForm.subjectId
    }).subscribe({
      next: () => {
        this.saving = false;
        this.actionMessage = 'Subject teacher assignment saved.';
        this.loadTeachers();
      },
      error: (err) => {
        console.error('Failed to assign subject teacher', err);
        this.saving = false;
        this.actionMessage = 'Could not assign subject teacher.';
      }
    });
  }

  endAssignment(assignment: TeacherAssignment): void {
    const id = assignment._id || assignment.id;
    if (!id) return;
    this.api.endTeacherAssignment(id).subscribe({
      next: () => this.loadTeachers(),
      error: (err) => {
        console.error('Failed to end assignment', err);
        this.actionMessage = 'Could not end assignment.';
      }
    });
  }

  private loadTeachers(): void {
    this.loading = true;
    forkJoin({
      teachers: this.api.getTeachers(),
      classes: this.api.getClasses(),
      subjects: this.api.getSubjects(),
      activeYear: this.api.getActiveAcademicYear(),
      assignments: this.api.getTeacherAssignments({ isActive: 'true' })
    }).subscribe({
      next: ({ teachers, classes, subjects, activeYear, assignments }) => {
        this.classes = classes;
        this.subjects = subjects;
        this.activeYear = activeYear;
        this.teachers = teachers.map((teacher) => {
          const id = this.teacherId(teacher);
          return {
            ...teacher,
            classTeacherAssignments: assignments.filter((assignment) => (assignment.teacherId as any)?._id === id && assignment.assignmentType === 'class_teacher'),
            subjectTeacherAssignments: assignments.filter((assignment) => (assignment.teacherId as any)?._id === id && assignment.assignmentType === 'subject_teacher')
          };
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load teacher directory', err);
        this.error = 'Could not load teacher assignments.';
        this.loading = false;
      }
    });
  }
}
