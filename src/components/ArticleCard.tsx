import React, { useState } from "react";
import { Clock, Bookmark, MapPin, TrendingUp, TrendingDown, Minus, X } from "lucide-react";
import { Article } from "../types";
import { enrichArticle } from "../utils/articleEnricher";
import { isLegitimateLocalArticle } from "../utils/localNewsClassifier";

export type BentoVariant = "hero" | "standard" | "wide";
export type ReadingDepth = "skimm" | "deep";

interface ArticleCardProps {
  key?: string;
  article: Article;
  onSelect: (article: Article) => void;
  isSaved: boolean;
  onToggleSave: (e: React.MouseEvent, articleId: string) => void;
  onDismiss?: (e: React.MouseEvent, articleId: string) => void;
  variant?: BentoVariant;
  readingDepth?: ReadingDepth;
  className?: string;
}

function isAuthorOrLogoUrl(url?: string): boolean {
  if (!url || typeof url !== "string") return true;
  const lower = url.toLowerCase();
  return (
    lower.includes("gravatar") ||
    lower.includes("vgwort") ||
    lower.includes("vg08.met") ||
    lower.includes("remindme") ||
    lower.includes("partner-banner") ||
    lower.includes("partner_banner") ||
    lower.includes("ad-banner") ||
    lower.includes("ad_banner") ||
    lower.includes("sponsor") ||
    lower.includes("werbebanner") ||
    lower.includes("faz-quarterly") ||
    lower.includes("eine-hochzeit-kann-ein-guter") ||
    lower.includes("magazin-cover") ||
    lower.includes("magazin_cover") ||
    lower.includes("heft-cover") ||
    lower.includes("abo-aktion") ||
    lower.includes("abo_aktion") ||
    lower.includes("zukunftsmagazin") ||
    lower.includes("unsplash.com") ||
    lower.includes("add_bevorzugte_quelle") ||
    lower.includes("google_banner") ||
    lower.includes("bevorzugte_quelle") ||
    lower.includes("site-logo") ||
    lower.includes("site_logo") ||
    lower.includes("site-header") ||
    lower.includes("site_header") ||
    lower.includes("header-bg") ||
    lower.includes("header_bg") ||
    lower.includes("default-og") ||
    lower.includes("default_og") ||
    lower.includes("default-image") ||
    lower.includes("default_image") ||
    lower.includes("fallback-image") ||
    lower.includes("fallback_image") ||
    lower.includes("placeholder") ||
    /\/avatars?\//.test(lower) ||
    /\/users?\//.test(lower) ||
    /\b(32x32|48x48|50x50|64x64|80x80|96x96|100x100)\b/.test(lower)
  );
}

