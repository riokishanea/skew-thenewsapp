import { ArticleCard } from "@/components/ui/article-card";
import { BiasMeter } from "@/components/ui/bias-meter";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Icon } from "@/components/ui/icon";

const colorGroups = [
  {
    label: "Primary",
    colors: [
      ["Text primary", "#0D0D0F", "ink"],
      ["Text secondary", "#6B7280", "muted"],
      ["Surface", "#F6F6F6", "surface"],
    ],
  },
  {
    label: "Semantic",
    colors: [
      ["Left bias", "#B42318", "left"],
      ["Center", "#E5E7EB", "center"],
      ["Right bias", "#1D4ED8", "right"],
    ],
  },
  {
    label: "Neutrals",
    colors: [
      ["BG primary", "#FFFFFF", "white"],
      ["BG secondary", "#F0F0F0", "gray"],
      ["Border", "#E5E7EB", "border"],
      ["Divider", "#E5E7EB", "divider"],
    ],
  },
] as const;

const iconNames = [
  "menu", "search", "bookmark", "clock", "info",
  "share", "external", "calendar", "chart", "tag",
  "user", "bell", "sliders", "check", "more",
] as const;

const typeRows = [
  ["H1", "Page / Screen Title", "32px", "Bold", "1.2"],
  ["H2", "Section Title", "24px", "SemiBold", "1.3"],
  ["H3", "Card / Module Title", "20px", "SemiBold", "1.3"],
  ["H4", "Subheading", "16px", "Medium", "1.4"],
  ["Body Large", "Important content", "16px", "Regular", "1.6"],
  ["Body Medium", "Body text", "14px", "Regular", "1.6"],
  ["Body Small", "Supporting text", "13px", "Regular", "1.6"],
  ["Caption", "Labels, meta text", "11px", "Regular", "1.4"],
] as const;

const spacingScale = [4, 8, 16, 24, 32, 40, 64];

function SectionTitle({ children, id }: { children: React.ReactNode; id: string }) {
  return <h2 className="section-title" id={id}>{children}</h2>;
}

