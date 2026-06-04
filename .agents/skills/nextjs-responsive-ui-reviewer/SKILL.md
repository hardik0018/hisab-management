---
name: nextjs-responsive-ui-reviewer
description: Use after building any Next.js UI to review mobile, tablet, desktop, spacing, overflow, layout shift, touch targets, forms, dashboards, maps, tracker screens, and responsive behavior before handoff or deployment.
---
# Next.js Responsive UI Reviewer

## Purpose

Review a finished Next.js UI across screen sizes.

This skill catches design bugs after UI is built.

It checks:

* Mobile layout
* Tablet layout
* Desktop layout
* Overflow
* Spacing
* Typography
* Touch targets
* Forms
* Tables
* Cards
* Navigation
* Modals
* Maps
* Dashboard screens
* Tracker screens
* Image behavior
* Layout shift
* Real device usability

Main goal:

Find responsive UI bugs before the client or user finds them.

## When to use

Use this skill after:

* Building a page
* Building a dashboard
* Building a form
* Building a landing page
* Building a client website
* Building mobile-first screens
* Building map/tracker screens
* Building ecommerce/product pages
* Building gallery pages
* Building responsive cards
* Building navigation
* Building modal/drawer UI
* Redesigning a large section
* Preparing for handoff
* Preparing for production

Do not use this skill before UI exists.

Use `nextjs-project-planner` before coding.

Use this skill after implementation.

## Process

### 1. Identify review scope

First identify:

* Page URL
* Main screen purpose
* Target users
* Main devices
* Critical actions
* Important content
* Risky UI areas

Common risky areas:

* Header
* Mobile menu
* Hero section
* Forms
* Tables
* Cards
* Sidebar
* Modals
* Maps
* Speedometer sections
* Charts
* Image grids
* Footer
* Sticky buttons
* Bottom navigation

Do not review only the desktop screenshot.

Responsive bugs usually hide on mobile and tablet.

### 2. Test required viewport widths

Review at minimum:

```txt
320px  - very small mobile
360px  - common Android
375px  - iPhone standard
390px  - modern iPhone
414px  - large mobile
768px  - tablet portrait
1024px - tablet landscape / small laptop
1280px - laptop
1440px - desktop
1536px+ - large desktop
```

Rules:

* Do not test only one mobile width.
* Do not test only Chrome responsive default.
* Test both narrow and wide breakpoints.
* Test exact breakpoint edges.
* Test just before and after layout changes.

Breakpoint edge examples:

```txt
639px
640px
767px
768px
1023px
1024px
1279px
1280px
```

### 3. Check mobile first

Mobile must work before desktop polish.

Check:

* No horizontal scroll
* Content fits viewport
* Text is readable
* Buttons are tappable
* Cards do not feel cramped
* Header does not wrap badly
* Mobile menu works
* Sticky elements do not cover content
* Forms are easy to complete
* Bottom actions are reachable
* Important content appears early
* Images are not oversized
* Map UI remains usable
* Tables do not break layout

Rules:

* Do not hide important actions on mobile.
* Do not shrink text too much.
* Do not keep desktop grid on mobile.
* Do not force users to pinch zoom.
* Do not let fixed elements cover inputs.

### 4. Check tablet layout

Tablet is not just large mobile.

Check:

* Cards use better columns
* Sidebar behavior is correct
* Forms are not too stretched
* Tables have enough space
* Modals fit safely
* Map/tracker screens use available width
* Navigation does not look empty
* Dashboard density is balanced
* Content does not become awkwardly wide

Rules:

* Do not ignore 768px to 1024px.
* Many broken dashboards fail here.
* Tablet needs its own layout decisions.

### 5. Check desktop layout

Desktop must use space well.

Check:

* Max width is controlled
* Content is not too stretched
* Large empty gaps are avoided
* Layout alignment is consistent
* Sidebar and content balance well
* Hero section does not become oversized
* Cards do not look tiny
* Tables are readable
* Footer does not float awkwardly
* Large screens do not expose weak spacing

Rules:

* Do not use full width for every section.
* Use max-width containers.
* Do not make text lines too long.
* Avoid huge unused whitespace.

### 6. Check horizontal overflow

Horizontal overflow is a serious bug.

Check:

* Body width
* Root layout width
* Header width
* Cards
* Tables
* Forms
* Images
* Code blocks
* Long words
* Bad flex rows
* Fixed width elements
* Absolute positioned items
* Maps and charts
* Third-party widgets

Common causes:

* `w-screen` inside padded container
* Fixed pixel width
* Long unbroken text
* `min-w` too large
* Grid columns not collapsing
* Tables without scroll wrapper
* Images without max width
* Flex children missing `min-w-0`
* Absolute elements outside viewport

Fix patterns:

