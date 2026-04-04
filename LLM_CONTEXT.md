# RUET Hall Management System - In-Depth Project Context

This file serves as a deep, project-wise architectural map for the RUET Hall Management System monorepo. It details conventions, technologies, database schemas, and folder structures to strictly adhere to during AI coding tasks.

## 🏢 Monorepo Breakdown

The repository handles both front-office applications (Student Web Portal) and back-office management (Admin Portal) via a centralized backend API and an isolated payment microservice.

### 1. `web/` (Student Web Portal)

- **Role:** The primary application for students to apply for seats, book meals, check dues, and manage their profiles.
- **Framework:** Next.js (App Router), React 19, TypeScript.
- **Styling & UI:**
  - **Tailwind CSS v4** (`@tailwindcss/postcss`).
  - **HeroUI (`@heroui/react`)** is the predominant component library for layout, data display, and input elements.
  - Radix UI (`@radix-ui/react-*`) serves as an underlying primitive for certain interactive components (like Dialogs or Menus).
  - Visuals rely on dynamic and smooth styling (often using HeroUI's Framer Motion integration). Always build for a modern aesthetic here.
- **State & Data:** Uses `axios` for external fetching, `sonner` for rich toasts, and `recharts` for statistical graphs.
- **Run/Port:** DEV runs on port `3001`.

### 2. `admin/` (Administrative Portal)

- **Role:** The back-office system for hall administrators (Provost, Section Officers, Dining Managers, etc.) to manage students, approve applications, resolve asset damage, and oversee finances.
- **Framework:** Next.js (App Router), React 19, TypeScript.
- **Styling & UI:**
  - **Tailwind CSS v4**.
  - **Radix UI Primitive Focused**: Relies heavily on `@radix-ui/react-*` components for building highly functional and robust data-management interfaces, alongside `lucide-react` icons.
  - Prioritizes functional, information-dense tables and dashboards over massive visual flair.
- **Run/Port:** DEV runs on port `4001`.

### 3. `backend/` (Main API Server)

The absolute core of the application. All major data logic occurs here.

- **Architecture:** Strict MVC-inspired separation organized by feature module (`auth`, `halls`, `dining`, `admission`, `inventory`, `finance`).
- **Stack:** Node.js, Express 5.2+ (native async error support), TypeScript execution via `tsx`.
- **Database:** MySQL 8, manipulated via **Drizzle ORM** (`drizzle-orm`).
- **Data Validation:** Zod schema validation managed strictly in middleware.
- **File Structure & Conventions:**
  - `src/modules/<feature>/<feature>.routes.ts`: Maps HTTP methods to controllers and binds middlewares.
  - `src/modules/<feature>/<feature>.controller.ts`: Main logic block (DO NOT write logic in pure SQL; strictly use Drizzle).
  - `src/modules/<feature>/<feature>.validators.ts`: Zod schemas for `body`, `params`, `query`. Validated with a custom `validateRequest` middleware.
  - `src/db/models/*.ts`: Central definition for DB tables and schemas.
  - `src/utils/ApiError.ts` and `src/utils/ApiResponse.ts`: Strictly wrap outgoing data in `ApiResponse` and throw HTTP errors using `new ApiError(status, message)`.
- **DB Modules Overview:**
  - **Auth**: `users`, `refreshTokens`, `hallStudents`, `hallAdmins`. (Roles include: PROVOST, STUDENT, ASST_FINANCE, FINANCE_SECTION_OFFICER, ASST_DINING, DINING_MANAGER, ASST_INVENTORY, INVENTORY_SECTION_OFFICER).
  - **Dining**: `mealMenus`, `mealTokens`, `mealPayments`.
  - **Inventory**: `rooms`, `assets`, `damageReports`.
  - **Finance**: `studentDues`, `payments`, `expenses`.
  - **Admission**: `seatApplications`, `seatAllocations`.
- **Run/Port:** Exposed internally/externally on port `8000`.

### 4. `pay/` (Payment Microservice)

- **Role:** A lightweight, isolated Node.js/Express server used exclusively to handle payment processing and health-checks.
- **Stack:** Node.js, Express 5.2+, TypeScript (`tsx`), `bcrypt`, `jsonwebtoken`.
- **Security:** Checks token validity and payload hashes with the main backend.
- **Run/Port:** Listens internally on port `8080`.

## 🗄️ Infrastructure Details & Docker Compose

The system is deeply containerized.

- **`docker-compose.local.yml`**: Uses a local MySQL database mapped to `3307` externally, but internally services call `3306`.
- **Reverse Proxy**: Nginx combines traffic across services in production (`docker-compose.yml`).
- **Communication Pattern**: Frontends communicate with the `backend` via REST. The `backend` and `pay` sub-services communicate on the internal docker network (`hallnet`).

## ⚠️ Critical Agent Rules

When making edits as an AI against this repository, follow these precise rules:

1. **Never write raw SQL strings**: All schema modifications MUST occur within `backend/src/db/models/*.ts` and be deployed using `npx drizzle-kit generate` and `push` inside the `backend` folder.
2. **Respect the UI Library Boundaries**:
   - While generating components for `web/`, bias toward `HeroUI` (or custom highly-styled elements).
   - While generating components for `admin/`, use `Radix UI` primitives combined carefully with Tailwind CSS v4, yielding functional and robust inputs.
3. **API Logic Formatting**: In the backend, do not use `try/catch` internally if not explicitly necessary; rely on Express 5's async error handling mechanism. Instead of crashing, throw custom errors: `throw new ApiError(StatusCode, Message)`.
4. **Validation Pipeline**: In backend feature creation, define the Zod schema first in `validators.ts`, bind the schema to the route using `validateRequest(schema)`, and finally implement the Controller relying on the fact that `req.body` is fully and safely validated.
5. **Enums**: Note that Enums in `halls`, `roles`, and `statuses` must match the SQL enums declared in the models (e.g. `PROVOST`, `PENDING`, `APPROVED`). Always check `src/types/enums.ts` or `src/db/models` before pushing data.

*This project context acts as your singular point of truth for maintaining the codebase without polluting it with disjointed patterns or anti-patterns.*
