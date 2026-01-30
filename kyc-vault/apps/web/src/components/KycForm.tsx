import React, { useState } from 'react';

const KycForm: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [documents, setDocuments] = useState<File[]>([]);
    const [status, setStatus] = useState('');

    const handleDocumentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setDocuments(Array.from(event.target.files));
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setStatus('Submitting...');

        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        documents.forEach((doc) => {
            formData.append('documents', doc);
        });

        try {
            const response = await fetch('/api/kyc/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                setStatus('Submission successful!');
            } else {
                setStatus('Submission failed. Please try again.');
            }
        } catch (error) {
            setStatus('An error occurred. Please try again.');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>Name:</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>
            <div>
                <label>Email:</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div>
                <label>Upload Documents:</label>
                <input
                    type="file"
                    multiple
                    onChange={handleDocumentChange}
                    required
                />
            </div>
            <button type="submit">Submit</button>
            {status && <p>{status}</p>}
        </form>
    );
};

export default KycForm;