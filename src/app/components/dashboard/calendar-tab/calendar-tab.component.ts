import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService } from '../../../services/dashboard.service';
import { DashboardDataService } from '../../../services/dashboard-data.service';
import { CalendarViewDto, CalendarPermitDto } from '../../../models/dashboard-models';
import { Subscription } from 'rxjs';

interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    permits: CalendarPermitDto[];
}

@Component({
    selector: 'app-calendar-tab',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './calendar-tab.component.html',
    styleUrl: './calendar-tab.component.css'
})
export class CalendarTabComponent implements OnInit, OnDestroy {
    data: CalendarViewDto | null = null;
    isLoading: boolean = false;
    private subscription?: Subscription;

    // View toggle
    viewMode: 'calendar' | 'timeline' = 'calendar';

    // Calendar state
    currentMonth: Date = new Date();
    calendarDays: CalendarDay[] = [];
    weekDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    constructor(
        private dashboardService: DashboardService,
        private dashboardDataService: DashboardDataService,
        private router: Router
    ) { }

    ngOnInit(): void {
        // Initial load for current month
        this.loadCalendarData();
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }

    loadCalendarData(): void {
        this.isLoading = true;

        // Calculate start and end dates for the current view month
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const startDate = firstDay.toISOString().split('T')[0];
        const endDate = lastDay.toISOString().split('T')[0];

        this.dashboardService.getCalendarView(startDate, endDate).subscribe({
            next: (data) => {
                this.data = data;
                this.generateCalendar();
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading calendar data:', error);
                this.isLoading = false;
            }
        });
    }

    toggleView(): void {
        this.viewMode = this.viewMode === 'calendar' ? 'timeline' : 'calendar';
    }

    previousMonth(): void {
        this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
        this.loadCalendarData();
    }

    nextMonth(): void {
        this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
        this.loadCalendarData();
    }

    getCurrentMonthName(): string {
        return this.currentMonth.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
    }

    private generateCalendar(): void {
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();

        // First day of the month
        const firstDay = new Date(year, month, 1);
        // Last day of the month
        const lastDay = new Date(year, month + 1, 0);

        // Start from Sunday of the week containing the first day
        const startDate = new Date(firstDay);
        startDate.setDate(firstDay.getDate() - firstDay.getDay());

        // End on Saturday of the week containing the last day
        const endDate = new Date(lastDay);
        endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

        this.calendarDays = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dayPermits = this.getPermitsForDate(currentDate);

            this.calendarDays.push({
                date: new Date(currentDate),
                isCurrentMonth: currentDate.getMonth() === month,
                permits: dayPermits
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    private getPermitsForDate(date: Date): CalendarPermitDto[] {
        if (!this.data?.permits) return [];

        return this.data.permits.filter(permit => {
            const startDate = new Date(permit.startDate);
            const endDate = new Date(permit.endDate);

            // Reset hours to compare only dates
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            const s = new Date(startDate);
            s.setHours(0, 0, 0, 0);
            const e = new Date(endDate);
            e.setHours(0, 0, 0, 0);

            return d >= s && d <= e;
        });
    }

    private getYYYYMMDD(date: Date): string {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    getPermitSpan(permit: CalendarPermitDto, day: CalendarDay): number {
        const dayDateStr = this.getYYYYMMDD(day.date);
        const permitStartStr = permit.startDate.split('T')[0];

        if (dayDateStr !== permitStartStr) {
            return 0;
        }

        const dayDate = new Date(day.date);
        dayDate.setHours(0, 0, 0, 0);

        const endDate = new Date(permit.endDate);
        endDate.setHours(0, 0, 0, 0);

        const weekEnd = new Date(dayDate);
        weekEnd.setDate(dayDate.getDate() + (6 - dayDate.getDay()));

        const spanEnd = endDate < weekEnd ? endDate : weekEnd;
        const daysDiff = Math.ceil((spanEnd.getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        return Math.min(daysDiff, 7 - dayDate.getDay());
    }

    shouldShowPermit(permit: CalendarPermitDto, day: CalendarDay): boolean {
        const dayDateStr = this.getYYYYMMDD(day.date);
        const permitStartStr = permit.startDate.split('T')[0];

        return dayDateStr === permitStartStr;
    }

    getTimelineGroups(): { date: string, permits: CalendarPermitDto[] }[] {
        if (!this.data?.permits) return [];

        const groups = new Map<string, CalendarPermitDto[]>();

        this.data.permits.forEach(permit => {
            const dateKey = permit.startDate.split('T')[0];
            if (!groups.has(dateKey)) {
                groups.set(dateKey, []);
            }
            groups.get(dateKey)!.push(permit);
        });

        return Array.from(groups.entries())
            .map(([date, permits]) => ({ date, permits }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ar-EG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    viewPermit(permitId: number): void {
        this.router.navigate(['/work-permit', permitId, 'view']);
    }
}
