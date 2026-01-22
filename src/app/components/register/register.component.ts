import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './register.component.html',
    styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
    registerForm: FormGroup;
    error: string = '';
    isLoading: boolean = false;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        this.registerForm = this.fb.group({
            userName: ['', Validators.required],
            fullName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            nationalId: ['']
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
        if (this.registerForm.valid) {
            this.isLoading = true;
            this.error = '';

            this.authService.register(this.registerForm.value).subscribe({
                next: () => {
                    this.isLoading = false;
                    this.router.navigate(['/login']);
                },
                error: (err) => {
                    this.isLoading = false;
                    this.error = 'فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.';
                    console.error(err);
                }
            });
        }
    }
}
