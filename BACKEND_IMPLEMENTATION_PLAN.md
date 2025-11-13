# CCAI Jobs Platform - Production-Level FastAPI Backend Plan

## 📋 Overview

This document outlines the complete plan for building a production-ready FastAPI backend to replace the external DevvAI SDK, using SQLite as the database and Google Gemini AI for AI-powered features.

---

## 🏗️ Architecture Overview

```
ccai-job-website/
├── frontend/                    # Existing React app (move current src/ here)
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/                     # New FastAPI backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py             # FastAPI application entry
│   │   ├── config.py           # Configuration management
│   │   ├── database.py         # Database connection & session
│   │   │
│   │   ├── models/             # SQLAlchemy ORM models
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── job.py
│   │   │   ├── resume.py
│   │   │   ├── application.py
│   │   │   ├── interview.py
│   │   │   ├── social.py
│   │   │   └── ai_agent.py
│   │   │
│   │   ├── schemas/            # Pydantic schemas (request/response)
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── user.py
│   │   │   ├── job.py
│   │   │   ├── resume.py
│   │   │   ├── interview.py
│   │   │   ├── social.py
│   │   │   └── ai_agent.py
│   │   │
│   │   ├── api/                # API routes
│   │   │   ├── __init__.py
│   │   │   ├── deps.py         # Dependencies (auth, db session)
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       ├── auth.py
│   │   │       ├── users.py
│   │   │       ├── jobs.py
│   │   │       ├── resumes.py
│   │   │       ├── applications.py
│   │   │       ├── interviews.py
│   │   │       ├── social.py
│   │   │       └── ai_agents.py
│   │   │
│   │   ├── services/           # Business logic
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py
│   │   │   ├── resume_service.py
│   │   │   ├── job_service.py
│   │   │   ├── interview_service.py
│   │   │   ├── social_service.py
│   │   │   ├── ai_service.py   # Google Gemini integration
│   │   │   ├── email_service.py
│   │   │   └── file_service.py
│   │   │
│   │   ├── core/               # Core utilities
│   │   │   ├── __init__.py
│   │   │   ├── security.py     # Password hashing, JWT
│   │   │   ├── config.py       # Settings management
│   │   │   └── logging.py      # Logging configuration
│   │   │
│   │   ├── middleware/         # Custom middleware
│   │   │   ├── __init__.py
│   │   │   ├── cors.py
│   │   │   ├── rate_limit.py
│   │   │   └── error_handler.py
│   │   │
│   │   └── utils/              # Helper functions
│   │       ├── __init__.py
│   │       ├── validators.py
│   │       ├── parsers.py      # PDF/DOCX parsing
│   │       └── helpers.py
│   │
│   ├── alembic/                # Database migrations
│   │   ├── versions/
│   │   ├── env.py
│   │   └── alembic.ini
│   │
│   ├── tests/                  # Test suite
│   │   ├── __init__.py
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   ├── test_jobs.py
│   │   ├── test_resumes.py
│   │   └── test_ai_service.py
│   │
│   ├── uploads/                # File storage (gitignored)
│   │   ├── resumes/
│   │   └── avatars/
│   │
│   ├── logs/                   # Application logs (gitignored)
│   │
│   ├── requirements.txt        # Python dependencies
│   ├── requirements-dev.txt    # Development dependencies
│   ├── .env.example            # Environment variables template
│   ├── .env                    # Actual env vars (gitignored)
│   ├── Dockerfile              # Docker containerization
│   ├── docker-compose.yml      # Multi-container setup
│   └── README.md               # Backend documentation
│
├── database/                   # SQLite database file
│   └── ccai_jobs.db           # (gitignored)
│
├── .github/
│   └── workflows/
│       ├── backend-tests.yml   # CI/CD for backend
│       └── deploy.yml          # Production deployment
│
└── README.md                   # Project documentation

```

---

## 🔧 Technology Stack

### Backend Framework
- **FastAPI 0.104+** - Modern, fast web framework
- **Uvicorn** - ASGI server
- **Python 3.11+** - Latest stable Python

### Database
- **SQLite3** - Lightweight, serverless database
- **SQLAlchemy 2.0+** - ORM for database operations
- **Alembic** - Database migrations

### AI Integration
- **Google Gemini API** - AI models for:
  - Resume analysis (Gemini Pro)
  - Chat/conversational AI (Gemini Pro)
  - Content generation (Gemini Pro)
  - Embedding generation (text-embedding-004)

