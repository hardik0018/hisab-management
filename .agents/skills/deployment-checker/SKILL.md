---
name: deployment-checker
description: Use before deploying MERN, Next.js, Express, MongoDB, or API-based apps. Checks environment variables, build errors, database connection, CORS, API base URLs, production config, secrets, platform settings, and deployment blockers for Vercel, Render, Railway, VPS, and MongoDB Atlas.
---

# Deployment Checker

## Purpose

Check if the project is ready for production deployment.

This skill prevents common deployment failures:
- Missing env variables
- Wrong API base URL
- Build errors
- TypeScript errors
- Database connection failure
- MongoDB Atlas IP/network issue
- CORS blocking frontend requests
- Wrong production config
- Exposed secrets
- Broken auth cookies/JWT
- Wrong start/build command
- Platform mismatch
- Local-only code shipped to production

## When to use

Use this skill before:
- Deploying to Vercel
- Deploying to Render
- Deploying to Railway
- Deploying to VPS
- Connecting MongoDB Atlas
- Sending project to client
- Merging production branch
- Changing env variables
- Changing API URL
- Changing auth config
- Changing database connection logic
- Changing deployment platform

Use especially for:
- Next.js apps
- Express APIs
- MERN apps
- Admin dashboards
- API-based web apps
- Client websites with backend
- MongoDB Atlas production setup

## Process

### 1. Identify deployment target

First confirm:
- Platform: Vercel, Render, Railway, VPS, or other
- App type: Next.js, Express API, full MERN, monorepo
- Runtime: Node version
- Package manager: npm, pnpm, yarn, bun
- Build command
- Start command
- Production branch
- Domain/subdomain

Do not assume local setup equals production setup.

### 2. Check environment variables

List all env variables used in code.

Search for:
- `process.env`
- `import.meta.env`
- `NEXT_PUBLIC_`
- `.env`
- `.env.local`
- `.env.production`
- config files
- database config
- auth config
- API client config

Verify every required variable exists in the deployment platform.

Common required variables:
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `NEXT_PUBLIC_API_URL`
- `API_BASE_URL`
- `FRONTEND_URL`
- `BACKEND_URL`
- `NODE_ENV`
- `PORT`
- `CORS_ORIGIN`
- `COOKIE_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `UPLOAD_DIR`
- third-party API keys

Check:
- No missing env variable
- No typo in env name
- No extra spaces
- No quotes copied wrongly
- No local URL used in production
- No secret exposed with `NEXT_PUBLIC_`
- Public env only contains safe public values
- Production env differs from development env where needed

### 3. Check build command

Verify correct build command:

For Next.js:
```bash
npm run build
````

For Express TypeScript:

```bash
npm run build
```

For plain Node/Express:

```bash
npm install
npm start
```

Check:

* Build script exists
* Start script exists
* TypeScript compiles
* ESLint does not block build unexpectedly
* No missing dependency
* No dependency exists only in devDependencies when needed at runtime
* Generated files are not required but missing
* Static assets are included
* No hardcoded local path

### 4. Check Node version

Verify:

* Local Node version
* Platform Node version
* `package.json` engines field
* Framework compatibility

Recommended:

```json
{
  "engines": {
    "node": ">=20"
  }
}
```

Check for:

* Old Node version
* Platform using wrong version
* Native package incompatibility
* ESM/CommonJS mismatch
* Missing build tools for native modules

### 5. Check database connection

Verify:

* `MONGODB_URI` is correct
* MongoDB Atlas cluster is active
* Database user exists
* Password is correct
* Password special characters are URL encoded
* IP access list allows platform access
* App does not create multiple connections per request
* Connection is cached in Next.js serverless routes
* Connection errors are logged safely

Check MongoDB Atlas:

* Network access configured
* Database user has correct permissions
* Correct database name used
* Production database is not the local/test database
* Connection string does not expose credentials in code

### 6. Check CORS

For Express APIs, verify:

* Production frontend domain is allowed
* Localhost is not the only allowed origin
* Wildcard `*` is not used with credentials
* Cookies need `credentials: true`
* Methods are correct
* Headers are correct

Example safe CORS pattern:

```ts
const allowedOrigins = process.env.CORS_ORIGIN?.split(",") ?? [];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
```

Check:

* Frontend URL matches exactly
* `https://` is used in production
* No trailing slash mismatch
* Preview URL handling is intentional
* Admin domain and client domain are both handled if needed

### 7. Check API base URL

Verify frontend calls correct backend URL.

Check:

* No `localhost`
* No hardcoded development URL
* No missing `/api`
* No double `/api/api`
* No mixed HTTP/HTTPS
* Server components and client components use correct config
* Browser-side env uses `NEXT_PUBLIC_`
* Server-side secrets do not use `NEXT_PUBLIC_`

