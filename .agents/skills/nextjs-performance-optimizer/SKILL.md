---
name: nextjs-performance-optimizer
description: Use this skill after a Next.js feature works but feels slow, heavy, or production-unready. Use it for improving LCP, reducing JavaScript bundle size, optimizing images, fixing font loading, removing unnecessary client code, reducing hydration cost, and improving Core Web Vitals before deployment.
---
# Next.js Performance Optimizer

## Purpose

Improve real Next.js app performance after the feature already works.

This skill focuses on:

* Better LCP
* Smaller JavaScript bundle
* Faster page loading
* Lower hydration cost
* Better Core Web Vitals
* Cleaner server/client split
* Better image and font loading
* Fewer unnecessary client components

This skill does not redesign the UI.
This skill does not add new features.
This skill optimizes existing working code.

## When to use

Use this skill when:

* A page loads slowly.
* Landing page feels heavy.
* Dashboard takes too long to open.
* Images load late or shift layout.
* Fonts cause layout shift.
* JavaScript bundle is too large.
* Too many files use `"use client"`.
* Lighthouse score is weak.
* LCP, INP, or CLS is poor.
* Client website needs production optimization.
* Page has many charts, images, tables, maps, or animations.
* Next.js app is ready for production review.

Use before:

* Production deployment
* Client handoff
* SEO review
* Performance audit
* Vercel deployment review

Do not use when:

* Feature is not working yet.
* API logic is broken.
* Database queries are incorrect.
* UI design is still changing heavily.
* Security/auth is the main issue.

## Process

### 1. Identify the page type

First classify the page:

* Landing page
* Marketing page
* Dashboard
* Auth page
* Form page
* Image-heavy page
* Map/tracker page
* Admin table page
* Product/detail page

Then identify the performance goal:

* Faster first load
* Better LCP
* Smaller client bundle
* Less hydration
* Better image loading
* Better interaction speed
* Better mobile performance

### 2. Check rendering strategy

Review each route and decide:

* Should this be a Server Component?
* Should this be a Client Component?
* Should this be static?
* Should this be dynamic?
* Should data fetch on server?
* Should data fetch on client?
* Should loading use `loading.tsx`?
* Should slow sections stream with Suspense?

Rules:

* Default to Server Components.
* Use Client Components only for real browser interaction.
* Do not put `"use client"` at page level unless required.
* Keep interactive widgets small.
* Move static UI away from client components.
* Keep data fetching close to the route.
* Avoid fetching static data in `useEffect`.

### 3. Audit `"use client"`

Find all client components.

For each one, check if it really needs:

* `useState`
* `useEffect`
* browser APIs
* event handlers
* animations
* form interactivity
* local storage
* media query hooks
* map libraries
* chart libraries

If not required, remove `"use client"`.

If only one small part needs interactivity:

* Split the component.
* Keep parent as Server Component.
* Move only the interactive part into a small Client Component.

Bad pattern:

```tsx
"use client";

export default function Page() {
  return (
    <main>
      <Hero />
      <StaticContent />
      <Footer />
    </main>
  );
}
```

Better pattern:

```tsx
export default function Page() {
  return (
    <main>
      <Hero />
      <StaticContent />
      <InteractiveWidget />
      <Footer />
    </main>
  );
}
```

### 4. Check LCP element

Find the likely LCP element:

* Hero image
* Main heading
* Banner
* Product image
* First visible card
* Map container
* Dashboard summary card

For LCP image:

* Use `next/image`.
* Add correct `width` and `height`.
* Use `priority` only for real above-the-fold image.
* Use `sizes`.
* Avoid lazy loading the main hero image.
* Avoid huge desktop image on mobile.
* Avoid CSS background image for important LCP image.
* Avoid loading carousel images before needed.

Example:

```tsx
<Image
  src="/hero.webp"
  alt="Dashboard preview"
  width={1200}
  height={700}
  priority
  sizes="(max-width: 768px) 100vw, 1200px"
/>
```

For text LCP:

* Avoid blocking font load.
* Avoid client-only rendering.
* Avoid waiting for API before showing heading.
* Avoid wrapping static hero in client component.

### 5. Optimize images

Check every image:

