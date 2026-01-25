# 🚀 AI-Powered Job Application Automation Platform

> **A comprehensive full-stack web application that automates the entire job application process using AI. From analyzing job descriptions to sending personalized application emails - all with intelligent resume matching and cover letter generation.**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Core Capabilities](#core-capabilities)
- [Setup & Installation](#setup--installation)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Features Breakdown](#features-breakdown)

---

## 🎯 Overview

This project is a **complete job application automation system** that leverages artificial intelligence to streamline the job search process. The platform intelligently:

- **Analyzes** job descriptions to extract key information
- **Matches** the best resume using vector embeddings and semantic similarity
- **Generates** personalized cover letters tailored to each job
- **Sends** professional application emails with resume attachments
- **Tracks** all applications with real-time status updates

Built with modern technologies and best practices, this platform demonstrates advanced AI integration, background job processing, and a seamless user experience.

---

## ✨ Key Features

### 🔐 **Authentication & Security**
- ✅ Secure user registration and login with JWT tokens
- ✅ Password hashing with bcrypt
- ✅ Gmail OAuth2 integration for secure email access
- ✅ Encrypted storage of sensitive tokens
- ✅ Protected routes and API endpoints

### 📄 **Resume Management System**
- ✅ Upload and manage multiple PDF resumes
- ✅ AI-powered resume information extraction
- ✅ Vector embeddings for intelligent resume matching
- ✅ Semantic similarity search (cosine similarity)
- ✅ Resume viewing, downloading, and deletion
- ✅ Automatic embedding generation on upload

### 🤖 **AI-Powered Resume Generation**
- ✅ Generate tailored resumes from user profile data
- ✅ LaTeX-based professional resume templates
- ✅ Job description analysis for customization
- ✅ PDF compilation with MiKTeX/pdflatex
- ✅ ATS-friendly resume formatting
- ✅ One-page optimized layouts

### ✍️ **Intelligent Cover Letter Generation**
- ✅ AI-generated personalized cover letters
- ✅ Context-aware content based on resume and job description
- ✅ Integration with user profile for personalization
- ✅ Google Gemini AI (Gemini 2.5 Flash) integration

### 📧 **Email Automation**
- ✅ Send application emails via Gmail API
- ✅ Resume attachment support
- ✅ Custom email subjects and bodies
- ✅ OAuth-based secure email authentication
- ✅ Email sending status tracking

### ⚡ **Job Application Automation (Core Feature)**
- ✅ **End-to-end automation pipeline:**
  1. Job description analysis (extracts title, company, recruiter email)
  2. Intelligent resume selection using vector embeddings
  3. AI-powered cover letter generation
  4. Automated email sending with attachments
- ✅ Background processing with Celery task queue
- ✅ Real-time status tracking (7 status stages)
- ✅ Application history and management
- ✅ Retry mechanism for failed applications
- ✅ Comprehensive error handling

### 👤 **User Profile Management**
- ✅ Complete profile information storage
- ✅ Experience, education, skills tracking
- ✅ Certifications and projects management
- ✅ Social links (LinkedIn, GitHub, Portfolio)
- ✅ AI-powered resume-to-profile extraction

### 📊 **Application Tracking**
- ✅ Track all job applications
- ✅ Status monitoring (pending → completed/failed)
- ✅ Application history with filtering
- ✅ Detailed application records
- ✅ View cover letters and resume used

### 🔧 **Technical Infrastructure**
- ✅ Background job processing (Celery)
- ✅ Vector database for semantic search (pgvector)
- ✅ Server keep-alive mechanism
- ✅ CORS configuration
- ✅ Database migrations (Alembic)
- ✅ RESTful API architecture

---

## 🛠 Technology Stack

### **Frontend**
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI Framework |
| Vite | 7.2.4 | Build Tool & Dev Server |
| Tailwind CSS | 4.1.18 | Styling Framework |
| React Router DOM | 7.11.0 | Client-side Routing |

### **Backend**
| Technology | Version | Purpose |
|------------|---------|---------|
| FastAPI | 0.115.0 | Python Web Framework |
| SQLAlchemy | 2.0.35 | ORM & Database Management |
| SQLite | - | Database (with pgvector support) |
| Celery | 5.4.0 | Background Task Queue |
| Alembic | 1.18.0 | Database Migrations |

### **AI & ML**
| Technology | Purpose |
|------------|---------|
| Google Gemini AI | Cover letter generation, job analysis, resume extraction |
| Sentence Transformers | Text embeddings (all-MiniLM-L6-v2) |
| pgvector | Vector similarity search |
| NumPy | Vector operations |

### **Services & Integrations**
| Service | Purpose |
|---------|---------|
| Gmail API | Email sending with OAuth2 |
| Local File System | Resume storage |
| JWT | Authentication tokens |
| bcrypt | Password hashing |

### **Development Tools**
| Tool | Purpose |
|------|---------|
| PyPDF2 | PDF processing |
| pdfminer | PDF text extraction |
| LaTeX (pdflatex) | Resume PDF generation |
| PyCryptodome | Encryption utilities |

---

## 🏗 Project Architecture

```
┌─────────────────┐
│   React Client  │  (Frontend - Port 5173)
│   (Vite + React) │
└────────┬────────┘
         │ HTTP/REST API
         │
┌────────▼────────┐
│   FastAPI       │  (Backend - Port 8000)
│   REST API      │
└────────┬────────┘
         │
    ┌────┴────┬──────────────┬─────────────┐
    │         │              │             │
┌───▼───┐ ┌──▼────┐    ┌─────▼────┐  ┌────▼────┐
│SQLite │ │Celery│    │  Gemini  │  │  Gmail  │
│Database│ │Worker│    │    AI    │  │   API   │
└───────┘ └───────┘    └──────────┘  └─────────┘
```

### **Data Flow for Job Automation:**
1. User submits job description → FastAPI endpoint
2. Job application record created → SQLite database
3. Celery task queued → Background processing
4. Job description analyzed → Gemini AI
5. Resume matching → Vector similarity search
6. Cover letter generated → Gemini AI
7. Email sent → Gmail API
8. Status updated → Real-time tracking

---

## 🎨 Core Capabilities

### **1. Intelligent Resume Matching**
- Uses **sentence transformers** to create 384-dimensional embeddings
- Compares job descriptions with resume embeddings using **cosine similarity**
- Automatically selects the best matching resume (similarity ≥ 0.9)
- Falls back to available resumes if no high match found

### **2. AI-Powered Content Generation**
- **Job Analysis**: Extracts job title, company name, recruiter email from descriptions
- **Cover Letters**: Generates personalized, context-aware cover letters
- **Resume Extraction**: Parses existing resumes to populate user profiles
- **Resume Generation**: Creates tailored resumes optimized for specific jobs

### **3. Background Processing**
- **Celery** handles long-running tasks asynchronously
- Real-time status updates through database polling
- Error handling and retry mechanisms
- Non-blocking user experience

### **4. Vector Search System**
- **pgvector** extension for PostgreSQL-style vector operations
- Semantic search across resume database
- Efficient similarity calculations
- Scalable to thousands of resumes

---

## 🚀 Setup & Installation

### **Prerequisites**
- Node.js 18+ and npm/yarn
- Python 3.10+
- MiKTeX or LaTeX distribution (for resume generation)
- Google AI Studio API key (for Gemini)
- Gmail account with OAuth access

### **1. Backend Setup**

```bash
cd server

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Configure environment variables
# Create .env file with:
# DATABASE_URL=sqlite:///./job_apply.db
# SECRET_KEY=your_jwt_secret_key
# GEMINI_API_KEY=your_gemini_api_key
# GMAIL_CLIENT_ID=your_gmail_client_id
# GMAIL_CLIENT_SECRET=your_gmail_client_secret
# SERVER_URL=http://localhost:8000
# CLIENT_ORIGIN=http://localhost:5173
```

### **2. Frontend Setup**

```bash
cd client

# Install dependencies
yarn install
# or
npm install
```

### **3. Start Celery Worker** (for background tasks)

```bash
cd server
celery -A app.core.celery_config.celery_app worker --loglevel=info
```

### **4. Run the Application**

**Terminal 1 - Backend:**
```bash
cd server
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd client
yarn dev
# or
npm run dev
```

**Terminal 3 - Celery Worker:**
```bash
cd server
celery -A app.core.celery_config.celery_app worker --loglevel=info
```

### **5. Access the Application**
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

---

## 📚 API Documentation

### **Authentication Endpoints**
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login              - Login user
GET    /api/auth/me                 - Get current user
```

### **Resume Endpoints**
```
GET    /api/resumes                 - Get all user resumes
POST   /api/resumes                 - Upload new resume
GET    /api/resumes/{id}            - Get specific resume
DELETE /api/resumes/{id}            - Delete resume
```

### **Job & Cover Letter Endpoints**
```
POST   /api/jobs/generate-cover-letter  - Generate cover letter with AI
```

### **Email Endpoints**
```
POST   /api/email/send              - Send email with resume attachment
```

### **Gmail OAuth Endpoints**
```
GET    /api/google-auth/authorize    - Initiate Gmail OAuth
GET    /api/google-auth/callback     - OAuth callback handler
```

### **User Info Endpoints**
```
GET    /api/user-info               - Get user profile information
POST   /api/user-info               - Create/update user profile
POST   /api/user-info/extract-from-resume  - Extract info from resume PDF
POST   /api/user-info/generate-resume     - Generate tailored resume
GET    /api/user-info/resume/{id}/view     - View generated resume
GET    /api/user-info/resume/{id}/download - Download resume PDF
```

### **Job Automation Endpoints**
```
POST   /api/job-automation/start           - Start automation process
GET    /api/job-automation/status/{job_id} - Get application status
GET    /api/job-automation/applications     - List all applications
GET    /api/job-automation/application/{id} - Get application details
DELETE /api/job-automation/application/{id} - Delete application
POST   /api/job-automation/retry/{job_id}   - Retry failed application
```

### **Utility Endpoints**
```
GET    /health                      - Health check
GET    /ping                        - Keep-alive ping
GET    /api                         - API information
```

---

## 📁 Project Structure

```
job-apply/
├── client/                          # React Frontend
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── Layout.jsx          # Main layout wrapper
│   │   │   ├── Navbar.jsx          # Navigation bar
│   │   │   └── ProtectedRoute.jsx  # Auth guard component
│   │   ├── context/                 # React Context providers
│   │   │   └── AuthContext.jsx     # Authentication context
│   │   ├── pages/                  # Page components
│   │   │   ├── auth/               # Login/Register pages
│   │   │   ├── Dashboard.jsx      # Main dashboard
│   │   │   ├── resumes/           # Resume management
│   │   │   ├── cover-letter/      # Cover letter generation
│   │   │   ├── email/             # Email sending
│   │   │   ├── profile/           # User profile
│   │   │   ├── my-info/           # Profile information
│   │   │   ├── generate-resume/   # Resume generation
│   │   │   ├── job-automation/    # Automation interface
│   │   │   └── applied-jobs/      # Application tracking
│   │   ├── services/               # API service layer
│   │   │   ├── api.js             # Main API client
│   │   │   └── userInfoApi.js     # User info API
│   │   ├── util/                   # Utility functions
│   │   ├── App.jsx                # Main app component
│   │   ├── main.jsx               # Entry point
│   │   └── index.css              # Global styles
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
├── server/                          # FastAPI Backend
│   ├── app/
│   │   ├── core/                   # Core configuration
│   │   │   ├── config.py          # Settings & environment
│   │   │   ├── database.py        # Database connection
│   │   │   ├── security.py        # JWT & password hashing
│   │   │   ├── encryption.py      # Token encryption
│   │   │   └── celery_config.py   # Celery configuration
│   │   ├── models/                 # SQLAlchemy models
│   │   │   ├── user.py            # User model
│   │   │   ├── resume.py          # Resume model
│   │   │   ├── user_info.py       # User profile model
│   │   │   └── job_application.py # Application tracking model
│   │   ├── routers/                # API route handlers
│   │   │   ├── auth.py            # Authentication routes
│   │   │   ├── resume.py          # Resume routes
│   │   │   ├── job.py             # Job/cover letter routes
│   │   │   ├── email.py           # Email routes
│   │   │   ├── google_auth.py     # Gmail OAuth routes
│   │   │   ├── user_info.py       # Profile routes
│   │   │   └── job_automation.py  # Automation routes
│   │   ├── schemas/                # Pydantic schemas
│   │   │   ├── user.py            # User schemas
│   │   │   ├── resume.py          # Resume schemas
│   │   │   ├── user_info.py       # Profile schemas
│   │   │   ├── job_application.py # Application schemas
│   │   │   └── common.py          # Common response schemas
│   │   ├── services/               # Business logic services
│   │   │   ├── gemini_service.py  # Gemini AI integration
│   │   │   ├── email_service.py   # Gmail API integration
│   │   │   ├── storage_service.py # File storage operations
│   │   │   ├── embedding_service.py # Vector embeddings
│   │   │   ├── resume_generator_service.py # Resume generation
│   │   │   └── automation_service.py # Automation pipeline
│   │   ├── templates/              # LaTeX templates
│   │   │   ├── template.tex       # Resume template
│   │   │   └── resume_template.tex
│   │   ├── dependencies.py        # FastAPI dependencies
│   │   └── main.py                # FastAPI app entry point
│   ├── alembic/                    # Database migrations
│   │   ├── versions/              # Migration files
│   │   └── env.py                 # Alembic configuration
│   ├── requirements.txt            # Python dependencies
│   ├── alembic.ini                 # Alembic config
│   └── celery_worker.conf          # Celery configuration
│
└── README.md                        # This file
```

---

## 🎯 Features Breakdown

### **Job Application Automation Pipeline**

The core feature of this platform is the **complete automation pipeline** that handles:

1. **Job Description Analysis** (`ANALYZING_JD`)
   - Extracts job title, company name, recruiter email
   - Uses Gemini AI to parse unstructured job descriptions
   - Stores extracted information in database

2. **Resume Selection** (`SELECTING_RESUME`)
   - Generates embedding for job description
   - Compares with all user resumes using cosine similarity
   - Selects best match (similarity ≥ 0.9) or uses fallback
   - Updates application record with selected resume

3. **Cover Letter Generation** (`GENERATING_COVER_LETTER`)
   - Uses selected resume content
   - Incorporates user profile information
   - Generates personalized cover letter with Gemini AI
   - Tailored to specific job requirements

4. **Email Sending** (`SENDING_EMAIL`)
   - Composes professional email
   - Attaches selected resume PDF
   - Sends via Gmail API using OAuth tokens
   - Records send timestamp

5. **Status Tracking** (`COMPLETED` / `FAILED`)
   - Real-time status updates
   - Error message capture
   - Retry capability for failed applications

### **Vector Embedding System**

- **Model**: `all-MiniLM-L6-v2` (384 dimensions)
- **Storage**: pgvector extension in SQLite
- **Matching**: Cosine similarity search
- **Threshold**: 0.9 similarity for automatic selection
- **Performance**: Fast semantic search across resume database

### **Resume Generation System**

- **Template**: Professional LaTeX template
- **AI Engine**: Google Gemini 2.5 Flash
- **Output**: One-page ATS-friendly PDF
- **Customization**: Job-specific tailoring
- **Compilation**: pdflatex with error handling
- **Storage**: Automatic save to database with embeddings

---

## 🔑 Getting API Keys

### **Google Gemini AI**
1. Visit https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Create new API key
4. Copy and add to `.env` as `GEMINI_API_KEY`

### **Gmail OAuth**
1. Go to Google Cloud Console
2. Create new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs
6. Copy Client ID and Secret to `.env`

### **JWT Secret Key**
Generate a secure random string:
```python
import secrets
secrets.token_urlsafe(32)
```

---

## 📊 Database Schema

### **Tables:**
- `users` - User accounts and authentication
- `resumes` - Resume files with vector embeddings
- `user_info` - Extended user profile information
- `job_applications` - Application tracking and history

### **Key Relationships:**
- User → Resumes (one-to-many)
- User → UserInfo (one-to-one)
- User → JobApplications (one-to-many)
- JobApplication → Resume (many-to-one)

---

## 🎓 Key Technical Achievements

1. **AI Integration**: Seamless integration with Google Gemini AI for multiple use cases
2. **Vector Search**: Implemented semantic search using embeddings and cosine similarity
3. **Background Processing**: Asynchronous task processing with Celery
4. **PDF Generation**: LaTeX-based resume generation with error handling
5. **OAuth Integration**: Secure Gmail API integration with token encryption
6. **Real-time Tracking**: Status updates for long-running automation tasks
7. **Modern Stack**: Latest React 19, FastAPI, and modern Python practices

---

## 🚧 Development Notes

- **Database**: Currently using SQLite. For production, migrate to PostgreSQL for better pgvector support
- **Storage**: Local file system. Consider cloud storage (S3, Cloudinary) for production
- **Error Handling**: Comprehensive try-catch blocks with detailed error messages
- **Security**: JWT tokens, password hashing, encrypted sensitive data
- **Scalability**: Celery workers can be scaled horizontally

---

## 📝 License

MIT License - Feel free to use for personal and commercial projects!

---

## 👨‍💻 Development

Built with modern best practices:
- RESTful API design
- Component-based frontend architecture
- Database migrations for schema management
- Environment-based configuration
- Comprehensive error handling
- Background job processing

---

**🎉 This project demonstrates advanced full-stack development with AI integration, vector search, and automation capabilities!**
