# Skew app design system

## Goal

Implement the reusable visual foundations shown in the supplied UI reference so Skew pages can use a consistent design system. Establish global tokens and a small set of reusable presentational primitives, then show them in a compact in-app design system page. The reference is a design-system specification board; do not reinterpret it as a request to build a fully populated news homepage.

## Skills and documentation read

- `.agents/skills/ai-sdk/SKILL.md` (explicitly opened by the user; no AI SDK code is needed for this UI-only change)
- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md`

## Existing code inspected

- The root route is reserved for the application entry page; the design-system showcase belongs on its own route.
- `app/layout.tsx` currently loads Geist and starter metadata.
- `app/globals.css` contains only Tailwind v4 setup and default light/dark starter tokens.
- `package.json` contains Next.js 16.4.4, React 19.3, TypeScript, and Tailwind v4; there is no icon library or component system installed.

## Decisions and assumptions

- Treat the provided reference as the source of truth for Skew’s visual language and build a responsive design-system page that documents and demonstrates those tokens and primitives.
- Use Poppins via `next/font/google` for the app’s display and body typography, subject to Next’s existing font loading conventions.
- Use inline SVG icons rather than add a dependency for the small icon set.
- Preserve a light, editorial product experience. No dark mode is introduced because it is not represented in the reference.

## Files likely to change

- `app/layout.tsx`
- `app/globals.css`
- `app/design-system/page.tsx`
- `components/design-system-page.tsx`
- New reusable presentational components under `components/ui/` (or another small, clear location).
- `app/design-system.css` only if component-specific CSS is needed; otherwise keep tokens and shared styles in `app/globals.css`.

## Visual interpretation and implementation requirements

### Design tokens

- Establish CSS custom properties/Tailwind-consumable tokens for the reference palette: ink `#0D0D0F`, secondary ink `#6B7280`, surface `#F6F6F6`, page white `#FFFFFF`, secondary background `#F0F0F0`, border/divider `#E5E7EB`, left bias red `#B42318`, centre neutral `#E5E7EB`, and right bias blue `#1D4ED8`.
- Use a 4px-based spacing scale with prominent intervals of 4, 8, 16, 24, 32, 40, and 64px.
- Use 4px/8px/12px radii and a fully rounded pill treatment where appropriate.
- Define small, medium, and large elevation styles matching the restrained reference shadows.
- Set 2px, rounded-cap icon strokes.

### Typography

- Use Poppins with a compact geometric editorial feel.
- Implement the hierarchy: page title 32px bold / 1.2; section heading 24px semibold / 1.3; card title 20px semibold / 1.3; subheading 16px medium / 1.4; body 16px, 14px, and 13px regular / 1.6; caption 11px regular / 1.4.
- Maintain strong black headings, subdued metadata, generous readable line heights, and sentence-case labels.

### Design system page and reusable primitives

- Build the responsive design-system specimen at `/design-system`, organized in clear sections: brand, colors, typography, UI elements, icons, card example, spacing, grid, shadows, and border radius.
- Build reusable primitives for buttons (primary, secondary, text, disabled), category chips, the three-part bias meter, and an article card. Keep props typed and styles driven by the shared tokens.
- Show the reference palette as labeled swatches with names and hex values, including primary, semantic framing, and neutral colors.
- Show the type hierarchy and spacing/radius/shadow scales as visible specimens with their names and values.
- Include a responsive icon sample grid using inline SVGs with consistent 2px rounded strokes.
- Show one realistic, static article card with title, source, date, description, metadata, and AI-estimated left/center/right framing percentages. Treat the data as visual sample content only.
- Keep the framing meter accessible with an accompanying text label that marks the estimates as AI-estimated.
- Finish with the dark ink brand footer shown in the reference.
- Match the reference’s restrained editorial look: white/light gray surfaces, thin gray borders, modest shadows, compact section headings, and generous clear spacing. Avoid adding unrelated homepage navigation or product sections.

### Responsive and accessibility expectations

- Use a centered 1280px max-width container with approximately 24px desktop gutters.
- On narrow screens, collapse navigation safely, switch article layouts from multi-column to one column, allow chips to wrap, and keep the bias-meter labels legible without horizontal overflow.
- Use semantic landmarks, native buttons/links, visible keyboard focus, descriptive image alt text, and sufficient contrast.
- Avoid client-side state unless interaction requires it; do not introduce API calls, secrets, or browser-side pipeline logic.

## Security requirements

- This implementation must remain purely presentational and server-safe.
- Do not expose or add secrets, environment variables, OpenAI/Oxylabs calls, Supabase calls, or admin actions.

## Acceptance criteria

- The default starter screen and dark-mode starter styling are gone.
- `/design-system` displays the reference-based design system with sections for each major token and UI example represented in the reference.
- The color, type, spacing, radius, shadow, and icon standards are expressed as shared, reusable tokens or primitives.
- Buttons, chips, article card, and bias meter are reusable typed presentational units rather than duplicated markup.
- The result works at mobile, tablet, and desktop widths without clipping or horizontal scrolling.
- No new dependency is needed solely for icons or UI primitives.
- Metadata identifies the site as Skew News.

## Checks to run

- `npm run typecheck` (or report if this project does not define the required script)
- `npm run lint`
- `npm run build`

## Manual test steps

1. Run `npm run dev` from the project root.
2. Open `http://localhost:3000/design-system`.
3. Confirm the color, typography, UI element, icon, article card, spacing, grid, shadow, radius, and footer specimens render with the specified visual system.
4. Resize from a wide desktop viewport through tablet to approximately 360px wide; verify the layout becomes single-column without clipped text or horizontal scrolling.
5. Navigate with Tab; verify all interactive elements have visible focus treatment and bias-meter information remains understandable in accompanying text.
