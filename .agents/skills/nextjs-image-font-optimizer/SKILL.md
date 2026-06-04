---
name: nextjs-image-font-optimizer
description: Use when optimizing images, fonts, LCP, layout shift, hero visuals, galleries, ecommerce product images, portfolio pages, landing pages, client websites, or design-heavy Next.js pages. This skill forces correct next/image usage, font loading, image sizing, remote image config, placeholders, and Core Web Vitals-safe implementation.
---

# Next.js Image Font Optimizer

## Purpose

Optimize images and fonts in Next.js.

This skill improves:

* LCP
* CLS
* Image loading speed
* Font loading speed
* Visual stability
* Mobile performance
* Design-heavy page performance
* Hero section performance
* Gallery performance
* Ecommerce image performance

Main goal:

Keep beautiful pages fast.

## When to use

Use this skill for:

* Portfolio websites
* Client websites
* Ecommerce pages
* Landing pages
* Gallery pages
* Product pages
* Blog pages
* Hero sections
* Image-heavy sections
* Remote CMS images
* Local image assets
* Custom fonts
* Google fonts
* Local fonts
* LCP improvement
* Layout shift fixes

Do not use this skill for:

* API-only work
* Database schema work
* Auth logic
* Backend validation
* Non-visual backend features
* Small text-only pages

## Process

### 1. Audit page visual assets

Identify all visual assets:

* Hero image
* Background image
* Product image
* Gallery image
* Avatar
* Logo
* Icon
* Open Graph image
* Decorative image
* Remote CMS image
* Video thumbnail

For each image, identify:

* Is it above the fold?
* Can it become LCP?
* Is it local or remote?
* Is it fixed size or responsive?
* Does it need cropping?
* Does it need blur placeholder?
* Does it need lazy loading?
* Does it need eager loading?
* Does it need `priority` or preload?
* Does it need `fill`?
* Does it need `sizes`?

Do not optimize blindly.

### 2. Use `next/image` by default

Use `next/image` for normal images.

Use it for:

* Hero images
* Cards
* Products
* Gallery items
* Blog covers
* Avatars
* Banners
* Thumbnails
* CMS images

Avoid raw `<img>` unless there is a real reason.

Allowed raw `<img>` cases:

* External script-controlled image
* Email template preview
* SVG icon where optimization is not needed
* Tiny inline decorative asset
* Unsupported special case
* Third-party widget output

If raw `<img>` is used, explain why.

### 3. Set image dimensions correctly

Every image must prevent layout shift.

Use one of these patterns:

#### Fixed dimensions

Use when image has known width and height.

```tsx
import Image from "next/image";

export function Avatar() {
  return (
    <Image
      src="/avatar.jpg"
      alt="User profile photo"
      width={96}
      height={96}
    />
  );
}
```

#### Responsive fixed ratio

Use when image should scale with layout.

```tsx
import Image from "next/image";

export function BlogCardImage() {
  return (
    <Image
      src="/blog-cover.jpg"
      alt="Blog cover"
      width={1200}
      height={675}
      sizes="(max-width: 768px) 100vw, 33vw"
      className="h-auto w-full rounded-xl object-cover"
    />
  );
}
```

#### Fill container

Use when image fills a parent box.

```tsx
import Image from "next/image";

export function HeroImage() {
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl">
      <Image
        src="/hero.jpg"
        alt="Dashboard preview"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
    </div>
  );
}
```

Rules:

* Use `width` and `height` when possible.
* Use `fill` only with a sized parent.
* Parent of `fill` must have `position: relative`.
* Parent of `fill` must have fixed height, aspect ratio, or layout size.
* Never use `fill` inside an unsized parent.
* Always set meaningful `sizes` for responsive images.
* Do not leave browser guessing image size.

### 4. Choose correct `sizes`

`sizes` tells the browser how wide the image appears.

Bad:

```tsx
<Image
  src="/product.jpg"
  alt="Product"
  width={1200}
  height={1200}
/>
```

Problem:

The browser may download a larger image than needed.

Better:

```tsx
<Image
  src="/product.jpg"
  alt="Product"
  width={1200}
  height={1200}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
/>
```

Common `sizes` patterns:

Full-width hero:

```txt
100vw
```

Two-column layout:

