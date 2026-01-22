import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { DashboardDataService, DashboardData } from '../../../services/dashboard-data.service';

@Component({
    selector: 'app-analytics-tab',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './analytics-tab.component.html',
    styleUrl: './analytics-tab.component.css'
})
export class AnalyticsTabComponent implements OnInit, OnDestroy {
    data: DashboardData | null = null;
    private destroy$ = new Subject<void>();

    constructor(private dashboardDataService: DashboardDataService) { }

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
}
