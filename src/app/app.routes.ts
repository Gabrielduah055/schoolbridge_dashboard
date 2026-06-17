import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { AiAssistantComponent } from './pages/ai-assistant/ai-assistant.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';
import { AnnouncementsComponent } from './pages/announcements/announcements.component';
import { AttendanceComponent } from './pages/attendance/attendance.component';
import { BroadcastsComponent } from './pages/broadcasts/broadcasts.component';
import { ChannelsComponent } from './pages/channels/channels.component';
import { ClassesComponent } from './pages/classes/classes.component';
import { ComplaintsComponent } from './pages/complaints/complaints.component';
import { ConversationsComponent } from './pages/conversations/conversations.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { EmailCenterComponent } from './pages/email-center/email-center.component';
import { EventsComponent } from './pages/events/events.component';
import { ExamResultsComponent } from './pages/exam-results/exam-results.component';
import { FeeManagementComponent } from './pages/fee-management/fee-management.component';
import { KnowledgeBaseComponent } from './pages/knowledge-base/knowledge-base.component';
import { LoginComponent } from './pages/login/login.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { HandoverQueueComponent } from './pages/handover-queue/handover-queue.component';
import { ParentsComponent } from './pages/parents/parents.component';
import { ReportCardsComponent } from './pages/report-cards/report-cards.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { StudentDetailsComponent } from './pages/student-details/student-details.component';
import { StudentsComponent } from './pages/students/students.component';
import { TeachersComponent } from './pages/teachers/teachers.component';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: '', component: DashboardComponent },
      { path: 'overview', redirectTo: '', pathMatch: 'full' },
      { path: 'conversations', component: ConversationsComponent },
      { path: 'conversations/:id', component: ConversationsComponent },
      { path: 'handover-queue', component: HandoverQueueComponent },
      { path: 'broadcasts', component: BroadcastsComponent },
      { path: 'students', component: StudentsComponent },
      { path: 'students/:id', component: StudentDetailsComponent },
      { path: 'parents', component: ParentsComponent },
      { path: 'teachers', component: TeachersComponent },
      { path: 'classes', component: ClassesComponent },
      { path: 'knowledge-base', component: KnowledgeBaseComponent },
      { path: 'channels', component: ChannelsComponent },
      { path: 'announcements', redirectTo: 'broadcasts', pathMatch: 'full' },
      { path: 'email-center', component: EmailCenterComponent },
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