```txt
(max-width: 768px) 100vw, 50vw
```

Three-column cards:

```txt
(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw
```

Four-column product grid:

```txt
(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw
```

Avatar:

```txt
96px
```

Rules:

* Add `sizes` for responsive images.
* Add `sizes` when using `fill`.
* Match `sizes` to actual CSS layout.
* Do not use `100vw` for small card images.
* Wrong `sizes` wastes bandwidth.

### 5. Optimize LCP image

Find the likely LCP element.

Usually:

* Hero image
* Main banner
* Large product image
* Main heading block
* Blog cover image

If the LCP element is an image:

* Use `next/image`
* Add correct dimensions
* Add correct `sizes`
* Use `priority` when needed
* Avoid lazy loading for LCP image
* Avoid heavy overlays
* Avoid huge source image
* Avoid client-only rendering for hero
* Avoid animation delaying visibility

Example:

```tsx
<Image
  src="/landing-hero.jpg"
  alt="Modern ecommerce storefront"
  width={1600}
  height={900}
  priority
  sizes="100vw"
  className="h-auto w-full object-cover"
/>
```

Rules:

* Only prioritize important above-fold images.
* Do not add `priority` to every image.
* Do not lazy-load the main hero image.
* Do not hide LCP image behind slow animation.
* Do not render LCP image only after client hydration.

### 6. Use blur placeholders carefully

Use blur placeholder for:

* Hero images
* Gallery images
* Product images
* Blog covers
* Large remote images

Example with static local import:

```tsx
import Image from "next/image";
import heroImage from "@/public/images/hero.jpg";

export function Hero() {
  return (
    <Image
      src={heroImage}
      alt="Premium website dashboard"
      placeholder="blur"
      priority
      sizes="100vw"
      className="h-auto w-full object-cover"
    />
  );
}
```

Rules:

* Static imports can provide blur automatically.
* Remote images need blur data manually.
* Do not use blur on tiny icons.
* Do not use blur if it creates ugly visual noise.
* Do not use heavy placeholder logic.

### 7. Configure remote images safely

For remote images, configure `remotePatterns`.

Example:

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.example-cdn.com",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
```

Rules:

* Use `remotePatterns`.
* Keep allowed domains strict.
* Avoid broad wildcard domains.
* Do not allow unknown image hosts.
* Do not use untrusted user-controlled URLs blindly.
* Validate image URLs from CMS/API.
* Avoid deprecated loose config patterns.

### 8. Handle SVG correctly

Use SVG carefully.

Use inline/component SVG for:

* Icons
* Logos
* Simple vector graphics

Use normal file reference for:

* Large decorative SVGs
* Marketing illustrations
* Static public SVG assets

Rules:

* Do not optimize SVG through `next/image` unless needed.
* Do not allow untrusted SVG uploads.
* Treat SVG as risky if user-controlled.
* Avoid remote SVG from unknown sources.

### 9. Avoid layout shift

Prevent CLS problems.

Rules:

* Always reserve image space.
* Use width/height or aspect ratio.
* Do not inject images without size.
* Do not load fonts causing text jump.
* Do not animate layout during initial load.
* Do not replace placeholders with different dimensions.
* Do not use unsized background media above fold.
* Avoid late-loading banners above content.

Good:

```tsx
<div className="relative aspect-[4/3] w-full">
  <Image
    src="/product.jpg"
    alt="Product"
    fill
    sizes="(max-width: 768px) 100vw, 25vw"
    className="object-cover"
  />
</div>
```

Bad:

```tsx
<div>
  <Image
    src="/product.jpg"
    alt="Product"
    fill
  />
</div>
```

### 10. Optimize background images

Prefer `next/image` over CSS background for important images.

Use CSS background only for:

* Decorative textures
* Gradients
* Tiny patterns
* Non-content visuals

Do not use CSS background for:

* LCP hero image
* Product image
* Blog cover
* Gallery image
* SEO/content image

If background image is required:

* Compress it
* Use modern format
* Keep file small
* Reserve section height
* Avoid huge mobile downloads

### 11. Optimize fonts with `next/font`

Use `next/font` for fonts.

Use Google font:

```tsx
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

Use local font:

