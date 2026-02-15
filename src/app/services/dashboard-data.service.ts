import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
    DashboardStatisticsDto,
    PermitsTrendDto,
    DepartmentStatisticsDto,
    RecentActivityDto,
    TopStatisticsDto,
    ComplianceMetricsDto,
    AlertsSummaryDto,
    CalendarViewDto,
    ShSignatureStatsDto,
    UnsignedPermitDto,
    PaginatedResult
} from '../models/dashboard-models';

export interface DashboardData {
    statistics: DashboardStatisticsDto | null;
    trends: PermitsTrendDto | null;
    departmentStats: DepartmentStatisticsDto[];
    topStats: TopStatisticsDto | null;
    recentActivity: RecentActivityDto | null;
    alerts: AlertsSummaryDto | null;
    compliance: ComplianceMetricsDto | null;
    calendar?: CalendarViewDto | null;
    shSignatureStats?: ShSignatureStatsDto | null;
    unsignedPermits?: PaginatedResult<UnsignedPermitDto> | null;
}

@Injectable({
    providedIn: 'root'
})
export class DashboardDataService {
    private dataSubject = new BehaviorSubject<DashboardData | null>(null);
    public data$: Observable<DashboardData | null> = this.dataSubject.asObservable();

    private loadingSubject = new BehaviorSubject<boolean>(false);
    public isLoading$: Observable<boolean> = this.loadingSubject.asObservable();

    constructor() { }

    setData(data: DashboardData): void {
        this.dataSubject.next(data);
    }

    getData(): DashboardData | null {
        return this.dataSubject.value;
    }

    setLoading(loading: boolean): void {
        this.loadingSubject.next(loading);
    }

    isLoading(): boolean {
        return this.loadingSubject.value;
    }

    clearData(): void {
        this.dataSubject.next(null);
    }
}
