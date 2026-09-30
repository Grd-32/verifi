# 🚀 Quick Start - Admin Dashboards

Get started with the new KYC Vault admin dashboards in 2 minutes.

## Step 1: Start Services
```bash
docker-compose up
```

## Step 2: Access Main Dashboard
Open your browser and go to:
```
http://localhost:5000/admin
```

## Step 3: Explore Service Dashboards

Click the service cards or visit directly:

| Service | URL |
|---------|-----|
| 🏛️ Issuer | http://localhost:3002/admin |
| ✅ Verifier | http://localhost:3003/admin |
| 🔔 Notification | http://localhost:3004/admin |
| 🚫 Revocation | http://localhost:3005/admin |

## Step 4: Manage Your Data

Each dashboard provides:
- **View** - See all records in tables
- **Filter** - Search and filter data
- **Create/Edit** - Add or modify records
- **Delete/Revoke** - Remove or revoke items
- **Track** - View statistics and activity logs

## Common Tasks

### 🎯 Approve a KYC Application
1. Go to `http://localhost:5000/admin/kyc`
2. Find pending application in table
3. Click "Approve" button
4. Application status updates immediately

### 📋 Create a Credential Template
1. Go to `http://localhost:3002/admin`
2. Fill in template details
3. Enter JSON schema
4. Click "Create Template"

### 🔍 Verify Credentials
1. Go to `http://localhost:3003/admin`
2. View recent verifications
3. Check validation results
4. Manage verification policies

### 📧 Configure Notifications
1. Go to `http://localhost:3004/admin`
2. Manage notification templates
3. View delivery status
4. Track failed notifications

### 🗑️ Revoke a Credential
1. Go to `http://localhost:3005/admin`
2. Enter credential ID
3. Select revocation reason
4. Confirm revocation

## Dashboard Features

- 📊 **Real-time Statistics** - Key metrics at a glance
- 🔍 **Search & Filter** - Find what you need fast
- 📋 **Data Tables** - View all records
- ⚙️ **Management** - Create, edit, delete operations
- 📈 **Activity Logs** - Track all changes
- 📱 **Mobile Friendly** - Works on any device

## API Documentation

Swagger docs still available at original URLs:
- `http://localhost:5000/api/kyc/docs`
- `http://localhost:3002/docs`
- `http://localhost:3003/docs`
- `http://localhost:3004/docs`
- `http://localhost:3005/docs`

## Customization

### Change Colors
Edit the gradient in dashboard HTML:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Add New Columns to Tables
Edit the table HTML and add new `<th>` and `<td>` elements

### Connect to Your API
Update fetch URLs in dashboard:
```javascript
const response = await fetch('http://your-api/endpoint');
```

## Troubleshooting

### Dashboard Not Loading
- Verify service is running: `docker-compose logs service-name`
- Check port is correct (5000, 3002, 3003, 3004, 3005)
- Clear browser cache and reload

### No Data Showing
- Verify API endpoints are responding
- Check browser console for errors (F12)
- Ensure fetch URLs match your API

### Styling Issues
- Hard refresh browser (Ctrl+F5 or Cmd+Shift+R)
- Check inline CSS in dashboard HTML
- Verify CSS is not overridden by other styles

## Features Comparison

| Feature | Swagger | Dashboard |
|---------|---------|-----------|
| **Easy to use** | ❌ | ✅ |
| **Real-time data** | ❌ | ✅ |
| **No coding needed** | ❌ | ✅ |
| **Bulk operations** | ❌ | ✅ |
| **Statistics** | ❌ | ✅ |
| **Mobile friendly** | ❌ | ✅ |
| **Test APIs** | ✅ | ❌ |
| **View docs** | ✅ | ✅ |

## What's New

### Main Dashboard (Hub)
- Central access point for all services
- Quick system status overview
- Links to all admin dashboards

### KYC Dashboard
- Full application lifecycle management
- Real-time statistics
- Document review interface
- Activity tracking

### Service Dashboards
- Issuer: Template and credential management
- Verifier: Policy and verification tracking
- Notification: Template and delivery management
- Revocation: Revocation and registry management

## Next Steps

1. **Explore** - Click around and get familiar with the interface
2. **Integrate** - Connect dashboards to your APIs
3. **Customize** - Update colors, add fields, modify forms
4. **Deploy** - Use in production (add authentication first)
5. **Extend** - Add new features or dashboards as needed

## Documentation

For detailed information, see:
- [DASHBOARDS.md](./DASHBOARDS.md) - Complete feature guide
- [ADMIN_DASHBOARDS.md](./ADMIN_DASHBOARDS.md) - Implementation details
- [DASHBOARDS_SUMMARY.md](./DASHBOARDS_SUMMARY.md) - Architecture overview

## Support

Need help?
1. Check the documentation files above
2. Review browser console for errors
3. Verify services are running
4. Check API endpoints are responding

---

**Status**: ✅ Ready to use
**Version**: 1.0.0
**Last Updated**: January 28, 2026

Happy dashboard exploring! 🎉