```tsx
import localFont from "next/font/local";

const satoshi = localFont({
  src: [
    {
      path: "../public/fonts/Satoshi-Variable.woff2",
      weight: "300 900",
      style: "normal",
    },
  ],
  variable: "--font-satoshi",
  display: "swap",
});
```

Rules:

* Use `next/font`.
* Prefer variable fonts.
* Prefer `.woff2`.
* Use only needed weights.
* Avoid many font families.
* Avoid loading fonts through external CSS.
* Avoid `@import` from Google Fonts.
* Avoid font files larger than needed.
* Use `display: "swap"` unless design requires otherwise.

### 12. Limit font weight and family count

Bad:

```txt
Font 1: 300, 400, 500, 600, 700, 800, 900
Font 2: 300, 400, 500, 600, 700, 800, 900
Font 3: 400, 700
```

Better:

```txt
Primary variable font: 300–900
Mono font: 400–700 only if needed
```

Rules:

* One main font is usually enough.
* Two fonts maximum for most sites.
* Use variable font when available.
* Do not load unused weights.
* Do not load decorative fonts globally.
* Use decorative font only where needed.

### 13. Connect fonts to Tailwind

Use CSS variables.

Example:

```tsx
<html className={`${inter.variable} ${satoshi.variable}`}>
```

Tailwind config:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)"],
        display: ["var(--font-satoshi)"],
      },
    },
  },
};

export default config;
```

Rules:

* Use CSS variable font setup.
* Keep font usage consistent.
* Do not hardcode random font stacks everywhere.
* Do not define fonts differently per component.

### 14. Optimize image source files

Before using images:

* Resize huge images
* Compress images
* Convert screenshots carefully
* Use WebP/AVIF when suitable
* Keep transparent PNG only when needed
* Avoid 4K images for small cards
* Avoid large animated GIFs
* Use video instead of huge GIFs when needed

Practical limits:

* Hero image: aim under 300 KB when possible.
* Card image: aim under 100 KB when possible.
* Avatar/logo: aim under 50 KB when possible.
* Large gallery image: compress aggressively.

These are not hard rules.

They are practical targets.

### 15. Check mobile first

Images often fail on mobile.

Check:

* Mobile hero size
* Card image size
* Gallery image size
* Product image crop
* Font loading
* Text shift
* Above-fold image weight
* Slow 4G loading
* LCP element
* CLS after load

Rules:

* Do not send desktop-sized images to mobile.
* Do not use desktop crop blindly.
* Do not hide large images with CSS after download.
* Use responsive layout and `sizes`.

### 16. Verify final result

After implementation, check:

* No raw `<img>` without reason
* `next/image` used correctly
* All images have `alt`
* Width/height or `fill` used correctly
* `fill` parent has size
* `sizes` exists where needed
* Remote domains configured
* LCP image prioritized
* Non-critical images lazy-loaded
* Font loaded with `next/font`
* No external font CSS
* No layout shift
* No oversized images

## Rules

### Image rules

* Use `next/image` by default.
* Set `alt` on every image.
* Use correct width and height.
* Use `fill` only with a sized parent.
* Add `sizes` for responsive images.
* Add `priority` only for true above-fold LCP images.
* Do not add `priority` everywhere.
* Do not use raw `<img>` without reason.
* Do not use CSS background for important content images.
* Do not serve huge images for small UI.
* Do not allow unknown remote image hosts.
* Do not use untrusted SVGs.

### Font rules

* Use `next/font`.
* Prefer local or Google fonts through `next/font`.
* Prefer variable fonts.
* Prefer `.woff2`.
* Load only required weights.
* Keep font families minimal.
* Do not use `@import` for fonts.
* Do not load fonts from external CSS.
* Avoid decorative fonts globally.
* Use CSS variables for Tailwind integration.

### LCP rules

* Identify LCP element.
* Optimize LCP image first.
* Prioritize only the main above-fold image.
* Avoid client-only rendering for hero visuals.
* Avoid delayed entrance animation for LCP image.
* Avoid huge hero files.
* Avoid layout shift above fold.

### CLS rules

* Reserve image space.
* Reserve hero section height.
* Use aspect ratio.
* Avoid late banners above content.
* Avoid font layout shift.
* Avoid swapping images with different dimensions.

## Checklist

### Images

* [ ] All important images use `next/image`
* [ ] Every image has useful `alt`
* [ ] Width and height are set where possible
* [ ] `fill` is used only with sized parent
* [ ] Responsive images have correct `sizes`
* [ ] LCP image is identified
* [ ] LCP image uses `priority` if needed
* [ ] Non-critical images are lazy-loaded
* [ ] Blur placeholder used only where useful
* [ ] No oversized source images
* [ ] No unnecessary PNGs
* [ ] No huge GIFs
* [ ] Remote images use strict `remotePatterns`
* [ ] SVG usage is safe

### Fonts

* [ ] Fonts use `next/font`
* [ ] No Google Font `@import`
* [ ] No external font CSS
* [ ] Variable font used if possible
* [ ] `.woff2` used for local font
* [ ] Only needed weights loaded
* [ ] Font families are limited
* [ ] Fonts connected through CSS variables
* [ ] Tailwind font config is clean

### LCP

* [ ] Main LCP element found
* [ ] LCP image optimized
* [ ] LCP image not lazy-loaded
* [ ] LCP image not delayed by client-only rendering
* [ ] LCP image not hidden behind heavy animation
* [ ] Hero image file size is reasonable
* [ ] Mobile LCP checked

### CLS

* [ ] Image space reserved
* [ ] Hero space reserved
* [ ] No unsized `fill` images
* [ ] No font layout jump
* [ ] No late injected top banners
* [ ] No changing image aspect ratios after load

### Final review

* [ ] Mobile image sizes checked
* [ ] Desktop image sizes checked
* [ ] Network waterfall checked
* [ ] Lighthouse checked if available
* [ ] Core Web Vitals risk reduced

## Output format

When this skill is used, respond like this:

````txt
# Next.js Image Font Optimization Plan

## 1. Page / section

- Page:
- Section:
- Main visual risk:

## 2. Image audit

| Image | Location | Type | Above fold | LCP risk | Current issue | Fix |
|---|---|---|---|---|---|---|

## 3. Image implementation

- Use next/image:
- Use width/height:
- Use fill:
- Parent sizing:
- sizes value:
- priority:
- placeholder:
- alt text:

## 4. Remote image config

- Remote host:
- remotePatterns needed:
- Security risk:

## 5. Font audit

- Current font loading:
- Font source:
- Families:
- Weights:
- Problems:

## 6. Font implementation

- Use next/font:
- Google or local:
- Variable font:
- CSS variable:
- Tailwind config:

## 7. LCP fixes

- Likely LCP element:
- Current problem:
- Required fix:

## 8. CLS fixes

- Layout shift source:
- Required reserved space:
- Aspect ratio:
- Font shift fix:

## 9. Files to change

```txt
app/...
components/...
next.config.ts
tailwind.config.ts
public/...
````

