import React, { useState } from 'react';
import KycForm from '../components/KycForm';
import { uploadKycDocuments } from '../services/api';

const KycUpload: React.FC = () => {
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);

    const handleUpload = async (formData: FormData) => {
        try {
            const response = await uploadKycDocuments(formData);
            if (response.status === 200) {
                setUploadStatus('Upload successful!');
            } else {
                setUploadStatus('Upload failed. Please try again.');
            }
        } catch (error) {
            setUploadStatus('An error occurred during upload.');
        }
    };

    return (
        <div>
            <h1>KYC Document Upload</h1>
            <KycForm onUpload={handleUpload} />
            {uploadStatus && <p>{uploadStatus}</p>}
        </div>
    );
};

export default KycUpload;