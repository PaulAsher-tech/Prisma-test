# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automated CI/CD, testing, and deployment.

## Workflows

### 1. CI (`ci.yml`)
- **Triggers**: Push to `main`/`develop` branches, Pull Requests
- **Purpose**: Runs tests, linting, type checking, and builds the application
- **Features**:
  - PostgreSQL service container for testing
  - Runs all test suites (unit, API, component)
  - TypeScript compilation check
  - ESLint validation
  - Build verification

### 2. Deploy (`deploy.yml`)
- **Triggers**: Push to `main` branch
- **Purpose**: Deploys the application to production
- **Features**:
  - Automatic deployment to Vercel
  - Production environment protection
  - Build artifact upload

### 3. Security (`security.yml`)
- **Triggers**: Weekly schedule, Push to `main`, Pull Requests
- **Purpose**: Security vulnerability scanning
- **Features**:
  - npm audit checks
  - Dependency outdated checks
  - Snyk security scanning

### 4. Database (`database.yml`)
- **Triggers**: Manual workflow dispatch
- **Purpose**: Database operations for different environments
- **Features**:
  - Database migrations
  - Data seeding
  - Database reset
  - Environment-specific operations

## Required Secrets

Set these secrets in your GitHub repository settings:

### For Vercel Deployment:
- `VERCEL_TOKEN`: Your Vercel authentication token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

### For Security Scanning:
- `SNYK_TOKEN`: Your Snyk authentication token

### For Database Operations:
- `DATABASE_URL`: Database connection string for each environment

## Environment Setup

### 1. Create Environments
Go to Settings → Environments and create:
- `staging`
- `production`

### 2. Set Environment-Specific Secrets
Each environment can have its own secrets:
- `staging`: Use staging database and services
- `production`: Use production database and services

## Usage

### Automatic Workflows
- **CI**: Runs automatically on every push and PR
- **Deploy**: Runs automatically when merging to main
- **Security**: Runs weekly and on code changes

### Manual Workflows
- **Database**: Use the "Run workflow" button in Actions tab
  - Select environment (staging/production)
  - Choose operation (migrate/seed/reset)

## Local Development

To run the same checks locally:

```bash
# Install dependencies
npm ci

# Run linting
npm run lint

# Run type checking
npx tsc --noEmit

# Run tests
npm test

# Run API tests
npm run test:api

# Build application
npm run build
```

## Troubleshooting

### Common Issues

1. **Database Connection Failures**
   - Ensure `DATABASE_URL` secret is set correctly
   - Check if database is accessible from GitHub Actions

2. **Build Failures**
   - Verify all dependencies are in `package-lock.json`
   - Check for TypeScript compilation errors

3. **Test Failures**
   - Ensure test database is properly configured
   - Check for environment variable issues

### Support
For workflow issues, check the Actions tab in your GitHub repository for detailed logs and error messages.
