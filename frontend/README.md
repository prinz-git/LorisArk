# LorisArk Frontend

This is the Next.js frontend for LorisArk, a roost and local-services bundling platform. The app gives nomads a public discovery flow and authenticated dashboards for profile, inventory, booking, and community management.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

Configure the API base URL with:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Scripts

- `npm run dev`: start the local Next.js dev server
- `npm run build`: build the production frontend
- `npm run start`: serve the production build
- `npm run lint`: run ESLint
- `npm test`: run Jest tests

## Test IDs

UI test selectors are centralized in `src/lib/testids.ts`.

Reference map:
- `TESTIDS.md`

Guidance:
- Prefer importing `testIds` or `testIdBuilders` rather than hardcoding strings.
- Use dynamic builders for list rows to keep selectors consistent.
