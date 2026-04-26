# Cloudflare Workers Deployment Guide

This guide covers deploying your Express REST API to Cloudflare Workers with D1 database integration.

## Prerequisites

Before deploying, ensure you have:

1. **Cloudflare Account** - With a domain or access to Cloudflare
2. **Wrangler CLI** - Installed via `npm install -g wrangler` or as a local dev dependency
3. **D1 Database** - Already created in Cloudflare dashboard with ID: `4c51bf88-0419-41e7-a105-a0d0858d9d8a`
4. **Workers Project** - Already created in Cloudflare dashboard as `cubiko_api`
5. **Cloudflare API Token** - For authentication via `wrangler`

## Quick Start

### 1. Authenticate with Cloudflare

```bash
cd server
wrangler login
```

Follow the prompts to authorize Wrangler to access your Cloudflare account.

### 2. Initialize Database Schema

Run migrations to set up the D1 database schema:

```bash
# For staging environment
npm run migrate:d1:staging

# For production environment
npm run migrate:d1:prod
```

### 3. Set Up Environment Secrets

Configure JWT_SECRET and other sensitive data via Wrangler:

```bash
# For staging
wrangler secret put JWT_SECRET --env staging

# For production
wrangler secret put JWT_SECRET --env production
```

When prompted, enter your JWT secret key (use a strong, random value).

### 4. Deploy to Staging

Test your deployment in the staging environment first:

```bash
npm run deploy:staging
```

Verify the deployment succeeded:

- Check Cloudflare Workers dashboard
- Test the health endpoint: `https://staging-api.cubiko.dev/health`
- Run smoke tests on key endpoints (auth, rooms, reservas)

### 5. Deploy to Production

Once staging tests pass, deploy to production:

```bash
npm run deploy:prod
```

Verify production deployment:

- Test health endpoint: `https://api.cubiko.dev/health`
- Run full integration tests
- Monitor logs in Cloudflare dashboard

## Local Development

### Development with SQLite

For local development using SQLite:

```bash
npm run dev
```

This starts an Express server on `http://localhost:3001` with a local SQLite database at `data/biblioteca.db`.

### Development with Workers Runtime

To test your code in the Cloudflare Workers runtime locally:

```bash
npm run dev:worker
```

This uses `wrangler dev` to simulate the Workers environment with local SQLite. Test your endpoints at `http://localhost:8787`.

### Building

Build TypeScript to JavaScript:

```bash
npm run build
```

Output goes to `dist/` directory.

## Environment Configuration

### Wrangler Configuration

The `wrangler.toml` file configures:

- **D1 Database Binding** - Via `db` binding
- **Environments** - Staging and production variants
- **Compatibility Flags** - `nodejs_compat` for Node.js API support
- **Routes** - URL routing per environment

### Database Switching

The application automatically switches between databases based on environment:

- **Local Dev** (npm run dev): SQLite at `data/biblioteca.db`
- **Workers Local** (npm run dev:worker): SQLite at `data/biblioteca.db`
- **Staging/Production**: D1 via Cloudflare binding

This is handled in `src/config/database.ts`.

## Database Management

### Schema Migrations

Migrations are stored in `migrations/` folder:

- `001_init_schema.sql` - Initial database schema

### Applying Migrations

```bash
# View available migrations
ls -la migrations/

# Apply to staging D1
npm run migrate:d1:staging

# Apply to production D1
npm run migrate:d1:prod
```

### Manual D1 Queries

Use Wrangler to run SQL directly:

```bash
# Staging
wrangler d1 execute biblioteca-staging "SELECT * FROM Estudiante LIMIT 5" --env staging

# Production
wrangler d1 execute biblioteca "SELECT * FROM Estudiante LIMIT 5" --env production
```

### Create New Migrations

1. Create a new SQL file in `migrations/`:

   ```sql
   -- File: migrations/002_add_new_table.sql
   CREATE TABLE NewTable (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     ...
   );
   ```

2. Apply the migration:
   ```bash
   wrangler d1 execute biblioteca-staging < migrations/002_add_new_table.sql --env staging
   ```

## Monitoring & Logging

### View Worker Logs

