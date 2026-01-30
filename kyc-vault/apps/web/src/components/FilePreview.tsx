import React from 'react';

interface FilePreviewProps {
    file: File;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file }) => {
    const fileURL = URL.createObjectURL(file);

    return (
        <div className="file-preview">
            <h3>File Preview</h3>
            <p>Name: {file.name}</p>
            <p>Type: {file.type}</p>
            <p>Size: {(file.size / 1024).toFixed(2)} KB</p>
            <img src={fileURL} alt="File preview" style={{ maxWidth: '100%', maxHeight: '300px' }} />
        </div>
    );
};

export default FilePreview;