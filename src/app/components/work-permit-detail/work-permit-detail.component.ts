import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkPermitService } from '../../services/work-permit.service';
import { WorkPermitDetailDto } from '../../models/work-permit-detail';

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

  // Static work locations mapping (matches database)
  private workLocations: { [key: number]: string } = {
    1: 'الحقل الجوي',
    2: 'مدخل المطار و ساحات الانتظار',
    3: 'المباني والملحقات'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workPermitService: WorkPermitService
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
}
