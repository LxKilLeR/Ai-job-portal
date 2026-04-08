# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AI Job Portal (HireAI)** - A full-stack AI-powered job portal with:
- **Frontend**: React + Vite, Tailwind CSS, Framer Motion
- **Backend**: Node.js + Express, MongoDB Atlas, JWT Authentication
- **AI Integration**: Google Gemini API (via backend proxy)
- **Features**: Job listings, resume builder, AI recommendations, recruiter dashboard, chat assistant

## Architecture

### Backend (`/backend`)
```
backend/
├── server.js              # Express app, routes registration, MongoDB connection
├── routes/
│   ├── auth.js           # Email/password + Google OAuth
│   ├── jobs.js           # Public job listings (read-only for all)
│   ├── resume.js         # Resume CRUD operations
│   ├── recommendations.js # AI job recommendations
│   ├── chat.js           # Gemini AI chat endpoint (authenticated)
│   └── recruiter.js      # Recruiter dashboard APIs (jobs, applications, analytics)
├── models/
│   ├── User.js           # User model (Seeker, Employer/Recruiter)
│   ├── Job.js            # Job postings with applicant tracking
│   ├── Application.js    # Job applications with match scores
│   └── Resume.js         # User resumes
├── middleware/
│   └── auth.js           # JWT authentication middleware
└── .env                  # Configuration (PORT, JWT_SECRET, MONGO_URI, GEMINI_API_KEY)
```

### Frontend (`/frontend`)
```
frontend/
├── src/
│   ├── App.jsx           # Main routing (Seeker vs Recruiter layouts)
│   ├── context/
│   │   └── AuthContext.jsx  # Authentication state management
│   ├── components/
│   │   ├── Layout.jsx       # Main layout for job seekers
│   │   ├── ChatWidget.jsx   # AI assistant chat widget
│   │   └── recruiter/
│   │       ├── RecruiterLayout.jsx  # Recruiter sidebar layout
│   │       └── RecruiterSidebar.jsx # Navigation sidebar
│   ├── pages/
│   │   ├── Home.jsx         # Landing page
│   │   ├── Login.jsx        # Login with email/Google
│   │   ├── Signup.jsx       # Signup with role selection (Seeker/Recruiter)
│   │   ├── Dashboard.jsx    # Seeker dashboard
│   │   ├── JobListings.jsx  # Browse/search jobs
│   │   ├── JobDetail.jsx    # Single job view
│   │   ├── ResumeBuilder.jsx # AI resume builder
│   │   ├── AIRecommendations.jsx # AI job matching
│   │   └── recruiter/
│   │       ├── RecruiterDashboard.jsx # Overview stats
│   │       ├── PostJob.jsx            # Create new job
│   │       ├── ManageJobs.jsx         # Edit/delete/toggle jobs
│   │       ├── Applicants.jsx         # Manage applicants
│   │       └── Analytics.jsx          # Charts & metrics
│   └── services/
│       ├── mcpService.js   # Gemini AI chat service
│       └── recruiterService.js # Recruiter APIs
└── .env                    # Vite environment variables
```

**Key Design Decision**: All AI calls (Gemini) go through backend proxy to protect API keys. Frontend never exposes sensitive keys.

## User Roles

1. **Seeker (Job Seeker)**: Can browse jobs, apply, build resume, get AI recommendations, chat with AI assistant
2. **Employer (Recruiter)**: Can post/manage jobs, view applicants, see analytics, access recruiter dashboard at `/recruiter`

## Database Models

- **User**: name, email, password (hashed), role ('Seeker'|'Employer'), avatar, googleId
- **Job**: title, company, location, type, salary, skills, description, requirements, postedBy (ref User), isActive, applicationsCount, views, experienceLevel, industry, benefits, deadline
- **Application**: job (ref Job), applicant (ref User), resume (URL), matchScore, status ('pending'|'shortlisted'|'accepted'|'rejected'), notes

## Common Commands

### Backend
```bash
cd backend
npm install           # Install dependencies
npm start            # Start server on port 5001
npm run dev          # Development with nodemon (if configured)
```

**.env required variables**:
```
PORT=5001
JWT_SECRET=<strong-secret-here>
MONGO_URI=<mongodb-atlas-uri>
GEMINI_API_KEY=<google-gemini-key>
GEMINI_MODEL=gemini-1.5-flash (optional)
```

