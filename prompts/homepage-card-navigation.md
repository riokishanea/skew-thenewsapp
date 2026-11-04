# Homepage news card navigation

## Goal

Make every homepage news card open the existing news details route when clicked.

## Skills and documentation read

- `AGENTS.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`

No project-approved integration skill is needed because this is a static website navigation change.

## Existing code inspected

- `app/page.tsx` holds the typed homepage preview article collection and renders the 12 article cards.
- `app/news/[slug]/page.tsx` already provides a dynamic presentational route for article details.
- `app/globals.css` contains the existing homepage card styling and keyboard focus treatment.

## Decisions and assumptions

- Add a required unique `slug` field to each homepage preview article.
- Use Next.js `Link` for internal navigation to `/news/<slug>`.
- Make the full visual card a single accessible link without nesting it inside another interactive control.
- Keep the details page's current preview content shared for every slug until the persisted article query layer is implemented.

## Files likely to change

- `app/page.tsx`
- `app/globals.css` only if a small card-link style is necessary

## Implementation requirements

- Import and use `next/link` in the homepage route.
- Wrap each visual card in one `Link` targeting its article slug.
- Preserve the existing image, analysis information indicator, meter, source count, dimensions, hover restraint, and mobile grid behavior.
- Preserve semantics: an article remains represented as an `<article>` and contains one meaningful card link.
- Give the card link a visible keyboard focus state consistent with existing controls. Do not add client state.

## Security requirements

- Keep the change presentational and server-rendered.
- Do not add API calls, credentials, environment variables, persistence, scraping, analysis, or pipeline behavior.

## Acceptance criteria

- Clicking any homepage news card opens `/news/<that-card-slug>`.
- Keyboard users can focus and activate every card.
- The homepage and detail route retain their existing layout at desktop and mobile widths.
- No dependencies or data layer changes are added.

## Checks to run

1. `npm.cmd run typecheck`
2. `npm.cmd run lint`
3. `npm.cmd run build`

## Manual test steps after implementation

1. Run `npm.cmd run dev` from `C:\Users\workf\Projects\jsm-skew`.
2. Open `http://localhost:3000` and click several news cards. Confirm each opens a matching `/news/<slug>` URL.
3. Use Tab and Enter on a news card to confirm keyboard navigation works.
4. Resize the homepage near 360px and confirm cards remain fully clickable without horizontal overflow.