## 10. Do not do

* Do not:
* Do not:
* Do not:

## 11. Final checklist

* [ ] next/image used correctly
* [ ] sizes added
* [ ] LCP image prioritized
* [ ] fonts moved to next/font
* [ ] no layout shift risk

```

## Common mistakes to prevent

- Using raw `<img>` everywhere
- Missing width and height
- Using `fill` without sized parent
- Forgetting `sizes`
- Using `100vw` for small card images
- Adding `priority` to every image
- Lazy-loading the hero image
- Using CSS background for LCP image
- Loading huge desktop images on mobile
- Using external Google Font CSS
- Using `@import` for fonts
- Loading too many font weights
- Loading too many font families
- Not using variable fonts
- Not using `.woff2`
- Causing font layout shift
- Allowing broad remote image hosts
- Using unsafe remote SVGs
- Ignoring mobile LCP
- Ignoring CLS

## Quality bar

A good implementation:

- Uses `next/image` correctly
- Reserves image space
- Uses correct `sizes`
- Prioritizes only the right LCP image
- Uses strict remote image config
- Uses `next/font`
- Loads minimal font weights
- Avoids layout shift
- Keeps mobile fast
- Keeps design quality intact

A bad implementation:

- Uses raw `<img>` without reason
- Has unsized images
- Uses `fill` incorrectly
- Downloads oversized images
- Loads fonts from external CSS
- Loads too many font weights
- Causes layout shift
- Makes hero image slow
- Ignores mobile performance
- Optimizes blindly without checking LCP
```
