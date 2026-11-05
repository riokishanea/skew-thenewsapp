/* eslint-disable @next/next/no-img-element -- Persisted article image URLs are rendered directly. */

import Link from "next/link";
import { Suspense } from "react";

import { HeaderAuth } from "@/components/header-auth";
import { BiasMeter } from "@/components/ui/bias-meter";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { getPublishedArticles } from "@/lib/supabase/queries/articles";

const topics = ["World Cup", "IPL", "Social Media", "Business & Markets", "Health & Medicine", "Soccer", "Artificial Intelligence", "Arsenal FC", "Extreme Weather and Disasters"];

function Wordmark() {
  return <span className="home-wordmark">skew<small>News</small></span>;
}

function formatPublishedDate(publishedAt: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(publishedAt));
}

async function ArticleFeed() {
  const articles = await getPublishedArticles();

  return (
    <div className="home-news-grid">
      {articles.length === 0 ? (
        <div className="home-empty-state" role="status">
          <h2>No analyzed articles yet</h2>
          <p>Articles will appear here after they have been ingested and analyzed.</p>
        </div>
      ) : articles.map(({ article, source, analysis }) => (
        <article className="home-news-card" key={article.id}>
          <Link href={`/news/${article.slug}`} prefetch={false} className="home-news-card__link" aria-label={`Read: ${article.title}`}>
            <div className="home-news-card__image-wrap">
              <img src={article.image_url} alt={article.title} />
              <span className="home-news-card__info" title="Article analysis information"><Icon name="info" /></span>
            </div>
            <div className="home-news-card__body">
              <p className="home-news-card__eyebrow">{source.name}<span>·</span>{analysis.sentiment_label}</p>
              <h2>{article.title}</h2>
              <div className="home-news-card__framing"><BiasMeter compact left={analysis.left_percentage} center={analysis.center_percentage} right={analysis.right_percentage} /><span className="sr-only">AI-estimated {analysis.bias_label} framing</span></div>
              <p className="home-news-card__analysis-meta">AI-estimated {analysis.bias_label} framing · {Math.round(analysis.confidence * 100)}% confidence</p>
              <p className="home-news-card__sources">Published {formatPublishedDate(article.published_at)}</p>
            </div>
          </Link>
        </article>
      ))}
    </div>
  );
}

function ArticleFeedFallback() {
  return (
    <div className="home-news-grid">
      <div className="home-empty-state" aria-busy="true">
        <h2>Loading articles</h2>
        <p>Loading analyzed articles from Skew News.</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="homepage">
      <header>
        <div className="home-utility"><div className="home-shell home-utility__inner"><a href="#top-news" className="home-utility__brand">Skew News</a><div className="home-utility__links"><time dateTime="2026-06-01">Monday, June 1, 2026</time><button type="button">Set location</button><button type="button">International edition</button></div></div></div>
        <div className="home-main-nav"><div className="home-shell home-main-nav__inner"><button className="home-menu-button" type="button" aria-label="Open navigation menu"><Icon name="menu" /></button><a href="#top-news" aria-label="Skew News home"><Wordmark /></a><nav className="home-nav-links" aria-label="Primary navigation"><a className="is-active" href="#top-news">Home</a><a href="#for-you">For You</a><a href="#local">Local</a><a href="#blindspot">Blindspot</a></nav>        <div className="home-actions">
          <Button>Subscribe</Button>
          <Suspense fallback={<Button variant="secondary">Login</Button>}>
            <HeaderAuth />
          </Suspense>
        </div></div></div>
        <nav className="home-topics" aria-label="Featured topics"><div className="home-shell home-topics__scroll">{topics.map((topic) => <a className="home-topic" href="#top-news" key={topic}>{topic}<span aria-hidden="true">+</span></a>)}</div></nav>
      </header>
      <main id="top-news" className="home-shell home-content"><section aria-labelledby="top-news-title"><div className="home-section-heading"><h1 id="top-news-title">Top News</h1><p>Stories with AI-estimated framing across the coverage.</p></div><Suspense fallback={<ArticleFeedFallback />}><ArticleFeed /></Suspense></section></main>
      <footer className="home-footer"><div className="home-shell home-footer__grid"><div className="home-footer__brand"><Wordmark /><p>Balanced news coverage,<br />powered by AI.</p></div><div><h2>Company</h2><a href="#about">About</a><a href="#careers">Careers</a><a href="#press">Press</a><a href="#contact">Contact</a></div><div><h2>Help</h2><a href="#help">Help Center</a><a href="#guides">Guides</a><a href="#privacy">Privacy Policy</a><a href="#terms">Terms of Service</a></div><div><h2>Connect</h2><div className="home-social-links"><a href="#x" aria-label="Skew News on X">𝕏</a><a href="#linkedin" aria-label="Skew News on LinkedIn">in</a><a href="#instagram" aria-label="Skew News on Instagram">◎</a><a href="#youtube" aria-label="Skew News on YouTube">▶</a></div></div><p className="home-footer__copyright">© 2026 Skew News. All rights reserved.</p></div></footer>
    </div>
  );
}
