# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

SCRUM-5 established a clean V1 foundation: Docker, FastAPI + SQLite backend, statically-built Next.js frontend, start/stop scripts, and a fake login screen with no real authentication. SCRUM-6 added AI chat for drafting a Mutual NDA; SCRUM-7 expanded it to all 11 document types in catalog.json. Real user authentication and document persistence are not built yet and are expected in a later ticket.

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
- One structured-output call per turn returns both a conversational reply and the merged NDA fields, per the AI design guidance above (see that section for current model choice)
- Backend defensively re-merges fields so a blank value from the LLM never erases a previously known one
- Live document preview updates as fields are extracted; PDF download (`@react-pdf/renderer`) once all required fields are present
- No persistence: chat/fields live only in React state, reset on refresh (no backend endpoint stores conversations)
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

### Current API Endpoints
- `POST /api/auth/login` - Fake login: get or create a user by email, no password, sets session cookie
- `POST /api/auth/logout` - Clear session cookie
- `GET /api/auth/me` - Get current user info
- `GET /api/chat/greeting` - Opening AI message (auth required)
- `POST /api/chat/message` - Send a chat message, get back the AI's reply and updated document type/fields/completion state (auth required)
- `GET /api/health` - Health check

### Not yet built
- Real authentication (passwords, JWT) and document persistence
