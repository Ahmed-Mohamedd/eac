import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService, UserDto } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styles: [`
    .profile-modal {
      animation: fadeIn 0.2s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
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
        birthDate: this.user.birthDate ? new Date(this.user.birthDate).toISOString().split('T')[0] : ''
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

  closeModal(): void {
    this.close.emit();
  }
}
