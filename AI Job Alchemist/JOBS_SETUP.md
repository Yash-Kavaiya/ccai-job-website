# Dynamic Job Listings Setup

This document explains how the dynamic job listing system works and how to populate it with jobs.

## Overview

The candidate job search page (`/jobs`) now fetches jobs dynamically from Firebase Firestore instead of using hardcoded data. When recruiters publish jobs, they automatically appear in the candidate job search.

## Architecture

### Frontend
- **Service**: `src/services/jobService.ts` - Handles all Firebase Firestore operations for jobs
- **Store**: `src/store/job-matching-store.ts` - State management for jobs, updated to use Firebase
- **Page**: `src/pages/JobSearchPage.tsx` - Displays jobs fetched from Firebase

### Backend
- **Repository**: `backend/app/repositories/firestore/job_repository.py` - Firestore CRUD operations
- **API**: `backend/app/api/v1/jobs.py` - REST API endpoints for job management
- **Model**: `backend/app/models/job.py` - Job data models

## How It Works

1. **Recruiters Post Jobs**: When recruiters create job listings through the recruiter dashboard, jobs are stored in Firestore collection `jobs`

2. **Automatic Sync**: The candidate job search page automatically fetches all active jobs from Firestore on page load

3. **Real-time Updates**: Jobs are fetched fresh each time the page loads or when users search/filter

4. **No Hardcoding**: All job data comes from the database - no mock or hardcoded data

## Seeding Sample Jobs

To populate the database with sample jobs for testing:

### Method 1: Using Python Script (Recommended)

```bash
cd "AI Job Alchemist/backend"
python seed_jobs.py
```

This will add 10 sample jobs from companies like Google, Microsoft, OpenAI, Amazon, etc.

### Method 2: Using Backend API

Start the backend server and use the POST endpoint:

```bash
cd "AI Job Alchemist/backend"
uvicorn main:app --reload
```

Then POST to `http://localhost:8000/api/v1/jobs/` with job data.

### Method 3: Through Recruiter Dashboard

1. Log in as a recruiter
2. Navigate to "Post Job" page
3. Fill in job details and submit
4. Job will automatically appear in candidate search

## Job Data Structure

Jobs in Firestore have the following structure:

```typescript
{
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  job_type: string; // 'full_time', 'part_time', 'contract', 'remote'
  skills_required: string[];
  experience_level: string;
  source: string;
  source_url: string;
  company_logo_url: string;
  posted_at: Timestamp;
  expires_at?: Timestamp;
  is_active: boolean;
}
```

## Features

### For Candidates
- ✅ View all active jobs posted by recruiters
- ✅ Search jobs by keywords
- ✅ Filter by location, job type, experience level
- ✅ See real-time job postings
- ✅ Apply to jobs directly

### For Recruiters
- ✅ Post jobs that automatically appear in candidate search
- ✅ Manage job listings
- ✅ Track applications
- ✅ Update or deactivate jobs

## API Endpoints

### Get All Jobs
```
GET /api/v1/jobs?limit=20&offset=0
```

### Get Job by ID
```
GET /api/v1/jobs/{job_id}
```

### Create Job (Recruiter Only)
```
POST /api/v1/jobs
```

### Search Jobs
```
GET /api/v1/jobs?location=Remote&job_type=full_time
```

## Firestore Collection

**Collection Name**: `jobs`

**Indexes Required**:
- `is_active` + `posted_at` (descending)
- `company` + `is_active`
- `location` + `is_active` + `posted_at`

These indexes are defined in `firestore.indexes.json`.

## Testing

1. **Seed Sample Data**:
   ```bash
   python backend/seed_jobs.py
   ```

2. **Start Frontend**:
   ```bash
   cd "AI Job Alchemist"
   npm run dev
   ```

3. **Navigate to Jobs Page**:
   - Go to `http://localhost:5173/jobs`
   - Jobs should load automatically
   - Try searching and filtering

## Troubleshooting

### No Jobs Appearing

1. Check if jobs exist in Firestore:
   - Open Firebase Console
   - Navigate to Firestore Database
   - Check `jobs` collection

2. Check browser console for errors

3. Verify Firebase configuration in `.env`:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_PROJECT_ID=...
   ```

### Jobs Not Updating

- Clear browser cache
- Check if `is_active` is set to `true`
- Verify `posted_at` timestamp is recent

### Search Not Working

- Ensure job descriptions contain searchable text
- Check that skills_required array is populated
- Verify search query is not empty

## Future Enhancements

- [ ] Real-time updates using Firestore listeners
- [ ] Advanced full-text search with Algolia
- [ ] Job recommendations based on user profile
- [ ] Saved searches and job alerts
- [ ] Application tracking for candidates