```tsx
<div className="min-w-0">
```

```tsx
<div className="overflow-x-auto">
```

```tsx
<img className="max-w-full" />
```

```tsx
<div className="w-full max-w-screen-xl">
```

Rules:

* Do not hide overflow globally as a lazy fix.
* Find the actual overflowing element.
* `overflow-x-hidden` can hide real bugs.
* Use horizontal scroll only when valid, like tables.

### 7. Check spacing system

Spacing must be consistent.

Check:

* Section padding
* Card padding
* Gap between cards
* Form field spacing
* Button spacing
* Header spacing
* Footer spacing
* Mobile vertical spacing
* Desktop horizontal spacing
* Empty state spacing
* Error state spacing

Rules:

* Mobile spacing should be tighter.
* Desktop spacing can be wider.
* Do not use random spacing values everywhere.
* Use consistent scale.
* Avoid cramped mobile cards.
* Avoid huge desktop gaps.

Common Tailwind patterns:

```txt
px-4 sm:px-6 lg:px-8
py-8 sm:py-12 lg:py-16
gap-4 sm:gap-6 lg:gap-8
```

### 8. Check typography

Typography must scale safely.

Check:

* Mobile heading size
* Desktop heading size
* Body readability
* Line height
* Text wrapping
* Long titles
* Labels
* Helper text
* Error messages
* Button text
* Table text
* Chart labels
* Map labels

Rules:

* Do not use giant desktop headings on mobile.
* Do not use tiny body text on mobile.
* Keep line length readable.
* Use responsive type scale.
* Test real content, not short dummy text.

Common patterns:

```txt
text-3xl sm:text-4xl lg:text-6xl
text-sm sm:text-base
leading-tight
leading-relaxed
```

### 9. Check touch targets

Touch targets must be easy to tap.

Check:

* Buttons
* Icon buttons
* Menu items
* Tabs
* Dropdown triggers
* Checkboxes
* Radio buttons
* Form controls
* Map buttons
* Tracking controls
* Close buttons
* Pagination buttons
* Card click areas

Rules:

* Minimum safe target: 24×24 CSS pixels.
* Better mobile target: around 44–48px.
* Add padding around icons.
* Do not place small actions too close.
* Do not use tiny close buttons.
* Do not make map controls hard to tap.

Good pattern:

```tsx
<button className="min-h-11 min-w-11 px-4">
  Save
</button>
```

Icon button:

```tsx
<button className="flex h-11 w-11 items-center justify-center">
  <Icon className="h-5 w-5" />
</button>
```

### 10. Check forms

Forms break often on mobile.

Check:

* Inputs are full width on mobile
* Labels are visible
* Error messages fit
* Submit button is reachable
* Keyboard does not cover critical controls
* Date/time inputs fit
* File upload works
* Select dropdown fits
* Multi-column form collapses
* Validation state is clear
* Required fields are obvious

Rules:

* Use one-column form on mobile.
* Avoid tiny side-by-side fields.
* Keep submit button visible.
* Do not place important help text too far away.
* Do not rely only on placeholder text.

### 11. Check dashboard layouts

Dashboards need special review.

Check:

* Sidebar collapse
* Topbar wrapping
* Stats cards
* Tables
* Filters
* Search bar
* Date picker
* Charts
* Empty states
* Row actions
* Pagination
* Mobile card alternative
* Sticky header behavior

Rules:

* Do not force desktop table layout on mobile.
* Use card layout or horizontal scroll when needed.
* Keep filters usable on mobile.
* Avoid tiny chart labels.
* Keep primary action visible.

### 12. Check map and tracker screens

Map/tracker screens need stricter review.

Check:

* Map height on mobile
* Map controls spacing
* Marker visibility
* Bottom sheet behavior
* Speedometer size
* Live status badge
* GPS status
* Battery/network status
* Last update text
* Start/stop button
* Route history visibility
* Sticky controls
* Touch interaction
* Zoom controls
* Safe area on mobile

Rules:

* Do not let map consume all screen space.
* Do not cover marker with panels.
* Do not make speedometer unreadable.
* Keep emergency/start/stop actions reachable.
* Use bottom sheet carefully.
* Test landscape orientation.

### 13. Check navigation

Check:

* Desktop nav alignment
* Mobile nav open/close
* Menu overlay size
* Active route state
* Dropdown behavior
* Sticky header
* Back button behavior
* Keyboard accessibility
* Long nav labels
* Header overflow

Rules:

* Mobile menu must not cause layout jump.
* Header must not create horizontal scroll.
* Sticky header must not cover anchors.
* Menu items must be tappable.

### 14. Check modals and drawers

Check:

* Modal fits mobile height
* Content scrolls inside modal
* Close button visible
* CTA visible
* Keyboard focus safe
* Drawer width safe
* Overlay does not block wrong area
* Form inside modal works

