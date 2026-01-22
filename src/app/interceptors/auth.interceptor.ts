import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    // Inject AuthService to get token securely
    const authService = inject(AuthService);
    const token = authService.getToken();

    // If token exists, clone the request and add Authorization header
    if (token) {
        const clonedRequest = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        return next(clonedRequest);
    }

    // If no token, proceed with original request
    return next(req);
};