### Authentication & Security
- **JWT (JSON Web Tokens)** - Stateless authentication
- **Passlib + Bcrypt** - Password hashing
- **Python-JOSE** - JWT encoding/decoding
- **CORS Middleware** - Cross-origin requests
- **Rate Limiting** - slowapi

### File Processing
- **PyPDF2 / pdfplumber** - PDF resume parsing
- **python-docx** - DOCX file handling
- **python-multipart** - File upload handling
- **Pillow** - Image processing

### Email Service
- **SendGrid** or **SMTP (Gmail)** - Email notifications
- **Jinja2** - Email templates

### Testing & Quality
- **pytest** - Testing framework
- **pytest-asyncio** - Async test support
- **httpx** - Test client for FastAPI
- **pytest-cov** - Code coverage
- **black** - Code formatting
- **flake8** - Linting
- **mypy** - Type checking

### Monitoring & Logging
- **python-json-logger** - Structured logging
- **Sentry** (optional) - Error tracking

---

## 📊 Database Schema

### 1. Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255),
    full_name VARCHAR(255),
    phone VARCHAR(20),
    avatar_url TEXT,
    bio TEXT,
    location VARCHAR(255),
    current_position VARCHAR(255),
    company VARCHAR(255),
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    otp_code VARCHAR(6),
    otp_expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Resumes Table
```sql
CREATE TABLE resumes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    original_text TEXT,
    parsed_data JSON,  -- Name, email, phone, skills, experience, education
    ats_score INTEGER,  -- 0-100
    analysis JSON,  -- Detailed analysis from AI
    suggestions JSON,  -- Improvement suggestions
    is_primary BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 3. Jobs Table
```sql
CREATE TABLE jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    company_logo TEXT,
    location VARCHAR(255),
    job_type VARCHAR(50),  -- full-time, part-time, contract, remote
    experience_level VARCHAR(50),  -- entry, mid, senior, lead
    salary_min INTEGER,
    salary_max INTEGER,
    currency VARCHAR(10) DEFAULT 'USD',
    description TEXT,
    requirements TEXT,
    benefits TEXT,
    skills JSON,  -- Array of required skills
    source VARCHAR(100),  -- linkedin, indeed, glassdoor, custom
    external_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    posted_date DATETIME,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Applications Table
```sql
CREATE TABLE applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    resume_id INTEGER,
    cover_letter TEXT,
    status VARCHAR(50) DEFAULT 'applied',  -- applied, reviewing, interview, rejected, accepted
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE SET NULL,
    UNIQUE(user_id, job_id)  -- One application per job per user
);
```

### 5. Interviews Table
```sql
CREATE TABLE interviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    application_id INTEGER,
    interview_type VARCHAR(50),  -- technical, behavioral, hr, mock
    scheduled_at DATETIME,
    duration_minutes INTEGER DEFAULT 60,
    meeting_link TEXT,
    status VARCHAR(50) DEFAULT 'scheduled',  -- scheduled, completed, cancelled, rescheduled
    notes TEXT,
    feedback JSON,  -- AI-generated feedback
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL
);
```

### 6. Interview Questions Table
```sql
CREATE TABLE interview_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    interview_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50),  -- technical, behavioral, situational
    user_answer TEXT,
    ai_feedback TEXT,
    score INTEGER,  -- 0-10
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE
);
```

### 7. User Skills Table
```sql
CREATE TABLE user_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    skill_name VARCHAR(255) NOT NULL,
    proficiency_level VARCHAR(50),  -- beginner, intermediate, advanced, expert
    years_of_experience FLOAT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 8. Social Connections Table
```sql
CREATE TABLE connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',  -- pending, accepted, rejected, blocked
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(requester_id, receiver_id)
);
```

### 9. Messages Table
```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 10. AI Chat History Table
```sql
CREATE TABLE ai_chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id VARCHAR(255),
    role VARCHAR(50) NOT NULL,  -- user, assistant, system
    content TEXT NOT NULL,
    model VARCHAR(100),  -- gemini-pro, gemini-1.5-pro, etc.
    tokens_used INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 11. Saved Jobs Table
```sql
CREATE TABLE saved_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    UNIQUE(user_id, job_id)
);
```

### 12. User Achievements Table
```sql
CREATE TABLE achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    date_achieved DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 🔐 Authentication System