Rules:

* Do not use desktop-sized modal on mobile.
* Use bottom sheet for mobile when better.
* Avoid hidden submit button below viewport.
* Keep close action visible.

### 15. Check images and media

Check:

* Images keep aspect ratio
* No stretched faces/products
* `next/image` sizing correct
* No layout shift while loading
* Gallery grid collapses correctly
* Hero crop works on mobile
* Product image is clear
* Background image does not hide text
* Videos fit container
* Iframes are responsive

Rules:

* Use `max-w-full`.
* Use correct aspect ratio.
* Use responsive `sizes` for `next/image`.
* Do not crop important subject on mobile.
* Do not use huge image where small one is enough.

### 16. Check empty, loading, and error states

Responsive review must include non-happy states.

Check:

* Empty state
* Loading skeleton
* Error state
* Validation error
* No internet state if relevant
* Unauthorized state
* Not-found state
* Long loading state

Rules:

* Do not review only full-data screens.
* Empty states often break layout.
* Error messages often overflow.
* Skeletons must match final layout.

### 17. Check real content

Dummy content hides problems.

Test with:

* Long names
* Long emails
* Long addresses
* Long product names
* Long button text
* Many cards
* Empty lists
* One item only
* Large numbers
* Gujarati/Hindi text if project needs it
* Mixed English + local language

Rules:

* Do not trust perfect sample text.
* Test worst-case realistic text.
* Check wrapping and truncation.

### 18. Check safe areas

For mobile devices, check:

* Top notch area
* Bottom browser bar
* Sticky bottom button
* Mobile Safari viewport height
* Android Chrome viewport height
* Landscape orientation

Rules:

* Avoid fixed `100vh` problems.
* Prefer modern viewport units where useful.
* Do not place important actions under browser UI.

Useful classes:

```txt
min-h-dvh
h-dvh
pb-safe
```

Use safe area CSS if project supports it.

### 19. Check accessibility basics

Check:

* Visible focus states
* Keyboard navigation
* Contrast
* Labels
* Button names
* Link names
* Touch targets
* Error messages
* Motion sensitivity
* Form association

Rules:

* Do not remove focus outline without replacement.
* Do not use icon-only buttons without accessible name.
* Do not rely only on color for status.

### 20. Record issues clearly

Every issue should include:

* Screen size
* Page/section
* Problem
* Cause
* Fix
* Priority

Priority levels:

* P0: Blocks core action
* P1: Serious usability bug
* P2: Visual/responsive bug
* P3: Polish issue

Do not only say “make responsive.”

Be specific.

## Rules

### Review rules

* Review mobile first.
* Review tablet separately.
* Review desktop separately.
* Check breakpoint edges.
* Check real content.
* Check happy and error states.
* Check touch targets.
* Check overflow.
* Check forms.
* Check dashboard/table behavior.
* Check map/tracker behavior if present.

### Fix rules

* Fix root cause, not symptoms.
* Do not hide overflow globally.
* Do not add random media queries.
* Do not add random pixel values.
* Do not break desktop while fixing mobile.
* Do not break mobile while fixing desktop.
* Prefer consistent Tailwind responsive classes.
* Prefer container and grid fixes.
* Prefer `min-w-0` for flex overflow.
* Prefer scroll wrappers for tables.

### Tailwind rules

* Use mobile-first classes.
* Use `sm`, `md`, `lg`, `xl`, `2xl` intentionally.
* Do not use breakpoint classes randomly.
* Use consistent spacing scale.
* Avoid fixed widths on mobile.
* Avoid unnecessary `absolute` positioning.
* Use `max-w-*` for readable desktop sections.
* Use `overflow-x-auto` only where correct.

### Touch rules

* Keep mobile actions easy to tap.
* Icon buttons need enough hit area.
* Important actions need visible placement.
* Avoid tiny controls on maps.
* Avoid dense row actions on mobile.

## Checklist

### Viewports

* [ ] 320px checked
* [ ] 360px checked
* [ ] 375px checked
* [ ] 390px checked
* [ ] 414px checked
* [ ] 768px checked
* [ ] 1024px checked
* [ ] 1280px checked
* [ ] 1440px checked
* [ ] Breakpoint edges checked

### Mobile

* [ ] No horizontal scroll
* [ ] Header works
* [ ] Mobile menu works
* [ ] Text readable
* [ ] Buttons tappable
* [ ] Forms usable
* [ ] Cards stack correctly
* [ ] Images scale correctly
* [ ] Sticky elements safe
* [ ] Primary action visible

### Tablet

* [ ] Layout uses space well
* [ ] Sidebar behavior correct
* [ ] Cards/grid balanced
* [ ] Forms not awkward
* [ ] Tables usable
* [ ] Modals fit
* [ ] Dashboard density correct

