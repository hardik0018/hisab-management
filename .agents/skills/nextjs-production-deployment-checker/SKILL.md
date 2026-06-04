---

name: nextjs-production-deployment-checker
description: Use before deploying any Next.js app to Vercel, Render, Railway, VPS, or client production. Checks build, env variables, API URLs, image domains, redirects, headers, security config, dependency versions, and production release risks.
---
# Next.js Production Deployment Checker

## Purpose

Prevent broken, insecure, or incomplete Next.js production deployments.

This skill must be used before:

* Vercel deploy
* Render deploy
* Railway deploy
* VPS deploy
* Client handoff
* Production release
* Security-sensitive update
* Final QA before launch

The goal is simple:

* App must build.
* App must run.
* Env variables must be correct.
* API URLs must not break.
* Images must load.
* Auth must be safe.
* Headers must protect the app.
* Next.js version must be patched.
* Deployment must be production-ready.

## When to use

Use this skill when the user says:

* Check before deploy
* Production deployment check
* Vercel deployment check
* Render deployment check
* Railway deployment check
* Client handoff check
* Final release check
* Check env before deploy
* Check Next.js security before deploy
* Check production config
* Deployment failed
* Build failed on Vercel
* App works locally but not in production

Also use this skill before deploying:

* Client websites
* Dashboards
* Admin panels
* API-based apps
* Auth apps
* Payment apps
* Tracker apps
* MongoDB apps
* Image-heavy sites

## Process

### 1. Identify deployment target

First identify where the app will run:

* Vercel
* Render
* Railway
* VPS
* Docker
* Static export
* Other hosting

Then check platform-specific risks.

Do not assume Vercel unless confirmed.

### 2. Check package versions

Inspect:

* `package.json`
* `package-lock.json`
* `pnpm-lock.yaml`
* `yarn.lock`
* `next.config.js`
* `next.config.mjs`
* `next.config.ts`

Check these versions:

* `next`
* `react`
* `react-dom`
* `react-server-dom-webpack`
* `react-server-dom-turbopack`
* `react-server-dom-parcel`

Required security rule:

* Next.js 13.x and 14.x must not be deployed.
* Upgrade to Next.js 15.5.18 or 16.2.6 minimum.
* Next.js 15.x must be 15.5.18 or newer.
* Next.js 16.x must be 16.2.6 or newer.
* React Server Components packages must be patched.
* Do not rely on WAF as the main mitigation.

Fail deployment if framework versions are vulnerable.

### 3. Run local production checks

Run these commands based on package manager:

```bash
npm install
npm run lint
npm run type-check
npm run build
npm run start
```

If scripts differ, inspect `package.json`.

For pnpm:

```bash
pnpm install
pnpm lint
pnpm type-check
pnpm build
pnpm start
```

For yarn:

```bash
yarn install
yarn lint
yarn type-check
yarn build
yarn start
```

If `type-check` is missing, recommend adding:

```json
{
  "scripts": {
    "type-check": "tsc --noEmit"
  }
}
```

### 4. Check build errors

Block deployment for:

* TypeScript errors
* ESLint errors
* Missing modules
* Invalid imports
* Server/client component mistakes
* Invalid dynamic imports
* Missing env variables
* Broken image config
* Static generation errors
* Failed API route build
* Edge runtime errors
* Invalid middleware config

Do not ignore build warnings blindly.

Classify warnings:

* Safe warning
* Needs fix soon
* Must fix before deploy

### 5. Check environment variables

Inspect:

* `.env`
* `.env.local`
* `.env.production`
* `.env.example`
* Hosting dashboard env settings

Required checks:

* All required env vars exist in production.
* No local-only values remain.
* No secrets are exposed with `NEXT_PUBLIC_`.
* `NEXT_PUBLIC_` is used only for browser-safe values.
* Database URL points to production database.
* API base URL points to production API.
* Auth secret exists.
* JWT secret exists.
* Webhook secrets exist.
* Upload provider keys exist.
* Email provider keys exist.
* Payment keys exist.
* Map keys exist.
* Analytics keys exist.

