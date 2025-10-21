# Deployment Guide

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Writing Timeline Platform

# Analytics and Monitoring (Optional)
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# Performance Monitoring
NEXT_PUBLIC_PERFORMANCE_MONITORING=true

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ERROR_MONITORING=true
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true

# Security
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Database (if using direct connection)
DATABASE_URL=your_database_url

# Redis (for caching, optional)
REDIS_URL=your_redis_url

# Email (for notifications, optional)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

# File Storage (optional)
NEXT_PUBLIC_STORAGE_URL=your_storage_url
STORAGE_ACCESS_KEY=your_storage_access_key
STORAGE_SECRET_KEY=your_storage_secret_key
```

## Vercel Deployment

### 1. Prerequisites

- Vercel account
- Supabase project
- GitHub repository

### 2. Deploy to Vercel

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy
   vercel
   ```

2. **Set Environment Variables**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all required environment variables
   - Set production, preview, and development values

3. **Configure Domain**
   - Go to Vercel Dashboard → Project → Settings → Domains
   - Add your custom domain (optional)

### 3. Supabase Configuration

1. **Update RLS Policies**
   ```sql
   -- Update CORS settings in Supabase Dashboard
   -- Add your Vercel domain to allowed origins
   ```

2. **Configure Auth Settings**
   - Go to Supabase Dashboard → Authentication → Settings
   - Add your Vercel domain to Site URL
   - Add redirect URLs

### 4. Database Migrations

```bash
# Run migrations in Supabase Dashboard SQL Editor
# Or use Supabase CLI
supabase db push
```

## Monitoring Setup

### 1. Health Check

The application includes a health check endpoint:
- URL: `/api/health`
- Returns: Service status, database connectivity, response time

### 2. Performance Monitoring

Built-in performance monitoring tracks:
- Core Web Vitals (LCP, FID, CLS)
- Page load times
- API response times
- User interactions

### 3. Error Monitoring

Automatic error tracking for:
- JavaScript errors
- Unhandled promise rejections
- API errors
- Database errors

## Security Configuration

### 1. Security Headers

The application includes security headers via `vercel.json`:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()

### 2. Rate Limiting

Built-in rate limiting for API endpoints:
- 100 requests per 15 minutes per IP
- Configurable limits per endpoint

### 3. Input Validation

Comprehensive input validation for:
- Document titles (max 200 characters)
- Document content (max 50,000 characters)
- Email format validation
- UUID format validation

## Performance Optimization

### 1. Caching

- Static assets cached by Vercel CDN
- API responses cached where appropriate
- IndexedDB for local event storage

### 2. Bundle Optimization

- Next.js automatic code splitting
- Dynamic imports for heavy components
- Image optimization

### 3. Database Optimization

- Proper indexing on frequently queried columns
- Connection pooling
- Query optimization

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check Supabase credentials
   - Verify RLS policies
   - Check network connectivity

2. **Authentication Issues**
   - Verify Supabase Auth configuration
   - Check redirect URLs
   - Clear browser cache

3. **Performance Issues**
   - Check Vercel function limits
   - Monitor database query performance
   - Review bundle size

### Debug Mode

Enable debug mode by setting:
```bash
NEXT_PUBLIC_DEBUG=true
```

This will:
- Show detailed error messages
- Log performance metrics
- Enable development tools

## Maintenance

### 1. Regular Updates

- Keep dependencies updated
- Monitor security advisories
- Update Supabase client libraries

### 2. Backup Strategy

- Supabase automatic backups
- Export critical data regularly
- Monitor database size

### 3. Monitoring

- Set up alerts for errors
- Monitor performance metrics
- Track user analytics

## Scaling Considerations

### 1. Database Scaling

- Monitor query performance
- Consider read replicas for heavy read workloads
- Implement connection pooling

### 2. Application Scaling

- Vercel automatic scaling
- Monitor function execution time
- Consider edge functions for global performance

### 3. Storage Scaling

- Monitor IndexedDB usage
- Implement cleanup strategies
- Consider external storage for large files
