# FastAPI User Management API

## Features
- User registration
- Login with JWT authentication
- Profile management
- User listing
- Unit tests using PyTest
- API automation using Playwright

## Tech Stack
- FastAPI
- SQLite
- PyTest
- Playwright
- TypeScript

## Run Application

export SECRET_KEY="change-me"
uvicorn app.main:app --reload

## Run Unit Tests

pytest

## Run API Tests

cd qa
npx playwright install
npx playwright test

## Configuration

Environment variables:
- `APP_ENV`: `local` | `test` | `prod` (defaults to `local`)
- `SECRET_KEY`: required in non-local environments
- `DATABASE_URL`: default `sqlite:///./users.db`
- `ACCESS_TOKEN_EXPIRE_MINUTES`: default `60`
