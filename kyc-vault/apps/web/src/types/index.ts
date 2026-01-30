export interface User {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Document {
    id: string;
    userId: string;
    fileName: string;
    fileType: string;
    uploadDate: Date;
    status: 'pending' | 'approved' | 'rejected';
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}