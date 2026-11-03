import { BiasMeter } from "./bias-meter";
import { Icon } from "./icon";

export type ArticleCardProps = {
  category: string;
  region: string;
  title: string;
  summary: string;
  imageUrl: string;
  imageAlt: string;
  timeAgo: string;
  readTime: string;
  framing: { left: number; center: number; right: number };
};

export function ArticleCard({
  category,
  region,
  title,
  summary,
  imageUrl,
  imageAlt,
  timeAgo,
  readTime,
  framing,
}: ArticleCardProps) {
  return (
    <article className="article-card">
      <div className="article-card__image-wrap">
        {/* The sample image is decorative context for this static design-system specimen. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="article-card__image" src={imageUrl} alt={imageAlt} />
        <span className="article-card__image-info"><Icon name="info" /></span>
      </div>
      <div className="article-card__body">
        <div className="article-card__eyebrow">{category}<span>·</span>{region}</div>
        <h3>{title}</h3>
        <p className="article-card__summary">{summary}</p>
        <div className="article-card__meter">
          <BiasMeter compact {...framing} />
          <span className="article-card__estimate">AI-estimated framing</span>
        </div>
        <div className="article-card__meta">
          <span><Icon name="clock" />{timeAgo}</span>
          <span><Icon name="bookmark" />{readTime}</span>
        </div>
      </div>
    </article>
  );
}
