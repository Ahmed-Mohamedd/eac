import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { ApiError, ValidationError } from '../models/api-error';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const authService = inject(AuthService);
    const toastService = inject(ToastService);
    const translate = inject(TranslateService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = '';
            let shouldShowToast = true;
            let errorCode: string | undefined;

            if (error.error instanceof ErrorEvent) {
                // Client-side or network error
                errorMessage = translate.instant('errors.generic.network');
                console.error('Client-side error:', error.error.message);
            } else {
                // Backend returned an error response
                const apiError = error.error as ApiError;
                errorCode = apiError?.errorCode;

                // Try to handle specific error code first
                if (errorCode) {
                    console.log(`API Error Code: ${errorCode}`, apiError);

                    // Get translated message for error code
                    const translationKey = `errors.${errorCode}`;
                    errorMessage = translate.instant(translationKey);

                    // If translation not found, use backend detail or title
                    if (errorMessage === translationKey) {
                        errorMessage = apiError.detail || apiError.title || translate.instant('errors.generic.unknown');
                    }

                    // Handle specific error code actions
                    switch (errorCode) {
                        // Authentication errors (401) - Redirect to login
                        case 'WP-002-001': // Unauthenticated
                        case 'WP-002-003': // Token expired
                        case 'WP-002-006': // Session expired
                            // Show toast before redirecting
                            authService.logout();
                            router.navigate(['/login']);
                            break;

                        case 'WP-002-002': // Invalid credentials
                        case 'WP-002-007': // Account locked
                            // Just show toast, stay on login page
                            break;

                        // Authorization errors (403) - Show error and redirect
                        case 'WP-003-006': // Not resource owner
                        case 'WP-006-001': // Permit not found
                            // Redirect to list after showing toast
                            router.navigate(['/work-permits']);
                            break;

                        case 'WP-003-001': // Insufficient permissions
                        case 'WP-003-004': // Admin only operation
                        case 'WP-003-005': // Role required
                            // Just show toast, stay on current page
                            break;

                        // Validation errors (400)
                        case 'WP-004-001': // Validation failed
                            const validationError = apiError as ValidationError;
                            if (validationError.errors) {
                                // Show field-specific errors
                                const errors = Object.values(validationError.errors).flat();
                                errorMessage = errors.join('\n');
                            }
                            break;

                        // Business rule violations
                        case 'WP-005-003': // Max workers exceeded
                        case 'WP-005-004': // Past date not allowed
                        case 'WP-005-005': // Already approved
                            // Just show toast with specific message
                            break;

                        // Rate limiting
                        case 'WP-007-005': // Rate limit exceeded
                            // Show toast with retry suggestion
                            break;

                        default:
                            // For other error codes, just show the message
                            break;
                    }
                } else {
                    // No error code, fall back to HTTP status handling
                    switch (error.status) {
                        case 400:
                            errorMessage = translate.instant('errors.generic.400');

                            // Try to extract validation errors from backend
                            if (error.error?.errors) {
                                const validationErrors = Object.values(error.error.errors).flat();
                                errorMessage = validationErrors.join('\n');
                            } else if (error.error?.message) {
                                errorMessage = error.error.message;
                            }
                            break;

                        case 401:
                            errorMessage = translate.instant('errors.generic.401');
                            authService.logout();
                            router.navigate(['/login']);
                            break;

                        case 403:
                            errorMessage = translate.instant('errors.generic.403');
                            break;

                        case 404:
                            errorMessage = translate.instant('errors.generic.404');
                            break;

                        case 429:
                            errorMessage = translate.instant('errors.generic.429');
                            break;

                        case 500:
                            errorMessage = translate.instant('errors.generic.500');
                            break;

                        case 503:
                            errorMessage = translate.instant('errors.generic.503');
                            break;

                        default:
                            errorMessage = translate.instant('errors.generic.unknown');
                            console.error(`HTTP Error ${error.status}:`, error.error);
                    }
                }
            }

            // Display error to user using toast (unless already handled)
            if (shouldShowToast) {
                toastService.error(errorMessage, 5000);
            }

            // Return error for component-level handling if needed
            return throwError(() => ({
                status: error.status,
                message: errorMessage,
                errorCode: errorCode,
                originalError: error
            }));
        })
    );
};
