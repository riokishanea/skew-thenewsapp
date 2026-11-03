# Skew UI typography and size calibration

## Goal

Recalibrate the typography, text sizing, and element dimensions across the entire Skew application (both `/` homepage and `/design-system`) so that all text scales adhere to the design system specification in `prompts/app-design-system.md` and normal editorial web standards, eliminating miniature/microscopic font sizes (e.g. 6px, 8px, 9px) and restoring optimal readability, hierarchy, and visual balance.

## Skills and documentation read

- `AGENTS.md`
- `prompts/app-design-system.md`
- `prompts/skew-homepage-ui.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md`

## Existing code inspected

- `app/globals.css`: Contains CSS rules for both `.homepage` and `.system-page`. Many font sizes were hardcoded to miniature values:
  - Homepage utility bar: 9px font size, 29px height.
  - Homepage wordmark small label: 8px.
  - Homepage navigation links: 10px.
  - Homepage buttons: 9px font size, 31px height.
  - Homepage topic chips: 8px font size, 20px height.
  - Homepage section title: 19px; subtitle: 9px.
  - Homepage news card: eyebrow 8px; title 12px; compact bias meter 13px height with 6px font size; sources count 8px.
  - Homepage footer: links, headings, copyright, and brand text set to 8px–9px.
  - Design system page: section titles, specimen tables, swatches, labels, chips, and cards all using 8px–11px text.
- `components/design-system-page.tsx`: Explicitly defines the intended typography scale:
  - H1 (Page Title): 32px Bold / 1.2
  - H2 (Section Title): 24px SemiBold / 1.3
  - H3 (Card Title): 20px SemiBold / 1.3
  - H4 (Subheading): 16px Medium / 1.4
  - Body Large: 16px Regular / 1.6
  - Body Medium: 14px Regular / 1.6
  - Body Small: 13px Regular / 1.6
  - Caption: 11px Regular / 1.4
- `app/page.tsx`: Uses semantic markup and classes referencing `.home-*` styles.
- `components/ui/bias-meter.tsx`: Contains left, center, right percentages that become unreadable when forced into 6px–8px text containers.
- `components/ui/article-card.tsx`: Used in design system specimen with 9px–11px text.

## Decisions and assumptions

- The design system tokens documented in `components/design-system-page.tsx` and `prompts/app-design-system.md` represent the authoritative type hierarchy.
- No text in the interface should be smaller than 10px–11px (caption/badge text), with standard body, navigation, and interactive text scaling between 12px and 16px.
- Homepage cards must have clear, legible editorial headlines (17px–18px font size, line-height 1.35) matching card titles in editorial products.
- Bias meter text must be legible (10px–11px font size, 22px–24px compact bar height) so users can easily read the AI-estimated framing percentages without strain.
- Header, navigation, topics, and footer elements should have proper proportions and comfortable touch/click targets without creating horizontal overflow.

## Files likely to change

- `app/globals.css`
- `components/design-system-page.tsx` (only if inline classes or table row values need alignment)
- `components/ui/article-card.tsx` (if markup needs minor class/structure adjustments)
- `components/ui/bias-meter.tsx` (if styling hooks need adjustment)

## Visual interpretation and implementation requirements

### 1. Homepage Typography & Sizing

- **Utility Bar (`.home-utility`)**:
  - Increase text size from 9px to 12px.
  - Increase bar min-height from 29px to ~36px.
  - Ensure location button, date, and edition text are crisp and comfortably spaced.
- **Main Header & Navigation (`.home-main-nav`)**:
  - Wordmark: 28px–30px bold; small "News" label: 10px–11px.
  - Navigation links: increase from 10px to 14px (font-weight 500).
  - Header action buttons (Subscribe, Login): height 36px–38px, font-size 13px–14px, horizontal padding 14px–16px.
- **Topics Rail (`.home-topics`)**:
  - Increase topic chip font size from 8px to 12px.
  - Increase chip height from 20px to ~28px–30px with balanced padding (4px 12px).
  - Plus sign icon/glyph: 13px–14px.
  - Rail min-height: 44px–48px.
