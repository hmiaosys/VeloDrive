# VeloDrive

A multi-tenant rental business management SaaS — built for bus rentals, scalable for any rental operation.

## Stack

- **Backend:** ASP.NET Core 10 (Web API), Entity Framework Core, PostgreSQL, JWT + RBAC
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, TanStack Query, Zustand, Recharts
- **Testing:** Playwright (28 E2E tests)

## Features

- Multi-tenant architecture with tenant isolation
- Items & Categories management (dynamic custom fields per category)
- Customer CRM with booking history and revenue tracking
- Booking management with availability conflict detection
- Quote generation → Send → Accept workflow
- Invoice generation (deposit/full) with payment recording
- Operational dashboard (today's schedule, fleet status, needs attention)
- RBAC with 22 granular permissions across 4 roles (Owner/Admin/Manager/Staff)
- Internationalization (English + Simplified Chinese)
- Command palette (⌘K) with keyboard navigation
- Animated page transitions

## Getting Started

### Prerequisites
- .NET 10 SDK
- Node.js 24+
- PostgreSQL 16

### Backend
```bash
cd backend
dotnet run --project src/VeloDrive.Api
# API at http://localhost:5000
# Swagger at http://localhost:5000/swagger
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App at http://localhost:3000
```

### Test Accounts (password: Admin123!)
- `owner@metrobus.com` — Full access
- `manager@metrobus.com` — Admin (no settings/users)
- `driver1@metrobus.com` — Staff (read-only)
