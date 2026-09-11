# Cloud Deployment Configuration

## Current Deployment Status

| Component | Service | Status | URL |
|-----------|---------|--------|-----|
| Frontend | Azure Blob Storage | ✅ Deployed | `https://campbookingstorage.blob.core.windows.net/` |
| Backend API | Azure App Service | ✅ Deployed | `https://campbooking-api-prod.azurewebsites.net/` |
| Database | Neon Cloud (PostgreSQL) | ✅ Deployed | `postgresql://ep-...neon.tech` |

---

## Deployment Configuration Files

### 1. Azure Resource Manager (ARM) Template
**File**: `azure-deploy.json`
- Defines all Azure resources using Infrastructure as Code
- Includes App Service, Blob Storage, Application Insights, Key Vault
- Deploy with: `az deployment group create -g <rg> -f azure-deploy.json`

### 2. Automated Deployment Scripts

#### PowerShell (Windows)
**File**: `deploy-azure.ps1`
```powershell
.\deploy-azure.ps1 -Environment "prod" -Location "eastus"
```

#### Bash (Linux/Mac)
**File**: `deploy-azure.sh`
```bash
chmod +x deploy-azure.sh
./deploy-azure.sh
```

### 3. CI/CD Pipelines

#### GitHub Actions
**File**: `.github/workflows/deploy.yml`
- Triggers on push to main/develop branches
- Runs tests, builds both backend and frontend
- Auto-deploys to Azure on success
- Requires: `AZURE_CREDENTIALS` secret

#### Azure DevOps
**File**: `azure-pipelines.yml`
- Alternative CI/CD pipeline for Azure DevOps
- Includes build, test, and deployment stages
- Requires: Azure DevOps project linked to repo

---

## Environment Variables & Secrets

### App Service Configuration
Set these in Azure Portal or via Azure CLI:

```bash
az webapp config appsettings set \
  --resource-group CampBooking-RG \
  --name campbooking-api-prod \
  --settings \
  ASPNETCORE_ENVIRONMENT=Production \
  ConnectionStrings__DefaultConnection="YOUR_NEON_CONNECTION_STRING" \
  Jwt__Key="YOUR_JWT_SECRET_KEY" \
  Jwt__Issuer="YourIssuer" \
  Jwt__Audience="YourAudience" \
  APPINSIGHTS_INSTRUMENTATIONKEY="YOUR_APP_INSIGHTS_KEY"
```

### Local Development (.env)
```env
# Backend (appsettings.Development.json)
ASPNETCORE_ENVIRONMENT=Development
ConnectionStrings:DefaultConnection=postgresql://...

# Frontend (.env)
VITE_API_URL=/api
VITE_BACKEND_URL=http://localhost:5000
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Azure subscription active
- [ ] Azure CLI installed and authenticated
- [ ] Git repository configured
- [ ] Neon PostgreSQL database created
- [ ] Connection string documented

### Azure Infrastructure
- [ ] Resource Group created
- [ ] App Service created
- [ ] Storage Account created
- [ ] Application Insights configured
- [ ] Key Vault created

### Backend Deployment
- [ ] .NET 8 build successful
- [ ] Tests passing
- [ ] Connection string configured
- [ ] JWT secrets stored in Key Vault
- [ ] CORS configured

### Frontend Deployment
- [ ] React build successful
- [ ] Environment variables set
- [ ] Static website hosting enabled on Blob Storage
- [ ] CDN configured (optional)

### Post-Deployment
- [ ] API endpoint responding (https://campbooking-api-prod.azurewebsites.net/api/health)
- [ ] Frontend loading (https://campbookingstorage.blob.core.windows.net/)
- [ ] Database connectivity verified
- [ ] Monitoring and alerts configured
- [ ] Backups enabled

---

## Production Best Practices

### 1. Security
- ✅ Enable HTTPS only on App Service
- ✅ Store secrets in Azure Key Vault
- ✅ Use Managed Identity for database access
- ✅ Enable firewall on storage account
- ✅ Configure CORS carefully
- ✅ Use SSL certificates (free with App Service)

### 2. Performance
- ✅ Enable caching on Blob Storage
- ✅ Use Azure CDN for frontend
- ✅ Enable compression on App Service
- ✅ Configure connection pooling for database
- ✅ Set appropriate auto-scale rules

### 3. Reliability
- ✅ Enable Application Insights monitoring
- ✅ Configure alert rules
- ✅ Setup auto-backup for PostgreSQL
- ✅ Use deployment slots for zero-downtime updates
- ✅ Configure health checks

### 4. Compliance
- ✅ Enable diagnostic logging
- ✅ Store logs in Azure Storage
- ✅ Encrypt data in transit (HTTPS)
- ✅ Encrypt data at rest
- ✅ Regular security audits

---

## Monitoring & Alerts

### Application Insights Queries

```kusto
// API Performance
requests
| where name == 'GET /api/camps'
| summarize avg(duration), max(duration), count() by bin(timestamp, 1m)