* Is it using `next/image`?
* Is the file too large?
* Is the format modern?
* Is the image displayed smaller than source?
* Is `sizes` correct?
* Does it cause layout shift?
* Is it above the fold?
* Is it decorative?
* Is it loaded too early?
* Is remote image config correct?

Rules:

* Use WebP or AVIF where possible.
* Compress large images.
* Do not upload 3MB hero images.
* Do not use base64-heavy inline images.
* Do not use unoptimized remote images.
* Do not set `priority` on many images.
* Do not use `fill` without a stable parent size.
* Use blur placeholder only when useful.

### 6. Optimize fonts

Check font loading:

* Use `next/font`.
* Avoid external blocking font CSS.
* Avoid too many font weights.
* Avoid loading unused font styles.
* Use `display: swap` behavior through Next font.
* Keep font usage consistent.
* Avoid importing fonts inside many components.

Bad:

```tsx
import "@fontsource/inter/100.css";
import "@fontsource/inter/200.css";
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
```

Better:

```tsx
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
```

### 7. Analyze JavaScript bundle

Check for heavy dependencies:

* Chart libraries
* Map libraries
* Animation libraries
* Date libraries
* Icon libraries
* Editors
* PDF tools
* Rich text editors
* Large UI kits
* Utility libraries
* Unused packages

Required checks:

* Is the package imported on the server or client?
* Is the whole library imported?
* Can import be more specific?
* Can it load dynamically?
* Can it run only after user interaction?
* Can it be replaced with native code?
* Can it move to server?

Bad:

```tsx
import * as Icons from "lucide-react";
```

Better:

```tsx
import { MapPin, Battery, Wifi } from "lucide-react";
```

Bad:

```tsx
import moment from "moment";
```

Better:

```tsx
import { format } from "date-fns";
```

Or use native `Intl.DateTimeFormat` where enough.

### 8. Use dynamic imports carefully

Use dynamic imports for heavy client-only components:

* Maps
* Charts
* Editors
* PDF viewers
* Video players
* 3D components
* Animation-heavy sections
* Admin-only widgets

Example:

```tsx
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="h-[400px] rounded-xl bg-muted" />,
});
```

Rules:

* Do not dynamically import small components.
* Do not hide bad architecture with dynamic imports.
* Use dynamic import only when it reduces initial cost.
* Always provide a stable loading fallback.
* Avoid layout shift during dynamic load.

### 9. Reduce hydration cost

Check:

* Large client trees
* Many stateful components
* Client-rendered static content
* Large lists
* Heavy animations
* Repeated context providers
* Global client providers
* Client-side data formatting
* Client-side filtering of huge arrays

Fix:

* Move static layout to server.
* Keep providers minimal.
* Push state down.
* Virtualize large lists.
* Paginate large tables.
* Render first page server-side.
* Avoid client-side sorting large datasets.
* Avoid sending full records to browser when not needed.

### 10. Optimize data loading

Check:

* Duplicate API calls
* Waterfall requests
* Client fetching when server fetch works
* Fetching too much data
* Missing pagination
* Missing search debounce
* Missing loading skeleton
* Blocking full page for small widget data

Rules:

* Fetch only required fields.
* Use pagination for large lists.
* Use search debounce.
* Use loading skeletons.
* Avoid sequential fetches if independent.
* Avoid refetching unchanged data.
* Use caching only when data is safe to cache.
* Do not cache private user data incorrectly.

### 11. Optimize dashboards and tables

For dashboards:

* Load summary first.
* Defer heavy charts.
* Paginate tables.
* Avoid rendering thousands of rows.
* Avoid loading hidden tabs.
* Avoid loading all filters upfront.
* Use skeletons for slow widgets.
* Keep charts client-only but lazy loaded.
* Move calculations to server where possible.

For tables:

* Server-side pagination.
* Server-side search.
* Server-side filters.
* Limit fields returned.
* Add database indexes if backend query is slow.
* Do not fetch full collection for frontend filtering.

### 12. Optimize animations

Check:

* Heavy scroll animations
* Too many motion wrappers
* Animating layout properties
* Animating large images
* Client-only page because of animation
* Animation library imported globally

Rules:

