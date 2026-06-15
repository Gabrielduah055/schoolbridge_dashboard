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
  pageTitle = 'Overview';
  pageSubtitle = 'Communication control center for school admins';

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
      this.pageTitle = 'Students';
      this.pageSubtitle = 'Student records used for communication matching';
      return;
    }

    if (cleanUrl.startsWith('/students/')) {
      this.pageTitle = 'Student Details';
      this.pageSubtitle = 'View student profile, guardian, class, and fee details';
      return;
    }

    if (cleanUrl === '/parents') {
      this.pageTitle = 'Parents';
      this.pageSubtitle = 'Guardian contacts and communication identities';
      return;
    }

    if (cleanUrl === '/teachers') {
      this.pageTitle = 'Teachers';
      this.pageSubtitle = 'Teaching staff communication context';
      return;
    }

    if (cleanUrl === '/classes') {
      this.pageTitle = 'Classes';
      this.pageSubtitle = 'Class-based audiences for broadcasts and follow-ups';
      return;
    }

    if (cleanUrl === '/knowledge-base') {
      this.pageTitle = 'Knowledge Base';
      this.pageSubtitle = 'Source material the AI uses to answer school questions';
      return;
    }

    if (cleanUrl === '/conversations' || cleanUrl.startsWith('/conversations/')) {
      this.pageTitle = 'Conversations';
      this.pageSubtitle = 'Shared inbox for parent, teacher, and AI-assisted threads';
      return;
    }

    if (cleanUrl === '/handover-queue') {
      this.pageTitle = 'Handover Queue';
      this.pageSubtitle = 'Escalations that need human attention';
      return;
    }

    if (cleanUrl === '/broadcasts') {
      this.pageTitle = 'Broadcasts';
      this.pageSubtitle = 'Draft, approve, and monitor school-wide communication';
      return;
    }

    if (cleanUrl === '/channels') {
      this.pageTitle = 'Channels';
      this.pageSubtitle = 'Provider connection status, delivery logs, and webhook events';
      return;
    }

    if (cleanUrl === '/settings') {
      this.pageTitle = 'Settings';
      this.pageSubtitle = 'Backend access and dashboard configuration';
      return;
    }

    this.pageTitle = activeItem?.label ?? 'Page Not Found';
    this.pageSubtitle = cleanUrl === '/' ? 'Communication control center for school admins' : 'This section is currently outside the MVP navigation';
  }
}
