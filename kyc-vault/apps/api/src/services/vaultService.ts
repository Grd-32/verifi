import { User } from '../models/user';
import { Document } from 'mongoose';

export const uploadDocument = async (userId: string, documentData: any): Promise<Document> => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    const document = new Document({
        userId: userId,
        ...documentData,
    });

    await document.save();
    return document;
};

export const getDocumentsByUserId = async (userId: string): Promise<Document[]> => {
    return await Document.find({ userId: userId });
};

export const deleteDocument = async (documentId: string): Promise<void> => {
    const result = await Document.deleteOne({ _id: documentId });
    if (result.deletedCount === 0) {
        throw new Error('Document not found');
    }
};