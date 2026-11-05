# Clerk recovery cleanup

## Goal

Remove temporary Clerk troubleshooting prompt files created while diagnosing the earlier environment/session redirect loop, without undoing the working authentication and protected-article implementation.

## Existing code inspected

- Clerk authentication is now functional: provider, proxy, hosted auth routes, header control, and environment template are all required integration artifacts.
- `app/news/[slug]/page.tsx` retains the requested server-side article access check.
- Protected article links retain `prefetch={false}`, which is Clerk-recommended defensive behavior for public links to protected routes.

## Files to delete

- `prompts/clerk-environment-recovery.md`
- `prompts/clerk-session-loop-recovery.md`
- `prompts/protected-article-link-prefetch.md`

## Files explicitly preserved

- `prompts/clerk-authentication.md`
- `prompts/protected-news-details.md`
- Clerk implementation files and environment template
- `prefetch={false}` on protected-article links

## Implementation requirements

1. Delete only the three temporary troubleshooting prompt files listed above.
2. Do not change application source, Clerk configuration, `.env.local`, or package dependencies.
3. Confirm no deleted prompt is imported or referenced by application code.

## Acceptance criteria

- The temporary recovery prompt files are absent.
- The primary Clerk implementation and protected news-detail prompt remain.
- No runtime code changes are made.

## Checks to run

```powershell
git status --short
```

## Manual verification

1. Confirm the `prompts/` directory still contains `clerk-authentication.md` and `protected-news-details.md`.
2. Start the app with `npm run dev` and verify existing sign-in and protected article behavior remains unchanged.
