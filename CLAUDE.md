# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

SCRUM-5 reset the app to a clean V1 foundation: Docker, FastAPI + SQLite backend, statically-built Next.js frontend, start/stop scripts, and a fake login screen with no real authentication. The AI chat, document types, and real user authentication built in PL-5 through PL-7 (described below for history) were removed from this foundation and will be rebuilt on top of it in later tickets.

## Development process

When instructed to build a feature:
1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter to the `openrouter/openai/gpt-oss-120b` model with Cerebras as the inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

There is an OPENROUTER_API_KEY in the .env file in the project root.

## Technical design

The entire project should be packaged into a Docker container.  
The backend should be in backend/ and be a uv project, using FastAPI.  
The frontend should be in frontend/  
The database should use SQLLite and be created from scratch each time the Docker container is brought up, allowing for a users table with sign up and sign in.  
Consider statically building the frontend and serving it via FastAPI, if that will work.  
There should be scripts in scripts/ for:  
```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```
Backend available at http://localhost:8000

## Color Scheme
- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`

## Implementation Status

### Completed (SCRUM-5) — current state
- Rebuilt the V1 foundation: Docker multi-stage build, FastAPI + SQLite backend (fresh DB each container start), Next.js static export served by FastAPI at localhost:8000, start/stop scripts for Mac/Linux/Windows
- Fake login screen: enter an email, no password, to enter the platform (no real authentication yet)
- `users` table tracks only email identity for the fake session
- Placeholder home page after login; no document types, AI chat, or document persistence yet
- The AI chat, document catalog, and real JWT/bcrypt authentication from PL-5–PL-7 below were removed from the codebase for this reset and are expected back in future tickets

### History (superseded by SCRUM-5, kept for reference)

### Completed (PL-4)
- Docker multi-stage build (Node frontend + Python backend)
- FastAPI backend with SQLite (fresh DB each container start)
- Next.js static export served by FastAPI at localhost:8000
- Auth routes: POST /api/auth/signup, POST /api/auth/signin, POST /api/auth/signout, GET /api/auth/me
- Start/stop scripts for Mac, Linux, Windows
- Mutual NDA form with live preview and PDF download

### Completed (PL-5)
- AI chat interface replaces manual form for NDA creation
- Uses LiteLLM via OpenRouter with Cerebras inference (gpt-oss-120b model)
- Structured outputs for reliable field extraction from conversation
- Live preview updates as AI extracts fields from chat
- AI greets user, asks questions conversationally, and confirms when complete
- Download button appears when all required fields are gathered

### Completed (PL-6)
- Support for all 11 document types from catalog.json
- AI detects document type from user requests and routes accordingly
- Dedicated preview/PDF components for Mutual NDA, Cloud Service Agreement, Pilot Agreement
- Generic preview/PDF components for remaining document types (Design Partner, SLA, Professional Services, Partnership, Software License, DPA, BAA, AI Addendum)
- Auto-focus chat input after sending messages
- AI always asks follow-on questions when more information is needed

### Completed (PL-7)
- Functional user authentication with JWT tokens in HttpOnly cookies
- User signup and signin with email/password (bcrypt password hashing)
- Document persistence - users can save documents to their account
- My Documents modal to view, load, and delete saved documents
- User menu with sign out functionality
- New Document button to start fresh
- Auth context for managing user state across the app
- Protected document save/load endpoints

### Current API Endpoints
- `POST /api/auth/login` - Fake login: get or create a user by email, no password, sets session cookie
- `POST /api/auth/logout` - Clear session cookie
- `GET /api/auth/me` - Get current user info
- `GET /api/health` - Health check

The chat and document endpoints listed below (from PL-5–PL-7) no longer exist on this branch; they'll return once those features are rebuilt on the new foundation.
