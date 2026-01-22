import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { User } from '../models/user';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private router: Router, private http: HttpClient) {
        // Check local storage for existing session
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUserSubject.next(JSON.parse(savedUser));
        }
    }

    login(username: string, password: string): Observable<boolean> {
        return this.http.post<User>(`${environment.apiUrl}/auth/sign-in`, { userName: username, password: password })
            .pipe(map(user => {
                if (user && user.token) {
                    this.setCurrentUser(user);
                    return true;
                }
                return false;
            }));
    }

    register(user: any): Observable<any> {
        return this.http.post(`${environment.apiUrl}/auth/register`, user);
    }

    private setCurrentUser(user: User) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
    }

    logout() {
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
    }

    isLoggedIn(): boolean {
        return !!this.currentUserSubject.value;
    }

    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }

    getToken(): string | null {
        const user = this.currentUserSubject.value;
        return user?.token || null;
    }
}
