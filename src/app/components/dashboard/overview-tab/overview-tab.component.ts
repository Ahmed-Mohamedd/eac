import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DashboardDataService, DashboardData } from '../../../services/dashboard-data.service';

@Component({
    selector: 'app-overview-tab',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './overview-tab.component.html',
    styleUrl: './overview-tab.component.css'
})
export class OverviewTabComponent implements OnInit, OnDestroy {
    data: DashboardData | null = null;
    private destroy$ = new Subject<void>();

    constructor(
        private dashboardDataService: DashboardDataService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.dashboardDataService.data$
            .pipe(takeUntil(this.destroy$))
            .subscribe(data => {
                this.data = data;
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // Navigate to view permit
    viewPermit(id: number): void {
        this.router.navigate(['/work-permit', id, 'view']);
    }

    // Navigate to all permits
    viewAllPermits(): void {
        this.router.navigate(['/work-permits']);
    }

    // Get status badge class
    getStatusClass(status: string): string {
        const statusMap: { [key: string]: string } = {
            'قيد الانتظار': 'status-pending',
            'موافق عليه': 'status-approved',
            'مرفوض': 'status-rejected',
            'قيد التنفيذ': 'status-in-progress',
            'مكتمل': 'status-completed',
            'ملغي': 'status-cancelled'
        };
        return statusMap[status] || 'status-default';
    }

    // Format date to Arabic locale
    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Truncate text
    truncate(text: string, length: number = 50): string {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    // Get percentage for progress bars
    getPercentage(value: number, total: number): number {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    }
}