```bash
# Real-time logs for production
wrangler tail --env production

# View recent logs for staging
wrangler tail --env staging
```

### Check Deployment Status

```bash
# View recent deployments
wrangler deployments list

# View specific deployment
wrangler deployments view <deployment-id>
```

### CloudFlare Dashboard

1. Go to **Workers & Pages** → **cubiko_api**
2. Select **Deployments** to see deployment history
3. View **Analytics** for request metrics and errors
4. Check **Logs** for real-time request/response data

## Troubleshooting

### Common Issues

#### 1. Authentication Failed

```bash
wrangler login
# OR use API token:
export CLOUDFLARE_API_TOKEN=your-token-here
```

#### 2. D1 Database Connection Error

- Verify database ID in `wrangler.toml` matches your D1 database
- Check database is in the same account as Workers project
- Confirm D1 is linked to the Workers project in dashboard

#### 3. Schema Migration Fails

- Check SQL syntax for D1 compatibility (SQLite-based)
- Verify the migration file path is correct
- Ensure you have proper `FOREIGN KEY` constraints

#### 4. Routes Not Matching

- Verify URL routes in `wrangler.toml` match your domain
- Test with direct Worker URL first (auto-generated)
- Check domain DNS points to Cloudflare nameservers

#### 5. Cold Start Issues

- Cloudflare Workers typically start in <100ms
- If slow, check D1 connection latency
- Monitor real requests via `wrangler tail`

### Debug Mode

Enable debug logging:

```bash
# Run with debug output
wrangler dev --local --debug

# Run migrations with verbose output
wrangler d1 execute biblioteca "SELECT 1" --env production --verbose
```

## Performance Optimization

### Best Practices for Workers

1. **Connection Pooling** - D1 handles this automatically
2. **Query Optimization** - Use indexes (already in schema)
3. **Response Caching** - Add caching headers if applicable
4. **Batch Operations** - Group multiple queries when possible

### Monitoring Performance

- Check request duration in Cloudflare Analytics
- Use `wrangler tail` to see response times
- Monitor D1 query execution time

## Rollback & Recovery

### Rollback a Deployment

```bash
# View recent deployments
wrangler deployments list

# Rollback to specific deployment
wrangler deployments rollback --latest --yes
```

### Database Rollback

For data issues in production D1:

```bash
# Export current data (backup)
wrangler d1 execute biblioteca "SELECT * FROM Estudiante" --env production > backup.json

# Restore from migration
wrangler d1 execute biblioteca < migrations/001_init_schema.sql --env production
```

## Environment-Specific Notes

### Staging Environment

- **Database**: `biblioteca-staging` D1 instance
- **Route**: `staging-api.cubiko.dev/*`
- **Purpose**: Integration testing before production
- **Data**: Can be reset for testing

### Production Environment

- **Database**: `biblioteca` D1 instance
- **Route**: `api.cubiko.dev/*`
- **Purpose**: Live user traffic
- **Data**: Handle with care - no resets!

## CI/CD Integration (Optional)

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]
    paths:
      - "server/**"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: "18"

      - run: cd server && npm ci && npm run build

      - run: cd server && npm run deploy:staging
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

      # After manual approval in staging, deploy to production
      - run: cd server && npm run deploy:prod
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

Configure GitHub secret: `CLOUDFLARE_API_TOKEN` with your token from Cloudflare.

## Support & Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Express.js Documentation](https://expressjs.com/)

## Testing Checklist

Before deploying to production:

- [ ] Local development works: `npm run dev`
- [ ] Workers local works: `npm run dev:worker`
- [ ] TypeScript builds without errors: `npm run build`
- [ ] All tests pass: `npm test`
- [ ] Auth endpoints work (register/login)
- [ ] CRUD operations on rooms work
- [ ] CRUD operations on reservas work
- [ ] Error handling returns proper responses
- [ ] Health check endpoint returns 200
- [ ] JWT token validation works
- [ ] Database transactions work correctly
- [ ] Staging deployment succeeds
- [ ] Staging endpoints respond correctly
- [ ] Production deployment succeeds
- [ ] Production endpoints respond correctly

## Questions?

Refer to the main [README.md](./README.md) for general project information.
