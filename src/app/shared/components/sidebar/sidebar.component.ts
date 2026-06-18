import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NAVIGATION_ITEMS, getIconPath } from '../../../core/navigation';
import { AuthService, AuthUser } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);
  readonly navItems = NAVIGATION_ITEMS;
  readonly getIconPath = getIconPath;
  readonly user$ = this.auth.user$;

  initials(user: AuthUser | null): string {
    if (!user?.name) return 'SB';
    return user.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  logout(): void {
    this.auth.logout();
  }
}
