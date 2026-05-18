import { Component, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { NAVIGATION_ITEMS } from '../../core/navigation';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent implements OnDestroy {
  pageTitle = 'Dashboard';
  pageSubtitle = 'Good morning, Mr. Asante';

  private readonly subscription: Subscription;

  constructor(private readonly router: Router) {
    this.updatePageMeta(this.router.url);
    this.subscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.updatePageMeta(event.urlAfterRedirects));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private updatePageMeta(url: string): void {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const activeItem = NAVIGATION_ITEMS.find((item) => item.path === cleanUrl);

    if (cleanUrl === '/students') {
      this.pageTitle = 'Students & Parents';
      this.pageSubtitle = 'Manage all students and their guardians';
      return;
    }

    if (cleanUrl === '/teachers') {
      this.pageTitle = 'Teachers';
      this.pageSubtitle = 'Manage teaching staff and their activities';
      return;
    }

    if (cleanUrl === '/knowledge-base') {
      this.pageTitle = 'Knowledge Base - The Brain';
      this.pageSubtitle = 'Everything the AI learns about your school lives here. Upload documents and the bot instantly knows.';
      return;
    }

    this.pageTitle = activeItem?.label ?? 'Page Not Found';
    this.pageSubtitle = cleanUrl === '/' ? 'Good morning, Mr. Asante' : 'This section is currently under construction';
  }
}
