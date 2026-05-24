---
name: premium-nextjs-design
description: "Design premium admin Next.js interfaces in the admin service with an elegant corporate direction. Use for data-dense dashboards, management views, workflow forms, table UX, and advanced visual hierarchy improvements in the administrative back-office portal."
argument-hint: "Which admin screen should be upgraded?"
---

# Premium Next.js Design (Admin Portal)

Use this skill for admin-facing UI work in the `admin` service (port 4001).

## Default Visual Direction

- Elegant corporate with high operational clarity.
- Strong hierarchy for cards, tables, filters, and actions.
- Restrained color accents and clear semantic feedback states (success, warning, error).
- Dense layouts optimized for fast scanning, not decoration.

## UI Stack

- **Primary components:** `@radix-ui/react-*` primitives — use Radix for dialogs, dropdowns, selects, checkboxes, tooltips, tabs, and all interactive controls.
- **Icons:** `lucide-react` — consistent icon set throughout the admin interface.
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`) — utility-first. Compose Radix primitives with Tailwind classes; do not use HeroUI.
- **Data display:** Build data tables manually with Radix + Tailwind; use semantic HTML `<table>` structure for dense data grids.
- **Data fetching:** `axios` for API calls.

## Workflow

1. Define the business-critical action on the page before styling.
2. Map primary, secondary, and destructive actions and establish their visual weight.
3. Establish token consistency for typography, spacing, radius, and panel layers via Tailwind utilities.
4. Implement scan-friendly dense layouts: tables with sticky headers, filter rows, sortable columns, and paginated results.
5. Use Radix primitives for all interactive elements — they provide accessibility and keyboard navigation for free.
6. Add purposeful feedback motion for loading/success/error state transitions only.
7. Preserve keyboard/focus flow and responsive behavior at all breakpoints.
8. Validate with `npm run lint`; run `npm run build` for major UI changes.

## Completion Checks

- Data-dense views remain readable at high information density.
- Primary actions are immediately obvious; destructive actions have confirmation dialogs.
- All interactive controls use Radix primitives (no bare HTML inputs without Radix wrappers).
- Visual language is premium and consistent across all admin screens.
- Lint/build checks pass.
