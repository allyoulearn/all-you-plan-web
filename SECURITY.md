# Security Policy — All You Plan

All You Plan is a personal planner with an AI copilot (Wren) that reads and
writes user data on the user's behalf. Calendar OAuth tokens, refresh tokens,
and (where configured) user-provided LLM API keys are all encrypted at rest.

## Supported versions

Only the `main` branch of each sub-app receives security updates:

- `all-you-plan-api` — GraphQL API, Node 20+
- `all-you-plan-web` — Vue 3 SPA
- `all-you-plan-mobile` — React Native (Expo)

## Reporting a vulnerability

Email **security@allyoulearn.com** with:

- A description of the issue and its impact
- Reproduction steps (HTTP request, screenshot, or minimal PoC)
- Affected component(s) and version/commit
- Whether you have disclosed (or plan to disclose) this elsewhere

Do **not** open a public GitHub issue or PR for a suspected vulnerability.

We aim to:

- Acknowledge receipt within **2 business days**
- Provide an initial assessment within **5 business days**
- Patch confirmed high/critical issues within **30 days**

Please give us reasonable time to remediate before public disclosure.

## Scope

In scope:

- Authentication (JWT access/refresh, refresh rotation, session revocation)
- Authorization (every resolver is per-user; cross-tenant reads/writes count)
- OAuth integrations (Google Calendar; Outlook when shipped) and the
  AES-256-GCM encryption envelope used for tokens at rest
- Wren tool-calling surface (input validation, undo/confirm flows, audit trail)
- Stripe billing flow (checkout, webhook signature verification)
- Rate limiting, CORS, Helmet headers, GraphQL depth limits
- Dependency vulnerabilities. CI runs `npm audit --audit-level=high` in each
  app's job and a dedicated `security` job (audit-ci, allowlist-aware) that also
  runs on a weekly schedule; High/Critical advisories fail the build. Accepted,
  currently-unfixable advisories are tracked in the repo-root `audit-ci.json`
  allowlist.

Out of scope:

- Self-XSS in third-party browser extensions or DevTools
- Vulnerabilities requiring a compromised user device
- Social engineering of staff or customers
- DoS via volume (we operate behind a managed edge)

## Security model notes

- **Refresh tokens** rotate on every `refresh` mutation; each carries a `jti`
  recorded in a `Session` document. Logout revokes that single session;
  password reset bumps `User.tokenVersion` which invalidates every outstanding
  access token immediately.
- **OAuth tokens** (Google access + refresh) are wrapped with AES-256-GCM
  before persisting (`src/utils/encryption.ts`); the key is loaded from
  `OAUTH_TOKEN_ENCRYPTION_KEY` and required in production.
- **Wren writes** are routed through tool definitions with Zod input schemas
  and per-user `ToolContext`; destructive ops return an `undo_token` /
  `confirm_token` chip the user must explicitly use.
- **Logs** are pino with a redact list covering Authorization, Cookie,
  `password`, `token`, `refreshToken`, `accessToken`, `resetToken` fields.
- **Origins** are validated at startup; wildcard `CORS_ORIGIN=*` is rejected.

## Known limits (tracked, not vulnerabilities)

- Outlook calendar OAuth is not yet shipped; the encryption envelope already
  supports it.
- A small set of tracked items live in `audit-2026-05-27/all-you-plan-FIX-NOTES.md`.
