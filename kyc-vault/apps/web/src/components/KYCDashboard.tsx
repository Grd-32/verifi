import React, { useState, useRef } from 'react';
import { Button, Card, Progress, Alert, Spin, Upload, Form, Input, Select, message } from 'antd';
import { UploadOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

interface KYCFormData {
  applicantDid: string;
  email: string;
}

interface DocumentUpload {
  documentType: 'id_document' | 'selfie' | 'address_proof';
  file: File | null;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

export function KYCDashboard() {
  const [step, setStep] = useState<'form' | 'upload' | 'processing' | 'result'>('form');
  const [kycData, setKycData] = useState<KYCFormData>({ applicantDid: '', email: '' });
  const [kycId, setKycId] = useState<string>('');
  const [documents, setDocuments] = useState<Record<string, DocumentUpload>>({
    id_document: { documentType: 'id_document', file: null, status: 'pending' },
    selfie: { documentType: 'selfie', file: null, status: 'pending' },
    address_proof: { documentType: 'address_proof', file: null, status: 'pending' },
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  // Step 1: Initiate KYC
  const handleInitiateKYC = async () => {
    if (!kycData.applicantDid || !kycData.email) {
      message.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/kyc/initiate', {
        applicantDid: kycData.applicantDid,
        email: kycData.email,
      });
      setKycId(response.data.id);
      setStep('upload');
      message.success('KYC initiated! Please upload documents.');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to initiate KYC');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Upload documents
  const handleFileChange = (documentType: string, file: File) => {
    setDocuments(prev => ({
      ...prev,
      [documentType]: { ...prev[documentType], file, status: 'pending' },
    }));
  };

  const uploadDocument = async (documentType: string) => {
    const doc = documents[documentType];
    if (!doc.file) {
      message.error('Please select a file');
      return;
    }

    setDocuments(prev => ({
      ...prev,
      [documentType]: { ...prev[documentType], status: 'uploading' },
    }));

    const formData = new FormData();
    formData.append('document', doc.file);
    formData.append('documentType', documentType);

    try {
      await axios.post(`/api/kyc/${kycId}/upload-document`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setDocuments(prev => ({
        ...prev,
        [documentType]: { ...prev[documentType], status: 'completed' },
      }));
      message.success(`${documentType} uploaded successfully`);
    } catch (error: any) {
      setDocuments(prev => ({
        ...prev,
        [documentType]: {
          ...prev[documentType],
          status: 'failed',
          error: error.response?.data?.message || 'Upload failed',
        },
      }));
      message.error('Upload failed');
    }
  };

  // Step 3: Start verification
  const handleStartVerification = async () => {
    if (documents.id_document.status !== 'completed' || documents.selfie.status !== 'completed') {
      message.error('Please upload ID document and selfie');
      return;
    }

    setStep('processing');
    setLoading(true);

    try {
      const response = await axios.post(`/api/kyc/${kycId}/verify`);
      setResult(response.data);
      setStep('result');
      message.success('Verification completed!');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Verification failed');
      setStep('upload');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Show result
  const renderResult = () => {
    if (!result) return null;

    const isApproved = result.finalVerificationStatus === 'approved';
    const confidence = (result.verificationConfidence * 100).toFixed(1);

    return (
      <Card className="kyc-result">
        <div className="result-header">
          {isApproved ? (
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 48 }} />
          ) : (
            <CloseCircleOutlined style={{ color: '#f5222d', fontSize: 48 }} />
          )}
          <h2>{isApproved ? 'Verification Approved!' : 'Verification Failed'}</h2>
        </div>

        <div className="result-details">
          <p><strong>Status:</strong> {result.finalVerificationStatus}</p>
          <p><strong>Confidence:</strong> {confidence}%</p>
          <p><strong>Extracted Name:</strong> {result.extractedName}</p>
          <p><strong>Facial Match:</strong> {(result.facialMatch * 100).toFixed(1)}%</p>
          <p><strong>Liveness Score:</strong> {(result.livenessScore * 100).toFixed(1)}%</p>
          <p><strong>AML Status:</strong> {result.amlStatus}</p>
        </div>

        {isApproved && (
          <Alert
            message="Credential will be issued to the applicant's wallet"
            type="success"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}

        <Button onClick={() => {
          setStep('form');
          setKycData({ applicantDid: '', email: '' });
          setDocuments({
            id_document: { documentType: 'id_document', file: null, status: 'pending' },
            selfie: { documentType: 'selfie', file: null, status: 'pending' },
            address_proof: { documentType: 'address_proof', file: null, status: 'pending' },
          });
        }} style={{ marginTop: 20 }}>
          Start New KYC
        </Button>
      </Card>
    );
  };

  return (
    <div className="kyc-dashboard">
      <h1>KYC Verification Dashboard</h1>

      {step === 'form' && (
        <Card title="Applicant Information" style={{ maxWidth: 500 }}>
          <Form layout="vertical">
            <Form.Item label="Applicant DID" required>
              <Input
                placeholder="did:ion:EiA..."
                value={kycData.applicantDid}
                onChange={e => setKycData({ ...kycData, applicantDid: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="Email" required>
              <Input
                type="email"
                placeholder="user@example.com"
                value={kycData.email}
                onChange={e => setKycData({ ...kycData, email: e.target.value })}
              />
            </Form.Item>
            <Button type="primary" loading={loading} onClick={handleInitiateKYC}>
              Start KYC Process
            </Button>
          </Form>
        </Card>
      )}

      {step === 'upload' && (
        <Card title="Document Upload" style={{ maxWidth: 800 }}>
          <div className="document-uploads">
            {Object.entries(documents).map(([key, doc]) => (
              <div key={key} className="document-upload-item" style={{ marginBottom: 24 }}>
                <h3>{doc.documentType === 'id_document' ? 'ID Document (Passport/License)' : doc.documentType === 'selfie' ? 'Selfie Photo' : 'Address Proof'}</h3>
                
                {doc.status === 'pending' && !doc.file && (
                  <Button
                    icon={<UploadOutlined />}
                    onClick={() => fileInputs.current[key]?.click()}
                  >
                    Select File
                  </Button>
                )}

                <input
                  ref={el => { fileInputs.current[key] = el; }}
                  type="file"
                  accept="image/*,.pdf"
                  style={{ display: 'none' }}
                  onChange={e => {
                    if (e.target.files?.[0]) {
                      handleFileChange(key, e.target.files[0]);
                    }
                  }}
                />

                {doc.file && (
                  <div>
                    <p>Selected: {doc.file.name}</p>
                    <Button
                      loading={doc.status === 'uploading'}
                      onClick={() => uploadDocument(key)}
                      disabled={doc.status === 'completed'}
                    >
                      {doc.status === 'completed' ? '✓ Uploaded' : 'Upload'}
                    </Button>
                  </div>
                )}

                {doc.status === 'failed' && <Alert message={doc.error} type="error" />}
              </div>
            ))}

            <Button
              type="primary"
              size="large"
              onClick={handleStartVerification}
              disabled={documents.id_document.status !== 'completed' || documents.selfie.status !== 'completed'}
            >
              Start Verification
            </Button>
          </div>
        </Card>
      )}

      {step === 'processing' && (
        <Card>
          <Spin size="large" tip="Processing documents..." style={{ textAlign: 'center' }}>
            <div style={{ padding: 50 }}>
              <Progress type="circle" percent={50} />
              <p>Running facial recognition, OCR extraction, and AML screening...</p>
            </div>
          </Spin>
        </Card>
      )}

      {step === 'result' && renderResult()}
    </div>
  );
}

export default KYCDashboard;
