---
name: premium-nextjs-design
description: "Design premium Next.js pages for the web service using an elegant corporate style. Use for layout upgrades, typography systems, component polish, responsive refinement, and production-grade UX quality checks on the student-facing portal."
argument-hint: "Which student-facing page or flow should be redesigned?"
---

# Premium Next.js Design (Student Web Portal)

Use this skill for student-facing UI work in the `web` service (port 3001).

## Default Visual Direction

- Elegant corporate: clean structure, strong readability, restrained contrast accents.
- Typography is expressive but professional — never the generic default stack.
- Atmosphere uses subtle depth (soft gradients, layered surfaces), not flat one-color pages.
- Motion is purposeful: use HeroUI's built-in Framer Motion animations for state transitions and entrances only.

## UI Stack

- **Primary components:** `@heroui/react` — use HeroUI for all layout, data display, inputs, modals, tables, cards, badges, and navigation.
- **Primitive fallbacks:** `@radix-ui/react-*` only when HeroUI has no equivalent (e.g., advanced dropdown menus, popovers).
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`) — utility-first, no custom CSS unless unavoidable.
- **Data fetching:** `axios` for API calls.
- **Toasts:** `sonner` for rich notifications.
- **Charts/Stats:** `recharts` for all graphs and statistical displays.

## Workflow

1. Confirm user goal and the primary page action.
2. Audit current components and route structure in `app/` and `components/`.
3. Define design tokens for spacing, radius, color, and typography before writing UI code.
4. Build mobile-first layout, then refine desktop breakpoints.
5. Prefer HeroUI components; reach for raw Tailwind only for layout and spacing utilities.
6. Add meaningful motion only where it aids scanning and state transitions — no gratuitous animation.
7. Ensure loading, empty, and error states match the visual quality of the success state.
8. Validate with `npm run lint`; run `npm run build` for major UI changes.

## Completion Checks

- Visual hierarchy is clear within 3 seconds.
- HeroUI components are used wherever applicable — no reinventing buttons, inputs, or tables.
- Components feel coherent across pages.
- Desktop and mobile are both intentionally designed.
- No lint/build regressions.