export default function ArticleCard({
  article: rawArticle,
  onSelect,
  isSaved,
  onToggleSave,
  onDismiss,
  variant = "standard",
  readingDepth = "deep",
  className = "",
}: ArticleCardProps) {
  const article = enrichArticle(rawArticle);
  const [primaryImgFailed, setPrimaryImgFailed] = useState(false);
  const [scrapedImg, setScrapedImg] = useState<string | null>(null);
  const [isScraping, setIsScraping] = useState(false);

  React.useEffect(() => {
    setPrimaryImgFailed(false);
    setScrapedImg(null);
  }, [article.id, article.imageUrl]);

  // On-demand image scraper if missing or errored
  React.useEffect(() => {
    const rawImageIsAuthor = isAuthorOrLogoUrl(article.imageUrl);
    const needsImage = (!article.imageUrl || rawImageIsAuthor || primaryImgFailed) && article.url && !scrapedImg && !isScraping;
    if (needsImage) {
      setIsScraping(true);
      fetch(`/api/scrape-image?url=${encodeURIComponent(article.url)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.imageUrl && !isAuthorOrLogoUrl(data.imageUrl)) {
            setScrapedImg(data.imageUrl);
          }
        })
        .catch(() => {})
        .finally(() => setIsScraping(false));
    }
  }, [article.url, article.imageUrl, scrapedImg, isScraping, primaryImgFailed]);

  // High-contrast Glassmorphic Category Pills with border & drop-shadow
  const getCategoryPillStyle = (category: string) => {
    switch (category.toLowerCase()) {
      case "technologie":
        return "bg-indigo-950/90 text-indigo-300 border-indigo-500/40 shadow-indigo-950/50";
      case "politik":
        return "bg-emerald-950/90 text-emerald-300 border-emerald-500/40 shadow-emerald-950/50";
      case "wissen":
        return "bg-cyan-950/90 text-cyan-300 border-cyan-500/40 shadow-cyan-950/50";
      case "wirtschaft":
        return "bg-amber-950/90 text-amber-300 border-amber-500/40 shadow-amber-950/50";
      case "kultur & gesellschaft":
        return "bg-rose-950/90 text-rose-300 border-rose-500/40 shadow-rose-950/50";
      default:
        return "bg-slate-900/90 text-slate-200 border-slate-700 shadow-slate-950/50";
    }
  };

  // Sentiment analysis badge renderer
  const renderSentimentBadge = () => {
    switch (article.sentiment) {
      case "positive":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
            <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
            <span>Positiv</span>
          </span>
        );
      case "critical":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 backdrop-blur-md">
            <TrendingDown className="w-2.5 h-2.5 text-amber-400" />
            <span>Fokus</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-800/80 text-slate-400 border border-slate-700/60 backdrop-blur-md">
            <Minus className="w-2.5 h-2.5 text-slate-400" />
            <span>Sachlich</span>
          </span>
        );
    }
  };

  // Local-Pin renderer with strict high-precision regional verification
  const renderLocalBadge = () => {
    // Check if the article qualifies as genuinely local to Berlin/Brandenburg
    const isTrulyLocal = isLegitimateLocalArticle({
      title: article.title,
      teaser: article.teaser,
      sourceId: article.sourceId,
      sourceName: article.sourceName,
      category: article.category,
      url: article.url,
      isLocal: article.isLocal
    });

    if (!isTrulyLocal) return null;

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 backdrop-blur-md shadow-[0_0_10px_rgba(6,182,212,0.2)]">
        <MapPin className="w-2.5 h-2.5 text-cyan-400" />
        <span>Lokal-Pin</span>
      </span>
    );
  };

  const handleImageError = () => {
    setPrimaryImgFailed(true);
  };

  const categoryLabel = article.category;
  
  // Determine active image URL cleanly - ONLY REAL PUBLISHER IMAGES (Never fake stock/Unsplash photos)
  let candidateUrl = "";
  if (!primaryImgFailed && article.imageUrl && !isAuthorOrLogoUrl(article.imageUrl)) {
    candidateUrl = article.imageUrl;
  } else if (scrapedImg && !isAuthorOrLogoUrl(scrapedImg)) {
    candidateUrl = scrapedImg;
  }

  const activeImageUrl = (candidateUrl && !isAuthorOrLogoUrl(candidateUrl)) ? candidateUrl : "";
  const hasValidImage = Boolean(activeImageUrl);
  const bullets = article.summaryBullets || [];

  if (variant === "hero") {
    return (
      <article
        id={`article-card-${article.id}`}
        onClick={() => onSelect(article)}
        className={`${className} bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden group cursor-pointer hover:border-slate-700 hover:shadow-2xl hover:shadow-indigo-950/20 transition-all duration-300 flex flex-col h-full relative`}
      >
        {/* Top 2/3: Image Section */}
        <div className="h-64 sm:h-80 lg:h-[65%] bg-slate-800 relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent z-10"></div>
          {hasValidImage ? (
            <img
              src={activeImageUrl}
              alt=""
              referrerPolicy="no-referrer"
              onError={handleImageError}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-850 via-slate-900 to-indigo-950/50 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-3xl font-extrabold text-indigo-300 mb-2 shadow-lg">
                {article.sourceName.substring(0, 1)}
              </div>
              <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">{article.sourceName}</span>
            </div>
          )}
          
          {/* Top badging with maximum contrast glassmorphism */}
          <div className="absolute top-4 left-4 z-20 flex gap-2 flex-wrap items-center">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-widest font-bold border backdrop-blur-md drop-shadow-md ${getCategoryPillStyle(article.category)}`}>
              {categoryLabel}
            </span>
            {renderLocalBadge()}
            {renderSentimentBadge()}
            {article.isBreaking && (
              <span className="bg-rose-600 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded text-white animate-pulse shadow-md">
                Eilmeldung
              </span>
            )}
          </div>

          {/* Top Right Action Controls */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            <button
              id={`bookmark-btn-${article.id}`}
              onClick={(e) => onToggleSave(e, article.id)}
              title={isSaved ? "Beitrag aus Lesezeichen entfernen" : "Beitrag speichern"}
              className={`p-2.5 rounded-full border backdrop-blur-md transition-all cursor-pointer ${
                isSaved
                  ? "bg-indigo-600 text-white border-indigo-500 scale-110"
                  : "bg-slate-900/80 hover:bg-indigo-600 text-slate-400 hover:text-white border-slate-700/60 hover:scale-110"
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
            </button>
            {onDismiss && (
              <button
                id={`dismiss-btn-${article.id}`}
                onClick={(e) => onDismiss(e, article.id)}
                title="Beitrag aus Stream ausblenden"
                className="p-2.5 rounded-full border backdrop-blur-md bg-slate-900/80 hover:bg-rose-600 text-slate-400 hover:text-white border-slate-700/60 hover:scale-110 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Content Section */}
        <div className="p-6 flex flex-col flex-1 justify-between bg-slate-900">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight mb-2 group-hover:text-indigo-300 transition-colors line-clamp-2">
              {article.title}
            </h2>
            {readingDepth === "skimm" ? (
              <ul className="space-y-1.5 my-2">
                {bullets.slice(0, 3).map((b, idx) => (
                  <li key={idx} className="text-xs text-indigo-200/90 leading-snug flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1 shrink-0" />
                    <span className="line-clamp-2">{b}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 text-sm font-sans line-clamp-4 leading-relaxed">
                {article.teaser}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between mt-4 text-[10px] text-slate-500 uppercase tracking-widest font-mono border-t border-slate-800/80 pt-4">
            <span>{article.publishedAt} • {article.readingTime}</span>
            <span className="text-slate-300 font-bold hover:text-indigo-400 transition-colors">{article.sourceName}</span>
          </div>
        </div>
      </article>
    );
  }

  if (variant === "wide") {
    return (
      <article
        id={`article-card-${article.id}`}
        onClick={() => onSelect(article)}
        className={`${className} bg-slate-900 border ${article.isBreaking ? "border-red-500/30 shadow-red-950/10" : article.isPrioritized ? "border-amber-500/35 shadow-amber-950/20" : "border-slate-800"} rounded-2xl overflow-hidden flex flex-col sm:flex-row hover:border-slate-700 hover:shadow-xl hover:shadow-indigo-950/10 transition-all duration-300 cursor-pointer group relative min-h-[220px]`}
      >
        {/* Left Side: Image */}
        <div className="w-full sm:w-1/3 min-h-[160px] sm:min-h-full bg-slate-800 relative overflow-hidden flex items-center justify-center">
          {hasValidImage ? (
            <img
              src={activeImageUrl}
              alt=""
              referrerPolicy="no-referrer"
              onError={handleImageError}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full min-h-[160px] bg-gradient-to-br from-slate-850 via-slate-900 to-indigo-950/50 flex flex-col items-center justify-center p-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xl font-bold text-indigo-300 mb-1">
                {article.sourceName.substring(0, 1)}
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">{article.sourceName}</span>
            </div>
          )}

          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap z-10 items-center">
            <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider border backdrop-blur-md drop-shadow ${getCategoryPillStyle(article.category)}`}>
              {categoryLabel}
            </span>
            {renderLocalBadge()}
            {renderSentimentBadge()}
          </div>
        </div>

        {/* Right Side: Content */}
        <div className="w-full sm:w-2/3 p-5 md:p-6 flex flex-col justify-between bg-slate-900">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-slate-500 text-[10px] font-mono">{article.publishedAt} • {article.readingTime}</span>
              <div className="flex items-center gap-2">
                <button
                  id={`bookmark-btn-${article.id}`}
                  onClick={(e) => onToggleSave(e, article.id)}
                  title={isSaved ? "Beitrag aus Lesezeichen entfernen" : "Beitrag speichern"}
                  className={`text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer ${isSaved ? "text-indigo-400" : ""}`}
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
                </button>
                {onDismiss && (
                  <button
                    id={`dismiss-btn-${article.id}`}
                    onClick={(e) => onDismiss(e, article.id)}
                    title="Beitrag aus Stream ausblenden"
                    className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <h3 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-indigo-300 transition-colors line-clamp-2">
              {article.title}
            </h3>
            {readingDepth === "skimm" ? (
              <ul className="space-y-1.5 my-2">
                {bullets.slice(0, 3).map((b, idx) => (
                  <li key={idx} className="text-xs text-indigo-200/90 leading-snug flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1 shrink-0" />
                    <span className="line-clamp-2">{b}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 text-xs font-sans leading-relaxed line-clamp-4">
                {article.teaser}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/60">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{article.sourceName}</span>
            <span className="text-indigo-400 text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform hover:text-indigo-300">
              Zum Original-Artikel &rarr;
            </span>
          </div>
        </div>
      </article>
    );
  }

  // Standard Bento Box variant
  return (
    <article
      id={`article-card-${article.id}`}
      onClick={() => onSelect(article)}
      className={`${className} bg-slate-900 border ${article.isBreaking ? "border-red-500/30 shadow-red-950/10" : article.isPrioritized ? "border-amber-500/35 shadow-amber-950/20" : "border-slate-800"} rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 hover:shadow-xl hover:shadow-indigo-950/10 transition-all duration-300 cursor-pointer group relative min-h-[350px]`}
    >
      <div>
        {/* Image Section */}
        <div className="h-36 w-full rounded-xl overflow-hidden mb-4 bg-slate-800 relative group-hover:shadow-lg transition-all duration-300 flex items-center justify-center">
          {hasValidImage ? (
            <img
              src={activeImageUrl}
              alt=""
              referrerPolicy="no-referrer"
              onError={handleImageError}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-850 via-slate-900 to-indigo-950/50 flex flex-col items-center justify-center p-3 text-center">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-lg font-bold text-indigo-300 mb-1">
                {article.sourceName.substring(0, 1)}
              </div>
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 font-bold">{article.sourceName}</span>
            </div>
          )}

          {/* High contrast glassmorphic category badge */}
          <div className="absolute top-2.5 left-2.5 z-10 flex gap-1.5 flex-wrap items-center">
            <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider border backdrop-blur-md drop-shadow ${getCategoryPillStyle(article.category)}`}>
              {categoryLabel}
            </span>
            {renderLocalBadge()}
          </div>

          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
            <button
              id={`bookmark-btn-${article.id}`}
              onClick={(e) => onToggleSave(e, article.id)}
              title={isSaved ? "Beitrag aus Lesezeichen entfernen" : "Beitrag speichern"}
              className={`p-1.5 rounded-full border backdrop-blur-md transition-all cursor-pointer ${
                isSaved
                  ? "bg-indigo-600 text-white border-indigo-500 scale-110"
                  : "bg-slate-900/80 hover:bg-indigo-600 text-slate-400 hover:text-white border-slate-700/60 hover:scale-110"
              }`}
            >
              <Bookmark className={`w-3 h-3 ${isSaved ? "fill-current" : ""}`} />
            </button>
            {onDismiss && (
              <button
                id={`dismiss-btn-${article.id}`}
                onClick={(e) => onDismiss(e, article.id)}
                title="Beitrag aus Stream ausblenden"
                className="p-1.5 rounded-full border backdrop-blur-md bg-slate-900/80 hover:bg-rose-600 text-slate-400 hover:text-white border-slate-700/60 hover:scale-110 transition-all cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Sentiment and Metadata Line */}
        <div className="flex items-center justify-between mb-2">
          {renderSentimentBadge()}
          <span className="text-[9px] text-slate-500 font-mono">{article.publishedAt}</span>
        </div>

        <h3 className="text-base font-bold text-white mb-2 leading-snug group-hover:text-indigo-300 transition-colors line-clamp-2">
          {article.title}
        </h3>

        {readingDepth === "skimm" ? (
          <ul className="space-y-1.5 my-2">
            {bullets.slice(0, 3).map((b, idx) => (
              <li key={idx} className="text-xs text-indigo-200/90 leading-snug flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1 shrink-0" />
                <span className="line-clamp-2">{b}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-400 text-xs font-sans leading-relaxed line-clamp-4">
            {article.teaser}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2.5 mt-4 pt-3 border-t border-slate-800/80">
        <div className="w-6 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
          {article.sourceName.substring(0, 1)}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-semibold">{article.sourceName}</span>
          <span className="text-[9px] text-slate-500 font-mono">{article.readingTime}</span>
        </div>
      </div>
    </article>
  );
}
