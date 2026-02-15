import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkPermitService } from '../../services/work-permit.service';
import { WorkPermitDetailDto } from '../../models/work-permit-detail';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-work-permit-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './work-permit-detail.component.html',
  styleUrl: './work-permit-detail.component.css'
})
export class WorkPermitDetailComponent implements OnInit {
  permit: WorkPermitDetailDto | null = null;
  isLoading = true;
  permitId!: number;
  showSignModal = false;

  // Static work locations mapping (matches database)
  private workLocations: { [key: number]: string } = {
    1: 'الحقل الجوي',
    2: 'مدخل المطار و ساحات الانتظار',
    3: 'المباني والملحقات'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workPermitService: WorkPermitService,
    private authService: AuthService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.permitId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadPermitDetails();
  }

  loadPermitDetails(): void {
    this.isLoading = true;
    this.workPermitService.getWorkPermitById(this.permitId).subscribe({
      next: (data) => {
        this.permit = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading permit details:', error);
        this.isLoading = false;
      }
    });
  }

  editPermit(): void {
    this.router.navigate(['/work-permit', this.permitId, 'edit']);
  }

  goBack(): void {
    this.router.navigate(['/work-permits']);
  }

  /**
   * Export work permit to Word document
   * Calls backend API to generate and download .docx file
   */
  exportToWord(): void {
    if (!this.permitId) {
      console.error('No permit ID available for export');
      return;
    }

    this.workPermitService.exportWorkPermitToWord(this.permitId).subscribe({
      next: (blob: Blob) => {
        // Create a temporary URL for the blob
        const url = window.URL.createObjectURL(blob);

        // Create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = `WorkPermit_${this.permitId}_${new Date().toISOString().split('T')[0]}.docx`;

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        console.log('Work permit exported successfully');
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
  exportToPdf(): void {
    if (!this.permitId) {
      console.error('No permit ID available for PDF export');
      return;
    }

    this.workPermitService.exportWorkPermitToPdf(this.permitId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `WorkPermit_${this.permitId}_${new Date().toISOString().split('T')[0]}.pdf`;

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        console.log('Work permit exported to PDF successfully');
      },
      error: (error) => {
        console.error('Error exporting to PDF:', error);
        // The error interceptor will handle showing the toast
      }
    });
  }

  // Keep the print method for those who still want to print the page
  printPermit(): void {
    window.print();
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

  getLocationName(locationId: number): string {
    return this.workLocations[locationId] || `موقع #${locationId}`;
  }

  hasAnyPPE(): boolean {
    if (!this.permit) return false;
    return !!(
      this.permit.helmetAndShoes ||
      this.permit.gasDustMask ||
      this.permit.gloves ||
      this.permit.goggles ||
      this.permit.harness ||
      this.permit.faceShield ||
      this.permit.earPlugs ||
      this.permit.otherSafetyEquipment
    );
  }

  hasFireFightingEquipment(): boolean {
    if (!this.permit || this.permit.fireRisk !== 'نعم') return false;
    return !!(
      this.permit.fireExtinguisherRequired ||
      this.permit.waterSandRequired ||
      this.permit.adequateVentilationRequired ||
      this.permit.firefighterRequired ||
      this.permit.otherMeansRequired
    );
  }

  /**
   * Check if current user has S&H role
   */
  isShUser(): boolean {
    return this.authService.hasRole('S&H');
  }

  /**
   * Check if permit can be signed (not already signed and user is S&H)
   */
  canSignPermit(): boolean {
    return this.isShUser() && this.permit?.isSigned === false;
  }

  /**
   * Show sign confirmation modal
   */
  signPermit(): void {
    this.showSignModal = true;
  }

  /**
   * Close sign modal
   */
  closeSignModal(): void {
    this.showSignModal = false;
  }

  /**
   * Confirm and execute the signing
   */
  confirmSign(): void {
    const user = this.authService.getCurrentUser();
    if (!user?.id) {
      this.toastService.error('خطأ في معرف المستخدم');
      this.closeSignModal();
      return;
    }

    if (!this.permitId) {
      this.toastService.error('خطأ في معرف التصريح');
      this.closeSignModal();
      return;
    }

    this.workPermitService.signWorkPermit(this.permitId, user.id).subscribe({
      next: () => {
        this.toastService.success('تم التوقيع علي التصريح بنجاح');
        this.closeSignModal();
        this.loadPermitDetails(); // Reload to show updated status
      },
      error: () => {
        this.closeSignModal();
        // Error interceptor will show the toast
      }
    });
  }

  /**
   * Check if permit can be exported to Word
   * Business Rule: 
   * - Pending = NEVER allowed (must be approved first, even if signed)
   * - Approved/In Progress/Completed = Always allowed (can only reach these if signed)
   * - Rejected/Cancelled = Only allowed if signed
   */
  canExportPermit(): boolean {
    if (!this.permit) return false;

    const status = this.permit.workPermitStatusName || '';

    // Block Pending, Rejected, and Cancelled permits
    const blockedStatuses = ['قيد الانتظار', 'مرفوض', 'ملغي'];
    if (blockedStatuses.includes(status)) {
      return false;
    }

    // Auto-allow for advanced statuses (they can only exist if signed due to workflow)
    const autoAllowedStatuses = ['موافق عليه', 'قيد التنفيذ', 'مكتمل'];
    if (autoAllowedStatuses.includes(status)) {
      return true; // Must be signed to reach these statuses
    }

    // For Rejected/Cancelled: must be signed
    if (this.permit.isSigned === false) {
      return false; // Block export if not signed
    }

    // Allow if signed or isSigned is undefined (backward compatibility)
    return true;
  }

  /**
   * Get dynamic tooltip message for export button
   * Shows context-specific reason why export is disabled
   */
  getExportTooltip(): string {
    if (!this.permit) return 'غير متاح للتصدير حالياً';

    const status = this.permit.workPermitStatusName || '';

    // If export is allowed, show success message
    if (this.canExportPermit()) {
      return 'تصدير إلى Word';
    }

    // Pending status (even if signed)
    if (status === 'قيد الانتظار') {
      if (this.permit.isSigned === true) {
        return 'في انتظار موافقة المشرف لتصدير التصريح';
      }
      return 'يتطلب توقيع السلامة والصحة المهنية ثم موافقة المشرف';
    }

    // Rejected/Cancelled without signature - not available for export
    if (this.permit.isSigned === false) {
      return 'غير متاح للتصدير حالياً';
    }

    // Default fallback
    return 'غير متاح للتصدير حالياً';
  }
}
