import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { AiAssistantComponent } from './pages/ai-assistant/ai-assistant.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';
import { AnnouncementsComponent } from './pages/announcements/announcements.component';
import { AttendanceComponent } from './pages/attendance/attendance.component';
import { ComplaintsComponent } from './pages/complaints/complaints.component';
import { ConversationsComponent } from './pages/conversations/conversations.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { EmailCenterComponent } from './pages/email-center/email-center.component';
import { EventsComponent } from './pages/events/events.component';
import { ExamResultsComponent } from './pages/exam-results/exam-results.component';
import { FeeManagementComponent } from './pages/fee-management/fee-management.component';
import { KnowledgeBaseComponent } from './pages/knowledge-base/knowledge-base.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { ReportCardsComponent } from './pages/report-cards/report-cards.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { StudentsComponent } from './pages/students/students.component';
import { TeachersComponent } from './pages/teachers/teachers.component';

export const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', component: DashboardComponent },
      { path: 'students', component: StudentsComponent },
      { path: 'teachers', component: TeachersComponent },
      { path: 'knowledge-base', component: KnowledgeBaseComponent },
      { path: 'announcements', component: AnnouncementsComponent },
      { path: 'email-center', component: EmailCenterComponent },
      { path: 'conversations', component: ConversationsComponent },
      { path: 'fee-management', component: FeeManagementComponent },
      { path: 'report-cards', component: ReportCardsComponent },
      { path: 'attendance', component: AttendanceComponent },
      { path: 'exam-results', component: ExamResultsComponent },
      { path: 'events', component: EventsComponent },
      { path: 'complaints', component: ComplaintsComponent },
      { path: 'ai-assistant', component: AiAssistantComponent },
      { path: 'analytics', component: AnalyticsComponent },
      { path: 'settings', component: SettingsComponent },
      { path: '**', component: NotFoundComponent }
    ]
  }
];
