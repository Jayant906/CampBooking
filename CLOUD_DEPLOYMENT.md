# CampBooking - Cloud Deployment Guide

## 🌐 Current Cloud Architecture

The CampBooking application is deployed on **Microsoft Azure** with the following architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     Azure Cloud Platform                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐    ┌──────────────────┐                │
│  │   Azure Storage  │    │   App Service    │                │
│  │  (Blob Storage)  │    │  (.NET Backend)  │                │
│  │                  │    │                  │                │
│  │  Frontend React  │◄──►│  API Endpoints   │                │
│  │  (SPA Bundle)    │    │  Port: 80/443    │                │
│  │                  │    │                  │                │
│  └──────────────────┘    └────────┬─────────┘                │
│         ▲                         │                           │
│         │                         │                           │
│         │                    HTTPS/REST                       │
│         │                         │                           │
│         │                    ┌────▼──────────┐               │
│         └────────────────────┤ Neon Cloud    │               │
│                              │ (PostgreSQL)  │               │
│                              └───────────────┘               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Components

#### 1. **Frontend - Azure Blob Storage**
- **URL**: https://your-storage-account.blob.core.windows.net/
- **Service**: Static Website Hosting
- **Content**: React SPA bundle (index.html, JS, CSS)
- **CDN**: Azure CDN for global distribution (optional)
- **CORS**: Configured to allow requests from App Service

#### 2. **Backend - Azure App Service**
- **URL**: https://your-app-service.azurewebsites.net/
- **Runtime**: .NET 8 (Managed)
- **Instance**: Standard B1/B2 (scalable)
- **Authentication**: System Assigned Managed Identity
- **Features**:
  - Auto-scaling (0-5 instances recommended)
  - CI/CD integration (GitHub Actions or Azure DevOps)
  - Health check endpoint: `/api/health`
  - Staging slots for blue-green deployments

#### 3. **Database - Neon Cloud PostgreSQL**
- **Provider**: Neon (Serverless PostgreSQL)
- **Region**: US-East (optimized for Azure East US)
- **Connection**: Pooled connection (PgBouncer)
- **Backups**: Automated daily backups (30-day retention)
- **Scaling**: Compute scales automatically, storage is unlimited
- **Connection String**: Stored in App Service Configuration

---

## 🚀 Deployment Instructions

### Prerequisites
- Azure Account with active subscription
- Azure CLI installed
- Git
- .NET 8 SDK
- Node.js 18+

### Step 1: Deploy Backend to App Service

```bash
# 1. Login to Azure
az login

# 2. Create Resource Group
az group create --name CampBooking-RG --location eastus

# 3. Create App Service Plan
az appservice plan create \
  --name CampBooking-Plan \
  --resource-group CampBooking-RG \
  --sku B1 --is-linux

# 4. Create App Service
az webapp create \
  --resource-group CampBooking-RG \
  --plan CampBooking-Plan \
  --name campbooking-api \
  --runtime "DOTNET|8.0"

# 5. Configure environment variables
az webapp config appsettings set \
  --resource-group CampBooking-RG \
  --name campbooking-api \
  --settings \
  ASPNETCORE_ENVIRONMENT=Production \
  "ConnectionStrings:DefaultConnection=Host=YOUR_NEON_HOST;Port=5432;Database=YOUR_DB;Username=YOUR_USER;Password=YOUR_PASS;SSL Mode=Require" \
  Jwt:Key=YOUR_JWT_SECRET_KEY \
  Jwt:Issuer=YourIssuer \
  Jwt:Audience=YourAudience

# 6. Deploy code
cd backend/CampBooking.API
dotnet publish -c Release -o ./publish
cd publish
az webapp deployment source config-zip \
  --resource-group CampBooking-RG \
  --name campbooking-api \
  --src deployment.zip
```

### Step 2: Deploy Frontend to Blob Storage