### Flow
1. **Registration/Login via OTP**
   - User enters email
   - Generate 6-digit OTP (expires in 10 minutes)
   - Send OTP via email
   - User verifies OTP
   - Issue JWT access & refresh tokens

2. **JWT Token Structure**
   - **Access Token**: Short-lived (30 minutes), contains user_id, email
   - **Refresh Token**: Long-lived (7 days), stored in database for revocation

3. **Endpoints**
   - `POST /api/v1/auth/send-otp` - Send OTP to email
   - `POST /api/v1/auth/verify-otp` - Verify OTP and return JWT
   - `POST /api/v1/auth/refresh` - Refresh access token
   - `POST /api/v1/auth/logout` - Revoke refresh token
   - `GET /api/v1/auth/me` - Get current user info

---

## 🤖 Google Gemini AI Integration

### Use Cases

1. **Resume Analysis**
   - Parse resume text
   - Extract skills, experience, education
   - Calculate ATS score based on best practices
   - Generate improvement suggestions
   - Identify missing keywords for job matching

2. **Job Matching Algorithm**
   - Compare user skills with job requirements
   - Generate match score (0-100%)
   - Provide reasoning for match score
   - Suggest skills to learn

3. **Interview Preparation**
   - Generate relevant interview questions based on job description
   - Evaluate user answers
   - Provide constructive feedback
   - Simulate mock interviews

4. **AI Chatbot**
   - Career guidance
   - Resume tips
   - Interview advice
   - Job search strategies

5. **Project Generation**
   - Generate project ideas based on user skills
   - Create project descriptions
   - Suggest technologies to use

### API Configuration

```python
import google.generativeai as genai

# Configure Gemini API
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Models
GEMINI_PRO = "gemini-1.5-pro-latest"  # For complex tasks
GEMINI_FLASH = "gemini-1.5-flash"     # For fast responses
TEXT_EMBEDDING = "text-embedding-004"  # For embeddings

# Safety Settings
SAFETY_SETTINGS = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
]
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/send-otp` | Send OTP to email | No |
| POST | `/api/v1/auth/verify-otp` | Verify OTP and get JWT | No |
| POST | `/api/v1/auth/refresh` | Refresh access token | No |
| POST | `/api/v1/auth/logout` | Logout and revoke token | Yes |
| GET | `/api/v1/auth/me` | Get current user | Yes |

### Users
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/users/me` | Get current user profile | Yes |
| PUT | `/api/v1/users/me` | Update profile | Yes |
| POST | `/api/v1/users/avatar` | Upload avatar | Yes |
| GET | `/api/v1/users/{user_id}` | Get public profile | No |

### Resumes
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/resumes/upload` | Upload resume file | Yes |
| GET | `/api/v1/resumes` | List user's resumes | Yes |
| GET | `/api/v1/resumes/{id}` | Get resume details | Yes |
| DELETE | `/api/v1/resumes/{id}` | Delete resume | Yes |
| POST | `/api/v1/resumes/{id}/analyze` | Analyze resume with AI | Yes |
| GET | `/api/v1/resumes/{id}/ats-score` | Get ATS score | Yes |
| GET | `/api/v1/resumes/{id}/suggestions` | Get improvement suggestions | Yes |

### Jobs
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/jobs` | Search jobs (with filters) | No |
| GET | `/api/v1/jobs/{id}` | Get job details | No |
| POST | `/api/v1/jobs` | Create job posting (admin) | Yes |
| PUT | `/api/v1/jobs/{id}` | Update job (admin) | Yes |
| DELETE | `/api/v1/jobs/{id}` | Delete job (admin) | Yes |
| GET | `/api/v1/jobs/recommended` | Get AI-recommended jobs | Yes |
| POST | `/api/v1/jobs/{id}/match` | Calculate job match score | Yes |

### Applications
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/applications` | Apply to job | Yes |
| GET | `/api/v1/applications` | List user's applications | Yes |
| GET | `/api/v1/applications/{id}` | Get application details | Yes |
| PUT | `/api/v1/applications/{id}` | Update application | Yes |
| DELETE | `/api/v1/applications/{id}` | Withdraw application | Yes |

