import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Tag, message, Spin, Space, Image } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

interface KYCReview {
  id: string;
  applicantDid: string;
  email: string;
  status: 'manual_review' | 'pending_decision';
  extractedName: string;
  facialMatch: number;
  livenessScore: number;
  amlStatus: string;
  verificationConfidence: number;
  createdAt: string;
}

export function ManualReviewDashboard() {
  const [reviews, setReviews] = useState<KYCReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedKyc, setSelectedKyc] = useState<KYCReview | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [reviewForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const fetchPendingReviews = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/kyc/manual-review/pending');
      setReviews(response.data);
    } catch (error: any) {
      message.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (kyc: KYCReview) => {
    setSelectedKyc(kyc);
    reviewForm.setFieldsValue({
      decision: 'approved',
      notes: '',
    });
    setIsModalVisible(true);
  };

  const submitReview = async (values: any) => {
    if (!selectedKyc) return;

    setSubmitting(true);
    try {
      await axios.post(`/api/kyc/${selectedKyc.id}/manual-review`, {
        decision: values.decision,
        notes: values.notes,
        reviewedBy: 'current-user-id', // Get from auth context in real app
      });

      message.success(`KYC ${values.decision} by manual review`);
      setIsModalVisible(false);
      fetchPendingReviews();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'extractedName',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Confidence',
      dataIndex: 'verificationConfidence',
      key: 'confidence',
      render: (value: number) => `${(value * 100).toFixed(1)}%`,
    },
    {
      title: 'Facial Match',
      dataIndex: 'facialMatch',
      key: 'facialMatch',
      render: (value: number) => `${(value * 100).toFixed(1)}%`,
    },
    {
      title: 'Liveness',
      dataIndex: 'livenessScore',
      key: 'liveness',
      render: (value: number) => `${(value * 100).toFixed(1)}%`,
    },
    {
      title: 'AML Status',
      dataIndex: 'amlStatus',
      key: 'amlStatus',
      render: (status: string) => {
        const colors = { clear: 'green', alert: 'orange', high_risk: 'red' };
        return <Tag color={colors[status as keyof typeof colors] || 'blue'}>{status}</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: KYCReview) => (
        <Button type="primary" onClick={() => handleReview(record)}>
          Review
        </Button>
      ),
    },
  ];

  return (
    <div className="manual-review-dashboard">
      <Card
        title="Manual KYC Review Queue"
        extra={<Button onClick={fetchPendingReviews}>Refresh</Button>}
      >
        {loading ? (
          <Spin />
        ) : (
          <Table
            columns={columns}
            dataSource={reviews}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      <Modal
        title="KYC Manual Review"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        {selectedKyc && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h3>Applicant Details</h3>
              <p><strong>Name:</strong> {selectedKyc.extractedName}</p>
              <p><strong>Email:</strong> {selectedKyc.email}</p>
              <p><strong>DID:</strong> {selectedKyc.applicantDid}</p>
              <p><strong>Confidence Score:</strong> {(selectedKyc.verificationConfidence * 100).toFixed(1)}%</p>
              <p><strong>Facial Match:</strong> {(selectedKyc.facialMatch * 100).toFixed(1)}%</p>
              <p><strong>Liveness Score:</strong> {(selectedKyc.livenessScore * 100).toFixed(1)}%</p>
              <p>
                <strong>AML Status:</strong>{' '}
                <Tag color={selectedKyc.amlStatus === 'clear' ? 'green' : 'red'}>
                  {selectedKyc.amlStatus}
                </Tag>
              </p>
            </div>

            <Form
              form={reviewForm}
              layout="vertical"
              onFinish={submitReview}
            >
              <Form.Item
                label="Decision"
                name="decision"
                rules={[{ required: true, message: 'Please select a decision' }]}
              >
                <Select
                  options={[
                    { label: 'Approve', value: 'approved' },
                    { label: 'Reject', value: 'rejected' },
                    { label: 'Request More Info', value: 'info_requested' },
                  ]}
                />
              </Form.Item>

              <Form.Item
                label="Review Notes"
                name="notes"
                rules={[{ required: true, message: 'Please provide notes' }]}
              >
                <Input.TextArea rows={4} placeholder="Enter your review notes..." />
              </Form.Item>

              <Space>
                <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  Submit Review
                </Button>
              </Space>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ManualReviewDashboard;
