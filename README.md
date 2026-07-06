# DevStacker

The Developer Workspace OS — one dashboard for your repos, projects, learning, and productivity.

This is the **walking skeleton**: GitHub sign-in, a live repository list (with staleness detection), and a manual Projects module. Built on the MERN stack, deployable as a single Vercel project.

## Stack

- **Frontend:** React + Vite (`/src`)
- **Backend:** Express as a Vercel serverless function (`/server`, entry `/api/index.js`)
- **DB:** MongoDB (Atlas) via Mongoose
- **Auth:** GitHub OAuth → signed httpOnly session cookie (JWT)

## Project layout

```
src/            React frontend
server/         Express app + routes + models
  app.js        builds the Express app (routes mounted under /api)
  local.js      local dev server (node)
  routes/       auth, github, projects
api/index.js    Vercel serverless entry (exports server/app.js)
vercel.json     build + /api rewrite config
```

## Local development

1. `npm install`
2. Copy `.env.example` → `.env` and fill in the values (see below).
3. `npm run dev` — starts the API on :5000 and Vite on :5173 (with an /api proxy).
4. Open http://localhost:5173

### Getting the env values

- **GitHub OAuth App** — https://github.com/settings/developers → New OAuth App.
  Set **Authorization callback URL** to `http://localhost:5173/api/auth/github/callback`.
  Copy the Client ID + generate a Client Secret.
- **MongoDB Atlas** — https://cloud.mongodb.com → free M0 cluster → connection string.
- **JWT_SECRET** — any long random string.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it on Vercel (framework auto-detects as Vite; `vercel.json` handles the API).
3. Add env vars in Vercel: `APP_URL` (your prod URL), `GITHUB_CLIENT_ID`,
   `GITHUB_CLIENT_SECRET`, `JWT_SECRET`, `MONGODB_URI`.
4. Create a **second** GitHub OAuth App (or update the callback) for the prod URL:
   `https://<your-domain>/api/auth/github/callback`.

## Roadmap

Walking skeleton → see `PRD-v2-Supplement.md` §14 for the full release train
(Notes, Snippets, Bookmarks, Journal, Deployments, Analytics, AI assistant).
