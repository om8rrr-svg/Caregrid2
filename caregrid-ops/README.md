# CareGrid Operations Dashboard

A modern Next.js 14+ TypeScript operations dashboard for monitoring and managing the CareGrid healthcare platform.

<!-- Deployment trigger: Fixed Vercel build issues -->

## Features

### 🚀 Core Functionality
- **Feature Flags Management**: Create, update, and manage feature flags with A/B testing capabilities
- **Real-time Monitoring**: Live system health monitoring and performance metrics
- **User Management**: Role-based access control (Admin, Manager, Viewer)
- **Analytics Dashboard**: Comprehensive metrics and usage analytics
- **Incident Management**: Track and manage system incidents
- **Maintenance Mode**: Toggle maintenance mode with graceful shutdowns

### 🛠 Technical Stack
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: JWT-based with role-based access control
- **API Integration**: RESTful API client with circuit breaker pattern
- **State Management**: React Context API
- **Charts**: Recharts for data visualization

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- CareGrid backend API running

### Installation

1. Clone the repository:
```bash
git clone https://github.com/om8rrr-svg/caregrid-ops.git
cd caregrid-ops
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development
NEXTAUTH_SECRET=your-secret-key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   ├── feature-flags/     # Feature flags management
│   ├── monitoring/        # System monitoring
│   ├── metrics/           # Analytics and metrics
│   └── api/               # API routes
├── components/            # Reusable React components
│   ├── auth/              # Authentication components
│   ├── dashboard/         # Dashboard components
│   ├── FeatureFlags/      # Feature flag components
│   ├── layout/            # Layout components
│   ├── monitoring/        # Monitoring components
│   └── ui/                # UI components
├── contexts/              # React contexts
├── lib/                   # Utility libraries
│   ├── api/               # API client and configuration
│   ├── auth/              # Authentication utilities
│   └── utils.ts           # General utilities
├── types/                 # TypeScript type definitions
└── middleware.ts          # Next.js middleware
```

## Key Components

### Feature Flags Manager
Manage feature flags with:
- Create/Update/Delete operations
- A/B testing configuration
- Rollout percentage controls
- Usage analytics
- Real-time status monitoring

### Dashboard
- System health overview
- Performance metrics
- Real-time alerts
- User activity monitoring

### Authentication
- JWT-based authentication
- Role-based access control
- Secure token management
- Session handling

## API Integration

The dashboard integrates with the CareGrid backend API:

- **Health Monitoring**: `/api/health/*`
- **Feature Flags**: `/api/feature-flags/*`
- **Authentication**: `/api/auth/*`
- **User Management**: `/api/users/*`
- **Analytics**: `/api/analytics/*`

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_ENV` | Application environment | `development` |
| `NEXTAUTH_SECRET` | NextAuth secret key | Required |
| `NEXTAUTH_URL` | Application URL | `http://localhost:3000` |

## Deployment

### Vercel Deployment

This application is configured for deployment on Vercel with the domain `ops.caregrid.co.uk`.

#### Prerequisites
1. Vercel account and CLI installed
2. GitHub repository connected to Vercel

#### Environment Variables
Configure the following environment variables in Vercel → Project → Settings → Environment Variables:

| Variable | Description | Required Value |
|----------|-------------|----------------|
| `JWT_SECRET` | Strong secret key for JWT token signing | `***strong-secret***` |
| `NEXT_PUBLIC_API_BASE` | Backend API base URL | `https://caregrid-backend.onrender.com` |

#### Security Headers
The `vercel.json` configuration includes security headers:
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information

#### Route Protection
The following routes are protected by JWT authentication middleware:
- `/dashboard` - Accessible to admin, manager, viewer roles
- `/metrics` - Accessible to admin, manager roles  
- `/incidents` - Accessible to admin, manager roles
- `/feature-flags` - Accessible to admin, manager roles
- `/settings` - Accessible to admin role only

Unauthenticated users are automatically redirected to `/auth/login`.

#### Deployment Steps
1. Connect repository to Vercel
2. Add custom domain `ops.caregrid.co.uk`
3. Configure environment variables
4. Deploy

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.
