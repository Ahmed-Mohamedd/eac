import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PaginatedDepartment {
   count: number;
   pageIndex: number;
   pageSize: number ;
   data: Department[];
}
export interface Department {
   id: number;
   name: string;
}

@Injectable({
    providedIn: 'root'
})
export class DepartmentService {
    private apiUrl = `${environment.apiUrl}/lookups/departments`;

    constructor(private http: HttpClient) { }
    
    getAllDepartments(pageSize: number = 30): Observable<PaginatedDepartment> {
        const params = new HttpParams().set('PageSize', pageSize.toString());
        return this.http.get<PaginatedDepartment>(this.apiUrl, { params });
    }
}
