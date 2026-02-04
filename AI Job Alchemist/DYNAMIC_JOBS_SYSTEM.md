# Dynamic Jobs System - Complete Guide

## Overview
The AI Job Alchemist platform has a **fully dynamic job system** where jobs posted by recruiters are immediately visible to candidates. No hardcoded data - everything is real-time from Firebase Firestore.

## How It Works

### 1. Recruiter Posts a Job
**Location:** `/recruiter/post-job`

When a recruiter creates a job:
- Form data is collected via `PostJobPage.tsx`
- Data is sent to `recruiter-store.ts` → `createJob()` function
- Job is saved to Firestore `jobs` collection with:
  - `is_active: true` (for published jobs)
  - `posted_at: timestamp`
  - All job details (title, company, description, location, salary, etc.)

**Code Flow:**
```
PostJobPage.tsx 
  → useRecruiterStore.createJob()
  → Firebase Firestore: setDoc(db, 'jobs', jobId)
```

### 2. Candidate Views Jobs
**Location:** `/jobs`

When a candidate visits the job search page:
- `JobSearchPage.tsx` loads
- On mount, it calls `aggregateJobs()` from `job-matching-store.ts`
- This fetches ALL active jobs from Firestore via `jobService.ts`
- Jobs are displayed in real-time

**Code Flow:**
```
JobSearchPage.tsx (useEffect on mount)
  → useJobMatchingStore.aggregateJobs()
  → jobService.getAllJobs()
  → Firebase Firestore: getDocs(query(where('is_active', '==', true)))
  → Jobs displayed in UI
```

### 3. Real-Time Updates

#### Automatic Refresh
- When page loads: Jobs are fetched automatically
- Search functionality: Filters jobs from Firestore
- Filter changes: Re-queries Firestore with new criteria

#### Manual Refresh
- "Auto-Aggregate Jobs" button re-fetches latest jobs
- Search bar queries Firestore for matching jobs

## Key Files

### Frontend
1. **Job Display**
   - `src/pages/JobSearchPage.tsx` - Main job search interface
   - `src/store/job-matching-store.ts` - Job state management
   - `src/services/jobService.ts` - Firebase queries

2. **Job Creation**
   - `src/pages/recruiter/PostJobPage.tsx` - Job posting form
   - `src/store/recruiter-store.ts` - Recruiter job management

### Backend (Optional API)
- `backend/app/api/v1/jobs.py` - REST API endpoints
- `backend/app/services/job_service.py` - Business logic
- `backend/app/repositories/firestore/job_repository.py` - Database operations

## Database Schema

### Firestore Collection: `jobs`
```javascript
{
  id: string,                    // Unique job ID
  title: string,                 // Job title
  company: string,               // Company name
  description: string,           // Full job description
  location: string,              // Job location
  salary_min: number,            // Minimum salary (optional)
  salary_max: number,            // Maximum salary (optional)
  job_type: string,              // 'full_time', 'part_time', 'contract', 'internship'
  skills_required: string[],     // Array of required skills
  experience_level: string,      // Experience level required
  source: string,                // 'manual' for recruiter-posted jobs
  source_url: string,            // Link to job details
  company_logo_url: string,      // Company logo
  posted_at: Timestamp,          // When job was posted
  expires_at: Timestamp,         // When job expires (optional)
  is_active: boolean,            // Whether job is visible to candidates
  recruiterId: string,           // ID of recruiter who posted
  views: number,                 // Number of views
  applicationsCount: number,     // Number of applications
  createdAt: string,             // ISO timestamp
  updatedAt: string,             // ISO timestamp
  remotePolicy: string,          // 'remote', 'hybrid', 'onsite'
  status: string                 // 'active', 'draft', 'closed'
}
```

## Features

### For Candidates
✅ **Real-time job listings** - See jobs as soon as recruiters post them
✅ **Search & Filter** - Find jobs by keywords, location, salary, etc.
✅ **AI Matching** - Get personalized job recommendations
✅ **One-Click Apply** - Apply to multiple jobs quickly
✅ **Bookmark Jobs** - Save jobs for later

### For Recruiters
✅ **Post Jobs** - Create job listings with detailed information
✅ **Manage Jobs** - Edit, pause, or close job postings
✅ **View Applications** - See who applied to your jobs
✅ **Analytics** - Track views and application rates

## Testing the System

### 1. Post a Job as Recruiter
```
1. Login as recruiter
2. Navigate to /recruiter/post-job
3. Fill in job details
4. Click "Publish Job"
5. Job is saved to Firestore
```

### 2. View Job as Candidate
```
1. Login as candidate (or browse without login)
2. Navigate to /jobs
3. Jobs automatically load from Firestore
4. Search, filter, and apply to jobs
```

### 3. Verify in Firebase Console
```
1. Open Firebase Console
2. Go to Firestore Database
3. Check 'jobs' collection
4. See all posted jobs with is_active: true
```

## Troubleshooting

### Jobs Not Showing?
1. Check Firebase connection in `src/lib/firebase.ts`
2. Verify Firestore rules allow read access
3. Check browser console for errors
4. Ensure jobs have `is_active: true`

### Jobs Not Saving?
1. Check Firebase authentication
2. Verify Firestore rules allow write access for recruiters
3. Check browser console for errors
4. Ensure all required fields are filled

## Recent Fix

**Issue:** Syntax error in `job-matching-store.ts` at line 588
**Status:** ✅ FIXED
**Details:** Removed orphaned code block that was causing compilation error

## Next Steps

To enhance the dynamic job system:
1. Add real-time listeners for instant updates
2. Implement job expiration automation
3. Add email notifications for new jobs
4. Create job recommendation engine
5. Add advanced search with Algolia or similar

---

**Last Updated:** January 27, 2026
**Status:** ✅ Fully Functional & Dynamic
