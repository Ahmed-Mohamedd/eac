// ===========================
// Dashboard Statistics DTOs
// ===========================

export interface PermitsByStatusDto {
    pending: number;
    approved: number;
    inProgress: number;
    completed: number;
    rejected: number;
    cancelled: number;
}

export interface DashboardStatisticsDto {
    totalPermits: number;
    activePermits: number;
    pendingApprovals: number;
    completedThisMonth: number;
    overduePermits: number;
    completedThisWeek: number;
    averageProcessingTimeHours: number;
    permitsByStatus: PermitsByStatusDto;
}

// ===========================
// Trends DTOs
// ===========================

export interface TrendDataPointDto {
    date: string;
    created: number;
    completed: number;
    inProgress: number;
}

export interface PermitsTrendDto {
    dataPoints: TrendDataPointDto[];
}

// ===========================
// Department Statistics DTOs
// ===========================

export interface DepartmentStatisticsDto {
    departmentId: number;
    departmentName: string;
    totalPermits: number;
    activePermits: number;
    completedPermits: number;
    avgCompletionTimeHours: number;
    percentage: number;
}

// ===========================
// Recent Activity DTOs
// ===========================

export interface RecentPermitDto {
    id: number;
    departmentName: string;
    workDescription: string;
    status: string;
    createdAt: string;
    createdByName: string;
}

export interface UpcomingWorkDto {
    id: number;
    departmentName: string;
    workDescription: string;
    startWorkDate: string;
    startWorkHour: string;
    workLocation?: string;
}

export interface StatusChangeDto {
    permitId: number;
    workDescription: string;
    oldStatus: string;
    newStatus: string;
    changedAt: string;
    changedByName: string;
}

export interface RecentActivityDto {
    recentPermits: RecentPermitDto[];
    upcomingWork: UpcomingWorkDto[];
    recentStatusChanges: StatusChangeDto[];
}

// ===========================
// Calendar View DTOs
// ===========================

export interface CalendarPermitDto {
    id: number;
    title: string;
    startDate: string;
    endDate: string;
    departmentName: string;
    statusColor: string;
    workLocation?: string;
    isHotWork: boolean;
}

export interface CalendarViewDto {
    permits: CalendarPermitDto[];
}

// ===========================
// Top Statistics DTOs
// ===========================

export interface TopItemDto {
    name: string;
    count: number;
}

export interface TopStatisticsDto {
    topDepartments: TopItemDto[];
    topLocations: TopItemDto[];
    busiestSupervisors: TopItemDto[];
}

// ===========================
// Compliance Metrics DTOs (ACTUAL BACKEND STRUCTURE)
// ===========================

export interface SafetyStatsDto {
    totalHotWorkPermits: number;
    weldingPermits: number;
    cuttingPermits: number;
    otherHotWorkPermits: number;
    hotWorkPercentage: number;
}

export interface ComplianceMetricsDto {
    totalPermits: number;
    permitsWithPPE: number;
    ppeCompliancePercentage: number;
    hotWorkStats: SafetyStatsDto;
    permitsInConfinedSpaces: number;
    permitsWithSafetyBriefing: number;
    safetyEquipmentUsage: { [key: string]: number }; // e.g., "Helmet": 45, "Gloves": 50
}

// ===========================
// Alerts DTOs (ACTUAL BACKEND STRUCTURE)
// ===========================

export interface AlertItemDto {
    permitId: number;
    workDescription: string;
    alertType: string; // "Overdue", "PendingApproval", "StartingSoon"
    severity: string; // "High", "Medium", "Low"
    dueDate: string | null;
    daysOverdue: number;
}

export interface AlertsSummaryDto {
    totalAlerts: number;
    highPriorityAlerts: number;
    overduePermits: AlertItemDto[];
    pendingApprovals: AlertItemDto[];
    startingSoon: AlertItemDto[];
}

// ===========================
// User Dashboard DTOs
// ===========================

export interface MyPermitsDto {
    total: number;
    active: number;
    pending: number;
    completed: number;
}

export interface PermitsAsWorkerDto {
    total: number;
    upcoming: number;
    active: number;
}

export interface MyDepartmentStatsDto {
    departmentName: string;
    totalPermits: number;
    activePermits: number;
    myContribution: number;
}

export interface QuickActionsDto {
    canCreatePermit: boolean;
    canApprovePermits: boolean;
    pendingMyApproval: number;
}

export interface UserDashboardDto {
    myPermits: MyPermitsDto;
    myRecentPermits: RecentPermitDto[];
    permitsAsWorker: PermitsAsWorkerDto;
    myDepartmentStats: MyDepartmentStatsDto;
    quickActions: QuickActionsDto;
}

// ===========================
// Export Report DTOs
// ===========================

export interface DateRangeDto {
    startDate: string;
    endDate: string;
}

export interface ExportDashboardReportCommand {
    reportType: 'summary' | 'detailed' | 'compliance';
    format: 'pdf' | 'excel' | 'csv';
    dateRange: DateRangeDto;
    includeSections: string[];
}
