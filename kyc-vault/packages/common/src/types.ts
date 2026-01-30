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
    documentType: string;
    filePath: string;
    uploadedAt: Date;
}

export interface KycResponse {
    success: boolean;
    message: string;
    data?: any;
}