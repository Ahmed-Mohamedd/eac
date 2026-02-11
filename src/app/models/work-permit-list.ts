// Interfaces for the new API structure

export interface WorkPermitListDto {
  id: number;
  createdByFullName: string;
  departmentNameAr: string;
  createdAt: string;
  workPermitStatusName: string;
  supervisorEngineer: string;
  isSigned: boolean;  // Track if permit is signed by S&H
}

export interface PaginatedResult<T> {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  data: T[];
}

export interface WorkPermitStatusDto {
  id: number;
  nameEn: string;
  nameAr: string;
}

export interface WorkPermitFilters {
  departmentId?: number;
  workPermitStatusId?: number;
  fromDate?: string;
  toDate?: string;
  pageIndex?: number;
  pageSize?: number;
}
