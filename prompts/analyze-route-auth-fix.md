# Analysis route machine-auth fix

## Goal

Allow a server-to-server or terminal request to `POST /api/analyze` to reach its existing `x-skew-admin-secret` authentication check without requiring Clerk's browser development cookie.

## Skills read

- `.agents/skills/clerk/SKILL.md`
- `.agents/skills/clerk-nextjs-patterns/SKILL.md`

## Existing code inspected

- `proxy.ts`
- `app/api/analyze/route.ts`
- `package.json` (`@clerk/nextjs` 7.9.24)

## Diagnosis

`proxy.ts` currently invokes `clerkMiddleware()` for all `/api/*` paths. The reported `x-clerk-auth-reason: dev-browser-missing` response proves the request is rejected by Clerk before the route handler's machine-secret verification can run. The reported curl JSON body is also escaped incorrectly for the shell.

## Decision

- `/api/analyze` is a machine-only action route protected by `SKEW_ADMIN_SECRET`, not a browser session route.
- Exclude only `/api/analyze` from the Clerk proxy matcher.
- Retain Clerk middleware for application pages and all other currently matched paths.
- Do not weaken or remove the route handler's admin-secret check.

## Files likely to change

- `proxy.ts`

## Implementation requirements

1. Update the Clerk matcher so `POST /api/analyze` bypasses Clerk middleware.
2. Preserve the existing static-asset exclusions and Clerk coverage elsewhere.
3. Do not add deprecated `createRouteMatcher` usage.
4. Do not modify the analyze route's method, request schema, or `x-skew-admin-secret` authorization.

## Security requirements

- Missing or invalid `x-skew-admin-secret` must still return `401` from `/api/analyze`.
- The secret remains server-only and never appears in client code, URLs, logs, or responses.
- No user authentication bypass applies to pages or unrelated APIs.

## Acceptance criteria

- A request without an admin secret to `POST /api/analyze` reaches the route and returns its JSON `401`, without `x-clerk-auth-*` headers.
- A correctly authenticated request can proceed to the route's validation/pipeline logic.
- Requests to normal pages remain handled by Clerk.

## Checks to run

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- A local unauthenticated `POST /api/analyze` smoke test.

## Manual test steps

PowerShell:

```powershell
$headers = @{ "x-skew-admin-secret" = "<your SKEW_ADMIN_SECRET>" }
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/analyze" -Headers $headers -ContentType "application/json" -Body '{"articleIds":["104651af-4670-479f-a3ef-11773463d8ab"],"limit":1}'
```

Equivalent `curl.exe` command for PowerShell (use single quotes around JSON):

```powershell
curl.exe -i -X POST "http://localhost:3000/api/analyze" -H "x-skew-admin-secret: <your SKEW_ADMIN_SECRET>" -H "Content-Type: application/json" --data '{"articleIds":["104651af-4670-479f-a3ef-11773463d8ab"],"limit":1}'
```