For same Next.js app:

* Prefer relative API calls when suitable:

```ts
fetch("/api/users")
```

For separate frontend/backend:

* Use production backend URL:

```ts
process.env.NEXT_PUBLIC_API_URL
```

### 8. Check authentication production config

Verify:

* JWT secret exists and is strong
* Auth cookies are secure in production
* SameSite is correct
* Cookie domain is correct
* Token expiry is intentional
* Refresh token logic works if used
* OAuth callback URLs are production URLs
* Password reset links use production frontend URL

For cookies in production:

* `secure: true`
* `httpOnly: true`
* `sameSite` configured correctly
* domain configured only when needed

### 9. Check file upload and storage

If uploads exist, verify:

* Platform supports persistent storage
* Upload path works in production
* File size limit exists
* File type validation exists
* Public file URL is correct
* Temporary serverless filesystem is not used as permanent storage

Important:

* Vercel filesystem is not suitable for permanent uploads.
* Use cloud storage for production uploads.

Check storage options:

* S3
* Cloudinary
* Firebase Storage
* Supabase Storage
* UploadThing
* VPS disk only if backups exist

### 10. Check platform-specific config

#### Vercel

Check:

* Framework preset is correct
* Build command is correct
* Output directory is correct
* Env variables added to Production
* Env variables added to Preview if needed
* Serverless function timeout risk
* API route runtime is correct
* Image domains configured
* Custom domain configured
* Redirects/rewrites configured if needed

#### Render

Check:

* Build command
* Start command
* Node version
* Root directory
* Env variables
* Health check path
* Auto deploy branch
* Free instance sleep risk
* Persistent disk if needed
* CORS origin matches frontend domain

#### Railway

Check:

* Service variables
* Start command
* Build command
* Port binding
* Service domain
* Database plugin variables
* Monorepo root path
* Deployment logs
* Public networking enabled if needed

#### VPS

Check:

* `.env` exists on server
* PM2/systemd config
* Reverse proxy config
* Nginx config
* SSL certificate
* Firewall
* Node version
* MongoDB access
* Log rotation
* Restart policy
* Backup policy

### 11. Check production safety

Verify:

* `NODE_ENV=production`
* Debug logs removed
* Console logs do not expose secrets
* Source maps are intentional
* Error messages are safe
* Stack traces are not sent to clients
* Rate limiting exists on sensitive APIs
* Admin routes are protected
* Test routes are removed
* Seed scripts are not exposed
* Swagger/docs access is intentional

### 12. Check final deploy logs

After build/deploy, inspect logs for:

* Build failure
* TypeScript error
* Missing module
* Missing env variable
* Database connection failure
* Port binding failure
* CORS error
* Runtime crash
* 404 on API routes
* 500 on first request

Do not trust “deployed successfully” alone.

### 13. Run smoke tests

Test production manually:

* Homepage opens
* Login works
* Logout works
* Protected page redirects correctly
* API health route works
* Database read works
* Database write works
* Image/file upload works if used
* Form submit works
* CORS does not block request
* Mobile view works
* Refresh on nested route works
* Invalid URL returns proper 404
* Admin access is protected

Use real production URL.

## Rules

* Do not deploy with missing env variables.
* Do not deploy with `localhost` in production config.
* Do not expose secrets through `NEXT_PUBLIC_`.
* Do not use wildcard CORS with credentials.
* Do not store permanent uploads on serverless filesystem.
* Do not deploy without testing database connection.
* Do not deploy if build fails locally.
* Do not deploy if auth fails in production.
* Do not assume preview and production env are same.
* Do not ignore deployment logs.
* Do not use development MongoDB database for production.
* Do not hardcode API URLs.
* Do not deploy debug/test routes.
* Do not send stack traces to users.
* Do not skip smoke testing.

## Checklist

### Environment variables

* [ ] All `process.env` variables listed
* [ ] All required env variables exist on platform
* [ ] Production env values are correct
* [ ] No local URLs in production
* [ ] No secrets use `NEXT_PUBLIC_`
* [ ] Public env values are safe
* [ ] Env values have no extra spaces
* [ ] Env values have no wrong quotes
* [ ] Preview and production env are separated

### Build

* [ ] `npm install` works
* [ ] `npm run build` works
* [ ] TypeScript passes
* [ ] Required scripts exist
* [ ] Build command is correct
* [ ] Start command is correct
* [ ] Output directory is correct
* [ ] Node version is compatible
* [ ] Runtime dependencies are not missing

### Database

