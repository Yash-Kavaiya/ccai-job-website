# CCAI Jobs API - Backend

Production-level FastAPI backend for the CCAI Jobs platform with SQLite database and Google Gemini AI integration.

## Features

- **FastAPI Framework**: Modern, fast, production-ready API
- **SQLite Database**: Lightweight, serverless database with SQLAlchemy ORM
- **Google Gemini AI**: Advanced AI for resume analysis, job matching, and chatbot
- **JWT Authentication**: Secure token-based authentication with OTP verification
- **Email Service**: SendGrid/SMTP integration for notifications
- **File Upload**: Resume and avatar upload with validation
- **Social Networking**: User profiles, connections, messaging
- **Interview Management**: Scheduling, questions, AI feedback
- **Comprehensive API**: 60+ endpoints for all platform features

## Tech Stack

- **Python 3.11+**
- **FastAPI 0.104+**
- **SQLAlchemy 2.0+**
- **Alembic** (Database migrations)
- **Google Gemini AI**
- **JWT** (Authentication)
- **SendGrid/SMTP** (Email)
- **Docker** (Containerization)

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── database.py          # Database connection
│   ├── core/                # Core utilities
│   │   ├── config.py        # Configuration
│   │   └── security.py      # Auth & security
│   ├── models/              # SQLAlchemy models
│   │   ├── user.py
│   │   ├── job.py
│   │   ├── resume.py
│   │   ├── application.py
│   │   ├── interview.py
│   │   ├── social.py
│   │   └── ai_agent.py
│   ├── schemas/             # Pydantic schemas
│   ├── api/                 # API routes
│   │   └── v1/
│   ├── services/            # Business logic
│   ├── middleware/          # Custom middleware
│   └── utils/               # Helper functions
├── alembic/                 # Database migrations
├── tests/                   # Test suite
├── uploads/                 # File storage
├── logs/                    # Application logs
├── requirements.txt         # Dependencies
├── .env.example             # Environment template
├── Dockerfile               # Docker configuration
└── docker-compose.yml       # Docker Compose
```

## Getting Started

### Prerequisites

- Python 3.11 or higher
- pip (Python package manager)
- Virtual environment (recommended)

### Installation

1. **Clone the repository**

```bash
cd backend
```

2. **Create and activate virtual environment**

```bash
# Create virtual environment
python -m venv venv

# Activate on Linux/Mac
source venv/bin/activate

# Activate on Windows
venv\Scripts\activate
```

3. **Install dependencies**

```bash
pip install -r requirements.txt
```

4. **Set up environment variables**

```bash
# Copy example environment file
cp .env.example .env

# Edit .env and add your configuration
nano .env  # or use your preferred editor
```

Required environment variables:
- `SECRET_KEY`: Application secret key (min 32 characters)
- `JWT_SECRET_KEY`: JWT signing key
- `GOOGLE_API_KEY`: Google Gemini API key
- `SENDGRID_API_KEY`: SendGrid API key (or SMTP credentials)

5. **Initialize the database**

```bash
# Run migrations
alembic upgrade head
```

6. **Run the development server**

```bash
# Start server
uvicorn app.main:app --reload

# Or use Python directly
python -m app.main
```

The API will be available at:
- API: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Database Migrations

### Create a new migration

```bash
alembic revision --autogenerate -m "Description of changes"
```

### Apply migrations

```bash
alembic upgrade head
```

### Rollback migration

```bash
alembic downgrade -1
```

## Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Using Docker directly

```bash
# Build image
docker build -t ccai-jobs-backend .

# Run container
docker run -d \
  -p 8000:8000 \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/database:/app/database \
  --env-file .env \
  ccai-jobs-backend
```

## API Documentation

Once the server is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## Testing

### Run all tests

```bash
pytest
```

### Run with coverage

```bash
pytest --cov=app --cov-report=html
```

### Run specific test file

```bash
pytest tests/test_auth.py
```

## Development

### Code formatting

```bash
# Format code with Black
black app/

# Sort imports
isort app/
```

### Linting

```bash
# Run flake8
flake8 app/

# Run mypy for type checking
mypy app/
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `APP_NAME` | Application name | CCAI Jobs API | No |
| `DEBUG` | Debug mode | True | No |
| `SECRET_KEY` | App secret key | - | Yes |
| `JWT_SECRET_KEY` | JWT signing key | - | Yes |
| `DATABASE_URL` | Database connection | sqlite:///./database/ccai_jobs.db | No |
| `GOOGLE_API_KEY` | Google Gemini API key | - | Yes |
| `SENDGRID_API_KEY` | SendGrid API key | - | Yes* |
| `CORS_ORIGINS` | Allowed origins | http://localhost:5173 | No |
| `MAX_UPLOAD_SIZE` | Max file size (bytes) | 5242880 | No |

*Either SendGrid or SMTP credentials required

## API Endpoints

### Authentication
- `POST /api/v1/auth/send-otp` - Send OTP to email
- `POST /api/v1/auth/verify-otp` - Verify OTP and get JWT
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user

### Users
- `GET /api/v1/users/me` - Get profile
- `PUT /api/v1/users/me` - Update profile
- `POST /api/v1/users/avatar` - Upload avatar

### Resumes
- `POST /api/v1/resumes/upload` - Upload resume
- `GET /api/v1/resumes` - List resumes
- `GET /api/v1/resumes/{id}` - Get resume details
- `POST /api/v1/resumes/{id}/analyze` - Analyze resume

### Jobs
- `GET /api/v1/jobs` - Search jobs
- `GET /api/v1/jobs/{id}` - Get job details
- `GET /api/v1/jobs/recommended` - Get recommendations

### Applications
- `POST /api/v1/applications` - Apply to job
- `GET /api/v1/applications` - List applications

### Interviews
- `POST /api/v1/interviews` - Schedule interview
- `GET /api/v1/interviews` - List interviews

### Social
- `GET /api/v1/social/profiles` - Search profiles
- `POST /api/v1/social/connections` - Send connection request
- `GET /api/v1/social/messages` - List messages

### AI Agents
- `POST /api/v1/ai/chat` - Chat with AI
- `POST /api/v1/ai/generate-project` - Generate project ideas

## Security

- **CORS**: Configured for frontend origin
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: Bcrypt for password storage
- **Input Validation**: Pydantic schemas
- **Rate Limiting**: slowapi integration
- **File Upload Validation**: Type and size checks
- **SQL Injection Prevention**: SQLAlchemy ORM

## Troubleshooting

### Database locked error

```bash
# Stop all running processes
pkill -f uvicorn

# Delete database and reinitialize
rm database/ccai_jobs.db
alembic upgrade head
```

### Import errors

```bash
# Ensure you're in the backend directory
cd backend

# Reinstall dependencies
pip install -r requirements.txt
```

### Port already in use

```bash
# Change port in .env or use different port
uvicorn app.main:app --port 8001
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ using FastAPI and Google Gemini AI**