export function DesignSystemPage() {
  return (
    <main className="system-page">
      <div className="design-board">
        <section className="specimen brand-panel" aria-labelledby="brand-title">
          <SectionTitle id="brand-title">Brand</SectionTitle>
          <div className="brand-mark" aria-label="Skew News">
            <span>skew</span>
            <small>News</small>
          </div>
          <p className="brand-tagline">Balanced news coverage,<br />powered by AI.</p>
        </section>

        <section className="specimen color-panel" aria-labelledby="colors-title">
          <SectionTitle id="colors-title">Colors</SectionTitle>
          <div className="color-groups">
            {colorGroups.map((group) => (
              <div className="color-group" key={group.label}>
                <h3>{group.label}</h3>
                <div className="swatch-grid">
                  {group.colors.map(([name, hex, token]) => (
                    <div className="swatch" key={name}>
                      <span className={`swatch__color swatch__color--${token}`} aria-label={`${name}, ${hex}`} />
                      <span className="swatch__name">{name}</span>
                      <span className="swatch__hex">{hex}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="specimen type-panel" aria-labelledby="type-title">
          <SectionTitle id="type-title">Typography</SectionTitle>
          <div className="type-content">
            <div className="font-feature">
              <span className="micro-label">Font family</span>
              <strong>Poppins</strong>
              <p>Poppins is a modern geometric sans-serif typeface that ensures clarity and excellent readability.</p>
            </div>
            <div className="type-table" role="table" aria-label="Typography scale">
              <div className="type-table__head" role="row">
                <span>Style</span><span>Usage</span><span>Size</span><span>Weight</span><span>Line height</span>
              </div>
              {typeRows.map(([style, usage, size, weight, line]) => (
                <div className="type-table__row" role="row" key={style}>
                  <strong>{style}</strong><span>{usage}</span><span>{size}</span><span>{weight}</span><span>{line}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="specimen ui-panel" aria-labelledby="ui-title">
          <SectionTitle id="ui-title">UI Elements</SectionTitle>
          <div className="ui-block">
            <span className="micro-label">Buttons</span>
            <div className="button-table">
              <span />
              <span className="button-state">Default</span><span className="button-state">Hover</span><span className="button-state">Outline</span><span className="button-state">Disabled</span>
              <strong>Primary</strong><Button>Button</Button><Button className="button--hover-demo">Button</Button><Button variant="secondary">Button</Button><Button disabled>Button</Button>
              <strong>Secondary</strong><Button variant="secondary">Button</Button><Button variant="secondary" className="button--hover-demo">Button</Button><Button variant="secondary">Button</Button><Button variant="secondary" disabled>Button</Button>
              <strong>Text</strong><Button variant="text">Button</Button><Button variant="text" className="button--text-hover">Button</Button><span className="dash">—</span><span className="dash">—</span>
            </div>
          </div>
          <div className="ui-block">
            <span className="micro-label">Chip / Category</span>
            <div className="chip-row"><Chip>World Cup</Chip><Chip selected>IPL</Chip><Chip>Business &amp; Markets</Chip><Chip>More</Chip></div>
          </div>
          <div className="ui-block">
            <span className="micro-label">Bias meter</span>
            <BiasMeter left={25} center={50} right={25} />
            <div className="meter-axis"><span>0%</span><span>50%</span><span>100%</span></div>
            <p className="estimate-note">AI-estimated framing</p>
          </div>
        </section>

        <section className="specimen icon-panel" aria-labelledby="icons-title">
          <SectionTitle id="icons-title">Icons</SectionTitle>
          <div className="icon-grid">
            {iconNames.map((name) => <span className="icon-sample" key={name} title={name}><Icon name={name} /></span>)}
          </div>
          <p className="icon-note">Line style <b>·</b> 2px stroke <b>·</b> Rounded caps</p>
        </section>

        <section className="specimen card-panel" aria-labelledby="card-title">
          <SectionTitle id="card-title">Card Example</SectionTitle>
          <ArticleCard
            category="Politics"
            region="United States"
            title="Trump Sends Iran Revised Peace Proposal With Tougher Terms: Report"
            summary="The proposal includes stricter limits on uranium enrichment and enhanced verification measures."
            imageUrl="https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=900&q=85"
            imageAlt="The United States Capitol in Washington, D.C."
            timeAgo="2h ago"
            readTime="12 min read"
            framing={{ left: 25, center: 50, right: 25 }}
          />
        </section>

        <section className="specimen spacing-panel" aria-labelledby="spacing-title">
          <SectionTitle id="spacing-title">Spacing System <span className="section-title__aside">(4px base unit)</span></SectionTitle>
          <div className="spacing-bars">
            {spacingScale.map((size) => (
              <div className="spacing-sample" key={size}>
                <span style={{ height: `${size}px` }} />
                <small>{size}px</small>
              </div>
            ))}
          </div>
          <p className="panel-caption">Consistent spacing scale based on 4px base unit</p>
        </section>

        <section className="specimen grid-panel" aria-labelledby="grid-title">
          <SectionTitle id="grid-title">Grid System</SectionTitle>
          <div className="grid-specimen">
            <div className="grid-demo" aria-label="12 column grid with 24 pixel gutters">
              {Array.from({ length: 12 }, (_, index) => <span key={index} />)}
            </div>
            <div className="grid-labels"><span><b>Container</b>1280px</span><span><b>Columns</b>12</span><span><b>Gutter</b>24px</span><span><b>Margin</b>24px</span></div>
          </div>
        </section>

        <section className="specimen shadow-panel" aria-labelledby="shadows-title">
          <SectionTitle id="shadows-title">Shadows</SectionTitle>
          <div className="shadow-list">
            {[["Small", "0px 1px 2px rgba(0,0,0,0.05)"], ["Medium", "0px 4px 12px rgba(0,0,0,0.08)"], ["Large", "0px 12px 24px rgba(0,0,0,0.12)"]].map(([name, value]) => (
              <div className="shadow-item" key={name}><span className={`shadow-sample shadow-sample--${name.toLowerCase()}`} /><p><b>{name}</b>{value}</p></div>
            ))}
          </div>
        </section>

        <section className="specimen radius-panel" aria-labelledby="radius-title">
          <SectionTitle id="radius-title">Border Radius</SectionTitle>
          <div className="radius-list">
            {[["Small", "4px"], ["Medium", "8px"], ["Large", "12px"], ["Full", "9999px"]].map(([name, value]) => (
              <div className="radius-item" key={name}><span className={`radius-sample radius-sample--${name.toLowerCase()}`} /><b>{name}</b><span>{value}</span></div>
            ))}
          </div>
        </section>
      </div>

      <footer className="brand-footer">
        <div className="footer-brand"><div className="footer-logo">skew<small>News</small></div><p>Balanced news coverage,<br />powered by AI.</p></div>
        <span className="footer-version">Design System v1.0</span>
        <span className="footer-date">June 1, 2026</span>
        <p className="footer-signoff">Stay consistent. Stay unbiased.</p>
      </footer>
    </main>
  );
}
