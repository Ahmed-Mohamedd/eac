import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
    loginForm: FormGroup;
    error: string = '';
    isLoading: boolean = false;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        this.loginForm = this.fb.group({
            username: ['', Validators.required],
            password: ['', Validators.required]
        });
    }

    ngOnInit(): void {
        // Check if user is already logged in
        if (this.authService.isLoggedIn()) {
            // Redirect to dashboard if already authenticated
            this.router.navigate(['/dashboard']);
        }
    }

    onSubmit() {
        if (this.loginForm.valid) {
            this.isLoading = true;
            this.error = '';
            const { username, password } = this.loginForm.value;

            this.authService.login(username, password).subscribe({
                next: (success) => {
                    this.isLoading = false;
                    if (success) {
                        this.router.navigate(['/dashboard']);
                    } else {
                        this.error = 'اسم المستخدم أو كلمة المرور غير صحيحة';
                    }
                },
                error: () => {
                    this.isLoading = false;
                    this.error = 'حدث خطأ غير متوقع';
                }
            });
        }
    }
}
