import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WorkPermitService } from '../../services/work-permit.service';
import { WorkPermitListDto, PaginatedResult, WorkPermitStatusDto, WorkPermitFilters } from '../../models/work-permit-list';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { DepartmentService, Department } from '../../services/department.service';


@Component({
  selector: 'app-main-work-permits',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './main-work-permits.component.html',
  styleUrl: './main-work-permits.component.css'
})
export class MainWorkPermitsComponent implements OnInit {
  permits: WorkPermitListDto[] = [];
  statuses: WorkPermitStatusDto[] = [];
  departments: Department[] = [];

  // Expose Math to template
  Math = Math;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;

  // Filters
  filters: WorkPermitFilters = {
    pageIndex: 1,
    pageSize: 10
  };

  // Loading state
  isLoading = false;

  // Filter inputs
  selectedDepartmentId?: number;
  selectedStatusId?: number;
  fromDate = '';
  toDate = '';

  // Status Change Modal
  showStatusModal = false;
  selectedPermit: WorkPermitListDto | null = null;
  newStatusId: number | null = null;
  isUpdatingStatus = false;

  constructor(
    private workPermitService: WorkPermitService,
    private departmentService: DepartmentService,
    private router: Router,
    public authService: AuthService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.loadDepartments();
    this.loadStatuses();
    this.loadPermits();
  }

  loadDepartments(): void {
    this.departmentService.getAllDepartments().subscribe({
      next: (result) => {
        this.departments = result.data;
      },
      error: (error) => {
        console.error('Error loading departments:', error);
      }
    });
  }

  loadStatuses(): void {
    this.workPermitService.getWorkPermitStatuses().subscribe({
      next: (data) => {
        this.statuses = data;
      },
      error: (error) => {
        console.error('Error loading statuses:', error);
      }
    });
  }

