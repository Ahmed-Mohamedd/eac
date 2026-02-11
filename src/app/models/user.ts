export interface User {
    id: string;
    fullName?: string;
    token: string;
    userName: string;
    roles: string[];
    departmentId?: number;
    department: string;
    email: string;
    signature?: string;              // Base64 image
    signatureUpdatedAt?: Date;
}
