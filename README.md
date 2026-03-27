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
PYTHONPATH=backend uvicorn app.main:app --reload

## Run with Docker

docker compose up --build

App will be available at `http://localhost:8000`.

## Run with Docker (Production Profile)

docker compose --profile prod up --build

Notes:
- Set a strong `SECRET_KEY` for production.
- SQLite is fine for demos; use a managed DB for real workloads.

## Run Unit Tests

pytest

## Run API Tests

cd qa
npx playwright install
npx playwright test

## Linting + Pre-commit

pip install -r requirements.txt -r requirements-dev.txt
pre-commit install
pre-commit run --all-files

## Configuration

Environment variables:
- `APP_ENV`: `local` | `test` | `prod` (defaults to `local`)
- `SECRET_KEY`: required in non-local environments
- `DATABASE_URL`: default `sqlite:///./users.db`
- `ACCESS_TOKEN_EXPIRE_MINUTES`: default `60`
