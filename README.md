# Order management app

A simple app for managing orders

# Docker Setup

This Docker configuration sets up a complete development environment with:
- **Backend**: NestJS API server
- **Frontend**: Angular application with Nginx
- **Database**: PostgreSQL server

## Prerequisites
- npm package manager installed
- Docker Desktop installed on your machine

## Quick Start

1. **Build and start all services:**
```bash
(cd frontend && npm install) && (cd backend && npm install) && docker-compose up --build
```

2. **Access the applications:**
- Frontend (Angular): http://localhost:4200
- Backend API (NestJS): http://localhost:3000
- PostgreSQL: localhost:5432

## Running app in dev mode with hot reloading
```bash
(cd frontend && npm install) && (cd backend && npm install) && docker-compose -f docker-compose.dev.yml up --build
   ```

# Further improvements to be considered

## Business side
- User authentication 
- Order list pagination
- Order editing and deleting
- Countries to be saved as codes, not as strings
- Proper list of currencies
- Proper address fields

## Tech side
- Kubernetes configuration
- Test coverage for frontend
- Order ID generation and collision handling can be done on Postgres side
