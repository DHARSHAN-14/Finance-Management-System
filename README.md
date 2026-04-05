# SK Associates Finance Management System

A full-stack monorepo for managing chit funds, loans, and client portfolios.

## Tech Stack
- **Backend**: Node.js + Express + TypeScript + Prisma + PostgreSQL
- **Mobile**: React Native + Expo + TypeScript
- **Auth**: JWT + Refresh Tokens
- **State**: Zustand
- **Validation**: Zod + React Hook Form

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ (or Docker)
- Expo CLI (`npm install -g expo-cli`)

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment
```bash
cp .env.example .env
# Edit .env with your values
cp apps/server/.env.example apps/server/.env
```

### 3. Start database (Docker)
```bash
docker-compose up postgres -d
```

### 4. Run migrations & seed
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 5. Start backend
```bash
npm run dev:server
```

### 6. Start mobile
```bash
npm run dev:mobile
```

## Sample Credentials
| Role  | Email                  | Password    |
|-------|------------------------|-------------|
| Admin | admin@skassociates.com | Admin@1234  |
| Staff | staff@skassociates.com | Staff@1234  |
| Client| client@skassociates.com| Client@1234 |

## API Documentation
Swagger UI: http://localhost:4000/api-docs

## Project Structure
```
sk-associates/
├── apps/
│   ├── server/          # Express backend
│   └── mobile/          # Expo React Native app
├── packages/
│   └── shared/          # Shared types & utilities
├── docker-compose.yml
└── package.json
```
