# AI Resume Analyzer — Project Context

> **Purpose:** This is a codebase handoff/context document for continuing development. It describes what is actually present in the repository at the time of inspection, not what the project may eventually intend to do.
>
> **Inspection date:** 2026-07-31 (UTC)
>
> **Repository:** `RojanShrestha1992/ai-resume-analyzer`
>
> **Current branch:** `arena/019fb7b1-ai-resume-analyzer`
>
> **Starting commit:** `cd8961845c70b97c9695938476843ca09af3111c` (`feat: implement Resume Model`)

## 1. Executive summary

The repository currently contains only a Node.js/Express backend. There is no frontend, no AI/LLM integration, no job-description matching, no analysis service, no test suite, no API documentation, and no deployment configuration.

The implemented backend can:

- connect to MongoDB;
- register users and hash passwords with `bcryptjs`;
- log users in and issue a JWT in an HTTP-only cookie;
- log users out;
- return the authenticated user profile;
- accept authenticated PDF resume uploads up to 5 MB;
- extract PDF text with `pdf-parse`;
- upload the PDF to Cloudinary as a raw resource;
- save the resume metadata and extracted text in MongoDB;
- list a user's resumes (with extracted text omitted from the list response);
- fetch a user's resume by ID (but currently omits extracted text and analysis fields from the response);
- delete a user's resume database record.

The upload endpoint marks every new resume `pending`, but nothing in the repository processes pending resumes. The model has fields for a future analysis result (`score`, `skills`, `missingSkills`, `strengths`, `weakness`, `suggestions`), but there is no code that populates them.

## 2. Repository inventory

```
server/
├── .env.example
├── .gitignore
├── eslint.config.js
├── package.json
├── package-lock.json
├── server.js
└── src/
    ├── config/
    │   ├── cloudinary.js
    │   └── db.js
    ├── controllers/
    │   ├── authController.js
    │   └── resumeController.js
    ├── middleware/
    │   ├── authMiddleware.js
    │   └── upload.js
    ├── models/
    │   ├── Resume.js
    │   └── User.js
    ├── routes/
    │   ├── authRoutes.js
    │   └── resumeRoutes.js
    └── utils/
        └── generateToken.js
```

Tracked files: 17 (including the lockfile). There are no tracked files outside `server/` other than this context document added at the repository root. `node_modules/`, `.env`, and `uploads/` are ignored by `server/.gitignore`.

## 3. Runtime and package setup

`server/package.json`:

- package name: `server`
- version: `1.0.0`
- module system: ES modules (`"type": "module"`)
- entry declared as `index.js`, although the actual server entrypoint is `server.js`
- scripts:
  - `npm run dev` → `nodemon server.js`
  - `npm start` → `node server.js`
  - `npm test` intentionally fails with “no test specified”
- license: ISC
- Node version is not pinned (`engines` is absent).

Runtime dependencies:

| Package | Usage in this codebase |
|---|---|
| `express` | HTTP server and routing |
| `mongoose` | MongoDB connection and models |
| `dotenv` | Loads `.env` into `process.env` |
| `cors` | Allows the local frontend origin and cookies |
| `cookie-parser` | Reads the JWT cookie |
| `jsonwebtoken` | Signs and verifies JWTs |
| `bcryptjs` | Hashes and compares passwords |
| `bcrypt` | Declared but not imported; redundant |
| `multer` | Multipart file upload handling |
| `pdf-parse` | Extracts text from uploaded PDFs |
| `cloudinary` | Stores uploaded PDFs |

Development dependencies: `nodemon`, ESLint 10, `@eslint/js`, and `globals`.

The lockfile is present and should be used with `npm ci` for reproducible installs.

## 4. Configuration and environment variables

`server/server.js` calls `dotenv.config()` before connecting to MongoDB and starting the app.

Expected variables (based on code and `.env.example`):

| Variable | Required by | Notes |
|---|---|---|
| `PORT` | server | Defaults to `5000` |
| `NODE_ENV` | token cookie | `production` makes the cookie secure |
| `MONGO_URI` | MongoDB | Required for startup; connection failure exits the process |
| `JWT_SECRET` | JWT sign/verify | Required, but no validation exists |
| `JWT_EXPIRES_IN` | JWT signing | Not present in `.env.example`; if undefined, JWT behavior should be verified/configured |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary | Required for upload |
| `CLOUDINARY_API_KEY` | Cloudinary | Required for upload |
| `CLOUDINARY_API_SECRET` | Cloudinary | Required for upload |