* Animate `transform` and `opacity`.
* Avoid animating width, height, top, left.
* Do not wrap full page in client component for animation.
* Lazy load animation-heavy sections.
* Respect reduced motion.
* Use CSS animation when enough.
* Keep Framer Motion/GSAP only where needed.

### 13. Check third-party scripts

Review:

* Analytics
* Chat widgets
* Tracking pixels
* Payment scripts
* Maps
* Embedded videos
* Social widgets

Rules:

* Use `next/script`.
* Load non-critical scripts after interaction or after page load.
* Do not block LCP with third-party scripts.
* Remove unused scripts.
* Do not load scripts globally unless needed globally.

Example:

```tsx
<Script
  src="https://example.com/script.js"
  strategy="lazyOnload"
/>
```

### 14. Check CSS and Tailwind usage

Review:

* Large global CSS
* Unused CSS
* Duplicate styles
* Heavy shadows and filters
* Large backdrop blur usage
* Layout shift from missing dimensions
* Too many nested wrappers

Rules:

* Keep global CSS small.
* Avoid expensive visual effects on large areas.
* Avoid unnecessary `backdrop-blur` everywhere.
* Use stable widths and heights.
* Avoid layout shift from late content.

### 15. Validate Core Web Vitals

Review these metrics:

* LCP: loading speed
* INP: interaction speed
* CLS: visual stability

For LCP:

* Optimize hero image.
* Avoid render blocking.
* Avoid client-only hero.
* Improve server response time.
* Preload only critical resources.

For INP:

* Reduce JavaScript.
* Split heavy components.
* Avoid long tasks.
* Debounce input handlers.
* Avoid expensive re-renders.

For CLS:

* Add image dimensions.
* Reserve space for dynamic content.
* Avoid late font shifts.
* Avoid inserting banners above content.
* Use stable loading fallbacks.

## Rules

### General rules

* Do not optimize before the feature works.
* Do not rewrite the full app without proof.
* Do not add random libraries.
* Do not make performance worse for cleaner-looking code.
* Do not remove accessibility for speed.
* Do not remove security for speed.
* Do not blindly use `useMemo` and `useCallback`.
* Do not mark every component as dynamic.
* Do not cache private data without checking.
* Do not use `priority` on every image.
* Do not use `"use client"` at route level unless truly required.

### Next.js rules

* Prefer Server Components.
* Keep Client Components small.
* Use `next/image` for real images.
* Use `next/font` for fonts.
* Use `next/script` for third-party scripts.
* Use dynamic imports for heavy client-only widgets.
* Use route-level loading UI where useful.
* Avoid unnecessary client-side fetching.
* Avoid large serialized props.
* Avoid exposing server-only code to client.

### Production rules

* Run production build before final claim.
* Check bundle size before and after.
* Check Lighthouse or Web Vitals where possible.
* Test mobile viewport.
* Test slow network.
* Test image-heavy routes.
* Test dashboard routes.
* Check accessibility after optimization.
* Check SEO after optimization.
* Check no feature was broken.

## Checklist

### Page audit checklist

* [ ] Page type identified.
* [ ] Main performance problem identified.
* [ ] LCP element identified.
* [ ] Client components reviewed.
* [ ] Unnecessary `"use client"` removed.
* [ ] Static UI moved to server.
* [ ] Heavy widgets isolated.
* [ ] Dynamic imports used only where useful.
* [ ] Loading fallback added.
* [ ] Layout shift avoided.

### Image checklist

* [ ] Uses `next/image`.
* [ ] Correct `width` and `height`.
* [ ] Correct `sizes`.
* [ ] Hero image uses `priority` only if needed.
* [ ] Non-critical images lazy load.
* [ ] Images compressed.
* [ ] Modern formats used.
* [ ] No oversized mobile images.
* [ ] No layout shift from images.

### Font checklist

* [ ] Uses `next/font`.
* [ ] Only needed weights loaded.
* [ ] No blocking external font CSS.
* [ ] No repeated font imports.
* [ ] Font shift checked.

### Bundle checklist

* [ ] Bundle analyzer checked.
* [ ] Large dependencies identified.
* [ ] Unused dependencies removed.
* [ ] Import style optimized.
* [ ] Heavy client libraries lazy loaded.
* [ ] Icons imported individually.
* [ ] Date/utility libraries checked.
* [ ] Admin-only code not loaded publicly.

