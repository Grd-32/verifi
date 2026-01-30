export interface User {
    id: string;
    name: string;
    email: string;
    password: string;
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

export interface AuthResponse {
    token: string;
    user: User;
}

export interface UploadResponse {
    success: boolean;
    message: string;
    document?: Document;
}