### Frontend
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start Vite dev server on port 3000
npm run build        # Build for production
```

**.env required variables**:
```
VITE_GOOGLE_CLIENT_ID=<oauth-client-id>
VITE_API_URL=http://localhost:5001
```

## API Endpoints

### Public/Protected
- `POST /api/auth/signup` - Create account (role: Seeker|Employer)
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/google` - Google OAuth
- `GET  /api/jobs` - List all active jobs
- `GET  /api/jobs/:id` - Get job details

### Seeker Protected (requires JWT)
- `GET  /api/resume` - Get/update user resume
- `GET  /api/recommendations` - AI job recommendations
- `POST /api/chat` - Chat with Gemini AI (requires login)

### Recruiter Protected (requires JWT + role='Employer')
**Note**: All recruiter routes require the user to have role='Employer'. Frontend should hide recruiter routes for seekers.

- `GET    /api/recruiter/overview` - Dashboard stats (jobs, applicants, views)
- `GET    /api/recruiter/jobs` - List recruiter's jobs (query: ?status=active|inactive)
- `POST   /api/recruiter/jobs` - Create new job
- `GET    /api/recruiter/jobs/:id` - Get single job
- `PUT    /api/recruiter/jobs/:id` - Update job
- `DELETE /api/recruiter/jobs/:id` - Delete job (and applications)
- `PATCH  /api/recruiter/jobs/:id/toggle` - Toggle isActive status
- `GET    /api/recruiter/applications` - List applications (query: ?status, jobId, minScore, search)
- `GET    /api/recruiter/applications/:id` - Get application + candidate details
- `PUT    /api/recruiter/applications/:id/status` - Update status
- `GET    /api/recruiter/analytics` - Analytics data (query: ?period=30d|7d)
- `GET    /api/recruiter/notifications` - Notifications (placeholder)

## Testing the Recruiter Flow

1. **Create recruiter account**: Signup → select "Recruiter" role
2. **Login** → redirected to `/dashboard` (Seeker dashboard)
3. **Access recruiter area**: Go to `/recruiter` (automatically shows recruiter sidebar)
4. **Post a job**: Click "Post Job" → fill form → submit
5. **Manage jobs**: View/edit/delete/toggle active status
6. **View applicants**: When seekers apply (through job application flow), they appear here
7. **Analytics**: View charts and stats

## Current Implementation Status

✅ Backend APIs for recruiter (jobs, applications, analytics, overview)
✅ Frontend pages (Dashboard, PostJob, ManageJobs, Applicants, Analytics)
✅ Authentication middleware on all recruiter routes
✅ Gemini AI integration with backend proxy (protected)
✅ Role-based access (recruiter routes require role='Employer')
⚠️  **AI features for match scoring** - Basic implementation (random scores for now)
⚠️  **Search/filter on applicants** - Basic implementation (filters by job, status)
⚠️  **Notifications system** - Placeholder only

## Known Issues & Future Work

1. **Match Score Calculation**: Currently random/mock. Should be calculated based on resume-job skill match.
2. **AI Analysis for Applicants**: The "Why this candidate?" section shows placeholder text. Should integrate Gemini to analyze fit.
3. **Skill Gap Detection**: Not implemented. Should compare job requirements vs candidate skills.
4. **Notifications**: Model and real-time needed.
5. **Resume Upload/Download**: Application resume is a URL string. Need file upload (S3 or local).
6. **Email Notifications**: When new application arrives.
7. **Pagination**: Implemented in backend but frontend may need enhancement.

## Database Seeding

To populate with demo data:
```bash
cd backend
node seed.js  # Creates 5 sample jobs + test user (test@example.com / password123)
```

To clean demo jobs (keep real users):
```bash
cd backend
node clean.js  # Deletes all jobs only
```

## Debugging Tips

- Check backend logs for errors (MongoDB connection, API errors)
- Frontend axios calls use `VITE_API_URL` - ensure backend is running on that port
- JWT token stored in localStorage as `token` - check browser dev tools
- All recruiter APIs verify JWT + ownership (job belongs to logged-in recruiter)
- Gemini API errors will be logged in backend but frontend shows generic error

## Code Style

- Use functional components + hooks (React 18+)
- Tailwind CSS for styling (utility-first)
- Framer Motion for animations
- Consistent naming: PascalCase components, camelCase functions/vars
- API responses: `{ success: boolean, data?: any, message?: string, error?: string }`
- Error handling: try/catch with meaningful messages, 500 for server errors
