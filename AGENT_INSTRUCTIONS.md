# Agent Instructions — TaskHive

> Quick reference for autonomous or assisted agents working on the TaskHive repo.

---

## 📌 Overview
TaskHive is a small task-management app with a PHP backend (`taskhive-backend`) and a Vite + React frontend (`taskhive-frontend-vite`). The database schema is provided in `taskhive-DB/taskhive.sql`.

These instructions tell an agent how to act, what to prioritize, how to set up, and how to produce safe, reviewable changes.

---

## 🎯 Primary Goals
- Fix bugs and regressions in backend and frontend
- Add or improve tests (frontend unit tests; backend integration tests if added)
- Improve developer experience (documentation, scripts, CI)
- Implement well-scoped features requested in issues
- Keep the codebase secure and maintainable

---

## ⏱ Priorities
1. **Critical bug fixes** (authentication, data integrity, API errors) ✅
2. **Security & privacy** issues (no credential leaks, input validation) ⚠️
3. Core API stability & tests
4. UX bugs and important frontend features
5. Documentation, CI, minor refactors

---

## ✅ Rules & Constraints (must follow)
- Do not commit secrets (API keys, DB passwords); use environment-specific config files and add examples to README.
- Avoid schema-breaking database changes without a migration path and tests.
- Keep changes small and focused: one logical change per branch/PR.
- Add automated tests for new behavior. If you can't add tests immediately, explain why in the PR and add a follow-up issue.
- Use descriptive commit messages and create branches named `agent/<short-task>`.
- Do not deploy or publish credentials anywhere.

---

## ⚙️ Local Setup & Quick Start
1. Backend (PHP):
   - Ensure PHP (7.4+) and MySQL/MariaDB are available.
   - Import DB: `mysql -u root -p < taskhive-DB/taskhive.sql` (adjust user/host as needed).
   - Configure DB credentials in `taskhive-backend/config/database.php` (do not commit real creds).
   - Serve app for testing: `php -S localhost:8000 -t taskhive-backend` or run under your preferred server.

2. Frontend (Vite + React):
   - Ensure Node.js (16+) and npm/yarn are installed.
   - From `taskhive-frontend-vite`: `npm install` then `npm run dev` to start the frontend.
   - Run frontend tests: `npm test` (if configured).

3. Linting & Formatting:
   - Frontend has ESLint config. Run `npm run lint` if available.
   - For PHP, follow consistent formatting (PSR-12 style is recommended).

---

## 🧪 Testing & QA
- Add unit tests for new frontend logic (Jest + React Testing Library).
- For backend changes, add integration tests or at least reproducible manual test steps in the PR.
- Verify end-to-end flows after a change (login, create/read/update/delete tasks, logout).
- Run linters and address warnings before opening a PR.

---

## 🔀 Branching & PR Guidelines
- Branch name: `agent/<short-descriptive-task>` (e.g., `agent/fix-login-sql`)
- Commit messages: concise + imperative (e.g., `Fix authentication SQL injection`)
- PR description must include:
  - Summary of change
  - How to test locally (commands & steps)
  - Screenshots or test output where relevant
  - List of modified files and why
  - Any follow-up tasks or open questions

---

## ✅ PR Checklist (mandatory items)
- [ ] Branch created from `main` (or repo default)
- [ ] Tests added/updated and passing
- [ ] Linter run and warnings addressed
- [ ] Manual smoke tests documented and passed
- [ ] No secrets committed
- [ ] README updated if behavior/setup changed

---

## ✍️ Example Tasks (templates)
- Fix: Login fails when email contains dots
  - Reproduce steps, add unit/integration test, patch backend, add PR.
- Feature: Add task search/filter on `TaskList` and `KanbanBoard`
  - UI: add input+filters, API: optional query params, tests for both.
- Improve: Add CI workflow to run frontend tests and linting
  - Add a GitHub Actions workflow `.github/workflows/ci.yml` that runs `npm ci`, `npm run lint`, and `npm test`.

---

## 🧭 Useful Files & Paths
- Backend: `taskhive-backend/` (API endpoints, config)
- Frontend: `taskhive-frontend-vite/` (React app, tests, lint config)
- DB schema: `taskhive-DB/taskhive.sql`
- README: `README.md` (update when setup or behavior changes)

---

## 📢 Communication & Reporting
- When unsure, create a draft PR or issue with your proposed changes and ask for review.
- For larger changes, open an issue first describing the plan and gain approval before implementing.

---

## 🧰 Agent Behavior Summary
- Keep work small and testable; run linters and tests; write clear PRs; never commit secrets; document any environment or schema changes.

---

If you want, I can also:
- scaffold a `ci.yml` workflow for tests and linting ✅
- create issue templates and PR templates ✅
- open example issues based on outstanding TODOs in the repo ✅

---

*Generated for TaskHive — adjust as you like.*