* [ ] `MONGODB_URI` is correct
* [ ] Atlas cluster is running
* [ ] Database user exists
* [ ] Password is URL encoded if needed
* [ ] Network access allows platform
* [ ] Correct production database used
* [ ] Connection is cached where needed
* [ ] Database errors are handled safely

### CORS

* [ ] Production frontend domain allowed
* [ ] Localhost is not the only origin
* [ ] Wildcard is not used with credentials
* [ ] Credentials setting is correct
* [ ] Allowed headers are correct
* [ ] Allowed methods are correct
* [ ] Domain has no trailing slash mismatch

### API URLs

* [ ] Frontend uses correct production API URL
* [ ] No hardcoded localhost
* [ ] No wrong protocol
* [ ] No duplicate `/api`
* [ ] Server-side and client-side env usage is correct
* [ ] Health route works

### Authentication

* [ ] JWT secret exists
* [ ] Cookie settings are production-safe
* [ ] OAuth callback URLs are correct if used
* [ ] Password reset URL is production URL
* [ ] Protected routes work
* [ ] Admin routes are protected
* [ ] Token expiry is intentional

### Platform config

* [ ] Correct root directory
* [ ] Correct branch
* [ ] Correct framework preset
* [ ] Correct build command
* [ ] Correct start command
* [ ] Correct port binding
* [ ] Custom domain configured
* [ ] SSL works
* [ ] Redirects/rewrites work

### Security

* [ ] No secrets in Git
* [ ] No `.env` committed
* [ ] No debug route exposed
* [ ] No stack trace exposed
* [ ] Logs are safe
* [ ] Rate limits exist where needed
* [ ] CORS is strict
* [ ] Admin APIs require auth

### Smoke test

* [ ] Homepage loads
* [ ] API health check works
* [ ] Login works
* [ ] Logout works
* [ ] Protected route works
* [ ] Database read works
* [ ] Database write works
* [ ] Form submit works
* [ ] File upload works if used
* [ ] Mobile layout works
* [ ] Refresh route works
* [ ] 404 page works

## Output format

Return deployment review in this format:

```md
# Deployment Check Result

## Verdict

Choose one:
- Ready to deploy
- Ready after small fixes
- Not ready
- Blocked for production

## Deployment Target

- Platform:
- App type:
- Branch:
- Build command:
- Start command:
- Node version:
- Database:

## Production Blockers

### 1. Issue title
- Area:
- Problem:
- Risk:
- Required fix:

## Environment Variable Issues

| Variable | Status | Problem | Fix |
|---|---|---|---|
| MONGODB_URI | Missing | Not added on platform | Add production Atlas URI |

## Build Issues

- Problem:
- Risk:
- Fix:

## Database Issues

- Problem:
- Risk:
- Fix:

## CORS / API URL Issues

- Problem:
- Risk:
- Fix:

## Auth / Security Issues

- Problem:
- Risk:
- Fix:

## Platform-Specific Issues

- Platform:
- Problem:
- Fix:

## Smoke Test Plan

- [ ] Test homepage
- [ ] Test API health route
- [ ] Test login
- [ ] Test database write
- [ ] Test protected route
- [ ] Test production error handling

## Required Fixes Before Deploy

- [ ] Fix 1
- [ ] Fix 2
- [ ] Fix 3

## Optional Improvements

- Improvement 1
- Improvement 2

## Final Recommendation

Clear final deployment decision.
```

If everything is safe:

```md
# Deployment Check Result

## Verdict

Ready to deploy

## Checked Areas

- Environment variables
- Build command
- Start command
- Database connection
- CORS
- API base URL
- Auth config
- Platform config
- Production smoke tests

## Minor Notes

- Note 1
- Note 2

## Final Recommendation

Safe to deploy.
```

## Common mistakes to prevent

* Deploying with missing `.env`
* Using localhost in production
* Exposing `JWT_SECRET` in frontend
* Using `NEXT_PUBLIC_` for private secrets
* Forgetting MongoDB Atlas IP access
* Wrong database password encoding
* Wrong build command
* Wrong start command
* Wrong Node version
* CORS blocks production frontend
* Cookies fail because `secure` or `sameSite` is wrong
* Vercel upload feature fails due to temporary filesystem
* Render app sleeps and client thinks app is broken
* Railway app fails because `PORT` is not handled
* VPS deploy lacks SSL or process restart
* Preview env works but production env fails
* Deployment says success but first API call returns 500

## Quality bar

A deployable project must:

* Build successfully
* Start successfully
* Connect to database
* Use correct production env variables
* Use safe secrets
* Use correct API URLs
* Pass CORS from production frontend
* Protect auth routes
* Avoid local-only config
* Pass smoke tests on production URL

Never mark deployment ready only because local development works.