Common required variables:

```txt
MONGODB_URI=
JWT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_API_URL=
```

Security rule:

Never expose these:

```txt
MONGODB_URI
JWT_SECRET
NEXTAUTH_SECRET
DATABASE_URL
STRIPE_SECRET_KEY
RAZORPAY_SECRET
SMTP_PASS
AWS_SECRET_ACCESS_KEY
CLOUDINARY_API_SECRET
```

### 6. Check API URLs

Inspect frontend API calls.

Find:

* `localhost`
* `127.0.0.1`
* hardcoded dev URLs
* wrong staging URLs
* mixed HTTP/HTTPS
* absolute URLs where relative URLs are safer

Bad:

```ts
fetch("http://localhost:3000/api/users")
```

Good:

```ts
fetch("/api/users")
```

For external APIs, require env-based config:

```ts
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

Deployment blocker:

* Any production code calling `localhost`
* Any secret API key used in client code
* Any admin API route without auth

### 7. Check image domains

Inspect:

* `next/image`
* `next.config`
* CMS image URLs
* Cloudinary URLs
* S3 URLs
* Unsplash URLs
* client-hosted assets

Check config:

```ts
images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "res.cloudinary.com"
    }
  ]
}
```

Block deployment if:

* Remote images fail in production
* Domain is missing
* Wildcard image domains are too broad
* User-controlled SVG is allowed unsafely

Avoid unsafe config:

```ts
dangerouslyAllowSVG: true
```

Only allow SVG when CSP and content disposition are correctly configured.

### 8. Check redirects and rewrites

Inspect:

* `next.config`
* middleware
* proxy routes
* auth redirects
* dashboard redirects
* old URL redirects
* client website SEO redirects

Check for:

* Redirect loops
* Open redirects
* Broken callback URLs
* Wrong auth redirect after login
* Wrong dashboard redirect
* Missing www/non-www redirect
* Missing trailing slash decision
* Missing HTTP to HTTPS redirect

Block deployment for open redirect risk.

Bad:

```ts
redirect(searchParams.get("next"));
```

Good:

```ts
const allowedPaths = ["/dashboard", "/profile"];
```

### 9. Check middleware and auth protection

Inspect:

* `middleware.ts`
* `proxy.ts`
* route handlers
* server actions
* protected pages
* admin routes
* API routes

Important rule:

Middleware is not enough.

Every sensitive API route must validate auth again.

Check:

* Dashboard pages protected
* Admin pages protected
* API routes protected
* Server actions protected
* Token validation exists
* Role checks exist
* Ownership checks exist
* Session expiry handled
* Invalid token returns 401
* Valid token without permission returns 403

Block deployment if:

* Auth only exists in frontend
* API route trusts client state
* Admin route has no server-side check
* Middleware is the only security layer

### 10. Check server actions

Inspect all server actions.

Check:

* Input validation
* Auth validation
* Role validation
* Rate limiting where needed
* No secret returned to client
* No raw DB error returned
* No untrusted redirect
* No unsafe file path
* No direct user-controlled fetch URL

Block deployment if server actions mutate data without auth.

### 11. Check route handlers

Inspect:

```txt
app/api/**/route.ts
pages/api/**
```

Check every route for:

* Method validation
* Body validation
* Query validation
* Auth check
* Rate limit for sensitive routes
* Proper status codes
* Safe error response
* No stack trace leak
* No unrestricted CORS
* No SSRF risk
* No unsafe URL fetch

Required status codes:

```txt
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation Error
429 Too Many Requests
500 Internal Server Error
```

### 12. Check SSRF risk

Search for:

```ts
fetch(req.query.url)
fetch(searchParams.get("url"))
axios.get(userInput)
new URL(userInput)
```

Block deployment if user input controls server-side fetch without allowlist.

Bad:

```ts
await fetch(urlFromUser);
```

Good:

```ts
const allowedHosts = ["api.example.com"];
```

SSRF rule:

* Never fetch arbitrary user-provided URLs from server code.
* Use allowlisted hosts only.
* Block private IP ranges.
* Block localhost.
* Block metadata IPs.
* Block internal hostnames.

### 13. Check caching risks

Inspect:

* `fetch` cache options
* `revalidate`
* `unstable_cache`
* route segment config
* CDN cache headers
* auth pages
* tenant pages
* user-specific pages

Block deployment if private data can be cached publicly.

Danger signs:

```ts
export const revalidate = 3600;
```

inside user-specific pages.

Safe rules:

* Authenticated pages should be dynamic.
* User-specific responses should not be public cached.
* Tenant-specific cache keys must include tenant ID.
* Sensitive route handlers must send no-store.

Use:

```ts
headers: {
  "Cache-Control": "no-store"
}
```

For App Router pages:

```ts
export const dynamic = "force-dynamic";
```

### 14. Check security headers

Add headers in `next.config` or hosting config.

Required baseline:

```ts
const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY"
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()"
  }
];
```

For apps using maps or geolocation, adjust permissions carefully.

Add CSP when possible:

```txt
Content-Security-Policy
```

CSP must be tested.
Do not add broken CSP blindly.

### 15. Check CORS

For API routes:

* Do not use `*` with credentials.
* Allow only required domains.
* Use HTTPS production domains.
* Keep staging separate from production.
* Validate allowed origins server-side.

Bad:

```ts
"Access-Control-Allow-Origin": "*"
```

Bad with cookies:

```ts
"Access-Control-Allow-Credentials": "true"
```

and wildcard origin.

### 16. Check database production readiness

For MongoDB / Mongoose:

Check:

* Production MongoDB URI
* IP allowlist
* Database indexes
* Connection reuse
* No connection per request
* No test database in production
* No seed script running in deploy
* No destructive script in build
* Required indexes created
* Unique constraints exist
* Query pagination exists

Block deployment if:

* MongoDB URI points to local DB
* Missing required indexes
* API can return unlimited records
* Sensitive fields are returned

### 17. Check file upload production readiness

For upload features:

Check:

* File size limit
* MIME validation
* Extension validation
* Auth required
* Storage provider configured
* Public/private access correct
* Upload folder separated by environment
* No executable file serving
* Image transformation safety

Block deployment if:

* Any user can upload without auth
* File type is unchecked
* Files are stored in local filesystem on serverless hosting

### 18. Check forms and validation

For every form:

* Client validation exists
* Server validation exists
* Empty state handled
* Loading state handled
* Error state handled
* Duplicate submit prevented
* API error shown properly
* Success state shown properly

Server validation is mandatory.

Client validation alone is not acceptable.

### 19. Check production logging

Required:

* Server errors logged
* Sensitive data not logged
* Auth tokens not logged
* Passwords not logged
* Payment data not logged
* MongoDB URI not logged
* Stack traces hidden from users

Good production error response:

```json
{
  "success": false,
  "message": "Something went wrong"
}
```

Bad:

```json
{
  "error": "MongoServerError: full stack trace..."
}
```

### 20. Check analytics and monitoring

For client handoff, recommend:

* Vercel Analytics
* Sentry
* Logtail
* Axiom
* PostHog
* UptimeRobot
* Better Stack

Minimum production monitoring:

* Error tracking
* Uptime monitor
* Performance monitoring
* Deployment logs
* API failure visibility

### 21. Check SEO for client sites

For marketing/client websites:

Check:

* Metadata title
* Description
* Open Graph image
* Favicon
* Sitemap
* Robots.txt
* Canonical URLs
* Social share preview
* 404 page
* Mobile layout
* Lighthouse basics

Block handoff if:

* Site has no metadata
* Wrong brand name appears
* Demo content remains
* Broken social image

### 22. Check accessibility

Minimum checks:

* Buttons have accessible names
* Forms have labels
* Images have alt text
* Color contrast acceptable
* Keyboard navigation works
* Focus state visible
* Modals trap focus
* No layout-breaking text

### 23. Check performance

Run:

```bash
npm run build
```

Inspect:

* Route sizes
* First Load JS
* Large client components
* Unnecessary `"use client"`
* Large images
* Unoptimized fonts
* Heavy animation libraries
* Unused dependencies

Fix before deploy:

* Large hero images
* Layout shift
* Missing image sizes
* Blocking third-party scripts
* Large dashboard tables
* No pagination
* Client-side fetching for SEO pages

### 24. Check Vercel config

Inspect:

* `vercel.json`
* project settings
* build command
* output directory
* install command
* framework preset
* env variables
* domain settings
* redirects
* functions region
* cron jobs

Common Vercel config:

```json
{
  "framework": "nextjs"
}
```

Avoid unnecessary config.

Do not add custom config unless required.

### 25. Check Render / Railway config

For Render:

* Correct build command
* Correct start command
* Node version set
* Env variables added
* Health check path works
* Persistent disk only if needed

For Railway:

* Correct service root
* Correct env variables
* Correct build provider
* Database connection works
* Public URL configured

### 26. Check Node version

Use stable Node version.

Recommended:

```txt
Node.js 22 LTS
```

Add:

```txt
.nvmrc
```

Example:

```txt
22
```

Or in `package.json`:

```json
{
  "engines": {
    "node": ">=22"
  }
}
```

### 27. Check final production smoke test

After deploy, test:

* Home page loads
* Login works
* Logout works
* Protected route blocks guest
* Dashboard loads
* API routes work
* Forms submit
* Images load
* Redirects work
* 404 works
* Mobile layout works
* Database writes work
* Database reads work
* Error state works
* Refresh does not break auth
* Direct protected URL access is blocked

## Rules

### Hard deployment blockers

Do not approve deployment if any item exists:

* Build fails
* TypeScript fails
* Missing env variables
* Production uses localhost
* Vulnerable Next.js version
* Vulnerable React Server Components package
* Admin API without auth
* Sensitive API without auth
* Middleware is the only auth protection
* Secrets exposed with `NEXT_PUBLIC_`
* MongoDB points to local database
* Open redirect exists
* SSRF risk exists
* Private data can be public cached
* Upload accepts unchecked files
* Payment/webhook secret missing
* CORS allows unsafe origins
* App crashes on refresh
* Client handoff still has demo data

### Strong warning items

Warn clearly but do not always block:

* Missing monitoring
* Missing analytics
* Missing sitemap
* Missing Open Graph image
* Large bundle size
* Weak loading states
* Weak empty states
* No automated tests
* No rate limit
* No backup plan

### Security rules

* Patch framework first.
* Do not trust middleware alone.
* Do not trust frontend auth.
* Do not expose secrets.
* Do not fetch arbitrary URLs.
* Do not public-cache private data.
* Do not ignore dependency advisories.
* Do not deploy with unknown security warnings.

## Checklist

### Build

* [ ] Dependencies installed cleanly
* [ ] Lint passes
* [ ] TypeScript passes
* [ ] Production build passes
* [ ] Production start tested
* [ ] No blocking warnings

### Versions

* [ ] Next.js version checked
* [ ] React version checked
* [ ] React Server Components packages checked
* [ ] Vulnerable versions upgraded
* [ ] Lockfile updated
* [ ] Deployment redeployed after upgrade

### Env

* [ ] `.env.example` exists
* [ ] Production env variables added
* [ ] No missing env variables
* [ ] No secret uses `NEXT_PUBLIC_`
* [ ] Production database configured
* [ ] Production API URL configured
* [ ] Auth secret configured

### API

* [ ] No localhost API calls
* [ ] API routes validate methods
* [ ] API routes validate input
* [ ] API routes validate auth
* [ ] API routes use safe status codes
* [ ] API routes hide internal errors
* [ ] Sensitive routes rate-limited

### Auth

* [ ] Protected pages checked
* [ ] Protected APIs checked
* [ ] Server actions checked
* [ ] Role checks verified
* [ ] Ownership checks verified
* [ ] Middleware not used as only protection

### Security

* [ ] Security headers configured
* [ ] CORS restricted
* [ ] SSRF risk checked
* [ ] Open redirect risk checked
* [ ] Cache poisoning risk checked
* [ ] XSS risk checked
* [ ] Upload risk checked
* [ ] Dependency audit reviewed

### Database

* [ ] Production MongoDB URI configured
* [ ] Connection reuse implemented
* [ ] Indexes checked
* [ ] Pagination exists
* [ ] Sensitive fields excluded
* [ ] No destructive scripts run on deploy

### Images

* [ ] Image domains configured
* [ ] Remote patterns correct
* [ ] SVG policy safe
* [ ] Image sizes optimized
* [ ] No broken production images

### Platform

* [ ] Vercel settings checked
* [ ] Render settings checked if used
* [ ] Railway settings checked if used
* [ ] Domain configured
* [ ] HTTPS working
* [ ] Redirects working
* [ ] Build command correct
* [ ] Start command correct

### Final smoke test

* [ ] Home page works
* [ ] Login works
* [ ] Logout works
* [ ] Dashboard works
* [ ] Protected route blocks guest
* [ ] Forms submit
* [ ] Images load
* [ ] APIs work
* [ ] Database read/write works
* [ ] Refresh works
* [ ] Mobile layout works
* [ ] 404 page works

## Output format

Use this output format.

```md
# Next.js Production Deployment Check

## Verdict

Status: PASS / FAIL / PASS WITH WARNINGS

Deployment target:
App type:
Risk level:

## Blockers

- [ ] Blocker 1
- [ ] Blocker 2

## Security findings

- Finding:
- Risk:
- Required fix:

## Build findings

- Finding:
- Required fix:

## Env findings

- Missing:
- Wrong:
- Exposed risk:

## API findings

- Route:
- Issue:
- Required fix:

## Auth findings

- Protected:
- Missing:
- Required fix:

## Config findings

- next.config:
- vercel.json:
- image domains:
- redirects:
- headers:

## Database findings

- Connection:
- Indexes:
- Query risks:

## Performance findings

- Issue:
- Impact:
- Fix:

## Final checklist

- [ ] Build passes
- [ ] Env complete
- [ ] Security patched
- [ ] Auth checked
- [ ] APIs checked
- [ ] Database checked
- [ ] Images checked
- [ ] Smoke test passed

## Required actions before deploy

1. Action
2. Action
3. Action

## Safe to deploy?

Answer: YES / NO

Reason:
```

## Common mistakes to prevent

* Deploying with `localhost` API URLs
* Forgetting production env variables
* Exposing secrets in client code
* Trusting middleware as the only auth layer
* Deploying vulnerable Next.js versions
* Ignoring React Server Components advisories
* Missing image remote domains
* Breaking images in production
* Using local MongoDB URI
* Missing MongoDB indexes
* Returning unlimited database records
* Public-caching private user data
* Allowing open redirects
* Creating SSRF through server-side fetch
* Allowing wildcard CORS with credentials
* Returning raw server errors
* Uploading files to local filesystem on serverless hosting
* Deploying without final smoke test
* Giving client handoff with demo data
* Ignoring mobile layout before launch

## Quality bar

A deployment is approved only when:

* Build passes.
* TypeScript passes.
* Critical lint issues are fixed.
* Required env variables exist.
* No secrets are exposed.
* Next.js security version is patched.
* API routes are protected.
* Server actions are protected.
* Auth is checked server-side.
* Middleware is not the only defense.
* Database is production-ready.
* Images work in production.
* Redirects are safe.
* Security headers are configured.
* Private data is not public cached.
* Production smoke test passes.

If uncertain, mark as:

```txt
PASS WITH WARNINGS
```

If security is uncertain, mark as:

```txt
FAIL
```

Security uncertainty is not acceptable for production.
