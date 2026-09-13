# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

SCRUM-5 established a clean V1 foundation: Docker, FastAPI + SQLite backend, statically-built Next.js frontend, start/stop scripts, and a fake login screen with no real authentication. SCRUM-6 added AI chat for drafting a Mutual NDA; SCRUM-7 expanded it to all 11 document types in catalog.json. SCRUM-8 replaced the fake login with real email/password authentication and added backend persistence for drafted documents.

## Development process

When instructed to build a feature:
1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use LiteLLM via OpenRouter. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

Model choice: the originally intended `openrouter/openai/gpt-oss-120b` via Cerebras needs OpenRouter credits (the account currently has none). OpenRouter's free auto-router (`openrouter/openrouter/free`) was tried as a no-cost alternative but doesn't reliably honor `response_format` — it can return plain prose instead of the structured JSON this app depends on, since it routes across many different underlying free models. The chat service is pinned instead to a single free-tier model that declares `structured_outputs` support in OpenRouter's model list (currently `openrouter/nvidia/nemotron-3-super-120b-a12b:free`, verified to return valid structured JSON). That model doesn't support `reasoning_effort`, unlike gpt-oss-120b via Cerebras, so that parameter isn't passed. If a different/paid model is ever swapped back in, check OpenRouter's `/models` endpoint for `structured_outputs` support first.

There is an OPENROUTER_API_KEY in the .env file in the project root.

## Technical design

