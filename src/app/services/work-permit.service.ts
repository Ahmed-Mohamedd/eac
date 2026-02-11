import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WorkPermit } from '../models/work-permit';
import { PaginatedResult, WorkPermitFilters, WorkPermitListDto, WorkPermitStatusDto } from '../models/work-permit-list';
import { WorkPermitDetailDto } from '../models/work-permit-detail';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class WorkPermitService {
    private apiUrl = environment.apiUrl + '/work-permit';
    private lookupsUrl = environment.apiUrl + '/lookups';

    constructor(private http: HttpClient) { }

    // New API methods
    getAllWorkPermits(filters?: WorkPermitFilters): Observable<PaginatedResult<WorkPermitListDto>> {
        let params = new HttpParams();

        if (filters?.departmentId) params = params.set('departmentId', filters.departmentId.toString());
        if (filters?.workPermitStatusId) params = params.set('workPermitStatusId', filters.workPermitStatusId.toString());
        if (filters?.fromDate) params = params.set('fromDate', filters.fromDate);
        if (filters?.toDate) params = params.set('toDate', filters.toDate);
        if (filters?.pageIndex) params = params.set('pageIndex', filters.pageIndex.toString());
        if (filters?.pageSize) params = params.set('pageSize', filters.pageSize.toString());

        return this.http.get<PaginatedResult<WorkPermitListDto>>(`${this.apiUrl}/paginated`, { params });
    }

    getWorkPermitById(id: number): Observable<WorkPermitDetailDto> {
        return this.http.get<WorkPermitDetailDto>(`${this.apiUrl}/${id}`);
    }

    getWorkPermitStatuses(): Observable<WorkPermitStatusDto[]> {
        return this.http.get<WorkPermitStatusDto[]>(`${this.lookupsUrl}/work-permit-statuses`);
    }

    // Existing methods
    createWorkPermit(permitData: WorkPermit): Observable<any> {
        return this.http.post(this.apiUrl + '/create', permitData);
    }

    getPermitById(id: string): Observable<WorkPermit> {
        return this.http.get<WorkPermit>(`${this.apiUrl}/${id}`);
    }

    getPermits(): Observable<WorkPermit[]> {
        return this.http.get<WorkPermit[]>(this.apiUrl);
    }

    deletePermitById(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

    updateWorkPermit(permitData: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/edit`, permitData);
    }

    updateWorkPermitStatus(workPermitId: number, statusId: number): Observable<any> {
        return this.http.patch(`${this.apiUrl}/status?workPermitId=${workPermitId}&statusId=${statusId}`, {});
    }

    /**
     * Export work permit to Word document
     * Downloads the permit as a .docx file with all data filled in the template
     */
    exportWorkPermitToWord(id: number): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/export-word/${id}`, {
            responseType: 'blob'  // Important: tells Angular to expect binary data
        });
    }

    /**
     * Export work permit to PDF document (secure, read-only format)
     * Downloads the permit as a .pdf file
     */
    exportWorkPermitToPdf(id: number): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/export-pdf/${id}`, {
            responseType: 'blob'
        });
    }

    /**
     * Sign work permit (S&H role only)
     * Calls the backend to mark the permit as signed by the S&H representative
     */
    signWorkPermit(workPermitId: number, shUserId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/sign`, {
            workPermitId,
            shUserId
        });
    }
}
