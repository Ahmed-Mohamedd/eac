import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserDto {
    id: number;
    userName: string;
    email: string;
    fullName: string;
    nationalId?: string;
    phoneNumber?: string;
    birthDate?: string;
    departmentId?: number;
    departmentName?: string;
    isActive: boolean;
    createdAt: string;
    roles: string[];
}

export interface PaginatedResult<T> {
    pageIndex: number;
    pageSize: number;
    count: number;
    data: T[];
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = `${environment.apiUrl}/user`;

    constructor(private http: HttpClient) { }

    getUsers(params: any = {}): Observable<PaginatedResult<UserDto>> {
        let httpParams = new HttpParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                httpParams = httpParams.set(key, params[key]);
            }
        });
        return this.http.get<PaginatedResult<UserDto>>(`${this.apiUrl}/paginated`, { params: httpParams });
    }

    getUserById(id: number): Observable<UserDto> {
        return this.http.get<UserDto>(`${this.apiUrl}/${id}`);
    }

    createUser(user: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/create`, user);
    }

    updateUser(user: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/edit`, user);
    }

    deactivateUser(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/deactivate/${id}`);
    }

    reactivateUser(id: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/reactivate/${id}`, {});
    }

    updateRoles(userId: number, roles: string[]): Observable<any> {
        return this.http.put(`${this.apiUrl}/update-roles`, { userId, roles });
    }

    resetPassword(userId: number, newPassword: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/reset-password`, { userId, newPassword });
    }

    getMyProfile(): Observable<UserDto> {
        return this.http.get<UserDto>(`${this.apiUrl}/me`);
    }

    updateMyProfile(profile: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/me/update`, profile);
    }

    changePassword(passwords: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/change-password`, passwords);
    }
}