- **Top News Section Header (`.home-section-heading`)**:
  - H1: Increase from 19px to 28px (matching H1/H2 editorial scale), font-weight 700.
  - Subtitle: Increase from 9px to 13px–14px, color `#6b7280`.
- **Top News Grid Cards (`.home-news-card`)**:
  - Eyebrow (Category · Region): Increase from 8px to 11px (uppercase/caption style, font-weight 600, letter-spacing 0.02em).
  - Headline (H2): Increase from 12px to 17px–18px, font-weight 650, line-height 1.35, letter-spacing -0.025em.
  - Bias Meter (`.bias-meter--compact`):
    - Height: increase from 13px to 22px–24px.
    - Font size: increase from 6px to 10px–11px, font-weight 600.
    - Labels ("Left 20%", "Center 31%", "Right 49%") must fit legibly without clipping.
  - Sources count: Increase from 8px to 12px, font-weight 500.
  - Info button: Adjust from 18px to 22px–24px circle with 12px–13px icon.
  - Card body padding: 14px–16px for breathable spacing.
- **Homepage Footer (`.home-footer`)**:
  - Brand wordmark: 26px–28px; tagline: 13px–14px.
  - Column headers: 12px–13px, font-weight 600, uppercase, letter-spacing 0.05em.
  - Links: 13px, regular.
  - Social icons: 15px–16px.
  - Copyright: 12px.

### 2. Design System Page Specimens (`.system-page`, `.specimen`)

- **Section Titles (`.section-title`)**: 20px–22px, font-weight 700.
- **Micro-labels (`.micro-label`)**: 11px–12px, font-weight 600, uppercase.
- **Color Swatches (`.swatch`)**: swatch name 11px, hex 11px monospace.
- **Typography Specimen Table (`.type-table`)**:
  - Header: 11px, uppercase.
  - Specimen rows: real sizes matching their scale (H1: 32px, H2: 24px, H3: 20px, H4: 16px, Body Large: 16px, Body Medium: 14px, Body Small: 13px, Caption: 11px).
- **UI Elements (Buttons, Chips, Bias Meter)**:
  - Standard button: height 36px–38px, font-size 13px–14px.
  - Chip primitive: height 32px, font-size 12px–13px.
  - Full Bias Meter: height 32px–36px, font-size 12px. Compact: height 24px, font-size 10px–11px.
- **Article Card Specimen (`.article-card`)**:
  - Eyebrow: 11px.
  - H3: 20px (per design token).
  - Summary: 13px–14px (Body Small/Medium).
  - Meta/timestamps: 12px.

### 3. Responsiveness & Accessibility

- Ensure layout adjustments do not introduce horizontal scroll at 360px mobile width.
- Ensure all text contrasts meet WCAG AA standards.
- Keep the clean editorial aesthetics with proper whitespace and alignment.

## Security requirements

- Purely presentational/CSS changes.
- No external APIs, secrets, or data persistence modifications.

## Acceptance criteria

- All text throughout `/` and `/design-system` is comfortably readable on standard monitors and mobile devices.
- No text element uses microscopic font sizes (such as 6px, 8px, or 9px).
- The typographic hierarchy clearly distinguishes page headings (28px–32px), card headlines (17px–20px), body and navigation text (13px–14px), and captions/metadata (11px–12px).
- Bias meters display percentages clearly at 10px–11px without overlapping or clipping.
- Responsive layout remains intact across mobile (360px), tablet, and desktop (1280px+).

## Checks to run

- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Exact manual test steps expected after implementation

1. Run `npm run dev` in the terminal.
2. Visit `http://localhost:3000` (Homepage):
   - Check the top utility bar, main header, topic chips, card headlines, bias meters, and footer.
   - Verify all text is easily readable and no longer miniature.
   - Verify card titles are prominent (17px–18px) and bias meter percentages are legible.
3. Visit `http://localhost:3000/design-system`:
   - Verify all specimens (Brand, Colors, Typography table, UI components, Article Card, Spacing, Grid, Shadows, Radius) reflect the calibrated sizes.
   - Check the typography table specimens display their true scale from 32px down to 11px.
4. Resize viewport to ~360px:
   - Ensure cards, chips, navigation, and bias meters adapt smoothly without any horizontal overflow or clipping.

