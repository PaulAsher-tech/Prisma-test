# Newsletter Application

A full-stack newsletter application built with Next.js, TypeScript, and Prisma. This application allows users to author newsletter posts, manage subscriptions, schedule posts, and send email notifications to subscribers.

## Features

### Core Functionality
- ✅ **Post Authoring**: Create and edit newsletter posts with rich content
- ✅ **Post Management**: View, edit, and delete posts through admin dashboard
- ✅ **Newsletter Subscription**: Public subscription form for users to join the newsletter
- ✅ **Post Scheduling**: Schedule posts to be published at a later date
- ✅ **Email Notifications**: Send emails to subscribers when posts are published (mock implementation)
- ✅ **Public Post Viewing**: Read-only view of published posts
- ✅ **API Endpoints**: RESTful API for retrieving and managing posts and subscriptions

### Technical Features
- Server-side rendering (SSR) with Next.js
- TypeScript for type safety
- Responsive design with Tailwind CSS
- Form validation with Zod and React Hook Form
- Database operations with Prisma ORM
- SQLite database for development

## Tech Stack

### Frontend
- **Next.js 14**: React-based SSR framework
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **React Hook Form**: Form handling and validation
- **Zod**: Schema validation

### Backend
- **Next.js API Routes**: Server-side API endpoints
- **Prisma**: Database ORM and query builder
- **SQLite**: Lightweight database for development
- **Nodemailer**: Email sending (configurable)

### Development Tools
- **ESLint**: Code linting
- **PostCSS**: CSS processing
- **date-fns**: Date manipulation utilities

## Project Structure

```
src/
├── app/
│   ├── admin/              # Admin dashboard
│   ├── api/                # API routes
│   │   ├── posts/          # Post management endpoints
│   │   ├── subscribers/    # Subscription endpoints
│   │   └── scheduler/      # Post scheduling endpoint
│   ├── posts/[slug]/       # Individual post pages
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Homepage
├── lib/
│   ├── db.ts              # Database connection
│   ├── email.ts           # Email service
│   ├── scheduler.ts       # Post scheduling logic
│   ├── utils.ts           # Utility functions
│   └── validations.ts     # Zod schemas
└── prisma/
    ├── schema.prisma      # Database schema
    └── migrations/        # Database migrations
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd newsletter-app
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
# Create .env file with the following variables:
DATABASE_URL="file:./dev.db"
EMAIL_FROM="your-email@example.com"
EMAIL_HOST="smtp.example.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@example.com"
EMAIL_PASS="your-password"
```

4. **Set up the database**:
```bash
npx prisma migrate dev
```

5. **Run the development server**:
```bash
npm run dev
```

