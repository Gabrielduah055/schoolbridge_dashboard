import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  route: string;
}

interface FeeRow {
  className: string;
  students: number;
  paid: string;
  outstanding: string;
  status: 'Complete' | 'Partial' | 'Behind';
}

interface FeeSummary {
  percent: number;
  collected: string;
  target: string;
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatGHS(amount: number): string {
  if (isNaN(amount) || amount == null) return 'GHS 0';
  return `GHS ${amount.toLocaleString('en-GH', { maximumFractionDigits: 0 })}`;
}

function safePercent(numerator: number, denominator: number): number {
  if (!denominator || denominator === 0 || isNaN(numerator) || isNaN(denominator)) return 0;
  return Math.round((numerator / denominator) * 100);
}

function feeStatus(paid: number, total: number): 'Complete' | 'Partial' | 'Behind' {
  const pct = safePercent(paid, total);
  if (pct >= 100) return 'Complete';
  if (pct >= 50) return 'Partial';
  return 'Behind';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly getIconPath = getIconPath;
  private frameId = 0;

  studentsLoading = true;
  studentsError = false;
  feeLoading = true;

  constructor(private api: ApiService) {}

  stats: StatCard[] = [
    { label: 'Total Students',  value: 0, display: '—', change: 'Loading…', icon: 'students', tone: 'purple' },
    { label: 'Total Parents',   value: 0, display: '—', change: 'Loading…', icon: 'teachers',  tone: 'blue'   },
    { label: 'Fee Collection',  value: 0, suffix: '%', display: '—', change: 'Loading…', icon: 'money',    tone: 'emerald' },
    { label: 'Messages Today',  value: 0, display: '—', change: 'Loading…', icon: 'chat',     tone: 'amber'  }
  ];

  readonly attendanceRows = [
    { label: 'Best class',      className: 'Class 5A', percent: 97, tone: 'green' },
    { label: 'Average',         className: 'Class 3B', percent: 89, tone: 'purple' },
    { label: 'Needs attention', className: 'Class 2B', percent: 74, tone: 'red' }
  ];

  announcements: Announcement[] = [
    { title: 'PTA dues reminder',          target: 'All Parents', time: '10 mins', rate: '91%', tone: 'purple' },
    { title: 'Class 4B science trip',      target: 'Class 4B',   time: '35 mins', rate: '78%', tone: 'blue'   },
    { title: 'Mid-term assessment dates',  target: 'All Parents', time: '1 hr',   rate: '84%', tone: 'green'  },
    { title: 'Uniform inspection notice',  target: 'Class 2B',   time: '2 hrs',  rate: '65%', tone: 'red'    }
  ];

  readonly actions: Action[] = [
    { label: 'Send Announcement', icon: 'megaphone', tone: 'purple', route: '/announcements' },
    { label: 'Add Student',       icon: 'userPlus',  tone: 'blue',   route: '/students'      },
    { label: 'Upload Knowledge',  icon: 'upload',    tone: 'emerald',route: '/knowledge-base'},
    { label: 'Send Email',        icon: 'mail',      tone: 'emerald',route: '/email-center'  },
    { label: 'Check Fees',        icon: 'wallet',    tone: 'amber',  route: '/fee-management'},
    { label: 'Mark Attendance',   icon: 'check',     tone: 'pink',   route: '/attendance'    },
    { label: 'Generate Report',   icon: 'file',      tone: 'gray',   route: '/report-cards'  }
  ];

  feeSummary: FeeSummary = { percent: 0, collected: '—', target: '—' };
  feeRows: FeeRow[] = [];
  feeError = false;

  readonly insights: Insight[] = [
    { icon: 'warning',  text: 'Class 2B attendance dropped 18% this week.',      action: 'Recommend investigation with class teacher.',  tone: 'amber' },
    { icon: 'money',    text: '8 students have fees outstanding for over 30 days.', action: 'Auto reminders sent to parents.',            tone: 'red'   },
    { icon: 'megaphone',text: 'Parent engagement is highest on Tuesdays at 9am.', action: 'Schedule announcements then.',               tone: 'blue'  }
  ];

  readonly activities: Activity[] = [
    { icon: 'megaphone', text: 'Announcement sent to all Class 4 parents',  time: '8 mins ago',  tone: 'pink'  },
    { icon: 'money',     text: 'Fee reminder sent to 23 defaulters',         time: '22 mins ago', tone: 'amber' },
    { icon: 'teachers',  text: 'Mr. Boateng sent message to 4B parents',     time: '41 mins ago', tone: 'blue'  },
    { icon: 'report',    text: 'Report cards uploaded for Class 5',           time: '1 hr ago',   tone: 'gray'  },
    { icon: 'check',     text: "Mrs. Mensah's complaint resolved",            time: '2 hrs ago',  tone: 'green' }
  ];

  ngOnInit(): void {
    this.loadStudentData();
  }

  private loadStudentData(): void {
    this.api.getStudents().subscribe({
      next: (data: any) => {
        const students: any[] = Array.isArray(data) ? data : [];
        this.studentsError = false;

        const totalStudents = students.length;
        const totalParents  = students.filter((s: any) => !!s.parentPhone).length;
        const unregistered  = totalStudents - totalParents;

        // ── Derive fee data from student records ──────────────────────────────
        // Group students by class, aggregate termFee / outstanding from Fee model
        // fields that are embedded via population if present, else derive safely.
        const byClass: Record<string, { students: number; termFee: number; amountPaid: number; outstanding: number }> = {};

        let totalTermFee  = 0;
        let totalPaid     = 0;
        let totalOutstanding = 0;

        for (const s of students) {
          const cls        = s.class ?? 'Unknown';
          const termFee    = Number(s.termFee    ?? s.fee?.termFee    ?? 0);
          const amountPaid = Number(s.amountPaid ?? s.fee?.amountPaid ?? 0);
          const outstanding = termFee > 0
            ? Math.max(0, termFee - amountPaid)
            : Number(s.outstanding ?? s.fee?.outstanding ?? 0);

          if (!byClass[cls]) byClass[cls] = { students: 0, termFee: 0, amountPaid: 0, outstanding: 0 };
          byClass[cls].students++;
          byClass[cls].termFee    += termFee;
          byClass[cls].amountPaid += amountPaid;
          byClass[cls].outstanding += outstanding;

          totalTermFee    += termFee;
          totalPaid       += amountPaid;
          totalOutstanding += outstanding;
        }

        // Build fee rows sorted by class name
        this.feeRows = Object.entries(byClass)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([cls, d]) => ({
            className:   cls,
            students:    d.students,
            paid:        formatGHS(d.amountPaid),
            outstanding: formatGHS(d.outstanding),
            status:      feeStatus(d.amountPaid, d.termFee)
          }));

        // Fee summary bar — only show if we have actual fee data
        const feePercent = safePercent(totalPaid, totalTermFee);
        if (totalTermFee > 0) {
          this.feeSummary = {
            percent:   feePercent,
            collected: formatGHS(totalPaid),
            target:    formatGHS(totalTermFee)
          };
        }
        this.feeLoading = false;

        // ── Update stat counters ──────────────────────────────────────────────
        this.stats[0].value  = totalStudents;
        this.stats[0].change = `${totalStudents} enrolled`;

        this.stats[1].value  = totalParents;
        this.stats[1].change = unregistered > 0 ? `${unregistered} unregistered` : 'All registered';

        this.stats[2].value  = feePercent;
        this.stats[2].change = totalTermFee > 0
          ? `${formatGHS(totalPaid)} collected`
          : 'No fee data yet';

        // Messages Today - the deployed backend does not expose conversations yet.
        this.stats[3].value  = 0;
        this.stats[3].change = 'No message data yet';

        this.studentsLoading = false;
        this.startAnimation();
      },

      error: () => {
        this.studentsError  = true;
        this.studentsLoading = false;
        this.feeLoading     = false;
        this.feeError       = true;

        this.stats[0].display = '—';
        this.stats[0].change  = 'Could not reach server';
        this.stats[1].display = '—';
        this.stats[1].change  = 'Could not reach server';
        this.stats[2].display = '—';
        this.stats[2].change  = 'Could not reach server';
        this.stats[3].display = '—';
        this.stats[3].change  = 'Could not reach server';
      }
    });
  }

  private startAnimation(): void {
    cancelAnimationFrame(this.frameId);
    const start    = performance.now();
    const duration = 900;

    const animate = (time: number) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);

      for (const stat of this.stats) {
        const current = Math.round(stat.value * eased);
        stat.display  = `${current}${stat.suffix ?? ''}`;
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
