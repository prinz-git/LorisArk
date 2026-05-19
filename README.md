# LorisArk

LorisArk is a FastAPI and Next.js platform for curating local stays. Hosts can publish roost listings, artisans can offer nearby services, and nomads can discover and bundle a place, services, bookings, and checkout into one flow.

## Features
- JWT authentication with role-aware profiles for nomads, hosts, and artisans
- Roost inventory management for host listings
- Local service discovery and bundle creation around selected roosts
- Booking and bundle workflows backed by FastAPI APIs
- Responsive Next.js frontend with shared test IDs for UI automation
- Unit, API, and UI test coverage with Pytest and Playwright

## Tech Stack
- FastAPI
- Next.js
- SQLite
- Pytest
- Playwright
- TypeScript

## Run Locally

Install Python dependencies:

```bash
pip install -r requirements.txt -r requirements-dev.txt
```

Start the API:

```bash
export SECRET_KEY="change-me"
PYTHONPATH=backend uvicorn app.main:app --reload
```

Start the frontend in another terminal:

```bash
cd frontend
npm install
npm run dev
```

The API runs at `http://localhost:8000` and the frontend runs at `http://localhost:3000`.

## Run with Docker

```bash
docker compose up --build
```

Frontend: `http://localhost:3000`

API: `http://localhost:8000`

## Run with Docker (Production Profile)

```bash
docker compose --profile prod up --build
```

Notes:
- Set a strong `SECRET_KEY` for production.
- SQLite is fine for demos; use a managed database for production workloads.

## Tests

Run backend unit tests:

```bash
pytest
```

Run frontend tests:

```bash
cd frontend
npm test
```

Run Playwright API and UI tests:

```bash
cd qa
npm install
npx playwright install
npx playwright test
```

## Linting and Pre-commit

```bash
pip install -r requirements.txt -r requirements-dev.txt
pre-commit install
pre-commit run --all-files
```

## Configuration

Environment variables:
- `APP_ENV`: `local` | `test` | `prod` (defaults to `local`)
- `APP_NAME`: API title shown in OpenAPI docs (defaults to `LorisArk API`)
- `SECRET_KEY`: required in non-local environments
- `DATABASE_URL`: default `sqlite:///./users.db`
- `ALLOWED_ORIGINS`: comma-separated CORS origins
- `ACCESS_TOKEN_EXPIRE_MINUTES`: default `60`
- `NEXT_PUBLIC_API_BASE_URL`: frontend API base URL
