# RO Water Plant Management System

A full-stack application for managing RO water customers and sales.

## 🧩 What it is
- **Backend**: FastAPI (Python) providing REST APIs for customer and sales management.
- **Frontend**: React + Vite dashboard for viewing, searching, adding, and updating customers.
- **Database**: PostgreSQL (uses stored procedures / functions for core logic and validation).

## � What this project demonstrates
- Full API-driven architecture: frontend communicates with backend via REST.
- Customer management system (CRUD + filtering + search).
- Sales tracking tied to customers.
- Flexible data validation and error handling on the backend.
- Offline-first local deployment: works on a shop’s internal network without external cloud dependency.

## �🚀 Run Locally (Dev)
### 1) Install dependencies
- Python (>= 3.11 recommended)
- Node.js (>= 20 recommended)

From the repo root:
```bash
# Python deps
python -m venv .venv
.venv\Scripts\Activate.ps1   # PowerShell
pip install -r requirement.txt

# Frontend deps
cd frontend
npm install
cd ..
```

### 2) Start backend + frontend together
From the root:
```bash
python run_script.py
```

This runs:
- Backend FastAPI server on `http://127.0.0.1:8001`
- Frontend Vite dev server (usually `http://localhost:5173`)

## 🧠 Architecture Overview
- Backend exposes routes under:
  - `/customer/*` for customer operations
  - `/sales/*` for sales operations
- Frontend consumes these APIs using `fetch(...)` and renders a customer CRUD dashboard.

## 🗂️ Key Folders
- `backend/` - FastAPI app + DB access + business logic
- `frontend/` - React + Vite app
- `database/` - SQL scripts with stored procedure definitions

## ✅ Deployment Notes
- To deploy, move sensitive configuration (DB connection, API URLs) into environment variables.
- Frontend can be deployed to Vercel.
- Backend can be deployed to Render, Fly.io, or Vercel Serverless.
- Database can be hosted on Supabase / Heroku Postgres / any Postgres provider.

## 📌 Next Improvements (Optional)
- Add a proper DB migration tool (Alembic or Flyway)
- Add authentication and access control
- Add unit tests and API integration tests
- Improve frontend routing and add sales management UI

---

*This documentation is generated based on the current project structure.*
