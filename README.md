# Sanjhi Samasya — SIH 2026 (Problem Statement 26043)

A full-stack crowdsourcing platform connecting **citizens**, **universities** and
**industry** to surface and solve everyday problems across Jharkhand — built for
Smart India Hackathon 2026, Problem Statement ID **26043**
("A digital platform to crowdsource societal challenges and facilitate
collaborative problem solving through universities and industry partnerships").

## Tech stack

| Layer     | Technology                                              |
|-----------|----------------------------------------------------------|
| Frontend  | Plain HTML5, CSS3, vanilla JavaScript (no build step)    |
| Backend   | Node.js, Express.js                                      |
| Database  | SQLite (via `better-sqlite3`) — a single file, no server to install |
| Auth      | JWT (JSON Web Tokens) + bcrypt password hashing           |

No paid services, no external database server, no build tooling — clone it, run
two commands, and it works. That makes it easy to demo live in front of judges.

## Folder structure

```
sanjhi-samasya/
├── backend/
│   ├── db/
│   │   ├── database.js      # SQLite connection + schema
│   │   ├── seed.js          # demo data (run once)
│   │   └── data.db          # created automatically on first run
│   ├── middleware/
│   │   └── auth.js          # JWT verification middleware
│   ├── routes/
│   │   ├── auth.js          # /api/auth/register, /login, /me
│   │   └── challenges.js    # /api/challenges (list, create, upvote)
│   ├── server.js            # Express app entry point
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── index.html           # main dashboard (hero, feed, submit form)
    ├── login.html
    ├── register.html
    ├── css/styles.css
    └── js/
        ├── api.js           # fetch wrapper + auth-state helpers
        └── (inline page scripts live in each .html file)
```

## How it works (architecture)

1. **Express serves both the API and the frontend** from one process — so
   there's only one server to run and no CORS headaches when you deploy.
2. **Registration** (`POST /api/auth/register`) hashes the password with
   bcrypt and stores the user in SQLite. It never stores plain-text passwords.
3. **Login** (`POST /api/auth/login`) checks the password hash and returns a
   signed JWT. The frontend stores this token in `localStorage` and attaches
   it as `Authorization: Bearer <token>` on every request that needs it.
4. **Challenges** are readable by anyone (`GET /api/challenges`), but creating
   one or upvoting one (`POST /api/challenges`, `POST /api/challenges/:id/upvote`)
   requires a valid token — enforced server-side by `middleware/auth.js`, not
   just hidden in the UI.
5. **One vote per user per challenge** is enforced with a unique constraint in
   the `votes` table, not just client-side logic.

## Setup — run it locally

**Prerequisites:** Node.js 18 or newer ([nodejs.org](https://nodejs.org)).

```bash
# 1. Go into the backend folder
cd sanjhi-samasya/backend

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env
# Open .env and set JWT_SECRET to any long random string

# 4. Seed the database with demo data (creates data.db)
npm run seed

# 5. Start the server
npm start
```

Now open **http://localhost:4000** in your browser. That single URL serves the
whole app — home page, login, register, everything.

**Demo login:** User ID `demo@jharkhand.gov.in` · Password `demo123`
(created by the seed script).

For development with auto-restart on file changes, use `npm run dev` instead
of `npm start` (requires the `nodemon` dev-dependency, already listed in
`package.json`).

## Deploying it so you can share a real link

Any Node-friendly host works, for example:

- **Render.com** — connect your GitHub repo, set root directory to
  `backend`, build command `npm install`, start command `npm start`, add the
  `JWT_SECRET` environment variable in the dashboard.
- **Railway.app** — similar one-click deploy from a GitHub repo.

Once deployed you'll get a real `https://...` URL you can share on WhatsApp —
no separate frontend hosting needed, since Express serves it all.

> ⚠️ SQLite's data file lives on disk, so on hosts with an ephemeral
> filesystem (data wiped on redeploy) your data resets each deploy. That's
> fine for a hackathon demo. For a production deployment, swap SQLite for a
> managed Postgres/MySQL database — the route files would only need small
> changes to the SQL queries.

## API reference (for the judges / your report)

| Method | Endpoint                        | Auth required | Description                     |
|--------|----------------------------------|:--------------:|----------------------------------|
| POST   | `/api/auth/register`             | No             | Create an account                |
| POST   | `/api/auth/login`                 | No             | Log in, returns a JWT            |
| GET    | `/api/auth/me`                    | Yes            | Validate the current token       |
| GET    | `/api/challenges?domain=&status=` | No             | List challenges (filterable)     |
| POST   | `/api/challenges`                 | Yes            | Submit a new challenge           |
| POST   | `/api/challenges/:id/upvote`      | Yes            | Upvote a challenge (once/user)   |

## Known limitations & honest next steps

Worth mentioning in your presentation — judges respond well to a team that
knows its own roadmap:

- **Security:** the JWT is stored in `localStorage`, which is simple but
  vulnerable to XSS; a production version should move to an httpOnly cookie.
- **Database:** SQLite is perfect for a demo; a real deployment with many
  concurrent users should move to Postgres.
- **No file uploads yet:** the problem statement mentions photos — the schema
  can be extended with an `attachments` table and a file-upload endpoint
  (e.g. using `multer` + cloud storage).
- **No admin/matching dashboard yet:** today, "matching" a university team to
  a challenge is manual/implicit — a real system needs a dashboard where
  university accounts can claim challenges and update status.
- **No email verification / password reset** — straightforward to add with a
  transactional email provider.

## Credits

Built for Smart India Hackathon 2026 — Problem Statement 26043, Department of
Higher & Technical Education, Government of Jharkhand.
