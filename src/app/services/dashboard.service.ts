import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
    DashboardStatisticsDto,
    PermitsTrendDto,
    DepartmentStatisticsDto,
    RecentActivityDto,
    CalendarViewDto,
    TopStatisticsDto,
    ComplianceMetricsDto,
    AlertsSummaryDto,
    UserDashboardDto,
    ExportDashboardReportCommand,
    ShSignatureStatsDto,
    UnsignedPermitDto,
    PaginatedResult
} from '../models/dashboard-models';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private apiUrl = environment.apiUrl + '/dashboard';

    constructor(private http: HttpClient) { }

    /**
     * 1. Get Dashboard Statistics
     * Backend expects: DepartmentId, UserId, StartDate, EndDate (all PascalCase, all optional)
     */
    getDashboardStatistics(filters?: {
        departmentId?: number,
        userId?: number,
        startDate?: string,
        endDate?: string
    }): Observable<DashboardStatisticsDto> {
        let params = new HttpParams();

        if (filters?.departmentId) params = params.set('DepartmentId', filters.departmentId.toString());
        if (filters?.userId) params = params.set('UserId', filters.userId.toString());
        if (filters?.startDate) params = params.set('StartDate', filters.startDate);
        if (filters?.endDate) params = params.set('EndDate', filters.endDate);

        return this.http.get<DashboardStatisticsDto>(`${this.apiUrl}/statistics`, { params });
    }

    /**
     * 2. Get Permits Over Time (Trends)
     * Backend expects: Months, GroupBy, DepartmentId, UserId (PascalCase)
     */
    getPermitsOverTime(months: number = 6, groupBy: 'day' | 'week' | 'month' = 'month'): Observable<PermitsTrendDto> {
        let params = new HttpParams()
            .set('Months', months.toString())
            .set('GroupBy', groupBy);

        return this.http.get<PermitsTrendDto>(`${this.apiUrl}/trends`, { params });
    }

    /**
     * 3. Get Department Statistics
     * Backend expects: StartDate, EndDate (PascalCase, optional)
     */
    getDepartmentStatistics(startDate?: string, endDate?: string): Observable<DepartmentStatisticsDto[]> {
        let params = new HttpParams();
        if (startDate) params = params.set('StartDate', startDate);
        if (endDate) params = params.set('EndDate', endDate);

        return this.http.get<DepartmentStatisticsDto[]>(`${this.apiUrl}/departments`, { params });
    }

    /**
     * 4. Get Recent Activity
     * Backend expects: RecentPermitsCount, UpcomingDays (PascalCase)
     */
    getRecentActivity(recentCount: number = 10, upcomingDays: number = 7): Observable<RecentActivityDto> {
        let params = new HttpParams()
            .set('RecentPermitsCount', recentCount.toString())
            .set('UpcomingDays', upcomingDays.toString());

        return this.http.get<RecentActivityDto>(`${this.apiUrl}/recent-activity`, { params });
    }

    /**
     * 5. Get Calendar View
     * Backend expects: StartDate, EndDate (required), DepartmentId (optional) - PascalCase
     */
    getCalendarView(startDate: string, endDate: string, departmentId?: number): Observable<CalendarViewDto> {
        let params = new HttpParams()
            .set('StartDate', startDate)
            .set('EndDate', endDate);

        if (departmentId) params = params.set('DepartmentId', departmentId.toString());

        return this.http.get<CalendarViewDto>(`${this.apiUrl}/calendar`, { params });
    }

    /**
     * 6. Get Top Statistics
     * Backend expects: TopCount, StartDate, EndDate (PascalCase)
     * Route: /dashboard/top (NOT /dashboard/top-stats)
     */
    getTopStatistics(topCount: number = 5, startDate?: string, endDate?: string): Observable<TopStatisticsDto> {
        let params = new HttpParams().set('TopCount', topCount.toString());
        if (startDate) params = params.set('StartDate', startDate);
        if (endDate) params = params.set('EndDate', endDate);

        return this.http.get<TopStatisticsDto>(`${this.apiUrl}/top`, { params });
    }

    /**
     * 7. Get Compliance Metrics
     * Backend expects: StartDate, EndDate (PascalCase, optional)
     */
    getComplianceMetrics(startDate?: string, endDate?: string): Observable<ComplianceMetricsDto> {
        let params = new HttpParams();
        if (startDate) params = params.set('StartDate', startDate);
        if (endDate) params = params.set('EndDate', endDate);

        return this.http.get<ComplianceMetricsDto>(`${this.apiUrl}/compliance`, { params });
    }

    /**
     * 8. Get Alerts Summary
     * Backend expects: MaxAlerts, StartDate, EndDate (PascalCase)
     */
    getAlertsSummary(maxAlerts: number = 10, startDate?: string, endDate?: string): Observable<AlertsSummaryDto> {
        let params = new HttpParams().set('MaxAlerts', maxAlerts.toString());
        if (startDate) params = params.set('StartDate', startDate);
        if (endDate) params = params.set('EndDate', endDate);

        return this.http.get<AlertsSummaryDto>(`${this.apiUrl}/alerts`, { params });
    }

    /**
     * 9. Get User Dashboard (Personalized)
     * Backend expects: RecentPermitsCount, UpcomingDays (PascalCase)
     */
    getUserDashboard(recentCount: number = 5, upcomingDays: number = 7): Observable<UserDashboardDto> {
        let params = new HttpParams()
            .set('RecentPermitsCount', recentCount.toString())
            .set('UpcomingDays', upcomingDays.toString());

        return this.http.get<UserDashboardDto>(`${this.apiUrl}/my-dashboard`, { params });
    }

    /**
     * 10. Export Dashboard Report
     * Returns: File download (blob)
     */
    exportDashboardReport(command: ExportDashboardReportCommand): Observable<Blob> {
        return this.http.post(`${this.apiUrl}/export`, command, {
            responseType: 'blob'
        });
    }

    /**
     * 11. Get S&H Signature Statistics
     */
    getShSignatureStats(departmentId?: number): Observable<ShSignatureStatsDto> {
        let params = new HttpParams();
        if (departmentId) {
            params = params.set('departmentId', departmentId.toString());
        }
        return this.http.get<ShSignatureStatsDto>(`${this.apiUrl}/sh-signature-stats`, { params });
    }

    /**
     * 12. Get Unsigned Permits (Paginated)
     */
    getUnsignedPermits(page: number = 1, pageSize: number = 10, departmentId?: number): Observable<PaginatedResult<UnsignedPermitDto>> {
        let params = new HttpParams()
            .set('PageIndex', page.toString())
            .set('PageSize', pageSize.toString());

        if (departmentId) {
            params = params.set('DepartmentId', departmentId.toString());
        }

        return this.http.get<PaginatedResult<UnsignedPermitDto>>(`${this.apiUrl}/unsigned-permits`, { params });
    }
}
