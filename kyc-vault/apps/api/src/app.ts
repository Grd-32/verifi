import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import kycRoutes from './routes/kycRoutes';
import { json, urlencoded } from 'body-parser';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(json());
app.use(urlencoded({ extended: true }));

// Serve static files (public folder with dashboards)
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/kyc', kycRoutes);

// Dashboard routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.get('/admin/kyc', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/kyc-admin.html'));
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI as string, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('MongoDB connected');
})
.catch((err: Error) => {
    console.error('MongoDB connection error:', err);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Dashboard available at http://localhost:${PORT}/admin`);
    console.log(`KYC Admin available at http://localhost:${PORT}/admin/kyc`);
});