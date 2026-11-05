/* eslint-disable @next/next/no-img-element -- Persisted article image URLs are rendered directly. */

import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { HeaderAuth } from "@/components/header-auth";
import { BiasMeter } from "@/components/ui/bias-meter";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { getArticleBySlug } from "@/lib/supabase/queries/articles";
import type { Json } from "@/lib/supabase/types";

const topics = ["World Cup", "IPL", "Social Media", "Business & Markets", "Health & Medicine", "Soccer", "Artificial Intelligence", "Arsenal FC", "Extreme Weather and Disasters"];

function Wordmark() {
  return <span className="home-wordmark">skew<small>News</small></span>;
}

function PageHeader() {
  return (
    <header>
      <div className="home-utility"><div className="home-shell home-utility__inner"><Link href="/" className="home-utility__brand">Skew News</Link><div className="home-utility__links"><time dateTime="2026-06-01">Monday, June 1, 2026</time><button type="button">Set location</button><button type="button">International edition</button></div></div></div>
      <div className="home-main-nav"><div className="home-shell home-main-nav__inner"><button className="home-menu-button" type="button" aria-label="Open navigation menu"><Icon name="menu" /></button><Link href="/" aria-label="Skew News home"><Wordmark /></Link><nav className="home-nav-links" aria-label="Primary navigation"><Link className="is-active" href="/">Home</Link><a href="#for-you">For You</a><a href="#local">Local</a><a href="#blindspot">Blindspot</a></nav><div className="home-actions"><Button>Subscribe</Button><Suspense fallback={<Button variant="secondary">Login</Button>}><HeaderAuth /></Suspense></div></div></div>
      <nav className="home-topics" aria-label="Featured topics"><div className="home-shell home-topics__scroll">{topics.map((topic) => <a className="home-topic" href="#article" key={topic}>{topic}<span aria-hidden="true">+</span></a>)}</div></nav>
    </header>
  );
}

function PageFooter() {
  return (
    <footer className="home-footer"><div className="home-shell home-footer__grid"><div className="home-footer__brand"><Wordmark /><p>Balanced news coverage,<br />powered by AI.</p></div><div><h2>Company</h2><a href="#about">About</a><a href="#careers">Careers</a><a href="#press">Press</a><a href="#contact">Contact</a></div><div><h2>Help</h2><a href="#help">Help Center</a><a href="#guides">Guides</a><a href="#privacy">Privacy Policy</a><a href="#terms">Terms of Service</a></div><div><h2>Connect</h2><div className="home-social-links"><a href="#x" aria-label="Skew News on X">𝕏</a><a href="#linkedin" aria-label="Skew News on LinkedIn">in</a><a href="#instagram" aria-label="Skew News on Instagram">◎</a><a href="#youtube" aria-label="Skew News on YouTube">▶</a></div></div><p className="home-footer__copyright">© 2026 Skew News. All rights reserved.</p></div></footer>
  );
}

function formatPublishedDate(publishedAt: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(publishedAt));
}

