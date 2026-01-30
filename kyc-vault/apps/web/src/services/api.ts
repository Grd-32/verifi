import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export const uploadKycDocuments = async (formData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/kyc/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error uploading documents');
    }
};

export const fetchKycStatus = async (userId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/kyc/status/${userId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error fetching KYC status');
    }
};

export const authenticateUser = async (credentials) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error authenticating user');
    }
};