// Failed Requests
requests
| where success == false
| summarize count() by resultCode, name

// Database Connections
customMetrics
| where name == 'DbConnectionPoolSize'
| summarize avg(value) by bin(timestamp, 5m)
```

### Alert Rules
- API response time > 2s
- Failed requests > 1%
- Server errors (5xx) > 0
- Database connection failures

---

## Scaling Configuration

### Horizontal Scaling
```bash
az monitor autoscale create \
  --resource-group CampBooking-RG \
  --resource campbooking-api-prod \
  --resource-type "Microsoft.Web/serverfarms" \
  --name autoscale-rule \
  --min-count 1 \
  --max-count 5 \
  --count 2
```

### Vertical Scaling
- **Dev**: B1 (1 core, 1.75 GB)
- **Staging**: B2 (2 cores, 3.5 GB)
- **Production**: S1 (1 core, 1.75 GB) or higher

---

## Cost Optimization

| Service | Tier | Monthly Cost (Estimate) |
|---------|------|------------------------|
| App Service | B1 | $13.14 |
| Blob Storage | Standard | $0.024/GB |
| PostgreSQL (Neon) | Starter | Free - $50+ |
| Application Insights | Pay-as-you-go | ~$3/GB |
| **Total** | | **$30-100/month** |

### Cost Reduction Tips
1. Use B1 tier for low-traffic apps
2. Enable compression on Blob Storage
3. Archive old logs
4. Use Neon serverless features
5. Remove unused resources

---

## Disaster Recovery

### Backup Strategy
- **Database**: Daily automated backups (Neon)
- **Code**: Git repository on GitHub
- **Blob Storage**: Geo-redundant storage (GRS)

### Recovery Procedures

**Restore Database**
```bash
# List available backups
neon branch list --project-id YOUR_PROJECT

# Restore from backup point
neon database restore --backup-id <backup_id>
```

**Restore Code**
```bash
# Redeploy from GitHub
git push origin main  # Triggers CI/CD
```

**Restore Frontend**
```bash
# Rebuild and redeploy
npm run build
az storage blob upload-batch \
  --account-name campbookingstorage \
  --destination '$web' \
  --source dist --overwrite
```

---

## Troubleshooting

### Backend Not Responding

```bash
# Check App Service status
az webapp show --resource-group CampBooking-RG --name campbooking-api-prod

# View logs
az webapp log tail --resource-group CampBooking-RG --name campbooking-api-prod

# Restart service
az webapp restart --resource-group CampBooking-RG --name campbooking-api-prod
```

### Frontend Not Loading

```bash
# Check blob storage
az storage blob list --account-name campbookingstorage --container-name '$web'

# Verify CORS
az storage cors list --account-name campbookingstorage --services b

# Check storage account status
az storage account show --name campbookingstorage
```

### Database Connection Issues

```bash
# Test Neon connection
psql -h YOUR_NEON_HOST -U YOUR_USER -d YOUR_DB -c "SELECT 1"

# Update connection string
az webapp config connection-string set \
  --resource-group CampBooking-RG \
  --name campbooking-api-prod \
  --settings DefaultConnection="YOUR_NEW_CONNECTION_STRING" \
  --connection-string-type PostgreSql
```

---

## Support & Documentation

- [Azure App Service Docs](https://docs.microsoft.com/azure/app-service/)
- [Neon PostgreSQL Docs](https://neon.tech/docs)
- [Azure CLI Reference](https://docs.microsoft.com/cli/azure/)
- [GitHub Actions for Azure](https://github.com/Azure/actions)

---

**Last Updated**: April 12, 2026  
**Deployed By**: Jayant Kumar  
**Project**: CampBooking