`.env.example` contains placeholder values, including an incomplete-looking Mongo URI (`mongodb+srv://admin:`), and does not document `JWT_EXPIRES_IN`. Create `server/.env` locally; never commit secrets.

The configured CORS origin is hard-coded to `http://localhost:5173` and credentials are enabled. A deployed frontend or a different local port will not work without changing this.

## 5. Application startup and middleware

`server/server.js`:

1. loads environment variables;
2. calls `connectDB()` without awaiting it;
3. creates an Express app;
4. enables `express.json()`;
5. enables `cookieParser()`;
6. enables CORS for `http://localhost:5173` with credentials;
7. mounts `/api/auth` and `/api/resume` routes;
8. returns plain text `Hello World` at `GET /`;
9. listens on `PORT || 5000`.

There is no global error handler, request logging, rate limiting, helmet/security middleware, compression, health endpoint, API versioning, or graceful shutdown. Because DB connection is started but not awaited, startup sequencing and early request behavior should be improved.

## 6. Data models

### User (`src/models/User.js`)

Mongo collection is generated by Mongoose from model `User` (normally `users`). Fields:

- `name`: required string, trimmed.
- `email`: required unique string, lowercased and trimmed. The `unique` option creates/enforces an index only once MongoDB has built it; controller also handles duplicate key error.
- `password`: required string, minimum length 6. A `pre("save")` hook hashes modified passwords using bcryptjs with 10 salt rounds.
- automatic `createdAt` and `updatedAt` timestamps.

Methods:

- `comparePassword(enteredPassword)`: bcrypt comparison against the stored hash.

Password is excluded manually in authentication lookup with `.select("-password")`; there is no schema-level `select: false`.

### Resume (`src/models/Resume.js`)

Fields:

- `userId`: required Mongo ObjectId referencing `User`.
- `fileUrl`: required Cloudinary URL.
- `originalName`: required original client filename.
- `extractedText`: required full PDF text.
- `analysisStatus`: enum `pending | processing | completed | failed`, defaults to `pending`.
- `score`: number, nullable by default, constrained 0–100.
- `skills`: string array, defaults to `[]`.
- `missingSkills`: string array, defaults to `[]`.
- `strengths`: string array, defaults to `[]`.
- `weakness`: string array, defaults to `[]`. Note singular naming is inconsistent with the likely intended `weaknesses`.
- `suggestions`: string array, defaults to `[]`.
- automatic `createdAt` and `updatedAt` timestamps.

There are no indexes declared on `userId`, `analysisStatus`, or timestamps.

## 7. Authentication behavior and API contract

JWTs are stored in a cookie named `jwt`. `generateToken(res, userId)` signs `{ id: userId }` with `JWT_SECRET`, uses `JWT_EXPIRES_IN`, and sets:

- `httpOnly: true`
- `secure: process.env.NODE_ENV === "production"`
- `sameSite: "strict"`
- `maxAge`: 30 days

There is no Authorization-header fallback. The frontend must send cookies (`credentials: include`).

### `POST /api/auth/register` — public

JSON body:

```json
{ "name": "Ada Lovelace", "email": "ada@example.com", "password": "secret123" }
```

Success `201`:

```json
{
  "succsess": true,
  "message": "User registered successfully",
  "user": { "id": "...", "name": "Ada Lovelace", "email": "ada@example.com" }
}
```