### Saved Jobs
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/saved-jobs` | Save a job | Yes |
| GET | `/api/v1/saved-jobs` | List saved jobs | Yes |
| DELETE | `/api/v1/saved-jobs/{job_id}` | Unsave job | Yes |

### Interviews
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/interviews` | Schedule interview | Yes |
| GET | `/api/v1/interviews` | List user's interviews | Yes |
| GET | `/api/v1/interviews/{id}` | Get interview details | Yes |
| PUT | `/api/v1/interviews/{id}` | Update interview | Yes |
| DELETE | `/api/v1/interviews/{id}` | Cancel interview | Yes |
| POST | `/api/v1/interviews/{id}/questions` | Add question | Yes |
| POST | `/api/v1/interviews/{id}/feedback` | Generate AI feedback | Yes |
| GET | `/api/v1/interviews/mock/questions` | Get mock interview questions | Yes |

### Social
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/social/profiles` | Search user profiles | Yes |
| GET | `/api/v1/social/profiles/{slug}` | Get public profile by slug | No |
| POST | `/api/v1/social/connections` | Send connection request | Yes |
| GET | `/api/v1/social/connections` | List connections | Yes |
| PUT | `/api/v1/social/connections/{id}` | Accept/reject connection | Yes |
| DELETE | `/api/v1/social/connections/{id}` | Remove connection | Yes |
| GET | `/api/v1/social/messages` | List messages | Yes |
| POST | `/api/v1/social/messages` | Send message | Yes |
| PUT | `/api/v1/social/messages/{id}/read` | Mark message as read | Yes |

### AI Agents
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/ai/chat` | Chat with AI assistant | Yes |
| GET | `/api/v1/ai/chat/history` | Get chat history | Yes |
| POST | `/api/v1/ai/generate-project` | Generate project ideas | Yes |
| POST | `/api/v1/ai/resume-builder` | AI-powered resume builder | Yes |

### Skills
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/skills` | Add skill to profile | Yes |
| GET | `/api/v1/skills` | List user's skills | Yes |
| PUT | `/api/v1/skills/{id}` | Update skill | Yes |
| DELETE | `/api/v1/skills/{id}` | Remove skill | Yes |

### Achievements
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/achievements` | Add achievement | Yes |
| GET | `/api/v1/achievements` | List user's achievements | Yes |
| DELETE | `/api/v1/achievements/{id}` | Remove achievement | Yes |

---

## 🛡️ Security Best Practices

1. **Environment Variables**
   - Never commit `.env` file
   - Use strong SECRET_KEY for JWT
   - Rotate API keys regularly

2. **Input Validation**
   - Use Pydantic schemas for all inputs
   - Sanitize user inputs
   - Validate file uploads (size, type, content)

3. **Authentication**
   - Use HTTPS in production
   - Implement rate limiting on auth endpoints
   - Add CAPTCHA for OTP generation (optional)
   - Use secure password hashing (bcrypt)

4. **CORS**
   - Whitelist frontend origin only
   - Don't allow credentials from untrusted origins

5. **SQL Injection Prevention**
   - Use SQLAlchemy ORM (never raw SQL)
   - Parameterize all queries

6. **File Upload Security**
   - Validate file types (magic bytes, not just extension)
   - Limit file sizes (5MB for resumes)
   - Store files outside web root
   - Use UUID filenames

7. **Rate Limiting**
   - Implement rate limits per IP/user
   - Stricter limits on expensive operations (AI calls)

8. **Error Handling**
   - Don't expose internal errors to clients
   - Log detailed errors server-side
   - Return generic error messages

---

## 📧 Email Service Configuration

### SendGrid (Recommended for Production)
```python
import sendgrid
from sendgrid.helpers.mail import Mail, Email, To, Content

sg = sendgrid.SendGridAPIClient(api_key=os.getenv('SENDGRID_API_KEY'))

def send_otp_email(to_email: str, otp: str):
    from_email = Email("noreply@ccaijobs.com")
    to_email = To(to_email)
    subject = "Your CCAI Jobs Login Code"
    content = Content("text/html", f"""
        <h2>Your OTP Code</h2>
        <p>Your one-time password is: <strong>{otp}</strong></p>
        <p>This code expires in 10 minutes.</p>
    """)
    mail = Mail(from_email, to_email, subject, content)
    response = sg.client.mail.send.post(request_body=mail.get())
    return response.status_code == 202
```