The entire project should be packaged into a Docker container.  
The backend should be in backend/ and be a uv project, using FastAPI.  
The frontend should be in frontend/  
The database should use SQLLite and be created from scratch each time the Docker container is brought up, allowing for a users table with sign up and sign in. Session signing keys are also generated fresh at process start rather than persisted, matching the database's own fresh-per-container-start lifecycle (see SCRUM-8 below).  
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
- Fake login screen: enter an email, no password, to enter the platform (replaced by real signup/signin in SCRUM-8)
- Placeholder home page after login with a user menu (email + sign out)
- Backend pytest coverage and frontend jest coverage for the login/logout flow
- Merged via [PR #4](https://github.com/Alok-Pratik/PreLegal/pull/4)

### Completed (SCRUM-6)
- Freeform AI chat replaces a form for drafting a Mutual NDA (still the only document type)
- One structured-output call per turn returns both a conversational reply and the merged NDA fields, per the AI design guidance above (see that section for current model choice)
- Backend defensively re-merges fields so a blank value from the LLM never erases a previously known one
- Live document preview updates as fields are extracted; PDF download (`@react-pdf/renderer`) once all required fields are present
- No persistence at the time: chat/fields lived only in React state, reset on refresh (backend persistence added in SCRUM-8)
- Chat endpoints require the fake login session; a failed LLM call returns a clean `503` instead of a raw error
- Merged via [PR #5](https://github.com/Alok-Pratik/PreLegal/pull/5)

### Completed (SCRUM-7)
- Expanded from Mutual NDA only to all 11 document types in catalog.json (the 12th entry, "Mutual NDA Cover Page", is a companion to the NDA and excluded from the selectable list)
- Fields generalized from a Mutual-NDA-specific schema to one generic `{key, label, value, group}` shape used for every document type; the AI decides which fields a document needs and groups related ones (e.g. "Party 1") for display — see `backend/models/chat.py` and `backend/services/ai_service.py`
- If the user asks for an unsupported document, the AI explains it can't generate that, suggests the closest catalog match, and waits for the user to agree before gathering fields for it
- Backend forces `is_complete` to false unless every known field is non-empty (defensive backstop against a premature "ready to download" state)
- The system prompt asks for a follow-up question whenever the document isn't complete, but a free-tier model doesn't reliably comply on its own — `_ensure_follow_up_question` in `ai_service.py` deterministically appends one naming the first empty field whenever the model's reply doesn't already end in a question
- Fixed a focus bug: the chat input regained focus by calling `.focus()` in the same tick as re-enabling it, before React had re-rendered the DOM — moved to a `useEffect` keyed on the sending state
- `NDAPreview`/`NDAPdf` renamed to generic `DocumentPreview`/`DocumentPdf`; grouping logic shared via `frontend/src/utils/documentFields.ts`
- `catalog.json` was never copied into the Docker image, so `ai_service.py` (which reads it at import time) crashed the app on every container startup — the Dockerfile now copies it alongside `backend/`; if any other code starts reading a repo-root file at import time, remember this same gotcha
- The model sometimes emits literal HTML `<br>` tags for line breaks; since the chat UI renders messages as plain text, `_clean_reply` strips them defensively
- Merged via [PR #6](https://github.com/Alok-Pratik/PreLegal/pull/6)

### Completed (SCRUM-8)
- Replaced the fake email-only login with real accounts: `users.hashed_password` (bcrypt, via the `bcrypt` package directly) plus `SignupRequest`/`SigninRequest` in `backend/models/auth.py`; the old passwordless `/api/auth/login` endpoint is gone
- Session cookie now holds a signed, expiring token (`backend/core/security.py`, `itsdangerous`) instead of a raw user id, so it can't be forged or tampered with client-side; signing key is generated fresh at process start, matching the database's fresh-per-container-start lifecycle (no secret to configure, but sessions don't survive a restart either — acceptable since neither does the DB)
- New `documents` table persists each drafted document (`document_type`, fields, chat history as JSON, `is_complete`) per user, in `backend/database.py`; `backend/services/document_service.py` saves a row on every chat turn once the AI has picked a `document_type`, keyed by `document_id`
- `POST /api/chat/message` now accepts/returns a `document_id` so a conversation already in progress keeps updating the same row instead of creating a new one each turn
- New `GET /api/documents` and `GET /api/documents/{id}` list a user's own documents and fetch one with its full chat history so a draft can be resumed; ownership is checked (404, not 403, if another user's id is requested) in `DocumentService._get_owned`
- Frontend: `LoginScreen` now has separate sign-up/sign-in forms; a `DocumentsList` "My Documents" view (with `AppHeader` tab navigation) lets a user browse past documents and reopen one into `ChatInterface`, which resumes from the saved history instead of always starting fresh
- Added a shared `apiClient.ts` (`getJson`/`postJson` with credentialed fetch and consistent error extraction from FastAPI's error shapes) that `chatApi.ts` and the new `documentsApi.ts` both build on
- Added the disclaimer required by this ticket ("This document is a draft generated with AI assistance...") to `DocumentPreview.tsx` and `DocumentPdf.tsx`
- Merged via [PR #7](https://github.com/Alok-Pratik/PreLegal/pull/7)
- UI polish pass (rest of this ticket's scope): shared `ErrorMessage`/`Spinner` components replace ad-hoc red text and "Loading..." strings across `LoginScreen`, `ChatInterface`, `DocumentsList`, `DownloadButton`, and `page.tsx`; a persistent disclaimer footer was added to the logged-in app shell so the legal-review notice isn't only visible on the document preview/PDF; `DocumentsList`'s empty state got an icon; a stray JSX indentation bug in `LoginScreen`'s confirm-password field was fixed

### Current API Endpoints
- `POST /api/auth/signup` - Create an account (email + password), sets session cookie
- `POST /api/auth/signin` - Sign in to an existing account, sets session cookie
- `POST /api/auth/logout` - Clear session cookie
- `GET /api/auth/me` - Get current user info
- `GET /api/chat/greeting` - Opening AI message (auth required)
- `POST /api/chat/message` - Send a chat message, get back the AI's reply and updated document type/fields/completion state; persists the turn to the `documents` table (auth required)
- `GET /api/documents` - List the current user's documents, most recently updated first (auth required)
- `GET /api/documents/{document_id}` - Get one of the current user's documents, including chat history (auth required)
- `GET /api/health` - Health check

### Not yet built
- Password reset / email verification
- Editing or deleting a persisted document (currently create/append and read-only list/view)
