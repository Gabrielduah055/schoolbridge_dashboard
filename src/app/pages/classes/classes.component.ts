import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, ClassDirectoryRow } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-classes-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './classes.component.html',
  styleUrl: './classes.component.css'
})
export class ClassesComponent implements OnInit {
  loading = true;
  importing = false;
  error = '';
  actionMessage = '';
  sourceLabel = 'Class communication directory';
  classes: ClassDirectoryRow[] = [];

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

  importClasses(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    this.importing = true;
    this.actionMessage = 'Importing class directory...';

    this.api.importClasses(formData).subscribe({
      next: (result) => {
        this.actionMessage = `Class import complete. ${result.imported} added, ${result.updated} updated, ${result.skipped} skipped.`;
        this.importing = false;
        input.value = '';
        this.loadClasses();
      },
      error: (err) => {
        console.error('Failed to import classes', err);
        this.actionMessage = 'Class import failed. Please check the file columns.';
        this.importing = false;
        input.value = '';
      }
    });
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