  loadPermits(): void {
    this.isLoading = true;

    this.filters = {
      departmentId: this.selectedDepartmentId,
      workPermitStatusId: this.selectedStatusId,
      fromDate: this.fromDate || undefined,
      toDate: this.toDate || undefined,
      pageIndex: this.currentPage,
      pageSize: this.pageSize
    };

    this.workPermitService.getAllWorkPermits(this.filters).subscribe({
      next: (result: PaginatedResult<WorkPermitListDto>) => {
        this.permits = result.data;
        this.totalCount = result.totalCount;
        this.totalPages = result.totalPages;
        this.currentPage = result.pageIndex;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading permits:', error);
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadPermits();
  }

  clearFilters(): void {
    this.selectedDepartmentId = undefined;
    this.selectedStatusId = undefined;
    this.fromDate = '';
    this.toDate = '';
    this.currentPage = 1;
    this.loadPermits();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadPermits();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadPermits();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadPermits();
    }
  }

  viewDetails(id: number): void {
    this.router.navigate(['/work-permit', id, 'view']);
  }

  editPermit(id: number): void {
    this.router.navigate(['/work-permit', id, 'edit']);
  }

  createNewPermit(): void {
    this.router.navigate(['/work-permit/new']);
  }

  getStatusClass(statusName: string): string {
    const statusMap: { [key: string]: string } = {
      'قيد الانتظار': 'status-pending',
      'موافق عليه': 'status-approved',
      'مرفوض': 'status-rejected',
      'قيد التنفيذ': 'status-in-progress',
      'مكتمل': 'status-completed',
      'ملغي': 'status-cancelled'
    };
    return statusMap[statusName] || 'status-default';
  }

  // Status Change Modal Methods
  openStatusModal(permit: WorkPermitListDto): void {
    this.selectedPermit = permit;
    this.newStatusId = null;
    this.showStatusModal = true;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.selectedPermit = null;
    this.newStatusId = null;
    this.isUpdatingStatus = false;
  }

  updatePermitStatus(): void {
    if (!this.selectedPermit || !this.newStatusId) {
      this.toastService.warning('يرجى اختيار الحالة الجديدة');
      return;
    }

    this.isUpdatingStatus = true;

    this.workPermitService.updateWorkPermitStatus(this.selectedPermit.id, this.newStatusId).subscribe({
      next: () => {
        this.toastService.success('تم تحديث حالة التصريح بنجاح');
        this.closeStatusModal();
        this.loadPermits(); // Refresh the list
      },
      error: (error) => {
        console.error('Error updating status:', error);

        // Enhanced error handling
        if (error.status === 401) {
          this.toastService.error('ليس لديك صلاحية لتغيير حالة هذا التصريح');
        } else if (error.status === 400) {
          this.toastService.error('انتقال الحالة غير مسموح به');
        } else {
          this.toastService.error('حدث خطأ أثناء تحديث الحالة');
        }

        this.isUpdatingStatus = false;
      }
    });
  }

  // Get available statuses based on current status and user role
  getAvailableStatuses(currentStatus: string): WorkPermitStatusDto[] {
    const isAdmin = this.isAdmin();
    const allStatuses = this.statuses;

    // Check if this is an unsigned pending permit
    const isUnsignedPending = currentStatus === 'قيد الانتظار' &&
      this.selectedPermit?.isSigned === false;

    // Status transition rules:
    // - Normal users can ONLY: Approved→In Progress (4), In Progress→Completed (5)
    // - Admin can do all transitions as before
    // - CRITICAL: Cannot change from Pending unless signed by S&H (except Cancelled/Rejected)
    const transitions: { [key: string]: number[] } = {
      'قيد الانتظار': isAdmin ? [2, 3, 6] : [],           // Pending: Admin only can change
      'موافق عليه': isAdmin ? [4, 6] : [4],               // Approved: User can → In Progress (4)
      'قيد التنفيذ': isAdmin ? [5, 6] : [5],              // In Progress: User can → Completed (5)
      'مكتمل': [],                                         // Completed: No changes allowed
      'مرفوض': isAdmin ? [1] : [],                         // Rejected: Admin only
      'ملغي': isAdmin ? [1] : []                           // Cancelled: Admin only
    };

    let allowedStatusIds = transitions[currentStatus] || [];

    // If it's an unsigned pending permit, only allow Cancelled (6) and Rejected (3)
    if (isUnsignedPending && isAdmin) {
      allowedStatusIds = allowedStatusIds.filter(id => id === 3 || id === 6);
    }

    return allStatuses.filter(s => allowedStatusIds.includes(s.id));
  }

  // Check if the current user can change the status of this permit
  canChangeStatus(permit: WorkPermitListDto): boolean {
    // Note: We no longer hide the button for unsigned permits
    // Instead, we show a warning message in the modal
    // This provides better UX - users know WHY they can't change status

    if (this.isAdmin()) {
      // Admin can always see status change option (except Completed)
      return permit.workPermitStatusName !== 'مكتمل';
    }

    // Normal user can only change:
    // - Approved (موافق عليه) → In Progress
    // - In Progress (قيد التنفيذ) → Completed
    const userAllowedStatuses = ['موافق عليه', 'قيد التنفيذ'];
    return userAllowedStatuses.includes(permit.workPermitStatusName || '');
  }

  isAdmin(): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.roles?.includes('Admin') || false;
  }

  /**
   * Check if permit can be exported to Word
   * Business Rule: 
   * - Pending = NEVER allowed (must be approved first, even if signed)
   * - Approved/In Progress/Completed = Always allowed (can only reach these if signed)
   * - Rejected/Cancelled = Only allowed if signed
   */
  canExportPermit(permit: WorkPermitListDto): boolean {
    const status = permit.workPermitStatusName || '';

    // Block all Pending permits (even if signed - must wait for approval)
    if (status === 'قيد الانتظار') {
      return false;
    }

    // Auto-allow for advanced statuses (they can only exist if signed due to workflow)
    const autoAllowedStatuses = ['موافق عليه', 'قيد التنفيذ', 'مكتمل'];
    if (autoAllowedStatuses.includes(permit.workPermitStatusName || '')) {
      return true; // Must be signed to reach these statuses
    }

    // For Pending/Rejected/Cancelled: must be signed
    if (permit.isSigned === false) {
      return false; // Block export if not signed
    }

    // Allow if signed or isSigned is undefined (backward compatibility)
    return true;
  }

  /**
   * Get dynamic tooltip message for export button
   * Shows context-specific reason why export is disabled
   */
  getExportTooltip(permit: WorkPermitListDto): string {
    const status = permit.workPermitStatusName || '';

    // If export is allowed, show success message
    if (this.canExportPermit(permit)) {
      return 'تصدير إلى Word';
    }

    // Pending status (even if signed)
    if (status === 'قيد الانتظار') {
      if (permit.isSigned === true) {
        return 'في انتظار موافقة المشرف لتصدير التصريح';
      }
      return 'يتطلب توقيع السلامة والصحة المهنية ثم موافقة المشرف';
    }

    // Rejected/Cancelled without signature - not available for export
    if (permit.isSigned === false) {
      return 'غير متاح للتصدير حالياً';
    }

    // Default fallback
    return 'غير متاح للتصدير حالياً';
  }

  /**
   * Export work permit to Word document
   * Calls backend API to generate and download .docx file
   */
  exportToWord(permitId: number): void {
    if (!permitId) {
      console.error('No permit ID available for export');
      return;
    }

    this.workPermitService.exportWorkPermitToWord(permitId).subscribe({
      next: (blob: Blob) => {
        // Create a temporary URL for the blob
        const url = window.URL.createObjectURL(blob);

        // Create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = `WorkPermit_${permitId}_${new Date().toISOString().split('T')[0]}.docx`;

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        console.log(`Work permit ${permitId} exported successfully`);
      },
      error: (error) => {
        console.error('Error exporting work permit:', error);
        // The error interceptor will handle showing the toast
      }
    });
  }

  /**
   * Export work permit to PDF document (secure, read-only)
   * Calls backend API to generate and download .pdf file
   */
  exportToPdf(permitId: number): void {
    if (!permitId) {
      console.error('No permit ID available for PDF export');
      return;
    }

    this.workPermitService.exportWorkPermitToPdf(permitId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `WorkPermit_${permitId}_${new Date().toISOString().split('T')[0]}.pdf`;

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        console.log(`Work permit ${permitId} exported to PDF successfully`);
      },
      error: (error) => {
        console.error('Error exporting to PDF:', error);
        // The error interceptor will handle showing the toast
      }
    });
  }
}
