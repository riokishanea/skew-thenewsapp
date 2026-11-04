# Skew news details page UI

## Goal

Create a polished, responsive Skew News article-details page that closely interprets the supplied editorial reference. The page must present one full article, its AI-estimated coverage analysis, a source-breakdown card, related stories, newsletter signup treatment, and the existing Skew navigation/footer shell.

This is a presentational website-layer milestone only. It must not add data fetching, persistence, scraping, analysis, auth, API routes, or browser-side pipeline actions.

## Skills and documentation read

- `AGENTS.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`

No project-approved integration skill is required: the request is limited to the static website layer and does not add Clerk, Supabase, Oxylabs, or AI work.

## Existing code inspected

- `app/page.tsx` already supplies a static Skew homepage shell, sample article data, utility/header navigation, topic rail, and footer.
- `app/globals.css` provides the Poppins-based visual tokens, homepage styling, responsive breakpoints, focus styles, and the red/neutral/blue framing palette.
- `components/ui/bias-meter.tsx` provides the accessible three-part AI-estimated framing meter and validates that percentages total 100.
- `components/ui/icon.tsx` contains menu, bookmark, share, info, more, and related presentational icons.
- `components/ui/article-card.tsx` is an existing design-system specimen and must remain working.
- `/design-system` is an existing visual-reference route and must not regress.
- The current worktree includes a user deletion of `prompts/typography-and-size-calibration.md`; preserve that unrelated change.

## Decisions and assumptions

- Add the details page at `app/news/[slug]/page.tsx`, allowing homepage article links to target an article-shaped URL without creating one hard-coded route per story.
- As no Supabase query layer exists yet, use one typed preview-article record at the page composition boundary. Keep its shape clearly separable from the UI so a future server-side database query can replace it. Do not portray the content as persisted data.
- The dynamic `slug` is only a route/display affordance for this visual milestone; unknown slugs can render the same representative preview rather than introducing data storage or not-found behavior.
- Reuse the existing framing meter and visual tokens. Add only small shared presentation utilities or icon names when necessary; do not duplicate meter logic.
- Keep the route server-rendered. Static buttons and links are semantic only; Save, Share, Subscribe, and feedback controls do not require state or side effects.
- Use editorial sample imagery through the existing plain `<img>` pattern. Do not add image-host configuration or download assets.

## Files likely to change

- `app/news/[slug]/page.tsx` (new detail page route)
- `app/page.tsx` (link static homepage cards to their detail route only, if needed)
- `app/globals.css` (scoped detail-page layout and responsive styling)
- `components/ui/icon.tsx` (only if missing visual icons are needed)

No API routes, environment files, schema/types, dependency manifests, auth, scraping, analysis, or configuration files should change.

## Visual interpretation and implementation requirements

### Overall composition

- Reuse the existing full-width Skew shell: dark utility strip, white primary navigation, and light topic rail. Continue to use Skew News branding rather than the third-party reference branding.
- Desktop content is a compact two-column editorial layout inside the existing `1280px`-ish centered shell: wide reading column on the left and a roughly 330px sticky-or-static analysis rail on the right. Use a normal document flow implementation; stickiness is optional and must never impair mobile reading.
- Use the established near-black ink, off-white background, white cards, thin neutral-gray borders, restrained 4-12px radii, small shadows, and red/neutral/blue analysis colors. Match the reference's dense newspaper/editorial hierarchy, not a marketing-page aesthetic.

### Article header and reading column

- Show category and region context, an article-specific headline, byline, publication date, estimated reading time, Save/Share/more controls, and a large lead image with an accessible descriptive alt and compact caption/credit.
- Include a full-width three-part `BiasMeter` below the lead media. Keep every Left/Center/Right label and percentage visibly readable, and include a visible `AI-estimated framing` note so framing is not asserted as objective fact.
- Render several readable article body paragraphs in a constrained text measure. Include an attributable pull quote/paragraph only if it improves the reference composition; do not misrepresent sample text as real reporting.
- Follow the article body with a Related Stories section. It should render a compact responsive card grid with image, topic/location eyebrow, headline, date/read-time metadata, and links targeting plausible detail URLs.

### Analysis rail

