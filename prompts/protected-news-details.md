# Protect news details with Clerk

## Goal

Keep article cards and the homepage publicly visible, but require an authenticated Clerk session before any news-detail page at `/news/[slug]` is rendered. A signed-out visitor who clicks a card must be redirected to Clerk's sign-in route and must not receive the article page content.

## Skills read

- `.agents/skills/clerk/SKILL.md`
- `.agents/skills/clerk-nextjs-patterns/SKILL.md`
- `node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md`

## Existing code inspected

- `app/page.tsx` — article cards link to `/news/[slug]`; it is intentionally public.
- `app/news/[slug]/page.tsx` — currently renders the article detail without an authorization check.
- `proxy.ts` — runs bare `clerkMiddleware()`, correctly providing request context but not acting as the authorization boundary.
- `next.config.ts` — enables `cacheComponents`, which requires a `loading.tsx` boundary for a whole-page `auth.protect()` check.

## Decisions and assumptions

- Protect only the news detail route segment (`/news/[slug]`). The homepage and its article cards remain public.
- Use Clerk's server-side `await auth.protect()` at the top of the protected page. Do not implement the rule only in the proxy or client-side JavaScript.
- Let Clerk redirect a signed-out page request to the configured `/sign-in` route and retain the intended destination so the visitor can continue to the article after sign-in.
- Add a route-level `loading.tsx` to satisfy Next.js 16 Cache Components handling for the request-bound authentication check.

## Files likely to change

- `app/news/[slug]/page.tsx` — add the server-side Clerk authorization check before rendering article UI.
- `app/news/[slug]/loading.tsx` — add the loading boundary required by Next.js Cache Components.

## Implementation requirements

1. Import `auth` from `@clerk/nextjs/server` in the news-detail page.
2. Call and await `auth.protect()` before any article UI or data is rendered.
3. Add a minimal accessible `loading.tsx` in the same route segment. It must avoid article content so a signed-out request cannot reveal protected details while the redirect is resolving.
4. Do not alter card links, make the homepage authenticated, add client-side-only access checks, or move protection into `proxy.ts`.
5. Preserve the existing signed-in detail page UI.

## Security requirements

- The authorization decision occurs on the server at the protected resource.
- A signed-out request must not receive the article-detail content.
- Do not expose session tokens, Clerk keys, or `.env.local` contents.

## Acceptance criteria

- A signed-out visitor can browse the homepage and see article cards.
- Clicking any card while signed out redirects to `/sign-in` rather than displaying the article detail.
- After signing in, the visitor can open the requested news-detail page.
- Signed-in users retain the existing details UI.
- The production build succeeds with `cacheComponents: true`.

## Checks to run

```powershell
npm run typecheck
npm run lint
npm run build
```

## Manual test steps after implementation

1. Start the application with `npm run dev`.
2. In a signed-out browser session, open `http://localhost:3000` and click an article card. Confirm that Clerk redirects to `/sign-in` and no article body appears.
3. Sign in through Clerk. Confirm the browser returns to, or can open, the selected `/news/<slug>` page and the full article UI renders.
4. Sign out and directly open a `/news/<slug>` URL. Confirm it redirects to `/sign-in` again.
