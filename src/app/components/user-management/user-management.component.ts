import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { UserService, UserDto } from '../../services/user.service';
import { DepartmentService } from '../../services/department.service';
import { ToastService } from '../../services/toast.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-user-management',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
    templateUrl: './user-management.component.html',
    styleUrl: './user-management.component.css'
})
export class UserManagementComponent implements OnInit {
    Math = Math;
    users: UserDto[] = [];
    totalCount = 0;
    pageIndex = 1;
    pageSize = 10;
    loading = false;

    searchTerm = '';
    selectedDepartmentId?: number;
    selectedRole = '';
    isActiveFilter?: boolean;

    departments: any[] = [];
    roles = ['Supervisor', 'Admin', 'User'];

    // Modal state
    showCreateModal = false;
    createForm: FormGroup;

    showResetModal = false;
    showEditModal = false;
    editForm: FormGroup;
    resetForm: FormGroup;
    selectedUser: UserDto | null = null;

    submitting = false;

    constructor(
        private userService: UserService,
        private departmentService: DepartmentService,
        private toastService: ToastService,
        private fb: FormBuilder
    ) {
        this.createForm = this.fb.group({
            userName: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            fullName: [''],
            nationalId: [''],
            phoneNumber: [''],
            birthDate: [null],
            departmentId: [null],
            roles: this.fb.array([], Validators.required)
        });

        this.resetForm = this.fb.group({
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]]
        }, { validators: this.passwordMatchValidator });

        this.editForm = this.fb.group({
            userId: [null, Validators.required],
            userName: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            fullName: [''],
            nationalId: [''],
            phoneNumber: [''],
            birthDate: [null],
            departmentId: [null],
            roles: this.fb.array([], Validators.required)
        });
    }

    passwordMatchValidator(g: FormGroup) {
        return g.get('newPassword')?.value === g.get('confirmPassword')?.value
            ? null : { 'mismatch': true };
    }

    get f() {
        return this.createForm.controls;
    }

    get rf() {
        return this.resetForm.controls;
    }

    get ef() {
        return this.editForm.controls;
    }

    get createRolesArray() {
        return this.createForm.get('roles') as FormArray;
    }

    get editRolesArray() {
        return this.editForm.get('roles') as FormArray;
    }

    onRoleChange(event: any, formType: 'create' | 'edit') {
        const rolesArray = formType === 'create' ? this.createRolesArray : this.editRolesArray;
        if (event.target.checked) {
            rolesArray.push(this.fb.control(event.target.value));
        } else {
            const index = rolesArray.controls.findIndex((x: any) => x.value === event.target.value);
            rolesArray.removeAt(index);
        }
    }

    isRoleSelected(role: string, formType: 'create' | 'edit'): boolean {
        const rolesArray = formType === 'create' ? this.createRolesArray : this.editRolesArray;
        return rolesArray.value.includes(role);
    }

    ngOnInit(): void {
        this.loadUsers();
        this.loadDepartments();
    }

    loadUsers(): void {
        this.loading = true;
        const params = {
            pageNumber: this.pageIndex,
            pageSize: this.pageSize,
            search: this.searchTerm,
            departmentId: this.selectedDepartmentId,
            role: this.selectedRole,
            isActive: this.isActiveFilter
        };

        this.userService.getUsers(params).subscribe({
            next: (result) => {
                this.users = result.data;
                this.totalCount = result.count;
                this.loading = false;
            },
            error: (err) => {
                this.toastService.error('Failed to load users');
                this.loading = false;
            }
        });
    }

    loadDepartments(): void {
        this.departmentService.getAllDepartments().subscribe({
            next: (result) => {
                this.departments = result.data;
            }
        });
    }

    onSearch(): void {
        this.pageIndex = 1;
        this.loadUsers();
    }

    onPageChange(index: number): void {
        this.pageIndex = index;
        this.loadUsers();
    }

    toggleUserStatus(user: UserDto): void {
        if (user.isActive) {
            this.userService.deactivateUser(user.id).subscribe({
                next: () => {
                    this.toastService.success(`User ${user.userName} deactivated`);
                    this.loadUsers();
                }
            });
        } else {
            this.userService.reactivateUser(user.id).subscribe({
                next: () => {
                    this.toastService.success(`User ${user.userName} reactivated`);
                    this.loadUsers();
                }
            });
        }
    }

    openCreateModal(): void {
        this.createForm.reset();
        this.createRolesArray.clear();
        // Default to 'User' role
        this.createRolesArray.push(this.fb.control('User'));
        this.showCreateModal = true;
    }

    closeCreateModal(): void {
        this.showCreateModal = false;
    }

    onCreateSubmit(): void {
        if (this.createForm.invalid) {
            this.createForm.markAllAsTouched();
            return;
        }

        this.submitting = true;
        this.userService.createUser(this.createForm.value).subscribe({
            next: () => {
                this.toastService.success('تم اضافة مستخدم جديد بنجاح');
                this.showCreateModal = false;
                this.submitting = false;
                this.loadUsers();
            },
            error: (err) => {
                this.toastService.error(err.error?.message || 'Failed to create user');
                this.submitting = false;
            }
        });
    }

    openEditModal(user: UserDto): void {
        this.selectedUser = user;
        this.editRolesArray.clear();
        if (user.roles) {
            user.roles.forEach(role => this.editRolesArray.push(this.fb.control(role)));
        }

        this.editForm.patchValue({
            userId: user.id,
            userName: user.userName,
            email: user.email,
            fullName: user.fullName,
            nationalId: user.nationalId,
            phoneNumber: user.phoneNumber,
            birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : null,
            departmentId: user.departmentId
        });
        this.showEditModal = true;
    }

    closeEditModal(): void {
        this.showEditModal = false;
        this.selectedUser = null;
    }

    onEditSubmit(): void {
        if (this.editForm.invalid) {
            this.editForm.markAllAsTouched();
            return;
        }

        this.submitting = true;
        this.userService.updateUser(this.editForm.value).subscribe({
            next: () => {
                this.toastService.success('تم تحديث بيانات المستخدم بنجاح');
                this.closeEditModal();
                this.submitting = false;
                this.loadUsers();
            },
            error: (err) => {
                this.toastService.error(err.error?.message || 'فشل تحديث بيانات المستخدم');
                this.submitting = false;
            }
        });
    }

    openResetPasswordModal(user: UserDto): void {
        this.selectedUser = user;
        this.resetForm.reset();
        this.showResetModal = true;
    }

    closeResetModal(): void {
        this.showResetModal = false;
        this.selectedUser = null;
    }

    onResetSubmit(): void {
        if (this.resetForm.invalid || !this.selectedUser) {
            this.resetForm.markAllAsTouched();
            return;
        }

        this.submitting = true;
        this.userService.resetPassword(this.selectedUser.id, this.resetForm.value.newPassword).subscribe({
            next: () => {
                this.toastService.success(`تم إعادة تعيين كلمة المرور لـ ${this.selectedUser?.userName} بنجاح`);
                this.closeResetModal();
                this.submitting = false;
            },
            error: (err) => {
                this.toastService.error(err.error?.message || 'Failed to reset password');
                this.submitting = false;
            }
        });
    }
}