- Build three stacked cards: `Bias Analysis`, `AI Summary`, and `Source Breakdown`.
- `Bias Analysis`: show an overall bias/framing label, an AI-estimated score/percentage, the number of balanced sources, an individual Left/Center/Right distribution display, concise explanatory/disclaimer copy, and a `How We Analyze Bias` control. Do not state political framing as fact.
- `AI Summary`: show generated-date/read-time metadata, 3-4 concise neutral bullet points, the compact framing distribution, and a feedback action.
- `Source Breakdown`: show total source count, Left/Center/Right source shares, a list of representative publications with visual labels, and a `View All Sources` action.
- Cards must be readable without color alone. Use labels, values, and sufficient contrast. Info affordances need accessible labels or accompanying text.

### Newsletter and footer

- Add a compact email subscription bar below the main detail layout, with a label, support copy, email input, and Subscribe button. It is visual/semantic only: no submission handler or client state.
- Use the homepage's compact dark footer with Skew identity, grouped informational links, social affordances, and copyright. Extract no broad shared layout component unless doing so is a small, safe improvement; avoiding unrelated refactors is more important.

### Linking, semantics, and accessibility

- Use semantic `header`, `nav`, `main`, `article`, `aside`, `section`, and `footer` landmarks, with heading levels that make sense from article title through section headings.
- Use `next/link` for in-app article/card links where practical; buttons are used only for apparent actions. Ensure all interactive elements receive existing visible keyboard focus treatment.
- Decorative icons must remain hidden from assistive technology. Add visible or screen-reader labels for Save, Share, more actions, information controls, and icon-only social links.
- Keep article analysis copy explicitly AI-estimated and include the analysis disclaimer.

### Responsive and pixel-quality expectations

- Desktop: article and sidebar align cleanly at the top; lead image, framing meter, and cards match the supplied reference's compact visual scale.
- Tablet: reduce gaps and allow the reading column/rail to fit without crushed text; collapse to one column before either column becomes unusably narrow.
- Mobile (approximately 360px): show a single reading column, move analysis cards below article/related content in a sensible order, stack the newsletter form controls, simplify the existing header controls, and introduce no horizontal page overflow or clipped framing labels.
- Use modest hover/focus transitions only and retain the project's reduced-motion behavior.

## Security requirements

- Keep the change entirely presentational and server-rendered.
- Do not expose or reference credentials, environment variables, service keys, admin secrets, scraping calls, model calls, database writes, or browser-side pipeline actions.
- Do not add source URLs to scraping logic or database behavior.

## Acceptance criteria

- `/news/<any-slug>` renders the new Skew article-details composition instead of a 404.
- The page includes article metadata, lead image/caption, full text preview, visible AI-estimated framing meter, Bias Analysis, AI Summary, Source Breakdown, Related Stories, newsletter bar, and Skew footer.
- The desktop view materially matches the supplied reference's hierarchy, density, two-column layout, typography, thin borders, spacing, and restrained visual treatment while using Skew News branding.
- The existing homepage remains functional; linking its sample cards to `/news/<slug>` is supported if implemented.
- `/design-system` continues to show working article-card and framing-meter specimens.
- At mobile, tablet, and desktop widths, controls and text remain usable with no horizontal overflow.
- No dependencies, API routes, schema/persistence changes, secrets, auth changes, or pipeline behavior are introduced.

## Checks to run

1. `npm run typecheck`
2. `npm run lint`
3. `npm run build` (a new route and shared page styling change)

## Manual test steps after implementation

1. Run `npm run dev` from `C:\Users\workf\Projects\jsm-skew`.
2. Open `http://localhost:3000/news/trump-sends-iran-revised-peace-proposal` and verify the desktop article, analysis rail, framing values, source breakdown, related stories, newsletter bar, and footer visually follow the supplied layout.
3. Open `http://localhost:3000` and verify the homepage still renders. If cards were linked, open one and confirm it navigates to the detail page.
4. Open `http://localhost:3000/design-system` and verify its existing primitives remain intact.
5. Resize the detail page to tablet and approximately 360px wide. Confirm the two-column layout becomes a readable single-column stack, framing labels remain legible, newsletter controls stack, and the document has no horizontal scroll.
6. Navigate with Tab and confirm visible focus states for header links, article controls, related-story links, newsletter input/button, source actions, and footer links.
