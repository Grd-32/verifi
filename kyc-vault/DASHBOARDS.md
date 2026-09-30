# KYC Vault - Admin Dashboards

This document describes all the admin and user dashboards available in the KYC Vault SSI ecosystem.

## Overview

Instead of relying solely on Swagger API documentation, KYC Vault now provides comprehensive admin dashboards for each service. These dashboards offer real-time visibility, management interfaces, and operational insights.

## Dashboard URLs

### Main Dashboard Hub
- **URL**: `http://localhost:5000/admin`
- **Purpose**: Central hub providing access to all service dashboards
- **Features**:
  - Service status overview
  - Quick links to all dashboards
  - System health metrics
  - Direct API endpoints

### KYC Service
- **Admin Dashboard**: `http://localhost:5000/admin/kyc`
- **API**: `http://localhost:5000/api/kyc`
- **Swagger**: `http://localhost:5000/api/kyc/docs`

#### Features
- View all KYC applications with status tracking
- Filter by status (pending, approved, rejected)
- Track verification progress
- Document management and review
- Real-time statistics:
  - Total applications
  - Pending applications
  - Approved applications
  - Rejected applications
- Approve/reject applications with reasons
- Activity logs

### Issuer Service
- **Admin Dashboard**: `http://localhost:3002/admin`
- **API Docs**: `http://localhost:3002/docs`

#### Features
- Create and manage credential templates
- View template schema and configuration
- Track issued credentials
- Monitor issuer performance
- Statistics:
  - Total templates (8+)
  - Credentials issued
  - Active issuers
  - System health
- Template CRUD operations
- Credential lifecycle management

### Verifier Service
- **Admin Dashboard**: `http://localhost:3003/admin`
- **API Docs**: `http://localhost:3003/docs`

#### Features
- Manage verification policies
- Track verification results
- Monitor credential validation
- Statistics:
  - Total verifications
  - Valid credentials
  - Invalid credentials
  - Average verification time
- View recent verifications with results
- Policy management interface

### Notification Service
- **Admin Dashboard**: `http://localhost:3004/admin`
- **API Docs**: `http://localhost:3004/docs`

#### Features
- Manage notification templates
- Track delivery status
- View sent notifications
- Statistics:
  - Total notifications
  - Delivered count
  - Failed count
  - Delivery rate
- Multi-channel support (Email, SMS)
- Event trigger configuration
- System configuration management

### Revocation Service
- **Admin Dashboard**: `http://localhost:3005/admin`
- **API Docs**: `http://localhost:3005/docs`

#### Features
- Revoke credentials with reasons
- View revocation records
- Manage revocation lists
- Statistics:
  - Total credentials
  - Active credentials
  - Revoked credentials
  - Registry size
- Revocation history
- Reason categorization
- Batch operations

## Dashboard Features

### Common Elements

All dashboards include:

1. **Statistics Cards**
   - Real-time metrics
   - Color-coded status indicators
   - Quick overview of key metrics

2. **Data Tables**
   - Sortable columns
   - Filterable results
   - Action buttons
   - Status badges

3. **Forms & Actions**
   - Create new resources
   - Edit existing items
   - Bulk operations
   - Confirmation dialogs

4. **Status Indicators**
   - ✓ Active (green)
   - ✗ Inactive/Revoked (red)
   - ⏱ Pending (yellow)
   - ℹ Verified (blue)

### Real-time Data

Dashboards auto-refresh data every 30 seconds to show:
- Updated application status
- New credential issuances
- Verification results
- Notification delivery status
- Revocation records

## Authentication

Currently, all dashboards are accessible without authentication for development. In production, add authentication middleware:

```typescript
app.use('/admin', authMiddleware);
app.use('/admin/*', authMiddleware);
```

## Customization

### Adding New Dashboards

1. Create HTML file in `public/` directory
2. Add route in service's `main.ts`:
   ```typescript
   app.getHttpAdapter().get("/admin/section", (req, res) => {
     res.sendFile(path.join(__dirname, "../public/section.html"));
   });
   ```
3. Link from main dashboard

### Styling

Dashboards use:
- Inline CSS for portability
- Gradient backgrounds
- Responsive grid layouts
- Accessible color scheme

### API Integration

Dashboards make fetch requests to service APIs:
```javascript
const response = await fetch('http://localhost:5000/api/kyc/applications');
const data = await response.json();
```

## Features by Service

### KYC Service Dashboard
```
├── Statistics (Total, Pending, Approved, Rejected)
├── Search & Filters
├── Applications Table
│   ├── View Details
│   ├── Approve
│   └── Reject
├── Documents Pending Review
│   ├── Review Document
│   └── Download
└── Recent Activity Log
```

### Issuer Service Dashboard
```
├── Statistics (Templates, Issued, Issuers, Health)
├── Create Template Form
├── Templates Table
│   ├── Edit Template
│   └── Delete Template
├── Recent Issuances
└── System Settings
```

### Verifier Service Dashboard
```
├── Statistics (Verifications, Valid, Invalid, Time)
├── Verification Policies
│   └── Edit Policy
├── Recent Verifications
└── Policy Management
```

### Notification Service Dashboard
```
├── Statistics (Total, Delivered, Failed, Rate)
├── Notification Templates
│   ├── Email Templates
│   ├── SMS Templates
│   └── Edit Template
├── Recent Notifications
└── System Configuration
```

### Revocation Service Dashboard
```
├── Statistics (Total, Active, Revoked, Registry Size)
├── Revoke Credential Form
├── Revocation Records
├── Revocation Statistics
└── Revocation List Management
```

## Benefits Over Swagger Docs

| Feature | Swagger | Dashboard |
|---------|---------|-----------|
| **User-friendly UI** | ❌ | ✅ |
| **Real-time data** | ❌ | ✅ |
| **Bulk operations** | ❌ | ✅ |
| **Status tracking** | ❌ | ✅ |
| **Statistics/metrics** | ❌ | ✅ |
| **Workflow management** | ❌ | ✅ |
| **Activity logs** | ❌ | ✅ |
| **API Documentation** | ✅ | ✅ |
| **Test endpoints** | ✅ | ❌ |

## Future Enhancements

1. **Authentication & Authorization**
   - Role-based access control
   - User management
   - Audit logging

2. **Advanced Features**
   - Data export (CSV, JSON)
   - Scheduled reports
   - Webhooks management
   - Advanced filtering
   - Custom dashboards

3. **Analytics**
   - Charts and graphs
   - Trend analysis
   - Performance metrics
   - Compliance reports

4. **Mobile Support**
   - Responsive design improvements
   - Mobile-optimized views
   - Push notifications

5. **Internationalization**
   - Multi-language support
   - Localized formatting
   - Regional compliance

## Development

### Adding Dashboard Data

Edit the fetch requests in dashboard HTML:

```javascript
async function loadDashboardData() {
  try {
    const response = await fetch('http://localhost:PORT/api/endpoint');
    const data = await response.json();
    displayData(data);
  } catch (error) {
    console.error('Error loading data:', error);
  }
}
```

### Testing Dashboards Locally

1. Start all services
2. Navigate to `http://localhost:5000/admin`
3. Click service links to view individual dashboards
4. Test data loading and interactions

## Support

For issues or questions about dashboards:
1. Check service logs: `docker logs service-name`
2. Verify API endpoints are responding
3. Check browser console for errors
4. Review dashboard HTML for customization issues

---

**Last Updated**: 2024
**Status**: Production Ready