6. **Open the application**:
   - Homepage: [http://localhost:12000](http://localhost:12000)
   - Admin Dashboard: [http://localhost:12000/admin](http://localhost:12000/admin)

## API Endpoints

### Posts
- `GET /api/posts` - Retrieve all posts
- `POST /api/posts` - Create a new post
- `GET /api/posts/[id]` - Retrieve a specific post
- `PUT /api/posts/[id]` - Update a specific post
- `DELETE /api/posts/[id]` - Delete a specific post

### Subscribers
- `GET /api/subscribers` - Retrieve all subscribers
- `POST /api/subscribers` - Add a new subscriber

### Scheduler
- `POST /api/scheduler` - Process scheduled posts for publishing

## Technology Choices & Trade-offs

### Why Next.js?
- **Server-side rendering**: Better SEO and initial page load performance
- **API routes**: Full-stack development in a single framework
- **File-based routing**: Intuitive page organization
- **Built-in optimization**: Image optimization, code splitting, etc.

### Why SQLite?
- **Simplicity**: No external database server required for development
- **Portability**: Database file can be easily moved or backed up
- **Performance**: Fast for small to medium applications
- **Trade-off**: Not suitable for high-concurrency production environments

### Why Prisma?
- **Type safety**: Generated TypeScript types from schema
- **Developer experience**: Excellent tooling and introspection
- **Migration system**: Version-controlled database changes
- **Trade-off**: Additional abstraction layer over raw SQL

### Why Tailwind CSS?
- **Rapid development**: Utility-first approach speeds up styling
- **Consistency**: Design system built into the framework
- **Bundle size**: Only used utilities are included in final CSS
- **Trade-off**: Learning curve for developers unfamiliar with utility classes

## Acceptable Trade-offs

1. **Authentication**: Omitted for simplicity as specified in requirements
2. **Email Service**: Mock implementation for development; easily replaceable with real service
3. **Database**: SQLite for development; would use PostgreSQL in production
4. **Error Handling**: Basic error handling; would implement comprehensive logging in production
5. **Testing**: Minimal testing due to time constraints; would add comprehensive test suite

## Future Improvements

### Short-term (Next Sprint)
- Fix React Hook Form submission issue in admin interface
- Add comprehensive error handling and user feedback
- Implement proper loading states throughout the application
- Add form validation feedback and error messages

### Medium-term (Next Month)
- **Authentication & Authorization**: User accounts, role-based access
- **Rich Text Editor**: WYSIWYG editor for post content
- **Image Upload**: Support for images in posts
- **Email Templates**: Customizable email templates for notifications
- **Analytics**: Basic analytics for post views and subscriber engagement

### Long-term (Next Quarter)
- **Multi-tenant Support**: Multiple newsletters per instance
- **Advanced Scheduling**: Recurring posts, bulk operations
- **Subscriber Management**: Segmentation, preferences, unsubscribe handling
- **Performance Optimization**: Caching, CDN integration, database optimization
- **Mobile App**: React Native app for content management

## Production Deployment

### Recommended Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel/Netlify│    │   PostgreSQL    │    │   SendGrid/     │
│   (Frontend +   │────│   (Database)    │    │   Mailgun       │
│   API Routes)   │    │                 │    │   (Email)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Deployment Steps

1. **Database Migration**:
   - Set up PostgreSQL database (AWS RDS, Supabase, or PlanetScale)
   - Update `DATABASE_URL` environment variable
   - Run `npx prisma migrate deploy`

2. **Environment Configuration**:
   ```bash
   DATABASE_URL="postgresql://..."
   EMAIL_FROM="newsletter@yourdomain.com"
   EMAIL_HOST="smtp.sendgrid.net"
   EMAIL_PORT="587"
   EMAIL_USER="apikey"
   EMAIL_PASS="your-sendgrid-api-key"
   ```

3. **Platform Deployment**:
   - **Vercel**: Connect GitHub repository, configure environment variables
   - **Railway**: Deploy with automatic PostgreSQL provisioning
   - **AWS**: Use Amplify or EC2 with RDS
   - **Docker**: Containerize application for any cloud provider

4. **Email Service Setup**:
   - Configure SendGrid, Mailgun, or Postmark
   - Set up domain authentication (SPF, DKIM records)
   - Implement bounce and complaint handling

5. **Monitoring & Logging**:
   - Set up error tracking (Sentry)
   - Configure application monitoring (Datadog, New Relic)
   - Implement structured logging

### Production Considerations
- **Security**: HTTPS, CSRF protection, rate limiting
- **Performance**: CDN, caching strategies, database indexing
- **Scalability**: Horizontal scaling, load balancing
- **Backup**: Automated database backups, disaster recovery
- **Compliance**: GDPR compliance for subscriber data

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma database browser
- `npx prisma migrate dev` - Create and apply new migration

### Docker Development

**Start development environment:**
```bash
docker-compose -f docker-compose.dev.yml up --build
```

**Start production environment:**
```bash
docker-compose up --build
```

**Stop all services:**
```bash
docker-compose down
```

**View logs:**
```bash
docker-compose logs -f app
```

**Access database:**
```bash
docker-compose exec db psql -U user -d newsletter
```

### Testing

The application includes a comprehensive test suite using Jest and React Testing Library. Tests are organized to cover both API endpoints and React components.

#### Running Tests

**Run all tests:**
```bash
npm test
```

**Run tests in watch mode (recommended for development):**
```bash
npm run test:watch
```

**Run tests with coverage report:**
```bash
npm run test:coverage
```

**Run specific test files:**
```bash
# Run API tests only
npm run test:api

# Run component tests only
npm run test:components

# Run a specific test file
npm test -- posts.test.ts
```

**Run tests in CI mode (single run, no watch):**
```bash
npm run test:ci
```

#### Test Structure

```
src/__tests__/
├── api/                    # API endpoint tests
│   ├── posts.test.ts      # Post API tests
│   ├── posts-id.test.ts   # Individual post API tests
│   ├── scheduler.test.ts  # Scheduler API tests
│   └── subscribers.test.ts # Subscriber API tests
├── post-page.test.tsx     # Post page component tests
└── utils.test.ts          # Utility function tests
```

#### Test Configuration

The project uses multiple Jest configurations:
- **`jest.config.js`** - Main configuration for component and utility tests
- **`jest.api.config.js`** - Configuration for API endpoint tests
- **`jest.setup.js`** - Global test setup and mocks

#### Writing Tests

**API Tests Example:**
```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { GET, POST } from '@/app/api/posts/route';

describe('/api/posts', () => {
  it('should return all posts', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    // Add more assertions...
  });
});
```

**Component Tests Example:**
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';
import PostPage from '@/app/posts/[slug]/page';

describe('PostPage', () => {
  it('should render post content', () => {
    render(<PostPage params={{ slug: 'test-post' }} />);
    expect(screen.getByText('Test Post')).toBeInTheDocument();
  });
});
```

#### Test Environment

- **Jest 29+** - Testing framework
- **React Testing Library** - Component testing utilities
- **@testing-library/jest-dom** - Custom Jest matchers for DOM testing
- **SQLite in-memory database** - Isolated database for tests

#### Continuous Integration

Tests are automatically run in CI/CD pipelines:
- **Pre-commit hooks** - Run tests before committing code
- **Pull request checks** - Ensure all tests pass before merging
- **Deployment validation** - Verify tests pass before production deployment

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.