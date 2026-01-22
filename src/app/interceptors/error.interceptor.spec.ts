import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { errorInterceptor } from './error.interceptor';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

describe('Error Interceptor with Error Codes', () => {
    let httpMock: HttpTestingController;
    let httpClient: HttpClient;
    let router: Router;
    let authService: AuthService;
    let toastService: ToastService;
    let translate: TranslateService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule,
                TranslateModule.forRoot()
            ],
            providers: [
                {
                    provide: Router,
                    useValue: { navigate: jasmine.createSpy('navigate') }
                },
                {
                    provide: AuthService,
                    useValue: { logout: jasmine.createSpy('logout') }
                },
                {
                    provide: ToastService,
                    useValue: { error: jasmine.createSpy('error') }
                }
            ]
        });

        httpMock = TestBed.inject(HttpTestingController);
        httpClient = TestBed.inject(HttpClient);
        router = TestBed.inject(Router);
        authService = TestBed.inject(AuthService);
        toastService = TestBed.inject(ToastService);
        translate = TestBed.inject(TranslateService);

        // Set default language for tests
        translate.setDefaultLang('en');
        translate.use('en');
    });

    afterEach(() => {
        httpMock.verify();
    });

    describe('Error Code Detection', () => {
        it('should detect WP-006-001 (Permit Not Found) error code', (done) => {
            httpClient.get('/api/work-permit/99999').subscribe({
                error: (error) => {
                    expect(error.errorCode).toBe('WP-006-001');
                    expect(toastService.error).toHaveBeenCalled();
                    expect(router.navigate).toHaveBeenCalledWith(['/work-permits']);
                    done();
                }
            });

            const req = httpMock.expectOne('/api/work-permit/99999');
            req.flush(
                {
                    type: 'https://api.workpermit.com/errors/WP-006-001',
                    title: 'Work Permit Not Found',
                    status: 404,
                    detail: 'Work Permit with ID \'99999\' was not found.',
                    errorCode: 'WP-006-001',
                    traceId: '00-abc123'
                },
                { status: 404, statusText: 'Not Found' }
            );
        });

        it('should detect WP-003-006 (Not Resource Owner) error code', (done) => {
            httpClient.put('/api/work-permit/123', {}).subscribe({
                error: (error) => {
                    expect(error.errorCode).toBe('WP-003-006');
                    expect(toastService.error).toHaveBeenCalled();
                    expect(router.navigate).toHaveBeenCalledWith(['/work-permits']);
                    done();
                }
            });

            const req = httpMock.expectOne('/api/work-permit/123');
            req.flush(
                {
                    errorCode: 'WP-003-006',
                    title: 'Not Resource Owner',
                    status: 403,
                    detail: 'You can only edit your own work permits'
                },
                { status: 403, statusText: 'Forbidden' }
            );
        });

        it('should detect WP-002-003 (Token Expired) and logout', (done) => {
            httpClient.get('/api/work-permits').subscribe({
                error: (error) => {
                    expect(error.errorCode).toBe('WP-002-003');
                    expect(authService.logout).toHaveBeenCalled();
                    expect(router.navigate).toHaveBeenCalledWith(['/login']);
                    done();
                }
            });

            const req = httpMock.expectOne('/api/work-permits');
            req.flush(
                {
                    errorCode: 'WP-002-003',
                    title: 'Token Expired',
                    status: 401,
                    detail: 'JWT token has expired'
                },
                { status: 401, statusText: 'Unauthorized' }
            );
        });

        it('should detect WP-004-001 (Validation Failed) with field errors', (done) => {
            httpClient.post('/api/work-permit', {}).subscribe({
                error: (error) => {
                    expect(error.errorCode).toBe('WP-004-001');
                    expect(toastService.error).toHaveBeenCalled();
                    done();
                }
            });

            const req = httpMock.expectOne('/api/work-permit');
            req.flush(
                {
                    errorCode: 'WP-004-001',
                    title: 'Validation Failed',
                    status: 400,
                    detail: 'One or more validation errors occurred',
                    errors: {
                        departmentId: ['Department ID is required'],
                        workDescription: ['Description is required']
                    }
                },
                { status: 400, statusText: 'Bad Request' }
            );
        });
    });

    describe('HTTP Status Fallback', () => {
        it('should fall back to HTTP 404 handling when no error code present', (done) => {
            httpClient.get('/api/old-endpoint/123').subscribe({
                error: (error) => {
                    expect(error.status).toBe(404);
                    expect(toastService.error).toHaveBeenCalled();
                    done();
                }
            });

            const req = httpMock.expectOne('/api/old-endpoint/123');
            req.flush(
                { message: 'Not found' },
                { status: 404, statusText: 'Not Found' }
            );
        });

        it('should fall back to HTTP 500 handling', (done) => {
            httpClient.get('/api/endpoint').subscribe({
                error: (error) => {
                    expect(error.status).toBe(500);
                    expect(toastService.error).toHaveBeenCalled();
                    done();
                }
            });

            const req = httpMock.expectOne('/api/endpoint');
            req.flush(
                { message: 'Internal server error' },
                { status: 500, statusText: 'Internal Server Error' }
            );
        });
    });

    describe('Translation Support', () => {
        it('should use translated message for error code in English', (done) => {
            translate.use('en');

            httpClient.get('/api/work-permit/99999').subscribe({
                error: (error) => {
                    // Message should be translated to English
                    expect(error.message).toContain('not found');
                    done();
                }
            });

            const req = httpMock.expectOne('/api/work-permit/99999');
            req.flush(
                {
                    errorCode: 'WP-006-001',
                    title: 'Work Permit Not Found',
                    status: 404
                },
                { status: 404, statusText: 'Not Found' }
            );
        });

        it('should use translated message for error code in Arabic', (done) => {
            translate.use('ar');

            httpClient.get('/api/work-permit/99999').subscribe({
                error: (error) => {
                    // Message should be translated to Arabic
                    expect(error.message).toBeDefined();
                    done();
                }
            });

            const req = httpMock.expectOne('/api/work-permit/99999');
            req.flush(
                {
                    errorCode: 'WP-006-001',
                    title: 'Work Permit Not Found',
                    status: 404
                },
                { status: 404, statusText: 'Not Found' }
            );
        });
    });

    describe('Navigation Logic', () => {
        it('should redirect to /work-permits on WP-006-001', (done) => {
            httpClient.get('/api/work-permit/99999').subscribe({
                error: () => {
                    expect(router.navigate).toHaveBeenCalledWith(['/work-permits']);
                    done();
                }
            });

            const req = httpMock.expectOne('/api/work-permit/99999');
            req.flush(
                { errorCode: 'WP-006-001', status: 404 },
                { status: 404, statusText: 'Not Found' }
            );
        });

        it('should redirect to /login on authentication errors', (done) => {
            httpClient.get('/api/work-permits').subscribe({
                error: () => {
                    expect(authService.logout).toHaveBeenCalled();
                    expect(router.navigate).toHaveBeenCalledWith(['/login']);
                    done();
                }
            });

            const req = httpMock.expectOne('/api/work-permits');
            req.flush(
                { errorCode: 'WP-002-001', status: 401 },
                { status: 401, statusText: 'Unauthorized' }
            );
        });

        it('should stay on page for WP-003-004 (Admin Only)', (done) => {
            httpClient.put('/api/work-permit/status', {}).subscribe({
                error: () => {
                    expect(toastService.error).toHaveBeenCalled();
                    expect(router.navigate).not.toHaveBeenCalled();
                    done();
                }
            });

            const req = httpMock.expectOne('/api/work-permit/status');
            req.flush(
                { errorCode: 'WP-003-004', status: 403 },
                { status: 403, statusText: 'Forbidden' }
            );
        });
    });

    describe('Toast Display Logic', () => {
        it('should show toast for most errors', (done) => {
            httpClient.get('/api/work-permit/99999').subscribe({
                error: () => {
                    expect(toastService.error).toHaveBeenCalled();
                    done();
                }
            });

            const req = httpMock.expectOne('/api/work-permit/99999');
            req.flush(
                { errorCode: 'WP-006-001', status: 404 },
                { status: 404, statusText: 'Not Found' }
            );
        });

        it('should not show duplicate toast when already handled', (done) => {
            httpClient.get('/api/work-permit/99999').subscribe({
                error: () => {
                    // Error interceptor shows toast once in the switch case
                    // Should not show again in the general error handler
                    const callCount = (toastService.error as jasmine.Spy).calls.count();
                    expect(callCount).toBe(1);
                    done();
                }
            });

            const req = httpMock.expectOne('/api/work-permit/99999');
            req.flush(
                { errorCode: 'WP-006-001', status: 404 },
                { status: 404, statusText: 'Not Found' }
            );
        });
    });
});
