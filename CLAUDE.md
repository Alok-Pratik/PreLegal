# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

SCRUM-5 established a clean V1 foundation: Docker, FastAPI + SQLite backend, statically-built Next.js frontend, start/stop scripts, and a fake login screen with no real authentication. SCRUM-6 added AI chat for drafting one document type (Mutual NDA); the other 10 document types and real user authentication are not built yet and are expected in later tickets.

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

### Completed (SCRUM-5)
- V1 foundation: Docker multi-stage build, FastAPI + SQLite backend (fresh DB each container start), Next.js static export served by FastAPI at localhost:8000, start/stop scripts for Mac/Linux/Windows
- Fake login screen: enter an email, no password, to enter the platform
- `users` table tracks only email identity for the fake session (no password field)
- Placeholder home page after login with a user menu (email + sign out)
- Backend pytest coverage and frontend jest coverage for the login/logout flow
- Merged via [PR #4](https://github.com/Alok-Pratik/PreLegal/pull/4)

### Completed (SCRUM-6)
- Freeform AI chat replaces a form for drafting a Mutual NDA (still the only document type)
- One structured-output call per turn (LiteLLM via OpenRouter, Cerebras provider, `openrouter/openai/gpt-oss-120b`) returns both a conversational reply and the merged NDA fields, per the AI design guidance above
- Backend defensively re-merges fields so a blank value from the LLM never erases a previously known one
- Live document preview updates as fields are extracted; PDF download (`@react-pdf/renderer`) once all required fields are present
- No persistence: chat/fields live only in React state, reset on refresh (no backend endpoint stores conversations)
- Chat endpoints require the fake login session; a failed LLM call returns a clean `503` instead of a raw error
- Requires the configured OpenRouter account to have credits (a `402 Insufficient credits` response from OpenRouter surfaces to the user as the same clean `503`, so an out-of-credits key isn't visually distinguishable from a real outage)
- Merged via [PR #5](https://github.com/Alok-Pratik/PreLegal/pull/5)

### Current API Endpoints
- `POST /api/auth/login` - Fake login: get or create a user by email, no password, sets session cookie
- `POST /api/auth/logout` - Clear session cookie
- `GET /api/auth/me` - Get current user info
- `GET /api/chat/greeting` - Opening AI message and empty NDA fields (auth required)
- `POST /api/chat/message` - Send a chat message, get back the AI's reply and updated NDA fields (auth required)
- `GET /api/health` - Health check

### Not yet built
- The other 10 document types from catalog.json
- Real authentication (passwords, JWT) and document persistence
