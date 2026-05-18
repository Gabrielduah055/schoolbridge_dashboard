import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { IconName, getIconPath } from '../../core/navigation';
import { ApiService } from '../../core/services/api.service';

interface StatCard {
  label: string;
  value: number;
  suffix?: string;
  display: string;
  change: string;
  icon: IconName;
  tone: string;
}

interface Announcement {
  title: string;
  target: string;
  time: string;
  rate: string;
  tone: string;
}

interface Action {
  label: string;
  icon: IconName;
  tone: string;
}

interface FeeRow {
  className: string;
  students: number;
  paid: string;
  outstanding: string;
  status: 'Complete' | 'Partial' | 'Behind';
}

interface Insight {
  icon: IconName;
  text: string;
  action: string;
  tone: string;
}

interface Activity {
  icon: IconName;
  text: string;
  time: string;
  tone: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly getIconPath = getIconPath;
  private frameId = 0;

  constructor(private api: ApiService) {}

  stats: StatCard[] = [
    {
      label: 'Total Students',
      value: 0,
      display: '—',
      change: 'Loading...',
      icon: 'students',
      tone: 'purple'
    },
    {
      label: 'Total Parents',
      value: 0,
      display: '—',
      change: 'Loading...',
      icon: 'teachers',
      tone: 'blue'
    },
    {
      label: 'Fee Collection',
      value: 67,
      suffix: '%',
      display: '0%',
      change: 'GHS 45,000 collected',
      icon: 'money',
      tone: 'emerald'
    },
    {
      label: 'Messages Today',
      value: 23,
      display: '0',
      change: '15 responded (65%)',
      icon: 'chat',
      tone: 'amber'
    }
  ];

  readonly attendanceRows = [
    { label: 'Best class', className: 'Class 5A', percent: 97, tone: 'green' },
    { label: 'Average', className: 'Class 3B', percent: 89, tone: 'purple' },
    { label: 'Needs attention', className: 'Class 2B', percent: 74, tone: 'red' }
  ];

  readonly announcements: Announcement[] = [
    {
      title: 'PTA dues reminder',
      target: 'All Parents',
      time: '10 mins',
      rate: '91%',
      tone: 'purple'
    },
    {
      title: 'Class 4B science trip',
      target: 'Class 4B',
      time: '35 mins',
      rate: '78%',
      tone: 'blue'
    },
    {
      title: 'Mid-term assessment dates',
      target: 'All Parents',
      time: '1 hr',
      rate: '84%',
      tone: 'green'
    },
    {
      title: 'Uniform inspection notice',
      target: 'Class 2B',
      time: '2 hrs',
      rate: '65%',
      tone: 'red'
    }
  ];

  readonly actions: Action[] = [
    { label: 'Send Announcement', icon: 'megaphone', tone: 'purple' },
    { label: 'Add Student', icon: 'userPlus', tone: 'blue' },
    { label: 'Send Email', icon: 'mail', tone: 'emerald' },
    { label: 'Check Fees', icon: 'wallet', tone: 'amber' },
    { label: 'Mark Attendance', icon: 'check', tone: 'pink' },
    { label: 'Generate Report', icon: 'file', tone: 'gray' }
  ];

  readonly feeRows: FeeRow[] = [
    { className: 'Class 6A', students: 52, paid: 'GHS 9,800', outstanding: 'GHS 600', status: 'Complete' },
    { className: 'Class 5B', students: 48, paid: 'GHS 8,100', outstanding: 'GHS 2,300', status: 'Partial' },
    { className: 'Class 4A', students: 55, paid: 'GHS 7,900', outstanding: 'GHS 2,800', status: 'Partial' },
    { className: 'Class 3A', students: 44, paid: 'GHS 4,600', outstanding: 'GHS 3,900', status: 'Behind' },
    { className: 'Class 2A', students: 39, paid: 'GHS 5,200', outstanding: 'GHS 1,700', status: 'Partial' }
  ];

  readonly insights: Insight[] = [
    {
      icon: 'warning',
      text: 'Class 2B attendance dropped 18% this week.',
      action: 'Recommend investigation with class teacher.',
      tone: 'amber'
    },
    {
      icon: 'money',
      text: '8 students have fees outstanding for over 30 days.',
      action: 'Auto reminders sent to parents.',
      tone: 'red'
    },
    {
      icon: 'megaphone',
      text: 'Parent engagement is highest on Tuesdays at 9am.',
      action: 'Schedule announcements then.',
      tone: 'blue'
    }
  ];

  readonly activities: Activity[] = [
    { icon: 'megaphone', text: 'Announcement sent to all Class 4 parents', time: '8 mins ago', tone: 'pink' },
    { icon: 'money', text: 'Fee reminder sent to 23 defaulters', time: '22 mins ago', tone: 'amber' },
    { icon: 'teachers', text: 'Mr. Boateng sent message to 4B parents', time: '41 mins ago', tone: 'blue' },
    { icon: 'report', text: 'Report cards uploaded for Class 5', time: '1 hr ago', tone: 'gray' },
    { icon: 'check', text: "Mrs. Mensah's complaint resolved", time: '2 hrs ago', tone: 'green' }
  ];

  ngOnInit(): void {
    // Fetch real student data then animate counters
    this.api.getStudents().subscribe({
      next: (data: any) => {
        const list: any[] = Array.isArray(data) ? data : [];
        const total = list.length;
        const withParent = list.filter((s: any) => s.parentPhone).length;

        // Update the values the animation will count up to
        this.stats[0].value = total;
        this.stats[0].change = `${total} enrolled`;
        this.stats[1].value = withParent;
        this.stats[1].change = `${total - withParent} unregistered parents`;

        this.startAnimation();
      },
      error: () => {
        // Fall back to static placeholders if API is down
        this.stats[0].display = '—';
        this.stats[0].change = 'Could not load';
        this.stats[1].display = '—';
        this.stats[1].change = 'Could not load';

        // Still animate the other stats
        this.stats[2].value = 67;
        this.stats[3].value = 23;
        this.startAnimation();
      }
    });
  }

  private startAnimation(): void {
    const start = performance.now();
    const duration = 900;

    const animate = (time: number) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      for (const stat of this.stats) {
        const current = Math.round(stat.value * eased);
        stat.display = `${current}${stat.suffix ?? ''}`;
      }

      if (progress < 1) {
        this.frameId = requestAnimationFrame(animate);
      }
    };

    this.frameId = requestAnimationFrame(animate);
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frameId);
  }

}