```bash
# 1. Create Storage Account
az storage account create \
  --name campbookingstorage \
  --resource-group CampBooking-RG \
  --location eastus \
  --sku Standard_LRS

# 2. Enable Static Website Hosting
az storage blob service-properties update \
  --account-name campbookingstorage \
  --static-website \
  --index-document index.html \
  --404-document index.html

# 3. Build React app
cd frontend
npm install
npm run build

# 4. Upload build files to blob storage
az storage blob upload-batch \
  --account-name campbookingstorage \
  --destination '$web' \
  --source ./dist

# 5. Get the storage website URL
az storage account show \
  --name campbookingstorage \
  --query primaryEndpoints.web \
  --output tsv
```

### Step 3: Configure CORS

```bash
# Allow frontend to call backend API
az webapp cors add \
  --resource-group CampBooking-RG \
  --name campbooking-api \
  --allowed-origins "https://campbookingstorage.blob.core.windows.net"
```

### Step 4: Setup Azure CDN (Optional)

```bash
# 1. Create CDN Profile
az cdn profile create \
  --resource-group CampBooking-RG \
  --name campbooking-cdn \
  --sku Standard_Microsoft

# 2. Create CDN Endpoint
az cdn endpoint create \
  --resource-group CampBooking-RG \
  --profile-name campbooking-cdn \
  --name campbooking \
  --origin campbookingstorage.blob.core.windows.net
```

---

## 🔒 Security Configuration

### 1. **App Service Security**
```bash
# Enable HTTPS only
az webapp update \
  --resource-group CampBooking-RG \
  --name campbooking-api \
  --https-only true

# Add custom domain with SSL certificate
az webapp config hostname add \
  --webapp-name campbooking-api \
  --resource-group CampBooking-RG \
  --hostname api.yourdomain.com
```

### 2. **Storage Account Security**
```bash
# Disable public blob access
az storage account update \
  --resource-group CampBooking-RG \
  --name campbookingstorage \
  --allow-shared-key-access false

# Enable firewall
az storage account network-rule add \
  --resource-group CampBooking-RG \
  --account-name campbookingstorage \
  --ip-address 0.0.0.0/0 --action Allow
```

### 3. **Secrets Management**
```bash
# Store secrets in Azure Key Vault
az keyvault create \
  --resource-group CampBooking-RG \
  --name campbooking-vault

# Store connection strings
az keyvault secret set \
  --vault-name campbooking-vault \
  --name "ConnectionStrings--DefaultConnection" \
  --value "Your_Connection_String"

# Grant App Service access
az keyvault set-policy \
  --name campbooking-vault \
  --object-id <app-service-object-id> \
  --secret-permissions get list
```

---

## 📊 Monitoring & Logging

### Application Insights Setup
```bash
# Create Application Insights
az monitor app-insights component create \
  --app campbooking-insights \
  --location eastus \
  --resource-group CampBooking-RG \
  --application-type web

# Link to App Service
az webapp config set \
  --resource-group CampBooking-RG \
  --name campbooking-api \
  --app-settings APPINSIGHTS_INSTRUMENTATIONKEY=YOUR_KEY
```

### View Logs
```bash
# Stream live logs
az webapp log tail \
  --resource-group CampBooking-RG \
  --name campbooking-api
```

---

## 🔄 CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup .NET
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: '8.0'
    
    - name: Build Backend
      run: |
        cd backend/CampBooking.API
        dotnet publish -c Release -o ${{env.DOTNET_ROOT}}/myapp
    
    - name: Deploy Backend
      uses: azure/webapps-deploy@v2
      with:
        app-name: campbooking-api
        publish-profile: ${{ secrets.AZURE_PUBLISH_PROFILE }}
        package: ${{env.DOTNET_ROOT}}/myapp
    
    - name: Setup Node
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Build Frontend
      run: |
        cd frontend
        npm install
        npm run build
    
    - name: Deploy Frontend
      uses: azure/CLI@v1
      with:
        inlineScript: |
          az storage blob upload-batch \
            --account-name campbookingstorage \
            --destination '$web' \
            --source frontend/dist