function estimateReadTime(rawText: string): string {
  const words = rawText.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 220))} min read`;
}

function toDisplayLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getArticleParagraphs(rawText: string): string[] {
  const paragraphs = rawText
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return paragraphs.length > 0 ? paragraphs : [rawText.trim()];
}

function getLoadedTerms(value: Json): string[] {
  return Array.isArray(value)
    ? value.filter((term): term is string => typeof term === "string" && term.trim().length > 0)
    : [];
}

export default async function NewsDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await auth.protect();

  const { slug } = await params;
  const details = await getArticleBySlug(slug);

  if (!details) {
    notFound();
  }

  const { article, source, analysis } = details;
  const paragraphs = getArticleParagraphs(article.raw_text);
  const loadedTerms = analysis ? getLoadedTerms(analysis.loaded_terms) : [];

  return (
    <div className="homepage details-page">
      <PageHeader />
      <main id="article" className="home-shell details-content">
        <div className="details-layout">
          <article className="details-article">
            <p className="details-eyebrow">{source.name}</p>
            <h1>{article.title}</h1>
            <div className="details-byline"><span>From <strong>{source.name}</strong></span><time dateTime={article.published_at}>{formatPublishedDate(article.published_at)}</time><span>{estimateReadTime(article.raw_text)}</span></div>
            <div className="details-actions" aria-label="Article actions"><button type="button"><Icon name="bookmark" />Save</button><button type="button"><Icon name="share" />Share</button><button type="button" aria-label="More article options"><Icon name="more" /></button></div>
            <figure className="details-figure"><img src={article.image_url} alt={article.title} /><figcaption>{source.name} article image.</figcaption></figure>
            {analysis ? (
              <section className="details-framing" aria-labelledby="framing-title"><div className="details-framing__heading"><h2 id="framing-title">AI-estimated framing <button type="button" aria-label="About AI-estimated framing"><Icon name="info" /></button></h2><strong>{toDisplayLabel(analysis.bias_label)} framing</strong></div><BiasMeter left={analysis.left_percentage} center={analysis.center_percentage} right={analysis.right_percentage} /><p>{analysis.disclaimer}</p></section>
            ) : (
              <section className="details-framing" aria-labelledby="framing-title"><div className="details-framing__heading"><h2 id="framing-title">Analysis status</h2></div><p>This article is awaiting AI analysis. Results will appear here after they are saved.</p></section>
            )}
            <div className="details-story">{paragraphs.map((paragraph, index) => <p key={`${article.id}-${index}`}>{paragraph}</p>)}</div>
          </article>
          <aside className="details-aside" aria-label="Article analysis">
            {analysis ? (
              <>
                <section className="analysis-card"><div className="analysis-card__title"><h2>Bias Analysis</h2><button type="button" aria-label="About AI-estimated framing"><Icon name="info" /></button></div><p className="analysis-kicker">Overall framing</p><strong className="analysis-score">{toDisplayLabel(analysis.bias_label)}</strong><p className="analysis-muted">AI-estimated · {Math.round(analysis.confidence * 100)}% confidence</p><div className="analysis-bars"><div><span>Left</span><b>{analysis.left_percentage}%</b><i className="bar-left" style={{ width: `${analysis.left_percentage}%` }} /></div><div><span>Center</span><b>{analysis.center_percentage}%</b><i className="bar-center" style={{ width: `${analysis.center_percentage}%` }} /></div><div><span>Right</span><b>{analysis.right_percentage}%</b><i className="bar-right" style={{ width: `${analysis.right_percentage}%` }} /></div></div><p className="analysis-copy">{analysis.framing_notes}</p></section>
                <section className="analysis-card"><div className="analysis-card__title"><h2>AI Summary</h2><button type="button" aria-label="About AI Summary"><Icon name="info" /></button></div><p className="analysis-muted">Sentiment: {toDisplayLabel(analysis.sentiment_label)} ({analysis.sentiment_score.toFixed(2)})</p><p className="analysis-copy">{analysis.summary}</p><BiasMeter compact left={analysis.left_percentage} center={analysis.center_percentage} right={analysis.right_percentage} /><p className="analysis-muted">Model: {analysis.model}</p></section>
                {loadedTerms.length > 0 ? <section className="analysis-card"><div className="analysis-card__title"><h2>Loaded Terms</h2></div><ul className="summary-list">{loadedTerms.map((term) => <li key={term}>{term}</li>)}</ul></section> : null}
                <section className="analysis-card"><div className="analysis-card__title"><h2>About this analysis</h2></div><p className="analysis-copy">{analysis.disclaimer}</p></section>
              </>
            ) : (
              <section className="analysis-card"><div className="analysis-card__title"><h2>Analysis pending</h2></div><p className="analysis-copy">No saved Gemini analysis is available for this article yet.</p></section>
            )}
          </aside>
        </div>
        <section className="details-newsletter" aria-labelledby="newsletter-title"><div><h2 id="newsletter-title">Stay Informed. Stay Balanced.</h2><p>Get the top stories and bias analysis delivered to your inbox.</p></div><form><label className="sr-only" htmlFor="newsletter-email">Email address</label><input id="newsletter-email" type="email" placeholder="Enter your email" /><Button type="button">Subscribe</Button></form></section>
      </main>
      <PageFooter />
    </div>
  );
}
