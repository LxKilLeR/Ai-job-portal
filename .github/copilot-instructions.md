# HireAI Workspace Instructions

## Build and Run
- Install dependencies:
  - npm install --prefix backend
  - npm install --prefix frontend
  - npm install
- Start both apps from repo root: npm start
- Backend only: cd backend && npm start
- Frontend only: cd frontend && npm run dev
- Frontend quality checks:
  - cd frontend && npm run lint
  - cd frontend && npm run build
- Backend tests are not implemented yet. Do not rely on backend npm test for validation.

## Testing and Validation
- Frontend has lint/build checks via npm run lint and npm run build.
- Backend npm test is a placeholder and intentionally fails.
- Prefer manual end-to-end checks for recruiter and seeker flows after changes.

## Database Setup
- Seed demo data before first manual test run:
  - cd backend && node seed.js
- Demo account created by seed script:
  - test@example.com / password123
- Optional cleanup script for jobs only:
  - cd backend && node clean.js

## Architecture
- Monorepo with two apps:
  - backend: Express + Mongoose API
  - frontend: React + Vite UI
- Backend entrypoint: backend/server.js
- Frontend entrypoint and routing: frontend/src/App.jsx, frontend/src/main.jsx
- Keep API and UI responsibilities separated:
  - backend/routes for HTTP behavior
  - backend/models for schema/data rules
  - frontend/pages for route-level screens
  - frontend/components for reusable UI
  - frontend/services for API calls

## API and Auth Conventions
- Keep backend API responses in the standard envelope:
  - success: boolean
  - data/message/error as needed
  - pagination when list endpoints are paginated
- Protected endpoints must use JWT via Authorization header in Bearer format.
- Keep role handling consistent:
  - database roles are Seeker and Employer
  - signup input may use Recruiter, but backend maps it to Employer
- Recruiter-only APIs under /api/recruiter should enforce role checks in addition to authentication.

## Frontend Conventions
- Use functional React components and hooks.
- Use AuthContext for auth state and keep localStorage usage consistent with current app behavior.
- Prefer import.meta.env.VITE_API_URL for backend base URL; avoid introducing new hardcoded localhost URLs.
- Keep changes scoped and preserve existing page/layout patterns for seeker vs recruiter views.

## Environment and Pitfalls
- Backend defaults to port 5001; frontend runs on 3000 in dev.
- Required backend env vars include MONGO_URI, JWT_SECRET, GOOGLE_CLIENT_ID, and GEMINI_API_KEY.
- CORS origin is controlled by FRONTEND_URL in backend env.
- If Mongo connection fails, server exits; verify env values before debugging route logic.
- Keep GOOGLE_CLIENT_ID aligned across backend and frontend env files for OAuth flows.

## Current Limitations
- Applicant matchScore is currently mock/random, not real AI scoring.
- Applicant fit analysis text is placeholder and not model-derived.
- Notifications endpoint exists but is placeholder-only.
- Resume handling in applications is URL-based, not file-upload storage.

## Troubleshooting Checklist
- Frontend cannot reach API: verify VITE_API_URL points to backend port 5001.
- OAuth login fails: verify GOOGLE_CLIENT_ID in backend and VITE_GOOGLE_CLIENT_ID in frontend.
- Chat/recommendations fail: confirm GEMINI_API_KEY is set and inspect backend logs.
- Recruiter endpoint access denied: verify JWT is present and user role is Employer.

## Documentation Links
- Detailed architecture, endpoints, models, and known issues: CLAUDE.md
- Project setup overview: README.md
- Backend env template: backend/.env.example
- Frontend env template: frontend/.env.example
- Ignore frontend/README.md for project conventions (it is the default Vite template).