### Desktop

* [ ] Max width controlled
* [ ] Content not stretched
* [ ] Alignment consistent
* [ ] Spacing balanced
* [ ] Typography readable
* [ ] Footer stable
* [ ] Large screen layout clean

### Overflow

* [ ] Body has no horizontal scroll
* [ ] Header does not overflow
* [ ] Tables handled
* [ ] Long text handled
* [ ] Images contained
* [ ] Flex children use `min-w-0` if needed
* [ ] Fixed widths removed on mobile

### Spacing

* [ ] Section spacing consistent
* [ ] Card padding consistent
* [ ] Form spacing clear
* [ ] Button spacing safe
* [ ] Mobile spacing not cramped
* [ ] Desktop spacing not excessive

### Touch targets

* [ ] Buttons large enough
* [ ] Icon buttons padded
* [ ] Tabs tappable
* [ ] Close buttons tappable
* [ ] Map controls tappable
* [ ] Dense actions separated

### Forms

* [ ] One-column mobile layout
* [ ] Labels visible
* [ ] Errors fit
* [ ] Submit button reachable
* [ ] Inputs full width on mobile
* [ ] File/date/select fields checked

### Dashboards

* [ ] Sidebar responsive
* [ ] Tables responsive
* [ ] Filters responsive
* [ ] Stats cards responsive
* [ ] Charts readable
* [ ] Empty states clean
* [ ] Pagination usable

### Map/tracker screens

* [ ] Map height safe
* [ ] Controls reachable
* [ ] Marker visible
* [ ] Bottom panel safe
* [ ] Speedometer readable
* [ ] Live status visible
* [ ] Start/stop action reachable
* [ ] Landscape checked

### States

* [ ] Loading state checked
* [ ] Empty state checked
* [ ] Error state checked
* [ ] Validation state checked
* [ ] Not-found state checked
* [ ] Unauthorized state checked

## Output format

When this skill is used, respond like this:

````txt
# Responsive UI Review

## 1. Review scope

- Page:
- Main user:
- Main action:
- Risky sections:

## 2. Tested viewports

- Mobile:
- Tablet:
- Desktop:
- Breakpoint edges:

## 3. Summary

- Overall status:
- Biggest risk:
- Must fix before handoff:

## 4. Issues found

| Priority | Viewport | Section | Problem | Cause | Fix |
|---|---|---|---|---|---|

## 5. Mobile review

- Layout:
- Header/nav:
- Text:
- Buttons:
- Forms:
- Overflow:
- Sticky elements:

## 6. Tablet review

- Layout:
- Grid:
- Sidebar:
- Forms:
- Tables:
- Spacing:

## 7. Desktop review

- Max width:
- Alignment:
- Spacing:
- Typography:
- Large screen behavior:

## 8. Overflow review

- Source:
- Root cause:
- Fix:

## 9. Touch target review

- Problem controls:
- Required size/padding:
- Fix:

## 10. State review

- Loading:
- Empty:
- Error:
- Validation:
- Not found:

## 11. File-level fixes

```txt
components/...
app/...
styles/...
````

## 12. Do not do

* Do not:
* Do not:
* Do not:

## 13. Final checklist

* [ ] Mobile fixed
* [ ] Tablet fixed
* [ ] Desktop fixed
* [ ] No horizontal scroll
* [ ] Touch targets fixed
* [ ] Forms checked
* [ ] States checked

```

## Common mistakes to prevent

- Testing only desktop
- Testing only one mobile width
- Ignoring tablet
- Ignoring 320px width
- Ignoring breakpoint edges
- Hiding overflow globally
- Using fixed widths on mobile
- Forgetting `min-w-0`
- Letting tables break mobile
- Keeping desktop grid on mobile
- Making buttons too small
- Making icon buttons hard to tap
- Ignoring form keyboard behavior
- Letting sticky footer cover content
- Letting header wrap badly
- Cropping important image content
- Ignoring empty states
- Ignoring error states
- Ignoring long real content
- Ignoring map/tracker landscape mode
- Adding random breakpoints without reason

## Quality bar

A good responsive review:

- Tests mobile, tablet, and desktop
- Finds exact viewport bugs
- Identifies root causes
- Gives specific fixes
- Checks overflow
- Checks touch targets
- Checks real content
- Checks forms
- Checks dashboard behavior
- Checks map/tracker behavior
- Checks loading and error states
- Prevents client-visible design bugs

A bad responsive review:

- Says “make it responsive”
- Checks only desktop
- Checks only Chrome default mobile
- Gives generic advice
- Ignores tablet
- Ignores overflow cause
- Ignores touch targets
- Ignores forms
- Ignores real content
- Fixes symptoms instead of root causes