### SMTP (Alternative)
```python
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_email_smtp(to_email: str, subject: str, body: str):
    msg = MIMEMultipart('alternative')
    msg['From'] = os.getenv('SMTP_FROM_EMAIL')
    msg['To'] = to_email
    msg['Subject'] = subject

    msg.attach(MIMEText(body, 'html'))

    with smtplib.SMTP_SSL(os.getenv('SMTP_HOST'), int(os.getenv('SMTP_PORT'))) as server:
        server.login(os.getenv('SMTP_USERNAME'), os.getenv('SMTP_PASSWORD'))
        server.send_message(msg)
```

---

## 🧪 Testing Strategy

### Unit Tests
- Test individual functions and methods
- Mock external dependencies (AI, email, database)
- Test edge cases and error handling

### Integration Tests
- Test API endpoints end-to-end
- Use test database
- Test authentication flows
- Test file uploads

### Test Coverage Goals
- Minimum 80% code coverage
- 100% coverage for critical paths (auth, payments)

### Example Test Structure
```python
# tests/test_auth.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_send_otp_success():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/api/v1/auth/send-otp", json={
            "email": "test@example.com"
        })
    assert response.status_code == 200
    assert "message" in response.json()

@pytest.mark.asyncio
async def test_verify_otp_invalid():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/api/v1/auth/verify-otp", json={
            "email": "test@example.com",
            "otp": "000000"
        })
    assert response.status_code == 401
```

---

## 📦 Dependencies (requirements.txt)

```txt
# FastAPI & ASGI Server
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
pydantic-settings==2.1.0

# Database
sqlalchemy==2.0.23
alembic==1.13.0
aiosqlite==0.19.0

# Authentication & Security
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
bcrypt==4.1.1

# Google AI
google-generativeai==0.3.1

# Email
sendgrid==6.11.0
jinja2==3.1.2

# File Processing
pypdf2==3.0.1
pdfplumber==0.10.3
python-docx==1.1.0
pillow==10.1.0

# HTTP Client
httpx==0.25.2
aiofiles==23.2.1

# Rate Limiting
slowapi==0.1.9

# Logging
python-json-logger==2.0.7

# CORS
python-cors==1.0.0

# Validation
email-validator==2.1.0
phonenumbers==8.13.27

# Utilities
python-dotenv==1.0.0
pydantic[email]==2.5.0
```

---

## 🐳 Docker Configuration

### Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY ./app ./app
COPY ./alembic ./alembic
COPY alembic.ini .

# Create upload directories
RUN mkdir -p /app/uploads/resumes /app/uploads/avatars /app/logs

# Run migrations and start server
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend/uploads:/app/uploads
      - ./database:/app/database
      - ./backend/logs:/app/logs
    environment:
      - DATABASE_URL=sqlite:///database/ccai_jobs.db
      - SECRET_KEY=${SECRET_KEY}
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
    env_file:
      - ./backend/.env
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
    environment:
      - VITE_API_URL=http://localhost:8000
    restart: unless-stopped
```

---

## 🚀 Deployment Checklist

### Pre-Production
- [ ] Set `DEBUG=False` in production
- [ ] Use strong `SECRET_KEY` (min 32 characters)
- [ ] Configure CORS with production frontend URL
- [ ] Set up SSL/TLS certificates (Let's Encrypt)
- [ ] Enable HTTPS only
- [ ] Configure rate limiting
- [ ] Set up logging to files
- [ ] Configure error tracking (Sentry)
- [ ] Run security audit (bandit, safety)
- [ ] Perform load testing
- [ ] Set up database backups
- [ ] Configure environment variables
- [ ] Test all API endpoints
- [ ] Verify email delivery
- [ ] Test AI integrations

### Production Environment Variables
```bash
# App
SECRET_KEY=your-super-secret-key-min-32-characters
DEBUG=False
ENVIRONMENT=production
ALLOWED_ORIGINS=https://yourdomain.com

# Database
DATABASE_URL=sqlite:///database/ccai_jobs.db

# Google AI
GOOGLE_API_KEY=your-google-api-key

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# JWT
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# File Upload
MAX_UPLOAD_SIZE=5242880  # 5MB in bytes
UPLOAD_DIR=/app/uploads

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000

