# Design System & UI Guide

This document details the theme modes, typography, colors, layout rules, component standards, and motion guidelines used across the **Hisab Management** interface.

## Theme Mode
The system uses `next-themes` to support theme synchronization:
*   **Default**: System preferences.
*   **Modes**: Light Mode and Dark Mode (`.dark` class injected at root HTML level).
*   **Implementation**: Utilizes Tailwind CSS variables mapped via HSL color coordinates.

## Fonts & Typography
*   **Primary Font**: `Plus_Jakarta_Sans` from Google Fonts. Loaded dynamically in [layout.tsx](file:///e:/Home/hisab-management/app/layout.tsx#L9) with CSS variable `--font-jakarta` and standard `font-sans` styling.
*   **Secondary/Monospace Font**: System monospace (`font-mono`) used for numeric ledgers, expense parsing textareas, raw input data, and date conflict displays.

## Colors
Color definitions are structured using CSS custom properties (variables) in HSL format inside [globals.css](file:///e:/Home/hisab-management/app/globals.css#L6-L49).

| Variable | Light Theme HSL | Dark Theme HSL | Purpose |
| :--- | :--- | :--- | :--- |
| `--background` | `210 40% 98%` (Soft Ice White) | `222.2 84% 4.9%` (Midnight Black) | Main canvas background |
| `--foreground` | `222.2 84% 4.9%` (Dark Slate) | `210 40% 98%` (Ice White) | Primary text color |
| `--card` | `0 0% 100%` (Pure White) | `222.2 84% 4.9%` (Midnight Black) | Cards, panels, and dropdown containers |
| `--primary` | `221.2 83.2% 53.3%` (Royal Blue) | `217.2 91.2% 59.8%` (Indigo Blue) | Brand identity, primary CTAs, links |
| `--destructive` | `0 84.2% 60.2%` (Coral Red) | `0 62.8% 30.6%` (Deep Crimson) | Warnings, delete buttons |
| `--muted` | `210 40% 96.1%` (Muted Gray) | `217.2 32.6% 17.5%` (Muted Slate) | Inactive tabs, placeholder backgrounds |
| `--border` | `214.3 31.8% 91.4%` (Slate Border) | `217.2 32.6% 17.5%` (Deep Slate Border) | Section split lines and input borders |

## Layout Style
*   **PWA Shell**: The system is optimized as a Progressive Web App (PWA). It is designed to fit mobile and tablet screens seamlessly.
*   **Navigation**: Uses a floating bottom navigation bar ([BottomNav.tsx](file:///e:/Home/hisab-management/components/BottomNav.tsx)) layered at `z-[100]` with a frosted-glass panel.
*   **Frosted Glassmorphism**: High-premium glass panel overlays are styled using utilities:
    *   `.glass`: `bg-white/70 backdrop-blur-md border border-white/20 shadow-xl`
    *   `.glass-dark`: `bg-black/50 backdrop-blur-md border border-white/10 shadow-xl`
*   **Corner Radii**: Standard borders utilize `--radius` set at `0.75rem` (`rounded-xl` / `rounded-2xl`).

## Components & Styles

### Button Styles (`@/components/ui/button`)
Standardized via `class-variance-authority`:
*   `default`: Solid primary background (`bg-primary`) with hover states.
*   `outline`: Bordered button (`border border-input bg-background`) with hover background modifications.
*   `ghost`: No border, transparent background, text color highlights on hover.
*   `destructive`: Crimson Red backgrounds for irreversable actions (clear data, delete record).

### Card Styles
Cards display ledger items (e.g., [ExpenseCard.tsx](file:///e:/Home/hisab-management/components/expense/ExpenseCard.tsx)).
*   Soft drop shadows: `shadow-[0_10px_30px_rgba(0,0,0,0.08)]`.
*   Hover micro-scales: Subtle interactive focus transitions (`transition-all duration-200 hover:translate-y-[-2px]`).

### Form Elements (`@/components/ui/input`)
*   Focused inputs show a prominent ring shadow: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.
*   Standard line heights: `leading-relaxed` on textareas to ease readability of multi-line text scripts.

## Motion & Animation Guidelines
*   **Library**: `framer-motion` for complex interactive state transitions.
*   **Springs**: Active navigation pill overlays use bouncy spring bindings:
    *   Stiffness: `380` / `400`
    *   Damping: `25` / `30`
*   **Page Transitions**: Defined in globals.css for route switches:
    *   `.page-enter`: Starts slightly translated vertically (`translateY(8px)`) with opacity `0`.
    *   `.page-enter-active`: Fades in and slides up over `300ms`.

## UI Mistakes to Avoid
1.  **Hardcoded Hex/RGB Colors**: Avoid hardcoding hex strings (e.g., `#6366F1`) inside inline styles or custom utility classes. Always use Tailwind theme classes (e.g. `bg-primary`, `text-muted-foreground`) to maintain dark mode capability.
2.  **Layout Shift (CLS)**: Dynamic data tables must render loading skeletal indicators ([loading.tsx](file:///e:/Home/hisab-management/app/(protected)/dashboard/loading.tsx)) to reserve spacing instead of popping elements onto the canvas after data loads.
3.  **Default Scrollbars**: Avoid thick, system-native scrollbars. Use the webkit scrollbar overrides defined in globals.css.