Important: response property is misspelled `succsess` (unlike all other endpoints' `success`). Missing fields return `400`; existing email returns `400`; other errors return `500`. Password length is ultimately validated by Mongoose, but validation errors are returned as generic `500`.

### `POST /api/auth/login` — public

JSON body:

```json
{ "email": "ada@example.com", "password": "secret123" }
```

Success `200` returns `success`, message, and public user fields; it also sets `jwt`. Missing fields and invalid credentials return `400`; unexpected errors return `500`.

### `POST /api/auth/logout` — public

Clears `jwt` by setting an expired HTTP-only cookie. Returns `200` with `success: true`.

### `GET /api/auth/me` — protected

Requires a valid `jwt` cookie. Returns `200` with `success: true` and `user` (password excluded).

### Authentication middleware

`protect` reads `req.cookies.jwt`, verifies it, loads the user by decoded ID, excludes password, and assigns `req.user`.

Known defects:

- missing-token response uses `mesage` instead of `message`;
- token-failure catch block calls `res.statu(...).jseon(...)`, which throws instead of returning the intended 401 response;
- no explicit handling for malformed/expired token, invalid user ID, or missing `JWT_SECRET`;
- cookies are `sameSite: strict`, which may be problematic for separately hosted frontend/API deployments.

## 8. Resume API contract

All resume routes use `protect`. Requests must be authenticated with the JWT cookie.

### `POST /api/resume/upload`

Content type: `multipart/form-data`; file field must be exactly `resume`.

Multer behavior:

- writes to `uploads/` relative to the process working directory;
- creates a randomized filename using timestamp, random number, and original extension;
- accepts only MIME type `application/pdf`;
- maximum size is 5 MiB;
- there is no explicit file-count or filename/content-signature validation.

Processing sequence:

1. require a file;
2. synchronously read the temporary file;
3. parse it using `pdf-parse`;
4. log all extracted text to stdout;
5. reject if text is absent or `extractedText.trim() === "0"` (this condition is likely a bug; it does not reject ordinary whitespace correctly);
6. upload the local file to Cloudinary folder `resumes`, `resource_type: "raw"`;
7. delete the temporary file;
8. create a Resume with `pending` analysis status;
9. return metadata.

Success `201` response includes `id`, `originalName`, `fileUrl`, `analysisStatus`, and `createdAt`, but not extracted text or analysis results. Missing file returns `400`. Parsing, Cloudinary, filesystem, and DB errors return `500` and include `error.message` (potentially leaking internals).

Important operational issues:

- `uploads/` is ignored but is not created by the app; Multer can fail if the directory does not already exist.
- temporary files can remain if an error occurs after deletion or if cleanup itself fails.
- Cloudinary file is not deleted when the DB write fails.
- deleting a resume only deletes MongoDB data; it does not delete the Cloudinary asset.
- synchronous filesystem calls block the event loop.
- `pdf-parse` has an in-code note suggesting `pdf2json` or `pdfjs-dist` may be more reliable, but no replacement is implemented.
- logging extracted resume text is a privacy/security concern.

### `GET /api/resume/all`

Returns the authenticated user's resumes sorted newest first. Uses `.select("-extractedText")`, so extracted text is excluded. Ownership is correctly scoped by `userId`.

```json
{ "success": true, "resumes": [/* Mongoose resume documents without extractedText */] }
```

### `GET /api/resume/:id`

Finds a resume by both `_id` and authenticated `userId`, preventing cross-user access when the ID is valid. Returns `404` if not found. The response includes only `id`, `originalName`, `fileUrl`, `analysisStatus`, and `createdAt`; it does not return score, skills, extracted text, strengths, weaknesses, or suggestions. Invalid Mongo IDs are treated as generic `500` errors rather than `400`.

### `DELETE /api/resume/:id`

Finds by `_id` plus `userId`, then deletes the MongoDB record. Returns `200` on success and `404` when not found. Invalid IDs produce `500`. Cloudinary cleanup is absent.

## 9. What is not implemented

These are not merely undocumented; there is no corresponding code in the repository:

- frontend/UI;
- user dashboard;
- resume analysis algorithm or AI model integration;
- OpenAI/Anthropic/Gemini/etc. client;
- job description input;
- ATS scoring rules;
- skill extraction or normalization;
- missing-skill comparison;
- strengths/weaknesses generation;
- suggestions generation;
- endpoint to start, poll, or retrieve analysis results;
- background queue/worker;
- analysis retry handling;
- status transitions beyond initial `pending`;
- resume editing or re-analysis;
- Cloudinary deletion;
- pagination, search, filtering, or sorting controls beyond newest-first list;
- email verification, password reset, profile update, account deletion;
- admin roles;
- structured validation library;
- centralized error handling;
- tests, fixtures, mocks, or CI;
- API schema/OpenAPI documentation;
- Docker, production process manager, deployment, migrations, or seed scripts.

## 10. Known bugs and risks to fix first

1. Fix `res.statu(...).jseon(...)` in auth middleware; invalid JWTs currently likely cause an Express error rather than a clean 401.
2. Ensure `uploads/` exists at startup or use memory storage/temp-dir management.
3. Add `JWT_EXPIRES_IN` to environment documentation and validate all required configuration at startup.
4. Fix response typos: `succsess` and `mesage`.
5. Add proper error middleware, especially Multer errors and Mongoose validation/CastErrors.
6. Validate and normalize request data (email, password, name) before DB operations.
7. Avoid returning raw error messages and avoid logging extracted resume contents.
8. Make upload cleanup and Cloudinary cleanup reliable and asynchronous.
9. Return the analysis payload from the detail endpoint once analysis exists.
10. Implement the analysis pipeline: pending → processing → completed/failed, with persistence and retry behavior.
11. Decide whether `weakness` should be renamed to `weaknesses`; changing it requires migration/backward compatibility.
12. Add ownership-safe Cloudinary deletion and verify resource identifiers are stored, not only `secure_url`.
13. Add indexes, pagination, rate limiting, security headers, CSRF strategy, and production CORS/cookie configuration.
14. Add automated tests before expanding functionality.

## 11. Suggested continuation plan

### Phase 1 — make the existing backend dependable

- Create a robust config module that validates environment variables.
- Fix middleware typos and add a global error handler.
- Create the upload directory safely, replace sync filesystem calls, and handle Multer errors.
- Add request validation and consistent response shapes.
- Add indexes and correct naming (`weaknesses`, if desired).
- Stop logging sensitive extracted text.
- Add tests for registration, login, cookie auth, ownership, upload rejection, and CRUD.

### Phase 2 — define analysis product behavior

Before coding AI, decide:

- whether analysis runs synchronously or asynchronously;
- exact score rubric and ATS dimensions;
- whether a job description is required;
- expected JSON schema for skills, missing skills, strengths, weaknesses, and suggestions;
- maximum extracted-text/token limits and privacy retention policy;
- what `processing` and `failed` mean to clients.

A likely design is an authenticated `POST /api/resume/:id/analyze` that validates ownership, sets `processing`, invokes a provider/service, validates structured output, saves results, and sets `completed` or `failed`; clients can use `GET /api/resume/:id` to poll/read status.

### Phase 3 — frontend and production

- Build the frontend against the documented cookie-based API.
- Use `credentials: "include"` on every authenticated request.
- Add upload progress, status polling, result visualization, and error states.
- Configure environment-specific API origin/CORS/cookie settings.
- Add CI, deployment, secrets management, observability, backups, and privacy controls.

## 12. How to run the current backend

From the repository root:

```bash
cd server
npm ci
mkdir -p uploads
cp .env.example .env
# Edit .env with real MongoDB, JWT, and Cloudinary values.
npm run dev
# or: npm start
```

The server listens on port 5000 by default. `GET http://localhost:5000/` should return `Hello World`, assuming startup dependencies/configuration are valid.

There is currently no passing test command: `npm test` is a placeholder that exits with status 1.

## 13. File-by-file map

- `server/server.js`: application bootstrap, middleware, route mounting, root route, listener.
- `server/src/config/db.js`: MongoDB connection; exits process on failure.
- `server/src/config/cloudinary.js`: Cloudinary SDK configuration from environment.
- `server/src/models/User.js`: user schema, password hashing, password comparison.
- `server/src/models/Resume.js`: resume storage and future analysis-result schema.
- `server/src/middleware/authMiddleware.js`: cookie JWT protection and `req.user` attachment.
- `server/src/middleware/upload.js`: PDF-only, disk-based Multer upload capped at 5 MiB.
- `server/src/utils/generateToken.js`: JWT signing and cookie creation.
- `server/src/controllers/authController.js`: register/login/logout/current-user handlers.
- `server/src/controllers/resumeController.js`: PDF extraction, Cloudinary upload, and resume CRUD handlers.
- `server/src/routes/authRoutes.js`: auth endpoint definitions.
- `server/src/routes/resumeRoutes.js`: protected resume endpoint definitions.
- `server/.env.example`: incomplete configuration template.
- `server/.gitignore`: ignores dependencies, environment file, and uploads.
- `server/eslint.config.js`: basic ESLint recommended config; it is not wired into an npm script.
- `server/package.json`: dependency and script manifest.
- `server/package-lock.json`: locked dependency graph.

## 14. Current architectural picture

```
Client (not included)
   │ JSON + credentials / multipart PDF
   ▼
Express server
   ├── /api/auth ── User model ── MongoDB
   └── /api/resume ── JWT cookie middleware
                     ├── Multer temporary disk file
                     ├── pdf-parse text extraction
                     ├── Cloudinary raw PDF storage
                     └── Resume model ── MongoDB

Future missing component:
Resume.pending → analysis worker/provider → score and findings → Resume.completed
```

This document should be updated whenever routes, schemas, environment variables, or analysis behavior change.