# CORS
CORS_ORIGINS=["https://yourdomain.com"]
CORS_ALLOW_CREDENTIALS=true
```

---

## 📈 Performance Optimization

1. **Database Indexing**
   - Index foreign keys
   - Index frequently queried columns (email, status, created_at)

2. **Caching**
   - Cache frequently accessed data (user profiles, job listings)
   - Use Redis for session storage (optional)

3. **Pagination**
   - Implement pagination for all list endpoints
   - Default page size: 20, max: 100

4. **Query Optimization**
   - Use eager loading for related data
   - Avoid N+1 queries
   - Use database connection pooling

5. **File Storage**
   - Consider moving to S3/Cloud Storage for production
   - Serve files through CDN

6. **AI API Optimization**
   - Implement request queuing for AI calls
   - Cache common AI responses
   - Use Gemini Flash for simple tasks

---

## 📚 API Documentation

FastAPI automatically generates interactive API documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

---

## 🔄 Migration from DevvAI SDK to FastAPI

### Frontend Changes Required

1. **Update API Base URL**
```typescript
// Before (DevvAI SDK)
import { auth, upload, table } from '@devvai/devv-code-backend';

// After (FastAPI)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

2. **Update Authentication**
```typescript
// Before
await auth.verifyOTP(email, otp);

// After
const response = await fetch(`${API_URL}/api/v1/auth/verify-otp`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, otp })
});
const { access_token } = await response.json();
localStorage.setItem('access_token', access_token);
```

3. **Update File Uploads**
```typescript
// Before
await upload.file(file);

// After
const formData = new FormData();
formData.append('file', file);
const response = await fetch(`${API_URL}/api/v1/resumes/upload`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

4. **Create API Client Utility**
```typescript
// src/lib/api-client.ts
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async get(endpoint: string) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: this.getHeaders()
    });
    return response.json();
  }

  async post(endpoint: string, data: any) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return response.json();
  }

  // ... other methods
}

export const apiClient = new ApiClient(import.meta.env.VITE_API_URL);
```

---

## 📖 Implementation Order

Follow this order for systematic development:

1. **Phase 1: Foundation** (Days 1-2)
   - Set up project structure
   - Configure FastAPI app
   - Set up SQLite + SQLAlchemy
   - Create database models
   - Set up Alembic migrations

2. **Phase 2: Authentication** (Days 3-4)
   - Implement JWT authentication
   - OTP generation and verification
   - Email service integration
   - Auth endpoints

3. **Phase 3: Core Features** (Days 5-8)
   - User management endpoints
   - File upload service
   - Resume upload and storage
   - Job CRUD operations

4. **Phase 4: AI Integration** (Days 9-12)
   - Google Gemini setup
   - Resume analysis with AI
   - ATS scoring algorithm
   - Job matching algorithm
   - AI chatbot

5. **Phase 5: Advanced Features** (Days 13-16)
   - Interview management
   - Social networking features
   - Messaging system
   - Achievements and skills

6. **Phase 6: Testing & Security** (Days 17-19)
   - Write unit tests
   - Integration tests
   - Security audit
   - Rate limiting
   - Error handling

7. **Phase 7: Documentation & Deployment** (Days 20-21)
   - API documentation
   - README and guides
   - Docker setup
   - Deployment configuration
   - Production testing

---

## 🎯 Success Criteria

- [ ] All API endpoints functional
- [ ] Authentication working with JWT
- [ ] Google Gemini AI integrated for all features
- [ ] Resume upload, parsing, and analysis working
- [ ] Job search and matching algorithm working
- [ ] Social features (profiles, connections) working
- [ ] Interview scheduling and questions working
- [ ] Email notifications working
- [ ] Test coverage > 80%
- [ ] API documentation complete
- [ ] Docker deployment working
- [ ] Production-ready security measures in place
- [ ] Error handling and logging implemented
- [ ] Rate limiting configured
- [ ] Frontend successfully migrated from DevvAI SDK

---

## 📞 Support & Resources

### Google Gemini API
- Docs: https://ai.google.dev/docs
- Models: https://ai.google.dev/models/gemini
- Pricing: https://ai.google.dev/pricing

### FastAPI
- Docs: https://fastapi.tiangolo.com/
- Tutorial: https://fastapi.tiangolo.com/tutorial/

### SQLAlchemy
- Docs: https://docs.sqlalchemy.org/
- ORM Tutorial: https://docs.sqlalchemy.org/en/20/orm/tutorial.html

---

## 🏁 Next Steps

1. Review this plan and confirm requirements
2. Set up development environment
3. Start with Phase 1: Foundation
4. Iterate and test each phase before moving forward

**Estimated Total Development Time: 3-4 weeks for full production-ready backend**

---

*Last Updated: 2025-11-13*
*Version: 1.0.0*
