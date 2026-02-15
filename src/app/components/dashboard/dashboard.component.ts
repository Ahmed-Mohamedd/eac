import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardDataService } from '../../services/dashboard-data.service';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
    currentUser: User | null = null;
    isLoading: boolean = false;
    isScrolled: boolean = false;

    @HostListener('document:scroll', ['$event'])
    onWindowScroll(event: any) {
        // Since the scroll is on the 'main' element in app.component, 
        // we check the target of the scroll event
        const scrollTop = event.target.scrollTop || 0;
        this.isScrolled = scrollTop > 20;
    }

    constructor(
        private authService: AuthService,
        private dashboardService: DashboardService,
        private dashboardDataService: DashboardDataService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.currentUser = this.authService.getCurrentUser();
        this.loadDashboard();
    }

    /**
     * Load dashboard data - backend returns role-appropriate data automatically
     */
    loadDashboard(): void {
        this.isLoading = true;
        this.dashboardDataService.setLoading(true);

        forkJoin({
            statistics: this.dashboardService.getDashboardStatistics(),
            trends: this.dashboardService.getPermitsOverTime(6, 'month'),
            departmentStats: this.dashboardService.getDepartmentStatistics(),
            topStats: this.dashboardService.getTopStatistics(5),
            recentActivity: this.dashboardService.getRecentActivity(10, 7),
            alerts: this.dashboardService.getAlertsSummary(10),
            compliance: this.dashboardService.getComplianceMetrics(),
            shSignatureStats: this.dashboardService.getShSignatureStats(),
            unsignedPermits: this.dashboardService.getUnsignedPermits(1, 5)
        }).subscribe({
            next: (data) => {
                // Set all data in the shared service
                this.dashboardDataService.setData({
                    statistics: data.statistics,
                    trends: data.trends,
                    departmentStats: data.departmentStats,
                    topStats: data.topStats,
                    recentActivity: data.recentActivity,
                    alerts: data.alerts,
                    compliance: data.compliance,
                    shSignatureStats: data.shSignatureStats,
                    unsignedPermits: data.unsignedPermits
                });
                this.isLoading = false;
                this.dashboardDataService.setLoading(false);
                console.log('✅ Dashboard data loaded successfully');
            },
            error: (error) => {
                console.error('❌ Error loading dashboard data:', error);
                this.isLoading = false;
                this.dashboardDataService.setLoading(false);
            }
        });
    }

    // Navigate to create new permit
    createNewPermit(): void {
        this.router.navigate(['/work-permit/new']);
    }

    /**
     * Get current time for header timestamp
     */
    getCurrentTime(): string {
        const now = new Date();
        return now.toLocaleString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    /**
     * Refresh data
     */
    refreshData(): void {
        this.loadDashboard();
    }
}

