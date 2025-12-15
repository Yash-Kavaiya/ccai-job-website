# AI Job Alchemist - Backend API

Scalable FastAPI backend using SOLID principles with Firebase Firestore, Firebase Storage, and Qdrant vector database.

## Architecture

```
backend/
├── main.py                 # FastAPI app entry point
├── requirements.txt
├── .env
├── app/
│   ├── config/            # Settings & configuration
│   ├── core/              # Security, exceptions, dependencies
│   ├── models/            # Domain models (User, Job, Resume, Interview)
│   ├── schemas/           # Pydantic schemas for API validation
│   ├── repositories/      # Data access layer
│   │   ├── base.py        # Abstract repository interfaces
│   │   ├── firestore/     # Firestore implementations
│   │   └── qdrant/        # Vector database implementations
│   ├── services/          # Business logic layer
│   └── api/v1/            # API endpoints
```

## SOLID Principles Applied

- **S**ingle Responsibility: Each service/repository handles one domain
- **O**pen/Closed: Abstract base classes for repositories
- **L**iskov Substitution: Repository interfaces can be swapped
- **I**nterface Segregation: Small, focused interfaces
- **D**ependency Inversion: Services depend on abstractions

## Tech Stack

- **FastAPI** - Modern async Python web framework
- **Firebase Firestore** - NoSQL database for users, jobs, resumes
- **Firebase Storage** - Blob storage for resume files
- **Qdrant** - Vector database for semantic job matching
- **Sentence Transformers** - Embeddings for similarity search

## Setup

### 1. Install Dependencies

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 2. Configure Firebase

Copy your Firebase service account JSON to `firebase-service-account.json`

### 3. Start Qdrant (Docker)

```bash
docker run -p 6333:6333 qdrant/qdrant
```

### 4. Run the Server

```bash
uvicorn main:app --reload
```

## API Endpoints

### Users
- `POST /api/v1/users/` - Create user
- `GET /api/v1/users/me` - Get current user
- `PATCH /api/v1/users/me` - Update profile

### Jobs
- `GET /api/v1/jobs/` - List jobs
- `GET /api/v1/jobs/{id}` - Get job
- `POST /api/v1/jobs/{id}/save` - Save job
- `POST /api/v1/jobs/{id}/apply` - Apply to job

### Resumes
- `POST /api/v1/resumes/upload` - Upload resume
- `GET /api/v1/resumes/` - List resumes
- `POST /api/v1/resumes/{id}/analyze` - ATS analysis

### Job Matching (Qdrant)
- `GET /api/v1/matching/jobs` - Get matching jobs for resume
- `GET /api/v1/matching/search` - Semantic job search
- `GET /api/v1/matching/score/{job_id}` - Get match score

### Mock Interviews
- `POST /api/v1/interviews/` - Create interview
- `POST /api/v1/interviews/{id}/start` - Start interview
- `POST /api/v1/interviews/{id}/respond` - Submit response
- `POST /api/v1/interviews/{id}/complete` - Complete & get results

## API Documentation

- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc
