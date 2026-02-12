import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService, UserDto } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import SignaturePad from 'signature_pad';


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  user: UserDto | null = null;
  loading = false;
  isEditing = false;
  isChangingPassword = false;
  editForm: FormGroup;
  passwordForm: FormGroup;

  // Signature Pad properties
  @ViewChild('signatureCanvas') signatureCanvas!: ElementRef<HTMLCanvasElement>;
  signaturePad?: SignaturePad;
  isSignaturePadOpen = false;
  isSignatureEmpty = true;

  constructor(
    private userService: UserService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {
    this.editForm = this.fb.group({
      userName: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      fullName: [''],
      nationalId: [''],
      phoneNumber: [''],
      birthDate: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  ngOnInit(): void {
    if (this.isOpen) {
      this.loadProfile();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && changes['isOpen'].currentValue === true) {
      this.loadProfile();
    }
  }

  loadProfile(): void {
    this.loading = true;
    this.userService.getMyProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
        this.initForm();
      },
      error: (err) => {
        this.toastService.error('Failed to load profile');
        this.loading = false;
        this.closeModal();
      }
    });
  }

  initForm(): void {
    if (this.user) {
      this.editForm.patchValue({
        userName: this.user.userName,
        email: this.user.email,
        fullName: this.user.fullName,
        nationalId: this.user.nationalId,
        phoneNumber: this.user.phoneNumber,
        // Extract date-only string without timezone conversion
        birthDate: this.user.birthDate ? this.user.birthDate.toString().split('T')[0] : ''
      });
    }
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.initForm();
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.initForm();
  }

  onSubmit(): void {
    if (this.editForm.invalid) {
      this.toastService.error('Please fix the errors in the form');
      return;
    }

    this.loading = true;
    this.userService.updateMyProfile(this.editForm.value).subscribe({
      next: (res) => {
        this.toastService.success('Profile updated successfully');
        this.isEditing = false;
        this.loadProfile();
      },
      error: (err) => {
        this.toastService.error(err.error?.Message || 'Failed to update profile');
        this.loading = false;
      }
    });
  }

  toggleChangePassword(): void {
    this.isChangingPassword = !this.isChangingPassword;
    if (this.isChangingPassword) {
      this.isEditing = false;
      this.passwordForm.reset();
    }
  }

  onChangePasswordSubmit(): void {
    if (this.passwordForm.invalid) {
      if (this.passwordForm.errors?.['mismatch']) {
        this.toastService.error('Passwords do not match');
      } else {
        this.toastService.error('Please fix the errors in the form');
      }
      return;
    }

    this.loading = true;
    const dto = {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword
    };

    this.userService.changePassword(dto).subscribe({
      next: (res) => {
        this.toastService.success('Password changed successfully');
        this.isChangingPassword = false;
        this.loading = false;
      },
      error: (err) => {
        this.toastService.error(err.error?.Message || 'Failed to change password');
        this.loading = false;
      }
    });
  }

  // Signature Pad Methods
  openSignaturePad(): void {
    this.isSignaturePadOpen = true;
    this.isEditing = false;
    this.isChangingPassword = false;

    // Initialize signature pad after view is ready
    setTimeout(() => {
      this.initSignaturePad();
    }, 100);
  }

  closeSignaturePad(): void {
    this.isSignaturePadOpen = false;
    if (this.signaturePad) {
      this.signaturePad.clear();
    }
  }

  initSignaturePad(): void {
    if (!this.signatureCanvas) return;

    const canvas = this.signatureCanvas.nativeElement;

    // Set canvas size to match container
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Initialize SignaturePad
    this.signaturePad = new SignaturePad(canvas, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 255)',  // Pure black for maximum contrast
      minWidth: 2.5,  // Thicker minimum stroke width (increased from default ~0.5)
      maxWidth: 2.5,  // Thicker maximum stroke width (increased from default ~2.5)
      throttle: 0,
      velocityFilterWeight: 0.7
    });

    // Listen for changes
    this.signaturePad.addEventListener('endStroke', () => {
      this.isSignatureEmpty = this.signaturePad!.isEmpty();
    });

    this.isSignatureEmpty = true;
  }

  clearSignature(): void {
    if (this.signaturePad) {
      this.signaturePad.clear();
      this.isSignatureEmpty = true;
    }
  }

  saveSignature(): void {
    if (!this.signaturePad || this.signaturePad.isEmpty()) {
      this.toastService.error('الرجاء إضافة التوقيع أولاً');
      return;
    }

    // Convert to base64 PNG
    const base64Signature = this.signaturePad.toDataURL('image/png');

    this.loading = true;
    this.userService.updateSignature(base64Signature).subscribe({
      next: (res) => {
        this.toastService.success('تم حفظ التوقيع بنجاح');
        this.closeSignaturePad();
        this.loadProfile();  // Reload to show new signature
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'فشل حفظ التوقيع');
        this.loading = false;
      }
    });
  }

  closeModal(): void {
    this.close.emit();
  }
}