```

---

## 📈 Scaling Configuration

### Auto-scale Backend
```bash
az monitor autoscale create \
  --resource-group CampBooking-RG \
  --resource campbooking-api \
  --resource-type "Microsoft.Web/serverfarms" \
  --name autoscale-rule \
  --min-count 1 \
  --max-count 5 \
  --count 2
```

### Monitor Database Connections
```bash
# Check current connections in Neon
neon connection list --project-id YOUR_PROJECT_ID
```

---

## 🌍 Domain Configuration

### Custom Domain with SSL
```bash
# 1. Point your domain DNS to Azure
# Add A record: api.yourdomain.com → your-app-service.azurewebsites.net

# 2. Verify domain ownership
az webapp config hostname add \
  --webapp-name campbooking-api \
  --resource-group CampBooking-RG \
  --hostname api.yourdomain.com

# 3. Create SSL certificate (free with App Service)
az appservice certificate create \
  --resource-group CampBooking-RG \
  --name campbooking-cert \
  --host-name api.yourdomain.com
```

---

## 🧪 Testing Cloud Deployment

```bash
# Test API
curl -X GET https://campbooking-api.azurewebsites.net/api/camps

# Test Frontend
open https://campbookingstorage.blob.core.windows.net/

# Check logs
az webapp log tail --resource-group CampBooking-RG --name campbooking-api
```

---

## 💾 Database Backup & Restore

### Neon Backups
```bash
# List available backups
neon branch list --project-id YOUR_PROJECT_ID

# Restore from backup (Neon dashboard)
# Navigate to: Project → Branches → Backups → Restore
```

### Export PostgreSQL Dump
```bash
# Create backup
pg_dump -h YOUR_NEON_HOST -U YOUR_USER -d YOUR_DB -F c -f backup.dump

# Restore from backup
pg_restore -h YOUR_NEON_HOST -U YOUR_USER -d YOUR_DB -F c backup.dump
```

---

## 🛠️ Troubleshooting

### Backend not connecting to database
```bash
# Check connection string
az webapp config appsettings list \
  --resource-group CampBooking-RG \
  --name campbooking-api | grep Connection

# Test Neon connection
psql -h YOUR_NEON_HOST -U YOUR_USER -d YOUR_DB -c "SELECT 1"
```

### Frontend loading but API calls failing
```bash
# Check CORS settings
az webapp cors show --resource-group CampBooking-RG --name campbooking-api

# Verify blob storage CORS
az storage cors list --account-name campbookingstorage --services b
```

### High latency
```bash
# Check App Service metrics
az monitor metrics list \
  --resource /subscriptions/{subscription}/resourceGroups/CampBooking-RG/providers/Microsoft.Web/sites/campbooking-api \
  --metric "ResponseTime" --start-time 2024-01-01T00:00:00Z
```

---

## 📋 Deployment Checklist

- [ ] Azure subscription created
- [ ] Resource group created
- [ ] App Service deployed
- [ ] Backend code deployed
- [ ] Database connection verified
- [ ] Storage account created
- [ ] Frontend built and uploaded
- [ ] CORS configured
- [ ] SSL certificates installed
- [ ] Domain configured
- [ ] CI/CD pipeline setup
- [ ] Monitoring enabled
- [ ] Backups configured
- [ ] Security hardened

---

## 🔗 Useful Resources

- [Azure App Service Docs](https://docs.microsoft.com/en-us/azure/app-service/)
- [Azure Storage Docs](https://docs.microsoft.com/en-us/azure/storage/)
- [Neon Cloud Docs](https://neon.tech/docs)
- [Azure CLI Reference](https://docs.microsoft.com/en-us/cli/azure/)

---

**Last Updated**: April 12, 2026  
**Deployed By**: DevOps Team
