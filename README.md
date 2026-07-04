# Calmindra Frontend

Frontend for the Calmindra mental health chatbot, built with Next.js and assistant-ui.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Backend Integration

Set `BACKEND_URL` to the deployed FastAPI backend. If it is omitted, the app falls back to `http://localhost:8000`.

Set `BACKEND_API_SECRET` to the same value configured on the FastAPI backend. The frontend sends it only from server-side proxy routes.

## Authentication

The app uses Auth.js and protects the assistant plus all frontend proxy API routes.

Required in production:

```bash
AUTH_SECRET=replace-with-a-long-random-secret
AUTH_URL=https://your-frontend-domain.example
```

Enable at least one provider:

```bash
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
```

For local testing only, set `AUTH_DEV_PASSWORD` and sign in with any email plus that password. Do not set `AUTH_DEV_PASSWORD` in production.
