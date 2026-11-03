# Skew homepage UI

## Goal

Replace the default Next.js starter at `/` with a polished, responsive Skew News homepage that closely interprets the supplied desktop UI reference: utility bar, primary header, horizontally scrolling topic chips, a three-column Top News grid, and a compact dark footer.

The implementation is a presentational homepage milestone. It must establish the exact page composition and reusable rendering shape that will later receive persisted articles; it must not implement scraping, analysis, database, or action-route behavior.

## Skills and documentation read

- `AGENTS.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md`

No project-approved integration skill is required: this request is limited to the static website layer and does not add Clerk, Supabase, Oxylabs, or AI work.

## Existing code inspected

- `app/page.tsx` is still the standard create-next-app starter and is the route to replace.
- `app/layout.tsx` and `app/globals.css` already contain Skew metadata and the shared Poppins-based visual tokens from the design-system milestone.
- `components/ui/article-card.tsx`, `components/ui/bias-meter.tsx`, `components/ui/chip.tsx`, `components/ui/button.tsx`, and `components/ui/icon.tsx` are typed reusable primitives ready to extend or reuse.
- `/design-system` is an existing reference route and must keep working.
- The worktree contains existing user changes, including the design-system work; preserve them and avoid unrelated rewrites.

## Decisions and assumptions

- Use the reference as layout direction only; brand the finished page as **Skew News**, not the third-party name visible in the source image.
- Since no Supabase data/query layer exists in this repository yet, render a compact typed visual preview data set at the page composition boundary. Keep article data and presentation separate so a subsequent Supabase query can replace that source without redesigning cards. Do not claim this preview data is persisted.
- Reuse the existing card/meter/chip/button/icon system where it fits. Update a primitive only when needed to support the homepage layout cleanly and without breaking the design-system route.
- Use remote editorial imagery only in the static preview, retaining plain `<img>` behavior already established in `ArticleCard`; do not add image-host configuration or download assets.
- Keep the page server-rendered and non-interactive except for semantic links/buttons. Do not add client state simply for visual controls.

## Files likely to change

- `app/page.tsx`
- `app/globals.css`
- `components/ui/article-card.tsx` (only if its compact homepage variation needs typed props)
- `components/ui/icon.tsx` (only if additional header/footer icons are needed)
- `components/ui/chip.tsx` or `components/ui/button.tsx` (only if required for compatible homepage variants)

No API, environment, schema, auth, scraping, analysis, or configuration files should change.

## Visual interpretation and implementation requirements

### Overall composition

- Use the existing Poppins visual language: near-black ink, white/light warm-gray surfaces, thin neutral borders, 4–12px radii, restrained shadow, and the red/neutral/blue framing meter.
- Create a full-width homepage with a `1280px`-ish centered inner container and desktop gutters close to the reference.
- Desktop order: black utility strip; white primary nav; light-gray topic rail; Top News section with 12 cards in a 3-column grid; dark footer.
- Keep visual density high but legible: the desktop section should feel editorial and compact rather than like a marketing landing page.

### Utility and primary navigation

- Utility bar: a lightweight “Skew News”/edition label on the left and date/location/international controls on the right. Use semantic buttons/links; their interactions do not need implementation.
- Primary header: menu button, Skew News wordmark, navigation links (`Home`, `For You`, `Local`, `Blindspot`), `Subscribe` primary button, and `Login` outlined button.
- Mark Home as active with the minimal underline treatment from the reference. Ensure controls have accessible text, labels, and visible keyboard focus.
- On small screens, simplify without clipping: retain menu + wordmark + a small account/action affordance, hide lower-priority desktop links/actions, and allow no horizontal body overflow.

### Topics

- Add a secondary rail of compact category chips modeled on the reference (for example World Cup, IPL, Social Media, Business & Markets, Health & Medicine, Soccer, Artificial Intelligence, Arsenal FC, Extreme Weather and Disasters).
- The rail must be horizontally scrollable on constrained widths, with scrollbar hidden only if still keyboard/trackpad usable. Chips should not force the full page to overflow.

### News grid and cards

- Use a semantic `<main>` and a `Top News` heading.
- Render a typed collection of 12 representative preview articles in a 3-column desktop grid, two columns at medium widths, and one column on small widths.
- Each card should include an editorial image, category/region eyebrow, headline, source count, an information affordance, and a three-segment AI-estimated framing meter. Use the same substantive framing presentation as the reference: visible left/center/right labels and percentages, not color alone.
- Cards must have consistent image aspect ratio, thin border, small radius, clean white body, no large hover effect, and should retain readable, balanced height across rows.
- If adapting `ArticleCard`, support the reference’s compact homepage fields without regressions to the existing design-system specimen. Do not duplicate bias-meter implementation inside the page.
- Include the term “AI-estimated framing” in accessible/visible supporting content so political framing is not presented as objective fact.

### Footer

- Build a compact near-black footer with Skew News identity/tagline, grouped navigation links, a small “Connect” icon/link row, and copyright text.
- Stack and space footer columns accessibly at tablet/mobile widths.

### Responsive and quality bar

- Match the reference’s proportions, compact typography, alignment, borders, and whitespace rather than mechanically copying its third-party branding.
- At approximately 360px, no card, header control, chip, framing label, or footer item may be clipped or cause horizontal page scrolling.
- Use semantic landmarks (`header`, `nav`, `main`, `section`, `footer`), descriptive image alt text, links/buttons for operable controls, and visible focus styles.
- Respect reduced motion; any hover/focus transition must be modest.

## Security requirements

- Keep this change entirely presentational.
- Do not add, expose, or reference credentials, environment variables, service keys, admin secrets, scraping calls, model calls, database writes, or browser-side pipeline actions.
- Do not add source URLs to scraping logic or database behavior.

## Acceptance criteria

- `/` no longer renders the Next.js starter screen.
- The Skew homepage visibly follows the supplied reference’s shell, topic rail, three-column news-card grid, and dark footer while using Skew branding.
- At desktop width, 12 news cards appear in a neat 3-column layout; each shows image, topical context, headline, source count, and a valid three-part framing meter totaling 100.
- The existing `/design-system` route remains functional and keeps its card/meter/chip examples working.
- Responsive layouts work without horizontal overflow at mobile, tablet, and desktop widths.
- No dependencies, API routes, database/schema changes, secrets, or pipeline work are introduced.

## Checks to run

1. `npm run typecheck`
2. `npm run lint`
3. `npm run build` (the root page and shared components change)

## Manual test steps after implementation

1. Run `npm run dev` from `C:\Users\workf\Projects\jsm-skew`.
2. Open `http://localhost:3000` and verify the utility bar, navigation, topic rail, 12-card Top News grid, framing meters, and footer match the intended composition.
3. Open `http://localhost:3000/design-system` and confirm its existing primitives remain intact.
4. Resize `/` to desktop, tablet, and approximately 360px wide. Confirm the news grid changes 3 → 2 → 1 columns, topics remain usable through horizontal scrolling, navigation collapses cleanly, and the page has no horizontal overflow.
5. Navigate with Tab. Confirm header controls, chip links/buttons, cards (if linked), and footer links show a visible focus treatment and framing remains understandable without relying on color.
