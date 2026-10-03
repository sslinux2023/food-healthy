# 🥗 Food Healthy — Fullstack App

A fullstack application for tracking healthy food habits.

## Stack

- **Backend:** NestJS + Prisma + PostgreSQL + JWT auth
- **Frontend:** React + Vite + TypeScript + i18n (EN/AR)

## Structure

    food-healthy/
    ├── backend/    # NestJS API
    └── frontend/   # React SPA

## Getting Started

### Backend

    cd backend
    npm install
    cp .env.example .env   # then fill in your DB URL + JWT secret
    npx prisma migrate dev
    npm run start:dev

### Frontend

    cd frontend
    npm install
    cp .env.example .env
    npm run dev

## License

MIT
