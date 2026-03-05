# RUET Hall Management Backend

## Getting Started

**Before making any changes or running the project, please read the full documentation in [`PROJECT_DOCS.txt`](./PROJECT_DOCS.txt).**

This file contains:
- Project architecture and module structure
- Coding conventions and naming rules
- Database schema and relationships
- API route structure
- Validation, error handling, and best practices
- Quick start and troubleshooting

---

## Installation

Install dependencies:

```bash
bun install
```

## Running the Project

Start the development server:

```bash
bun dev
```

## Database Setup

1. Configure your `.env` file (see `.env.sample` for required variables).
2. Generate and run migrations:
   ```bash
   bun db:generate
   bun db:migrate
   ```
   Or combined:
   ```bash
   bun db
   ```
3. Seed initial data (halls & rooms):
   ```bash
   bun db:seed
   ```
4. Seed beds (run after `db:seed`):
   ```bash
   bun src/db/seedBeds.ts
   ```

## Authentication

All protected routes require a JWT `accessToken`. The token is:
- Returned in the **response body** (`data.accessToken`) on login/register
- Also set as an **HTTP-only cookie** (`accessToken`) with path `/`

For Postman / API clients, use:
```
Authorization: Bearer <accessToken>
```

## Making Code Changes

**Always follow these steps when changing or adding code:**

1. **Read [`PROJECT_DOCS.txt`](./PROJECT_DOCS.txt) first.**
   - Understand the module structure, naming conventions, and validation patterns.
   - Review the coding standards and best practices.

2. **Follow the module-based structure:**
   - Place new features in the appropriate module folder under `src/modules/`.
   - Keep all business logic in the controller file unless it is reused elsewhere (then use a service file).
   - Use Zod schemas for all input validation (see `src/modules/<module>/<module>.validators.ts`).
   - Register new routes in the module's `routes.ts` file and ensure they are included in `src/app.ts`.

3. **Use the provided utilities and patterns:**
   - Use native async controller functions; Express 5 forwards thrown async errors automatically.
   - Use `ApiResponse` for all successful responses.
   - Use `ApiError` for all error handling.
   - Validate all requests with `validateRequest` middleware.
   - Use enums from `src/types/enums.ts` and SQL enums as per the model file conventions.

4. **Drizzle defaults:** Always explicitly pass enum/status fields in `.insert()` calls — do not rely on Drizzle `.default()` alone, as the DB column may not have a DEFAULT set.

5. **Test your changes:**
   - Use the Postman collections in `/postman/collections/` to test all endpoints.
   - Ensure all validation and error handling works as expected.

6. **Formatting and Linting:**
   - Format your code with Prettier before committing.
   - Follow the project's `.prettierrc` settings.

7. **Contributing:**
   - Write clear, descriptive commit messages.
   - Document any new endpoints or changes in `PROJECT_DOCS.txt` if they affect the architecture or API.

## Support

For any questions or issues, refer to `PROJECT_DOCS.txt` and the code comments. If you need further help, contact the project maintainer.

---

This project uses [Bun](https://bun.sh) as the JavaScript runtime and package manager.
