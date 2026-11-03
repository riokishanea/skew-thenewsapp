/* eslint-disable @next/next/no-img-element -- Static preview imagery uses remote URLs until the persisted data layer is connected. */

import { BiasMeter } from "@/components/ui/bias-meter";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

type PreviewArticle = {
  category: string;
  region: string;
  title: string;
  imageUrl: string;
  imageAlt: string;
  sources: number;
  framing: { left: number; center: number; right: number };
};

const topics = ["World Cup", "IPL", "Social Media", "Business & Markets", "Health & Medicine", "Soccer", "Artificial Intelligence", "Arsenal FC", "Extreme Weather and Disasters"];

const articles: PreviewArticle[] = [
  { category: "Politics", region: "United States", title: "Trump Sends Iran Revised Peace Proposal With Tougher Terms: Report", imageUrl: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=900&q=85", imageAlt: "The United States Capitol in Washington, D.C.", sources: 12, framing: { left: 20, center: 31, right: 49 } },
  { category: "Health", region: "United States", title: "Researchers Make Case for Grapes as a ‘Superfood’ After Review of Health Evidence", imageUrl: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=900&q=85", imageAlt: "Dark grapes growing on a vine in warm light.", sources: 7, framing: { left: 18, center: 42, right: 40 } },
  { category: "Science", region: "Switzerland", title: "CERN Finds High-Significance Hint of Physics Beyond Standard Model", imageUrl: "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&q=85", imageAlt: "A worker walks through an industrial tunnel.", sources: 8, framing: { left: 16, center: 62, right: 22 } },
  { category: "World", region: "Nicaragua", title: "Indigenous Leader Brooklyn Rivera Dies in Nicaragua After Nearly 3 Years of Detention", imageUrl: "https://images.unsplash.com/photo-1546525848-3ce03ca516f6?auto=format&fit=crop&w=900&q=85", imageAlt: "A baseball coach signals from the side of a field.", sources: 63, framing: { left: 54, center: 28, right: 18 } },
  { category: "World", region: "Middle East", title: "UN Security Council to Hold Emergency Meeting as Israel Pushes Deeper into Lebanon", imageUrl: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=900&q=85", imageAlt: "A damaged building in a dense urban area.", sources: 15, framing: { left: 22, center: 35, right: 43 } },
  { category: "Business", region: "Global", title: "Oil Prices Dip as OPEC+ Considers Output Increase Amid Weak Demand", imageUrl: "https://images.unsplash.com/photo-1516939884455-1445c8652f83?auto=format&fit=crop&w=900&q=85", imageAlt: "A fuel nozzle at a petrol station.", sources: 11, framing: { left: 25, center: 50, right: 25 } },
  { category: "Technology", region: "United States", title: "SpaceX Launches Starship Test Flight in Milestone for Mars Program", imageUrl: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?auto=format&fit=crop&w=900&q=85", imageAlt: "A rocket launches into a blue sky.", sources: 9, framing: { left: 12, center: 45, right: 43 } },
  { category: "Business", region: "United States", title: "Apple Unveils AI-Powered Features Across iPhone, iPad and Mac", imageUrl: "https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&w=900&q=85", imageAlt: "A glowing Apple logo on a dark glass facade.", sources: 10, framing: { left: 15, center: 40, right: 45 } },
  { category: "Climate", region: "Global", title: "2025 on Track to Be Among Top 3 Hottest Years, EU Climate Service Says", imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85", imageAlt: "A thermometer against a dramatic sunny sky.", sources: 14, framing: { left: 23, center: 34, right: 43 } },
  { category: "Economy", region: "United States", title: "Fed Holds Rates Steady, Signals Caution on Inflation and Growth Outlook", imageUrl: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=900&q=85", imageAlt: "The facade of a United States government building.", sources: 13, framing: { left: 30, center: 45, right: 25 } },
  { category: "Soccer", region: "Europe", title: "Real Madrid Win Champions League After Comeback Victory in Final", imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=85", imageAlt: "A football stadium lit for an evening match.", sources: 28, framing: { left: 10, center: 20, right: 70 } },
  { category: "Environment", region: "Canada", title: "Wildfires Force Thousands to Evacuate Across Western Canada", imageUrl: "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=900&q=85", imageAlt: "A wildfire glows through a forest at dusk.", sources: 17, framing: { left: 27, center: 33, right: 40 } },
];

function Wordmark() {
  return <span className="home-wordmark">skew<small>News</small></span>;
}

export default function Home() {
  return (
    <div className="homepage">
      <header>
        <div className="home-utility"><div className="home-shell home-utility__inner"><a href="#top-news" className="home-utility__brand">Skew News</a><div className="home-utility__links"><time dateTime="2026-06-01">Monday, June 1, 2026</time><button type="button">Set location</button><button type="button">International edition</button></div></div></div>
        <div className="home-main-nav"><div className="home-shell home-main-nav__inner"><button className="home-menu-button" type="button" aria-label="Open navigation menu"><Icon name="menu" /></button><a href="#top-news" aria-label="Skew News home"><Wordmark /></a><nav className="home-nav-links" aria-label="Primary navigation"><a className="is-active" href="#top-news">Home</a><a href="#for-you">For You</a><a href="#local">Local</a><a href="#blindspot">Blindspot</a></nav><div className="home-actions"><Button>Subscribe</Button><Button variant="secondary">Login</Button></div></div></div>
        <nav className="home-topics" aria-label="Featured topics"><div className="home-shell home-topics__scroll">{topics.map((topic) => <a className="home-topic" href="#top-news" key={topic}>{topic}<span aria-hidden="true">+</span></a>)}</div></nav>
      </header>
      <main id="top-news" className="home-shell home-content"><section aria-labelledby="top-news-title"><div className="home-section-heading"><h1 id="top-news-title">Top News</h1><p>Stories with AI-estimated framing across the coverage.</p></div><div className="home-news-grid">{articles.map((article) => <article className="home-news-card" key={article.title}><div className="home-news-card__image-wrap"><img src={article.imageUrl} alt={article.imageAlt} /><span className="home-news-card__info" title="Article analysis information"><Icon name="info" /></span></div><div className="home-news-card__body"><p className="home-news-card__eyebrow">{article.category}<span>·</span>{article.region}</p><h2>{article.title}</h2><div className="home-news-card__framing"><BiasMeter compact {...article.framing} /><span className="sr-only">AI-estimated framing</span></div><p className="home-news-card__sources">{article.sources} sources</p></div></article>)}</div></section></main>
      <footer className="home-footer"><div className="home-shell home-footer__grid"><div className="home-footer__brand"><Wordmark /><p>Balanced news coverage,<br />powered by AI.</p></div><div><h2>Company</h2><a href="#about">About</a><a href="#careers">Careers</a><a href="#press">Press</a><a href="#contact">Contact</a></div><div><h2>Help</h2><a href="#help">Help Center</a><a href="#guides">Guides</a><a href="#privacy">Privacy Policy</a><a href="#terms">Terms of Service</a></div><div><h2>Connect</h2><div className="home-social-links"><a href="#x" aria-label="Skew News on X">𝕏</a><a href="#linkedin" aria-label="Skew News on LinkedIn">in</a><a href="#instagram" aria-label="Skew News on Instagram">◎</a><a href="#youtube" aria-label="Skew News on YouTube">▶</a></div></div><p className="home-footer__copyright">© 2026 Skew News. All rights reserved.</p></div></footer>
    </div>
  );
}
