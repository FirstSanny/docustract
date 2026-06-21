# DocuStract Deployment Guide

**Status:** ✅ Production Ready  
**Version:** 0.1.0  
**Last Updated:** 2026-06-20

---

## 🎯 Quick Start

DocuStract is production-ready and can be deployed immediately. Follow these steps to deploy to Render (recommended) or other platforms.

## 📋 Prerequisites

### Required
- **Render account** (recommended) or alternative hosting platform
- **PostgreSQL database** (can be provisioned on Render)
- **Domain name** (optional, for production)

### Recommended Tools
- Git
- Node.js 20+
- npm
- Render CLI (optional)

## 🚀 Deployment to Render (Recommended)

### Step 1: Create a New Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository (select `DocuStract/projects/DocuStract`)

### Step 2: Configure Environment Variables

Add these environment variables in Render:

```bash
# Database
DATABASE_URL=postgresql://<username>:<password>@<host>:5432/docustract

# JWT Authentication (generate a secure secret)
JWT_SECRET=your-very-secure-jwt-secret-key-here-change-in-production

# Server
PORT=3000
NODE_ENV=production

# Appwrite (optional, if using Appwrite for storage)
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key
```

### Step 3: Deploy

1. Click "Create Web Service"
2. Render will automatically build and deploy
3. Monitor the build logs for any errors

### Step 4: Verify Deployment

Once deployed, test the health endpoint:

```bash
curl https://<your-service-name>.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-06-20T20:30:00Z",
  "dependencies": {
    "database": "ok",
    "appwrite": "ok"
  }
}
```

## 🔧 Alternative Deployment Platforms

### Heroku

```bash
# Create app
heroku create your-app-name

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Configure variables
heroku config:set JWT_SECRET=your-secret DATABASE_URL=$(heroku config:get DATABASE_URL)

# Deploy
git push heroku main
```

### Railway

1. Import repository
2. Add PostgreSQL service
3. Configure environment variables
4. Deploy

### AWS (EC2/EKS)

```bash
# Build Docker image
docker build -t docustract .

# Push to ECR
aws ecr create-repository --repository-name docustract

# Deploy to ECS or EKS
```

### Self-Hosted (Docker)

```bash
# Build image
docker build -t docustract .

# Run container
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e JWT_SECRET=your-secret \
  --name docustract \
  docustract
```

## 📊 Post-Deployment Verification

### Health Check
```bash
curl https://your-domain.com/health
```

### Authentication Test
```bash
# Register a test user
curl -X POST https://your-domain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'

# Login
curl -X POST https://your-domain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'
```

### Document Upload Test
```bash
# Upload a test document
curl -X POST https://your-domain.com/api/v1/documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test.pdf"
```

## 🔐 Security Best Practices

### In Production

1. **Rotate Secrets**
   ```bash
   # Generate a secure JWT secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Enable HTTPS**
   - Render provides automatic HTTPS
   - Configure SSL certificates on other platforms

3. **Rate Limiting**
   - Already configured via `@fastify/rate-limit`
   - Default: 1000 requests per 15 minutes

4. **CORS Configuration**
   - Configure allowed origins in production
   - Update `src/middleware/cors.ts`

### Environment Variables

Never commit `.env` files to version control:

```bash
# Add to .gitignore
.env
.env.local
.env*.local
```

## 📈 Monitoring and Observability

### Health Endpoint
```bash
GET /health
```

Returns:
- Service status
- Database connection status
- Appwrite connection status (if configured)
- Timestamp

### Logging

All logs are output to stdout/stderr (Render automatically captures these).

### Metrics (Future)

Consider adding:
- Prometheus metrics endpoint
- Grafana dashboard
- Alerting on health check failures

## 🔄 Database Management

### Migrations

```bash
# Run migrations (development)
npm run migrate:up

# Rollback migrations
npm run migrate:down
```

### Backup

```bash
# PostgreSQL backup
pg_dump -Fc -d $DATABASE_URL -f docustract_backup.dump
```

## 🛠️ Maintenance Tasks

### Regular Operations

1. **Monitor Health**
   - Check `/health` endpoint regularly
   - Set up uptime monitoring (e.g., UptimeRobot, Pingdom)

2. **Log Rotation**
   - Render handles log retention
   - For self-hosted: configure logrotate

3. **Dependency Updates**
   ```bash
   npm update
   npm audit
   ```

### Scaling

Render automatically scales based on load. For high traffic:

1. Upgrade plan (from free tier)
2. Consider database optimization
3. Add caching layer (Redis)

## 📚 API Documentation

Once deployed, Swagger UI is available at:
```
https://your-domain.com/docs
```

This provides interactive API documentation with:
- All endpoints
- Request/response schemas
- Try-it-out functionality

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Failed

**Symptoms:** Health endpoint shows database as down

**Solutions:**
- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running
- Verify network connectivity
- Check credentials and permissions

#### 2. JWT Authentication Issues

**Symptoms:** 401 Unauthorized errors

**Solutions:**
- Verify JWT secret matches across all instances
- Check token expiration (default: 1 hour)
- Ensure tokens are being sent in Authorization header

#### 3. Deployment Fails

**Solutions:**
- Check build logs in Render dashboard
- Verify all environment variables are set
- Ensure database migrations completed successfully
- Check for port conflicts

### Logs

```bash
# View Render logs
render logs --app <app-name>
```

## 📊 Performance Optimization

### Current Configuration

- **Node.js**: 20.x
- **Fastify**: 4.x
- **Rate Limiting**: 1000 requests/15 minutes
- **Timeouts**: 5 seconds for external requests

### Recommended Optimizations

1. **Add Caching**
   ```bash
   # Consider adding Redis
   npm install @fastify/redis
   ```

2. **Database Indexing**
   - Add indexes for frequently queried columns
   - Consider read replicas for high traffic

3. **Connection Pooling**
   - Kysely already uses connection pooling
   - Adjust pool size based on load

## 🎯 Next Steps After Deployment

### Phase 1: Immediate (Week 1)

- [ ] Verify all endpoints work correctly
- [ ] Test authentication flow
- [ ] Validate document uploads
- [ ] Set up monitoring and alerts
- [ ] Document API usage for team

### Phase 2: Short-term (Month 1)

- [ ] Add user management UI
- [ ] Implement pipeline templates
- [ ] Add webhooks for document processing events
- [ ] Set up automated backups
- [ ] Create admin dashboard

### Phase 3: Long-term

- [ ] Add multi-tenant support
- [ ] Implement billing and subscription management
- [ ] Add advanced analytics
- [ ] Support for additional document formats
- [ ] Integration with cloud storage (S3, GCS)

## 📞 Support

### Documentation
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design
- [TECH-STACK.md](docs/TECH-STACK.md) - Technology choices
- [API Documentation](https://your-domain.com/docs) - Interactive docs

### Issues
- Check GitHub issues for known problems
- Review logs for error patterns
- Verify environment configuration

### Contributing
See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for development guidelines.

---

## ✨ Success!

Your DocuStract API is now running in production! 🎉

**Deployment Checklist:**
- [x] Service deployed and running
- [x] Health checks passing
- [x] Database connected
- [x] Authentication working
- [ ] HTTPS configured
- [ ] Monitoring set up
- [ ] Backups configured

**Next:** Start building applications on top of your new document processing API!

---

**Project Status:** ✅ Production Ready  
**Deployment Date:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")  
**Maintainer:** DocuStract Engineer Agent