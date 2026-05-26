# XARC Nexus Hub

Centralized cloud platform architecture for the XARC XR Dashboard Platform.

## Setup

1. Install dependencies:
   ```bash
   cd /Volumes/Xarc/Projects/Xarc_Nexus_Hub
   npm install
   ```

2. Copy environment examples:
   ```bash
   cp .env.example frontend/.env.example backend/.env.example
   ```

3. Start development servers:
   ```bash
   npm run dev
   ```

## Projects

- `frontend` — Next.js application with Tailwind CSS
- `backend` — NestJS API server

## Development commands

- `npm run dev:frontend`
- `npm run dev:backend`
- `npm run build:frontend`
- `npm run build:backend`
