# Clerk authentication

## Goal

Add Clerk authentication to Skew's existing Next.js 16 App Router application. Clicking the existing `Login` button in the current navigation opens Clerk's sign-in experience, which provides the path to sign up. Signed-in visitors see Clerk's account control. Public news reading remains accessible without an account.

## Skills read

- `.agents/skills/clerk/SKILL.md`
- `.agents/skills/clerk-setup/SKILL.md`

## Existing code inspected

- `package.json` — Next.js 16.4.4 / React 19.3 project with no Clerk dependency.
- `app/layout.tsx` — root layout does not currently provide an authentication provider.
- `app/page.tsx` and `app/news/[slug]/page.tsx` — both have duplicate static `Login` controls in the primary header.
- `next.config.ts` — enables `cacheComponents`, so any server-side Clerk session-aware UI must be isolated behind `Suspense`.
- `node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md` and `01-app/01-getting-started/16-proxy.md` — confirms the Next 16 Cache Components and root `proxy.ts` conventions.

## Decisions and assumptions

- Install the current `@clerk/nextjs` SDK through the Clerk CLI, using its accountless development-key flow if this workspace is not already linked to a Clerk application.
- Preserve the current public home and article-detail experience. This task adds identity and account controls; it does not create a paywall or protect existing news pages.
- Use Clerk's hosted/prebuilt sign-in and sign-up flows at `/sign-in/[[...sign-in]]` and `/sign-up/[[...sign-up]]`.
- Keep user-visible controls consistent with the existing header: the existing signed-out `Login` control opens Clerk sign-in; sign-up is provided within Clerk's sign-in flow; signed-in users receive a compact `UserButton`.
- Add Clerk's proxy integration without using it as the authorization boundary. Any future protected page, route handler, or server action must use Clerk's server-side `await auth()` / `auth.protect()` close to protected data.
- Do not read, print, commit, or expose `.env.local` values. The implementation will document the required non-secret variable names in a new `.env.example` only.

## Files likely to change

- `package.json` and lockfile — install `@clerk/nextjs`.
- `app/layout.tsx` — add `ClerkProvider` inside `<body>`.
- `proxy.ts` — add Clerk proxy middleware and the documented matcher, including API routes so future handlers receive session context.
- `app/sign-in/[[...sign-in]]/page.tsx` and `app/sign-up/[[...sign-up]]/page.tsx` — prebuilt Clerk pages, each wrapped in `Suspense` for Cache Components compatibility.
- `components/...` — extract or add a small reusable server-rendered header-auth control so the two existing headers do not diverge.
- `app/page.tsx` and `app/news/[slug]/page.tsx` — replace the inert Login buttons with the shared authentication control without changing the rest of their layout.
- `.env.example` — document Clerk's required public and server-only variable names plus existing app environment contract placeholders, without values.

## Implementation requirements

1. Before installation, use Clerk's setup flow and report whether it creates temporary claimable development keys. Do not alter an existing Clerk application or overwrite existing keys.
2. Add the current Clerk Next.js SDK and wrap the App Router tree in `ClerkProvider` inside the root layout's `<body>`.
3. Create root-level `proxy.ts` with `clerkMiddleware()` and Clerk's standard static-asset/API matcher. Do not add route protection to the current public pages.
4. Create catch-all sign-in and sign-up routes using Clerk's `<SignIn />` and `<SignUp />`, wrapped in `Suspense` due to `cacheComponents: true`.
5. Add an auth navigation component that uses Clerk's current controls:
   - signed out: the existing `Login` button opens Clerk sign-in; Clerk's sign-in screen provides its sign-up link;
   - signed in: `UserButton` that supports account management and sign-out;
   - server-side rendered conditional UI enclosed in `Suspense` so the static page shell remains valid for Next 16 Cache Components.
6. Integrate that component into both existing page headers and preserve their responsive styling as closely as possible.
7. Add or update `.env.example` to document only:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`
8. Do not introduce Supabase Auth, browser-side secret access, custom credential handling, or unrelated UI/data changes.

## Security requirements

- `CLERK_SECRET_KEY` remains server-only and is never imported into a client component or exposed through a `NEXT_PUBLIC_*` variable.
- Authentication UI is not treated as authorization. Future server handlers/pages that access user-specific data must validate the request with Clerk server APIs.
- Never log tokens, cookies, session values, API keys, claim files, or `.env.local` contents.
- Do not use the proxy as the only authorization check for future protected resources.

## Acceptance criteria

- The app starts with valid Clerk environment configuration and no missing-provider error.
- `/sign-in` and `/sign-up` render Clerk's respective flows.
- The public home page and article-detail page render for signed-out users.
- Clicking the signed-out header `Login` control opens Clerk sign-in; signed-in users see a usable Clerk account control and can sign out.
- Next production build succeeds with `cacheComponents: true`.
- No secret is committed or included in browser code.

## Checks to run

```powershell
npx -y clerk@latest doctor
npm run typecheck
npm run lint
npm run build
```

## Manual test steps after implementation

1. Ensure `.env.local` contains Clerk development keys and the documented public redirect variables; do not commit it.
2. Start the app with `npm run dev`.
3. Open `http://localhost:3000`, confirm the public page renders, select the existing **Login** button, and verify Clerk's sign-in screen and its sign-up link.
4. Create a test account or sign in with an existing Clerk user, then return to the home and article-detail pages; confirm the header displays the account menu instead of signed-out controls.
5. Sign out through the account menu and confirm the signed-out controls return while both news pages remain public.