### Hydration checklist

* [ ] Large client trees reduced.
* [ ] Providers minimized.
* [ ] State pushed down.
* [ ] Static components server-rendered.
* [ ] Large lists paginated or virtualized.
* [ ] Client-only formatting reduced.
* [ ] Expensive re-renders reduced.

### Data checklist

* [ ] Duplicate fetches removed.
* [ ] API response size reduced.
* [ ] Pagination added where needed.
* [ ] Search/filter handled server-side if large.
* [ ] Loading skeleton added.
* [ ] Cache strategy checked.
* [ ] Private data not cached incorrectly.

### Dashboard checklist

* [ ] Summary loads first.
* [ ] Charts lazy loaded.
* [ ] Tables paginated.
* [ ] Hidden tabs not loaded early.
* [ ] Large calculations moved server-side.
* [ ] Slow widgets isolated.

### Core Web Vitals checklist

* [ ] LCP improved.
* [ ] INP risk reduced.
* [ ] CLS risk removed.
* [ ] Mobile performance checked.
* [ ] Slow network checked.
* [ ] Accessibility not broken.
* [ ] SEO not broken.

## Output format

Always return output in this format:

````md
# Next.js Performance Review

## 1. Current problem

- Page:
- Page type:
- Main issue:
- Likely user impact:

## 2. Biggest performance risks

| Risk | Severity | Why it matters | Fix |
|---|---:|---|---|
|  | High/Medium/Low |  |  |

## 3. LCP fixes

- Current LCP risk:
- Required fix:
- Code/files to change:

## 4. JavaScript bundle fixes

- Heavy imports:
- Unnecessary client code:
- Dynamic import candidates:
- Dependencies to remove or replace:

## 5. Image fixes

- Oversized images:
- Missing `sizes`:
- Wrong `priority` usage:
- Layout shift risks:

## 6. Font fixes

- Font loading issue:
- Unused weights:
- Suggested fix:

## 7. Hydration fixes

- Components to convert to Server Components:
- Components to split:
- Providers to reduce:
- State to push down:

## 8. Data loading fixes

- Duplicate fetches:
- Over-fetching:
- Pagination/search issues:
- Cache risks:

## 9. Exact implementation plan

### Step 1
- File:
- Change:
- Reason:

### Step 2
- File:
- Change:
- Reason:

### Step 3
- File:
- Change:
- Reason:

## 10. Validation commands

```bash
npm run build
npm run lint
npm run type-check
````

Optional if configured:

```bash
ANALYZE=true npm run build
```

## 11. Final checklist

* [ ] Build passes
* [ ] Page still works
* [ ] Mobile layout checked
* [ ] LCP element optimized
* [ ] Images optimized
* [ ] Bundle reduced
* [ ] Unneeded client code removed
* [ ] No layout shift introduced
* [ ] Accessibility still valid
* [ ] SEO still valid

```

## Common mistakes to prevent

- Adding `"use client"` to full page.
- Using client fetching for static content.
- Loading map/chart libraries on initial page load.
- Importing complete icon libraries.
- Using huge hero images.
- Missing image dimensions.
- Using `priority` on many images.
- Using CSS background for important LCP image.
- Loading five font weights for one page.
- Importing animation library globally.
- Rendering large tables fully on client.
- Filtering thousands of records in browser.
- Using `useMemo` everywhere without reason.
- Dynamically importing small components.
- Adding skeletons that cause layout shift.
- Caching private user data incorrectly.
- Optimizing code but breaking SEO.
- Improving Lighthouse while hurting real UX.
- Removing accessibility labels for cleaner UI.
- Shipping without production build check.

## Quality bar

The optimization is acceptable only when:

- The feature still works.
- Production build passes.
- No new TypeScript errors.
- No obvious accessibility regression.
- No SEO-critical content is hidden behind client-only rendering.
- Main LCP element is optimized.
- Unnecessary client components are removed.
- Heavy widgets are lazy loaded where useful.
- Images have correct size and loading behavior.
- Fonts are loaded through a controlled strategy.
- Dashboard/table pages do not load huge data upfront.
- The final answer gives exact file-level changes.
- The final answer avoids vague advice.
- Every recommendation has a clear reason.