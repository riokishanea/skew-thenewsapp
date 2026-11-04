/* eslint-disable @next/next/no-img-element -- This presentational preview retains the project's existing remote-image approach. */

import Link from "next/link";

import { BiasMeter } from "@/components/ui/bias-meter";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

const topics = ["World Cup", "IPL", "Social Media", "Business & Markets", "Health & Medicine", "Soccer", "Artificial Intelligence", "Arsenal FC", "Extreme Weather and Disasters"];

const relatedStories = [
  { category: "World", region: "Middle East", title: "Iran Says It Will Not Negotiate Under Maximum Pressure", image: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=700&q=85", slug: "iran-says-it-will-not-negotiate", meta: "May 29, 2026 · 8 min read" },
  { category: "Politics", region: "United States", title: "Bipartisan Group Urges Diplomacy With Iran", image: "https://images.unsplash.com/photo-1521292270410-a8c4d716d518?auto=format&fit=crop&w=700&q=85", slug: "bipartisan-group-urges-diplomacy", meta: "May 28, 2026 · 5 min read" },
  { category: "Politics", region: "United States", title: "US Sanctions More Iranian Entities Over Nuclear Program", image: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=700&q=85", slug: "us-sanctions-iranian-entities", meta: "May 28, 2026 · 6 min read" },
  { category: "Science", region: "Iran", title: "What’s in the 2015 Iran Nuclear Deal?", image: "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=700&q=85", slug: "whats-in-the-iran-nuclear-deal", meta: "May 27, 2026 · 4 min read" },
];

function Wordmark() {
  return <span className="home-wordmark">skew<small>News</small></span>;
}

function PageHeader() {
  return (
    <header>
      <div className="home-utility"><div className="home-shell home-utility__inner"><Link href="/" className="home-utility__brand">Skew News</Link><div className="home-utility__links"><time dateTime="2026-06-01">Monday, June 1, 2026</time><button type="button">Set location</button><button type="button">International edition</button></div></div></div>
      <div className="home-main-nav"><div className="home-shell home-main-nav__inner"><button className="home-menu-button" type="button" aria-label="Open navigation menu"><Icon name="menu" /></button><Link href="/" aria-label="Skew News home"><Wordmark /></Link><nav className="home-nav-links" aria-label="Primary navigation"><Link className="is-active" href="/">Home</Link><a href="#for-you">For You</a><a href="#local">Local</a><a href="#blindspot">Blindspot</a></nav><div className="home-actions"><Button>Subscribe</Button><Button variant="secondary">Login</Button></div></div></div>
      <nav className="home-topics" aria-label="Featured topics"><div className="home-shell home-topics__scroll">{topics.map((topic) => <a className="home-topic" href="#article" key={topic}>{topic}<span aria-hidden="true">+</span></a>)}</div></nav>
    </header>
  );
}

function PageFooter() {
  return (
    <footer className="home-footer"><div className="home-shell home-footer__grid"><div className="home-footer__brand"><Wordmark /><p>Balanced news coverage,<br />powered by AI.</p></div><div><h2>Company</h2><a href="#about">About</a><a href="#careers">Careers</a><a href="#press">Press</a><a href="#contact">Contact</a></div><div><h2>Help</h2><a href="#help">Help Center</a><a href="#guides">Guides</a><a href="#privacy">Privacy Policy</a><a href="#terms">Terms of Service</a></div><div><h2>Connect</h2><div className="home-social-links"><a href="#x" aria-label="Skew News on X">𝕏</a><a href="#linkedin" aria-label="Skew News on LinkedIn">in</a><a href="#instagram" aria-label="Skew News on Instagram">◎</a><a href="#youtube" aria-label="Skew News on YouTube">▶</a></div></div><p className="home-footer__copyright">© 2026 Skew News. All rights reserved.</p></div></footer>
  );
}

export default function NewsDetailsPage() {
  return (
    <div className="homepage details-page">
      <PageHeader />
      <main id="article" className="home-shell details-content">
        <div className="details-layout">
          <article className="details-article">
            <p className="details-eyebrow">Politics <span>·</span> United States</p>
            <h1>Trump Sends Iran Revised Peace Proposal With Tougher Terms: Report</h1>
            <div className="details-byline"><span>By <strong>David Morgan</strong></span><time dateTime="2026-05-31">May 31, 2026</time><span>12 min read</span></div>
            <div className="details-actions" aria-label="Article actions"><button type="button"><Icon name="bookmark" />Save</button><button type="button"><Icon name="share" />Share</button><button type="button" aria-label="More article options"><Icon name="more" /></button></div>
            <figure className="details-figure"><img src="https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1400&q=88" alt="United States Capitol building in Washington, D.C." /><figcaption>President Donald Trump speaks during a White House meeting. <span>Photo: Skew News preview</span></figcaption></figure>
            <section className="details-framing" aria-labelledby="framing-title"><div className="details-framing__heading"><h2 id="framing-title">Bias Distribution <button type="button" aria-label="About AI-estimated framing"><Icon name="info" /></button></h2><strong>Center 31%</strong></div><BiasMeter left={20} center={31} right={49} /><p>AI-estimated framing based on the language and emphasis across 12 sources.</p></section>
            <div className="details-story">
              <p>The Trump administration has sent Iran a revised nuclear deal proposal that includes tougher terms on uranium enrichment and stronger verification measures, according to a report published Saturday.</p>
              <p>The new proposal, delivered through intermediaries in Oman, requires Iran to halt all uranium enrichment on its soil and ship its stockpile of enriched uranium out of the country. It also demands unrestricted access for international inspectors to all Iranian nuclear facilities, including military sites.</p>
              <p>“This is a take-it-or-leave-it proposal,” a senior administration official told the Wall Street Journal. “The president wants a deal, but he will not accept a weak agreement that puts America or our allies at risk.”</p>
              <p>Iran has not yet officially responded to the proposal. However, Iranian Foreign Minister Hossein Amir-Abdollahian said last week that any deal must respect Iran’s right to peaceful nuclear energy and include the lifting of all U.S. sanctions.</p>
              <p>The revised proposal comes after several rounds of indirect talks between U.S. and Iranian officials failed to produce a breakthrough. The Trump administration has warned that if diplomacy fails, it is prepared to take action to prevent Iran from obtaining a nuclear weapon.</p>
              <p>European allies have urged both sides to continue negotiations. “We believe diplomacy is still the best path forward,” said a spokesperson for the EU’s foreign policy chief.</p>
              <p>Israel, which has long opposed the 2015 nuclear deal with Iran, praised the Trump administration’s tougher stance. “This is the kind of leadership that was missing in the past,” said Israeli Prime Minister Benjamin Netanyahu in a statement.</p>
              <p>The fate of the proposal now rests with Iran, as global attention remains focused on whether a new nuclear agreement can be reached—or if tensions will escalate further.</p>
            </div>
            <section className="related-stories" aria-labelledby="related-title"><h2 id="related-title">Related Stories</h2><div className="related-stories__grid">{relatedStories.map((story) => <Link href={`/news/${story.slug}`} className="related-story" key={story.slug}><img src={story.image} alt="" /><div><p>{story.category} <span>·</span> {story.region}</p><h3>{story.title}</h3><small>{story.meta}</small></div></Link>)}</div></section>
          </article>
          <aside className="details-aside" aria-label="Article analysis">
            <section className="analysis-card"><div className="analysis-card__title"><h2>Bias Analysis</h2><button type="button" aria-label="About Bias Analysis"><Icon name="info" /></button></div><p className="analysis-kicker">Overall Bias</p><strong className="analysis-score">Right 49%</strong><p className="analysis-muted">Based on 12 balanced sources</p><div className="analysis-bars"><div><span>Left</span><b>20%</b><i className="bar-left" style={{ width: "20%" }} /></div><div><span>Center</span><b>31%</b><i className="bar-center" style={{ width: "31%" }} /></div><div><span>Right</span><b>49%</b><i className="bar-right" style={{ width: "49%" }} /></div></div><p className="analysis-copy">Our analysis is based on the political leaning of the publication and how the story is framed. Sources are weighted by reliability and recency.</p><Button variant="secondary" className="analysis-button">How We Analyze Bias</Button></section>
            <section className="analysis-card"><div className="analysis-card__title"><h2>AI Summary</h2><button type="button" aria-label="About AI Summary"><Icon name="info" /></button></div><p className="analysis-muted">Generated May 31, 2026 · 3 min read</p><ul className="summary-list"><li>The Trump administration has sent Iran a revised nuclear deal proposal with tougher terms, including a complete halt to uranium enrichment.</li><li>The proposal also demands unrestricted inspector access to all nuclear sites, including military facilities.</li><li>Iran has not responded officially but says any deal must respect its right to peaceful nuclear energy and include sanctions relief.</li><li>The U.S. warns it is prepared to take further action if diplomacy fails, while European allies urge continued negotiations.</li></ul><BiasMeter compact left={20} center={31} right={49} /><Button variant="secondary" className="analysis-button">Provide Feedback</Button></section>
            <section className="analysis-card"><div className="analysis-card__title"><h2>Source Breakdown</h2><button type="button" aria-label="About Source Breakdown"><Icon name="info" /></button></div><p className="analysis-kicker">12 Total Sources</p><div className="analysis-bars"><div><span>Left</span><b>2 (20%)</b><i className="bar-left" style={{ width: "20%" }} /></div><div><span>Center</span><b>4 (31%)</b><i className="bar-center" style={{ width: "31%" }} /></div><div><span>Right</span><b>6 (49%)</b><i className="bar-right" style={{ width: "49%" }} /></div></div><dl className="source-list"><div><dt>Fox News</dt><dd className="source-right">Right</dd></div><div><dt>The Wall Street Journal</dt><dd>Center</dd></div><div><dt>Reuters</dt><dd>Center</dd></div><div><dt>BBC</dt><dd>Center</dd></div><div><dt>CNN</dt><dd className="source-left">Left</dd></div><div><dt>The Washington Post</dt><dd className="source-left">Left</dd></div></dl><Button variant="secondary" className="analysis-button">View All Sources</Button></section>
          </aside>
        </div>
        <section className="details-newsletter" aria-labelledby="newsletter-title"><div><h2 id="newsletter-title">Stay Informed. Stay Balanced.</h2><p>Get the top stories and bias analysis delivered to your inbox.</p></div><form><label className="sr-only" htmlFor="newsletter-email">Email address</label><input id="newsletter-email" type="email" placeholder="Enter your email" /><Button type="button">Subscribe</Button></form></section>
      </main>
      <PageFooter />
    </div>
  );
}
