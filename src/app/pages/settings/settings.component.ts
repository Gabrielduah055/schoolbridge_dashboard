import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService, AuthUser } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  readonly apiUrl = environment.apiUrl;
  user: AuthUser | null = null;

  constructor(private readonly auth: AuthService) {}

  ngOnInit(): void {
    this.user = this.auth.currentUser();
    this.auth.loadMe().subscribe({
      next: ({ user }) => this.user = user,
      error: () => this.user = this.auth.currentUser()
    });
  }

  logout(): void {
    this.auth.logout();
  }

  permissionPreview(): string {
    const permissions = this.user?.permissions || [];
    return permissions.length > 8
      ? `${permissions.slice(0, 8).join(', ')} and ${permissions.length - 8} more`
      : permissions.join(', ');
  }
}
