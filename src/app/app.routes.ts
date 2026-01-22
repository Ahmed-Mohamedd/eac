import { Routes } from '@angular/router';
import { WorkPermitComponent } from './components/work-permit/work-permit.component';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { OverviewTabComponent } from './components/dashboard/overview-tab/overview-tab.component';
import { AnalyticsTabComponent } from './components/dashboard/analytics-tab/analytics-tab.component';
import { ComplianceTabComponent } from './components/dashboard/compliance-tab/compliance-tab.component';
import { CalendarTabComponent } from './components/dashboard/calendar-tab/calendar-tab.component';
import { MainWorkPermitsComponent } from './components/main-work-permits/main-work-permits.component';
import { WorkPermitDetailComponent } from './components/work-permit-detail/work-permit-detail.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [

  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent) },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: OverviewTabComponent },
      { path: 'analytics', component: AnalyticsTabComponent },
      { path: 'compliance', component: ComplianceTabComponent },
      { path: 'calendar', component: CalendarTabComponent }
    ]
  },
  { path: 'work-permits', component: MainWorkPermitsComponent, canActivate: [AuthGuard] },
  { path: 'users', loadComponent: () => import('./components/user-management/user-management.component').then(m => m.UserManagementComponent), canActivate: [AuthGuard] },
  { path: 'work-permit/:id/view', component: WorkPermitDetailComponent, canActivate: [AuthGuard] },
  { path: 'work-permit/:id/edit', component: WorkPermitComponent, canActivate: [AuthGuard] },
  { path: 'work-permit/new', component: WorkPermitComponent, canActivate: [AuthGuard] }

];
