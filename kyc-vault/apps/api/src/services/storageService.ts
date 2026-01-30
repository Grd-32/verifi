import fs from 'fs';
import path from 'path';

const storageDirectory = path.join(__dirname, '../../uploads');

const ensureStorageDirectoryExists = () => {
    if (!fs.existsSync(storageDirectory)) {
        fs.mkdirSync(storageDirectory, { recursive: true });
    }
};

export const saveFile = (fileName: string, fileBuffer: Buffer): Promise<string> => {
    return new Promise((resolve, reject) => {
        ensureStorageDirectoryExists();
        const filePath = path.join(storageDirectory, fileName);
        fs.writeFile(filePath, fileBuffer, (err) => {
            if (err) {
                return reject(err);
            }
            resolve(filePath);
        });
    });
};

export const deleteFile = (fileName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const filePath = path.join(storageDirectory, fileName);
        fs.unlink(filePath, (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
};

export const getFilePath = (fileName: string): string => {
    return path.join(storageDirectory, fileName);
};