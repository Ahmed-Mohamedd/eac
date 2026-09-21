import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkPermitService } from '../../services/work-permit.service';
import { WorkPermit } from '../../models/work-permit';
import { WorkPermitDetailDto } from '../../models/work-permit-detail';
import { AuthService } from '../../services/auth.service';
import { DepartmentService, Department } from '../../services/department.service';
import { ToastService } from '../../services/toast.service';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-work-permit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent],
  templateUrl: './work-permit.component.html',
  styleUrl: './work-permit.component.css'
})
export class WorkPermitComponent implements OnInit {
  permitForm: FormGroup;
  permitId: string | null = null;
  departments: Department[] = [];
  currentPermit: WorkPermitDetailDto | null = null;
  editMode: 'full' | 'limited' | 'readonly' = 'full';

  // Add loading state flags
  isSubmitting = false;
  isLoadingPermit = false;
  isLoadingDepartments = false;

  // Clone mode — set when navigated with ?cloneFrom=<sourceId>
  isCloneMode = false;
  cloneSourceId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private workPermitService: WorkPermitService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private departmentService: DepartmentService,
    public router: Router,
    private toastService: ToastService
  ) {
    this.permitForm = this.fb.group({
      location: this.fb.group({
        entrance: [false],
        airfield: [false],
        buildings: [false]
      }),
      nature: this.fb.group({
        routine: [false],
        nonRoutine: [false]
      }),
      department: ['', Validators.required],
      supervisor: ['', [Validators.required, Validators.maxLength(200)]],
      workers: this.fb.array([]),
      timings: this.fb.group({
        date: ['', Validators.required],
        time: ['', Validators.required],
        expectedEndDate: ['', Validators.required],
        expectedEndTime: ['', Validators.required],
        actualEndDate: [''],
        actualEndTime: [''],
        dailyWorkStart: ['', Validators.required],
        dailyWorkEnd: ['', Validators.required]
      }),
      workDescription: ['', [Validators.required, Validators.maxLength(1000)]],
      workLocation: [''],
      equipment: [''],
      hotWork: this.fb.group({
        welding: [false],
        cutting: [false],
        other: ['']
      }),
      heights: this.fb.group({
        maxHeight: ['', [Validators.required, Validators.maxLength(200)]],
        scaffoldingDesc: ['']
      }),
      confinedSpaces: this.fb.group({
        description: [''],
        ventilation: ['']
      }),
      hazards: [''],
      safetyRequirements: this.fb.group({
        ppe: this.fb.group({
          helmet: this.createCheckGroup(),
          mask: this.createCheckGroup(),
          gloves: this.createCheckGroup(),
          goggles: this.createCheckGroup(),
          harness: this.createCheckGroup(),
          faceShield: this.createCheckGroup(),
          earPlugs: this.createCheckGroup(),
          other: this.createCheckGroup()
        }),
        securityRequirements: this.fb.array([]),
        fireRisk: ['', Validators.required],
        fireSafety: this.fb.group({
          extinguisher: this.createCheckGroup(),
          waterSand: this.createCheckGroup(),
          ventilation: this.createCheckGroup(),
          fireman: this.createCheckGroup(),
          other: this.createCheckGroup()
        })
      }),
      signatures: this.fb.group({
        engineer: [''],
        contractor: [''],
        phone: ['', [Validators.required, Validators.maxLength(20)]],
        signature: ['', [Validators.required, Validators.maxLength(200)]],
        safetyOfficer: [{ value: '', disabled: true }]  // Disabled field
      })
    });
  }

  ngOnInit(): void {
    // Load departments from API
    this.loadDepartments();

    // Initialize with 6 empty worker slots as per design
    for (let i = 0; i < 6; i++) {
      this.workers.push(this.fb.control(''));
    }

    // Initialize with 1 empty security requirement slot (user can add up to 8 total)
    this.securityRequirements.push(this.fb.control(''));

    // Check for ID parameter (edit mode)
    this.route.paramMap.subscribe(params => {
      this.permitId = params.get('id');

      if (this.permitId) {
        this.loadPermit(this.permitId);
      } else {
        // Check for clone mode (?cloneFrom=<sourceId>)
        const cloneFromId = this.route.snapshot.queryParamMap.get('cloneFrom');
        if (cloneFromId) {
          this.isCloneMode = true;
          this.cloneSourceId = +cloneFromId;
          this.loadPermitForClone(this.cloneSourceId);
        } else {
          // New blank permit — pre-fill user data
          const currentUser = this.authService.getCurrentUser();
          if (currentUser) {
            this.permitForm.patchValue({
              department: currentUser.department,
              supervisor: currentUser.userName
            });
          }
        }
      }
    });
  }

  loadDepartments() {
    this.isLoadingDepartments = true;
    this.departmentService.getAllDepartments().subscribe({
      next: (PaginatedDepartment) => {
        this.isLoadingDepartments = false;
        const allDepartments = PaginatedDepartment.data;
        const currentUser = this.authService.getCurrentUser();
        const isAdmin = currentUser?.roles?.includes('Admin') || false;

        if (isAdmin) {
          // Admin sees all departments
          this.departments = allDepartments;
        } else {
          // Normal user sees only their department
          if (currentUser?.departmentId) {
            this.departments = allDepartments.filter(d => d.id === currentUser.departmentId);
            // Auto-select the user's department
            if (this.departments.length === 1) {
              this.permitForm.patchValue({ department: this.departments[0].id });
            }
          } else {
            // User has no department - show empty (shouldn't happen normally)
            this.departments = [];
          }
        }
        console.log('Loaded departments:', this.departments);
      },
      error: (err) => {
        this.isLoadingDepartments = false;
        console.error('Error loading departments', err);
        this.toastService.error('حدث خطأ أثناء تحميل الأقسام');
      }
    });
  }

  loadPermit(id: string) {
    this.isLoadingPermit = true; // ← Start loading
    const permitId = Number(id);
    this.workPermitService.getWorkPermitById(permitId).subscribe({
      next: (permit) => {
        console.log('Loaded permit:', permit);
        this.isLoadingPermit = false; // ← Stop loading
        this.currentPermit = permit;

        // Map work location IDs to checkboxes
        // ID 1 = Airfield, ID 2 = Entrance, ID 3 = Buildings
        const locationIds = permit.workLocationIds || [];

        // Map the detailed DTO to the form structure
        this.permitForm.patchValue({
          location: {
            airfield: locationIds.includes(1),
            entrance: locationIds.includes(2),
            buildings: locationIds.includes(3)
          },
          department: permit.departmentId,
          supervisor: permit.supervisorEng,
          workDescription: permit.workDescription,
          workLocation: permit.workLocation || '',
          equipment: permit.usedTools || '',
          hazards: permit.potentialWorkRisks || '',
          timings: {
            date: permit.startWorkDate,
            time: permit.startWorkHour,
            expectedEndDate: permit.endWorkDate,
            expectedEndTime: permit.endWorkHour,
            actualEndDate: permit.actualWorkEndDate || '',
            actualEndTime: permit.actualWorkEndHour || '',
            dailyWorkStart: permit.dailyWorkHourFrom,
            dailyWorkEnd: permit.dailyWorkHourTo
          },
          nature: {
            routine: permit.isRoutineWork,
            nonRoutine: !permit.isRoutineWork
          },
          heights: {
            maxHeight: permit.highestExpectedRise,
            scaffoldingDesc: permit.descriptionOfUsedScaffoldingAndLadders || ''
          },
          confinedSpaces: {
            description: permit.descriptionOfClosedPlace || '',
            ventilation: permit.ventilation || ''
          },
          hotWork: {
            welding: permit.welding || false,
            cutting: permit.cutting || false,
            other: permit.otherHotWork || ''
          },
          safetyRequirements: {
            fireRisk: permit.fireRisk,
            ppe: {
              helmet: { required: permit.helmetAndShoes, notRequired: !permit.helmetAndShoes },
              mask: { required: permit.gasDustMask, notRequired: !permit.gasDustMask },
              gloves: { required: permit.gloves, notRequired: !permit.gloves },
              goggles: { required: permit.goggles, notRequired: !permit.goggles },
              harness: { required: permit.harness, notRequired: !permit.harness },
              faceShield: { required: permit.faceShield, notRequired: !permit.faceShield },
              earPlugs: { required: permit.earPlugs, notRequired: !permit.earPlugs },
              other: { required: permit.otherSafetyEquipment, notRequired: !permit.otherSafetyEquipment }
            },
            fireSafety: {
              extinguisher: { required: permit.fireExtinguisherRequired, notRequired: !permit.fireExtinguisherRequired },
              waterSand: { required: permit.waterSandRequired, notRequired: !permit.waterSandRequired },
              ventilation: { required: permit.adequateVentilationRequired, notRequired: !permit.adequateVentilationRequired },
              fireman: { required: permit.firefighterRequired, notRequired: !permit.firefighterRequired },
              other: { required: permit.otherMeansRequired, notRequired: !permit.otherMeansRequired }
            }
          },
          signatures: {
            engineer: permit.supervisorEng,
            phone: permit.phoneNumber,
            signature: permit.signature,
            contractor: permit.contractorsRepresentativesSignature || '',
            safetyOfficer: permit.occupationalSafteyAndHealthRepresentative || ''
          }
        });

        // Handle workers array
        this.workers.clear();
        if (permit.workers && permit.workers.length > 0) {
          permit.workers.forEach(worker => {
            this.workers.push(this.fb.control(worker.workerName));
          });
        }
        // Fill remaining slots up to 6
        while (this.workers.length < 6) {
          this.workers.push(this.fb.control(''));
        }

        // Handle security requirements
        this.securityRequirements.clear();
        if (permit.securityRequirements && permit.securityRequirements.length > 0) {
          permit.securityRequirements.forEach(req => {
            this.securityRequirements.push(this.fb.control(req));
          });
        } else {
          this.securityRequirements.push(this.fb.control(''));
        }

        // Apply form restrictions based on permissions
        this.applyFormRestrictions();
      },
      error: (err) => {
        console.error('Error loading permit', err);
        this.isLoadingPermit = false; // ← Stop loading
        this.toastService.error('حدث خطأ أثناء تحميل التصريح');
      }
    });
  }

  /**
   * Load a pre-filled CreateWorkPermitDto from an existing permit (clone mode).
   * All safety/work fields are copied; dates and signature fields are cleared.
   * The form is pre-filled so the user only needs to enter new dates before submitting.
   */
  loadPermitForClone(sourceId: number): void {
    this.isLoadingPermit = true;
    this.workPermitService.getWorkPermitForClone(sourceId).subscribe({
      next: (dto) => {
        this.isLoadingPermit = false;
        this.prefillFromClone(dto);
      },
      error: () => {
        this.isLoadingPermit = false;
        this.toastService.error('فشل تحميل التصريح المصدر للاستنساخ');
      }
    });
  }

  /**
   * Pre-fills the form from a clone DTO. Mirrors the patchValue structure used in loadPermit().
   * Date/time fields are explicitly cleared so the user must enter new values.
   */
  private prefillFromClone(dto: any): void {
    const locationIds: number[] = dto.workLocationIds || [];

    this.permitForm.patchValue({
      location: {
        airfield: locationIds.includes(1),
        entrance: locationIds.includes(2),
        buildings: locationIds.includes(3)
      },
      department: dto.departmentId,
      supervisor: dto.supervisorEng,
      workDescription: dto.workDescription,
      workLocation: dto.workLocation || '',
      equipment: dto.usedTools || '',
      hazards: dto.potentialWorkRisks || '',
      timings: {
        date: '',             // must be entered by user
        time: '',             // must be entered by user
        expectedEndDate: '',  // must be entered by user
        expectedEndTime: '',  // must be entered by user
        actualEndDate: '',
        actualEndTime: '',
        dailyWorkStart: dto.dailyWorkHourFrom || '',
        dailyWorkEnd: dto.dailyWorkHourTo || ''
      },
      nature: {
        routine: dto.isRoutineWork,
        nonRoutine: !dto.isRoutineWork
      },
      heights: {
        maxHeight: dto.highestExpectedRise || '',
        scaffoldingDesc: dto.descriptionOfUsedScaffoldingAndLadders || ''
      },
      confinedSpaces: {
        description: dto.descriptionOfClosedPlace || '',
        ventilation: dto.ventilation || ''
      },
      hotWork: {
        welding: dto.welding || false,
        cutting: dto.cutting || false,
        other: dto.otherHotWork || ''
      },
      safetyRequirements: {
        fireRisk: dto.fireRisk || '',
        ppe: {
          helmet:    { required: dto.helmetAndShoes,        notRequired: !dto.helmetAndShoes },
          mask:      { required: dto.gasDustMask,           notRequired: !dto.gasDustMask },
          gloves:    { required: dto.gloves,                notRequired: !dto.gloves },
          goggles:   { required: dto.goggles,               notRequired: !dto.goggles },
          harness:   { required: dto.harness,               notRequired: !dto.harness },
          faceShield:{ required: dto.faceShield,            notRequired: !dto.faceShield },
          earPlugs:  { required: dto.earPlugs,              notRequired: !dto.earPlugs },
          other:     { required: dto.otherSafetyEquipment,  notRequired: !dto.otherSafetyEquipment }
        },
        fireSafety: {
          extinguisher: { required: dto.fireExtinguisherRequired,  notRequired: !dto.fireExtinguisherRequired },
          waterSand:    { required: dto.waterSandRequired,          notRequired: !dto.waterSandRequired },
          ventilation:  { required: dto.adequateVentilationRequired, notRequired: !dto.adequateVentilationRequired },
          fireman:      { required: dto.firefighterRequired,        notRequired: !dto.firefighterRequired },
          other:        { required: dto.otherMeansRequired,         notRequired: !dto.otherMeansRequired }
        }
      },
      signatures: {
        engineer: dto.supervisorEng,
        phone: dto.phoneNumber || '',
        signature: '',          // contractor must re-sign
        contractor: '',         // cleared
        safetyOfficer: ''
      }
    });

    // Pre-fill workers list
    this.workers.clear();
    if (dto.workers && dto.workers.length > 0) {
      dto.workers.forEach((w: any) => this.workers.push(this.fb.control(w.workerName)));
    }
    while (this.workers.length < 6) {
      this.workers.push(this.fb.control(''));
    }

    // Pre-fill security requirements
    this.securityRequirements.clear();
    if (dto.securityRequirements && dto.securityRequirements.length > 0) {
      dto.securityRequirements.forEach((req: string) => this.securityRequirements.push(this.fb.control(req)));
    } else {
      this.securityRequirements.push(this.fb.control(''));
    }

    this.toastService.success(`تم تحميل بيانات التصريح #${this.cloneSourceId} — يرجى إدخال التواريخ والأوقات`);
  }

  get workers() {
    return this.permitForm.get('workers') as FormArray;
  }

  get securityRequirements() {
    return this.permitForm.get('safetyRequirements.securityRequirements') as FormArray;
  }

  createCheckGroup() {
    return this.fb.group({
      required: [false],
      notRequired: [false]
    });
  }

  addSecurityRequirement() {
    if (this.securityRequirements.length < 8) {
      this.securityRequirements.push(this.fb.control(''));
    }
  }

  removeSecurityRequirement(index: number) {
    if (this.securityRequirements.length > 1) {
      this.securityRequirements.removeAt(index);
    }
  }

  onSubmit() {
    if (this.isSubmitting) return; // Prevent double submission

    console.log('=== onSubmit CALLED ===');
    console.log('Edit mode:', this.editMode);
    console.log('Form valid:', this.permitForm.valid);
    console.log('Form errors:', this.permitForm.errors);

    // Mark all fields as touched to show validation errors
    this.markFormGroupTouched(this.permitForm);

    // For limited edit mode (actual times only), we don't validate the entire form
    // because disabled fields are not validated
    const canSubmit = this.editMode === 'limited' || this.permitForm.valid;

    if (canSubmit) {
      this.isSubmitting = true; // ← Start loading state
      // Use getRawValue() to include disabled fields in the form value
      const formValue = this.permitForm.getRawValue();

      console.log('Form value:', formValue);

      // Transform work location checkboxes to ID array
      const workLocationIds: number[] = [];
      if (formValue.location.airfield) workLocationIds.push(1);
      if (formValue.location.entrance) workLocationIds.push(2);
      if (formValue.location.buildings) workLocationIds.push(3);

      // Transform workers array to CreateWorkerDto format
      const workers = formValue.workers
        .map((name: string, index: number) => name ? { workerName: name, position: index + 1 } : null)
        .filter((w: any) => w !== null);

      // Transform security requirements (remove empty ones)
      const securityRequirements = formValue.safetyRequirements.securityRequirements
        .filter((req: string) => req && req.trim() !== '');

      // Map form data to backend DTO structure
      const permitData: any = {
        // Basic Info
        departmentId: parseInt(formValue.department) || null,
        isRoutineWork: formValue.nature.routine,
        supervisorEng: formValue.supervisor,

        // Work Timings
        startWorkDate: formValue.timings.date,
        startWorkHour: formValue.timings.time,
        endWorkDate: formValue.timings.expectedEndDate,
        endWorkHour: formValue.timings.expectedEndTime,
        dailyWorkHourFrom: formValue.timings.dailyWorkStart,
        dailyWorkHourTo: formValue.timings.dailyWorkEnd,

        // Work Timings - Actual (Optional)
        actualWorkEndDate: formValue.timings.actualEndDate || null,
        actualWorkEndHour: formValue.timings.actualEndTime || null,

        // Work Details
        workDescription: formValue.workDescription,
        workLocation: formValue.workLocation || null,
        usedTools: formValue.equipment || null,

        // Hot Work Data
        welding: formValue.hotWork.welding || null,
        cutting: formValue.hotWork.cutting || null,
        otherHotWork: formValue.hotWork.other || null,

        // Safety and Work Environment
        highestExpectedRise: formValue.heights.maxHeight,
        descriptionOfUsedScaffoldingAndLadders: formValue.heights.scaffoldingDesc || null,
        descriptionOfClosedPlace: formValue.confinedSpaces.description || null,
        ventilation: formValue.confinedSpaces.ventilation || null,
        potentialWorkRisks: formValue.hazards || null,
        fireRisk: formValue.safetyRequirements.fireRisk,

        // Safety Equipment (PPE) - convert required/notRequired to boolean
        helmetAndShoes: formValue.safetyRequirements.ppe.helmet.required || null,
        gasDustMask: formValue.safetyRequirements.ppe.mask.required || null,
        gloves: formValue.safetyRequirements.ppe.gloves.required || null,
        goggles: formValue.safetyRequirements.ppe.goggles.required || null,
        harness: formValue.safetyRequirements.ppe.harness.required || null,
        faceShield: formValue.safetyRequirements.ppe.faceShield.required || null,
        earPlugs: formValue.safetyRequirements.ppe.earPlugs.required || null,
        otherSafetyEquipment: formValue.safetyRequirements.ppe.other.required || null,

        // Fire Fighting Equipment
        fireExtinguisherRequired: formValue.safetyRequirements.fireSafety.extinguisher.required || null,
        waterSandRequired: formValue.safetyRequirements.fireSafety.waterSand.required || null,
        adequateVentilationRequired: formValue.safetyRequirements.fireSafety.ventilation.required || null,
        firefighterRequired: formValue.safetyRequirements.fireSafety.fireman.required || null,
        otherMeansRequired: formValue.safetyRequirements.fireSafety.other.required || null,

        // Signature Section
        phoneNumber: formValue.signatures.phone,
        signature: formValue.signatures.signature,
        contractorsRepresentativesSignature: formValue.signatures.contractor || null,
        occupationalSafteyAndHealthRepresentative: formValue.signatures.safetyOfficer || null,

        // Child Collections
        workLocationIds: workLocationIds.length > 0 ? workLocationIds : null,
        workers: workers.length > 0 ? workers : null,
        securityRequirements: securityRequirements.length > 0 ? securityRequirements : null
      };

      if (this.permitId) {
        // UPDATE - Add workPermitId to DTO
        permitData.workPermitId = parseInt(this.permitId);

        this.workPermitService.updateWorkPermit(permitData).subscribe({
          next: (response) => {
            console.log('Permit updated successfully:', response);
            this.isSubmitting = false; // ← Stop loading
            this.toastService.success('تم تعديل البيانات بنجاح');
            this.router.navigate(['/work-permits']);
          },
          error: (error) => {
            console.error('Error updating permit:', error);
            this.isSubmitting = false; // ← Stop loading
            this.toastService.error('حدث خطأ أثناء تعديل البيانات');
          }
        });
      } else {
        // CREATE
        this.workPermitService.createWorkPermit(permitData).subscribe({
          next: (response) => {
            console.log('Permit created successfully:', response);
            this.isSubmitting = false; // ← Stop loading
            this.toastService.success('تم حفظ البيانات بنجاح');
            this.router.navigate(['/work-permits']);
          },
          error: (error) => {
            console.error('Error creating permit:', error);
            this.isSubmitting = false; // ← Stop loading
            this.toastService.error('حدث خطأ أثناء حفظ البيانات');
          }
        });
      }
    } else {
      // Show specific error message with invalid fields
      const invalidFields: string[] = [];
      if (this.isFieldInvalid('department')) invalidFields.push('الإدارة');
      if (this.isFieldInvalid('supervisor')) invalidFields.push('اسم المشرف');
      if (this.isFieldInvalid('timings.date')) invalidFields.push('تاريخ البدء');
      if (this.isFieldInvalid('timings.time')) invalidFields.push('وقت البدء');
      if (this.isFieldInvalid('timings.expectedEndDate')) invalidFields.push('تاريخ الانتهاء المتوقع');
      if (this.isFieldInvalid('timings.expectedEndTime')) invalidFields.push('وقت الانتهاء المتوقع');
      if (this.isFieldInvalid('timings.dailyWorkStart')) invalidFields.push('بداية العمل اليومي');
      if (this.isFieldInvalid('timings.dailyWorkEnd')) invalidFields.push('نهاية العمل اليومي');
      if (this.isFieldInvalid('workDescription')) invalidFields.push('وصف العمل');
      if (this.isFieldInvalid('heights.maxHeight')) invalidFields.push('أعلى ارتفاع متوقع');
      if (this.isFieldInvalid('safetyRequirements.fireRisk')) invalidFields.push('خطر الحريق');
      if (this.isFieldInvalid('signatures.phone')) invalidFields.push('رقم التليفون');
      if (this.isFieldInvalid('signatures.signature')) invalidFields.push('التوقيع');

      if (invalidFields.length > 0) {
        this.toastService.error(`يرجى ملء الحقول المطلوبة: ${invalidFields.join('، ')}`);
      } else {
        this.toastService.warning('يرجى التأكد من صحة البيانات المدخلة');
      }

      // Scroll to first invalid field
      setTimeout(() => {
        const firstInvalidField = document.querySelector('.field-input.ng-invalid, .ng-invalid input, .ng-invalid textarea, .ng-invalid select');
        if (firstInvalidField) {
          firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (firstInvalidField as HTMLElement).focus();
        }
      }, 100);
    }
  }

  // ============= Authorization Methods =============

  isAdmin(): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.roles?.includes('Admin') || false;
  }

  isOwner(): boolean {
    if (!this.currentPermit) return false;
    const currentUser = this.authService.getCurrentUser();
    const currentUserId = currentUser?.id ? parseInt(currentUser.id.toString()) : null;

    console.log('Ownership check:');
    console.log('Current user ID:', currentUserId);
    console.log('Permit createdById:', this.currentPermit.createdById);
    console.log('Are they equal?', this.currentPermit.createdById === currentUserId);

    return this.currentPermit.createdById === currentUserId;
  }

  canEditPermit(): boolean {
    if (!this.currentPermit) return true; // New permit - can edit

    const isAdmin = this.isAdmin();
    const isOwner = this.isOwner();
    const statusName = this.currentPermit.workPermitStatusName;

    // Cancelled: Nobody can edit
    if (statusName === 'ملغي') return false;
    // Cancelled: Nobody can edit
    if (statusName === 'مرفوض') return false;
    // Completed: Admin only
    if (statusName === 'مكتمل') return isAdmin;

    // All other statuses: Owner or Admin
    return isOwner || isAdmin;
  }

  canEditFullPermit(): boolean {
    if (!this.currentPermit) return true; // New permit - full edit
    if (!this.canEditPermit()) return false;

    const isAdmin = this.isAdmin();
    const statusName = this.currentPermit.workPermitStatusName;

    // Admin can always do full edit (except cancelled)
    if (isAdmin && statusName !== 'ملغي') return true;

    // Users can do full edit only on Pending or Rejected
    return statusName === 'قيد الانتظار' || statusName === 'مرفوض';
  }

  canEditOnlyActualTimes(): boolean {
    if (!this.currentPermit) return false;
    if (!this.canEditPermit()) return false;

    const isAdmin = this.isAdmin();
    const isOwner = this.isOwner();
    const statusName = this.currentPermit.workPermitStatusName;

    // Non-admin users can only edit actual times for Approved or In Progress
    return !isAdmin && isOwner && (
      statusName === 'موافق عليه' || statusName === 'قيد التنفيذ'
    );
  }

  applyFormRestrictions(): void {
    console.log('=== applyFormRestrictions CALLED ===');
    console.log('currentPermit:', this.currentPermit);

    if (!this.currentPermit) {
      this.editMode = 'full';
      console.log('No current permit - full edit mode');
      return;
    }

    const canEditFull = this.canEditFullPermit();
    const canEditActualOnly = this.canEditOnlyActualTimes();

    console.log('canEditFull:', canEditFull);
    console.log('canEditActualOnly:', canEditActualOnly);
    console.log('Permit status:', this.currentPermit.workPermitStatusName);
    console.log('isAdmin:', this.isAdmin());
    console.log('isOwner:', this.isOwner());

    if (!canEditFull && !canEditActualOnly) {
      // Read-only mode
      this.editMode = 'readonly';
      this.permitForm.disable();
      return;
    }

    if (canEditActualOnly) {
      // Limited edit mode - only actual work times
      this.editMode = 'limited';

      // Disable all fields first
      this.permitForm.disable({ emitEvent: false });

      // Enable the timings group first (required for nested controls to work)
      const timings = this.permitForm.get('timings');
      timings?.enable({ emitEvent: false });

      // Then disable all timing fields except actual work times
      timings?.get('date')?.disable({ emitEvent: false });
      timings?.get('time')?.disable({ emitEvent: false });
      timings?.get('expectedEndDate')?.disable({ emitEvent: false });
      timings?.get('expectedEndTime')?.disable({ emitEvent: false });
      timings?.get('dailyWorkStart')?.disable({ emitEvent: false });
      timings?.get('dailyWorkEnd')?.disable({ emitEvent: false });

      // actualEndDate and actualEndTime remain enabled

      // Always keep safetyOfficer disabled
      this.permitForm.get('signatures.safetyOfficer')?.disable({ emitEvent: false });

      console.log('Limited edit mode applied');
      console.log('actualEndDate disabled?', timings?.get('actualEndDate')?.disabled);
      console.log('actualEndTime disabled?', timings?.get('actualEndTime')?.disabled);
    } else {
      // Full edit mode
      this.editMode = 'full';
      this.permitForm.enable();

      // Always keep safetyOfficer disabled even in full edit mode
      this.permitForm.get('signatures.safetyOfficer')?.disable({ emitEvent: false });
    }
  }

  getPermissionBadgeClass(): string {
    switch (this.editMode) {
      case 'full': return 'badge-full-edit';
      case 'limited': return 'badge-limited-edit';
      case 'readonly': return 'badge-read-only';
      default: return '';
    }
  }

  getPermissionBadgeText(): string {
    switch (this.editMode) {
      case 'full': return '✅ يمكنك تعديل جميع الحقول';
      case 'limited': return '⚠️ يمكنك تعديل أوقات العمل الفعلية فقط';
      case 'readonly': return '🔒 التصريح للقراءة فقط';
      default: return '';
    }
  }

  showCompletedWarning(): boolean {
    return this.currentPermit?.workPermitStatusName === 'مكتمل' && !this.isAdmin();
  }

  printForm() {
    window.print();
  }

  // ============= Validation Helper Methods =============

  isFieldInvalid(fieldPath: string): boolean {
    const field = this.permitForm.get(fieldPath);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  getFieldError(fieldPath: string): string {
    const field = this.permitForm.get(fieldPath);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'هذا الحقل مطلوب';
    if (field.errors['maxlength']) {
      const maxLength = field.errors['maxlength'].requiredLength;
      return `الحد الأقصى ${maxLength} حرف`;
    }
    return '';
  }

  private markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }
}
