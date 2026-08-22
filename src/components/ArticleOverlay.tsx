import React, { useState, useEffect } from "react";
import { 
  X, ExternalLink, Bookmark, Clock, Share2, Sparkles, 
  Check, RefreshCw, Zap, BookOpen, PanelRight, Maximize2
} from "lucide-react";
import { Article } from "../types";

interface ArticleOverlayProps {
  article: Article;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
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

export default function ArticleOverlay({
  article,
  onClose,
  isSaved,
  onToggleSave,
}: ArticleOverlayProps) {
  const [copied, setCopied] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const [expandedContent, setExpandedContent] = useState<string>(article.content || "");
  const [isExpanding, setIsExpanding] = useState<boolean>(false);
  const [expandedSuccess, setExpandedSuccess] = useState<boolean>(false);
  const [imgError, setImgError] = useState<boolean>(false);
  const [scrapedOverlayImg, setScrapedOverlayImg] = useState<string | null>(null);

  // Desktop Overlay Positioning State: "center" (Modal) vs "right" (Sidebar)
  const [overlayPosition, setOverlayPosition] = useState<"center" | "right">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("article_overlay_position") as "center" | "right") || "center";
    }
    return "center";
  });

  const toggleOverlayPosition = () => {
    const nextPos = overlayPosition === "center" ? "right" : "center";
    setOverlayPosition(nextPos);
    try {
      localStorage.setItem("article_overlay_position", nextPos);
    } catch (e) {
      // Ignore quota or restricted storage errors
    }
  };

  useEffect(() => {
    setExpandedContent(article.content || "");
    setExpandedSuccess(false);
    setImgError(false);
    setSummary("");
    setScrapedOverlayImg(null);
  }, [article.id, article.imageUrl]);

  // If article has no image or image failed, attempt to scrape OG image dynamically in background
  useEffect(() => {
    const hasInitialImage = !imgError && article.imageUrl && !isAuthorOrLogoUrl(article.imageUrl);
    if (!hasInitialImage && article.url && !scrapedOverlayImg) {
      fetch(`/api/scrape-image?url=${encodeURIComponent(article.url)}`)
        .then(r => r.json())
        .then(data => {
          if (data && data.imageUrl && !isAuthorOrLogoUrl(data.imageUrl)) {
            setScrapedOverlayImg(data.imageUrl);
          }
        })
        .catch(() => {});
    }
  }, [article.url, article.imageUrl, scrapedOverlayImg, imgError]);

  // Combined AI action: Generates summary AND expands article in one smooth action
  const handleAiAnalysis = async () => {
    setIsExpanding(true);
    if (!summary) {
      setLoadingSummary(true);
    }

    try {
      // Clean HTML tags and combine teaser + content to provide full text context for AI analysis
      const rawTextToAnalyze = [article.teaser, article.content]
        .filter(Boolean)
        .join("\n\n")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      // Trigger both endpoints in parallel for maximum performance
      const expandPromise = fetch("/api/news/expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: article.title,
          teaser: article.teaser,
          sourceName: article.sourceName,
          category: article.category,
          url: article.url,
          existingContent: rawTextToAnalyze || article.teaser || article.title
        })
      }).then(r => r.json());

      const summaryPromise = !summary
        ? fetch("/api/news/summarize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              title: article.title, 
              text: rawTextToAnalyze || article.teaser || article.title,
              url: article.url 
            })
          }).then(r => r.json())
        : Promise.resolve(null);

      const [expandData, summaryData] = await Promise.all([expandPromise, summaryPromise]);

      if (expandData && expandData.content) {
        // Robust cleanup: remove any legacy duplicate take-aways boxes that might linger in cached HTML
        const sanitizedContent = expandData.content.replace(
          /<div[^>]*>(?:(?!<\/div>).)*?Das Wichtigste auf einen Blick.*?<\/div>/gis,
          ""
        );
        setExpandedContent(sanitizedContent);
        setExpandedSuccess(true);
      }
      if (summaryData && summaryData.summary) {
        setSummary(summaryData.summary);
      }
    } catch (err) {
      console.error("Error running AI analysis:", err);
    } finally {
      setIsExpanding(false);
      setLoadingSummary(false);
    }
  };

  // Scroll listener for reading progress bar
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const total = scrollHeight - clientHeight;
    if (total > 0) {
      setScrollProgress(Math.min(100, Math.max(0, (scrollTop / total) * 100)));
    }
  };

  // Copy link helper
  const handleCopyLink = () => {
    navigator.clipboard.writeText(article.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderSummary = () => {
    if (!summary) return null;
    
    // Split by newline or bullet characters
    const lines = summary.split("\n")
      .map(line => line.replace(/^-\s*/, "").replace(/^\*\s*/, "").replace(/^•\s*/, "").trim())
      .filter(line => line.length > 0);
      
    return (
      <ul className="space-y-2.5 mt-3">
        {lines.map((line, index) => {
          // Parse markdown **bold** parts for crisp keyphrase highlighting
          const parts = line.split(/(\*\*[^*]+\*\*)/g);
          return (
            <li key={index} className="text-sm text-slate-200 leading-relaxed flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0 shadow-sm shadow-indigo-500/50" />
              <div className="flex-1">
                {parts.map((part, i) => {
                  if (part.startsWith("**") && part.endsWith("**")) {
                    return (
                      <strong key={i} className="font-bold text-white mr-1 text-indigo-200">
                        {part.slice(2, -2)}
                      </strong>
                    );
                  }
                  return <span key={i} className="text-slate-200">{part}</span>;
                })}
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  // Dynamic reading time based on expanded text length
  const activeContentText = (expandedContent || article.content || "").replace(/<[^>]*>/g, "");
  const wordCount = activeContentText.split(/\s+/).filter(Boolean).length;
  const computedReadingMins = Math.max(2, Math.round(wordCount / 170));
  const readingTimeLabel = `${computedReadingMins} Min. Lesezeit`;

  return (
    <div 
      id="article-overlay-backdrop"
      className={`fixed inset-0 z-50 flex bg-slate-950/60 backdrop-blur-sm animate-fade-in transition-all duration-300 ${
        overlayPosition === "center"
          ? "justify-center items-end md:items-center p-0 md:p-6"
          : "justify-end items-stretch p-0"
      }`}
    >
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-out or Centered Modal Panel */}
      <div 
        id="article-overlay-panel"
        className={`relative w-full bg-slate-950 shadow-2xl flex flex-col z-10 overflow-hidden border-slate-800 transition-all duration-300 ${
          overlayPosition === "center"
            ? "max-w-3xl h-full md:h-[90vh] md:max-h-[920px] md:rounded-3xl border-t md:border border-slate-800 animate-scale-up"
            : "max-w-2xl h-full rounded-none border-l border-slate-800 animate-slide-in-right"
        }`}
      >
        {/* Scroll Progress Bar */}
        <div 
          className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 transition-all duration-150 sticky top-0 z-30" 
          style={{ width: `${scrollProgress}%` }}
        />

        {/* Navigation / Actions Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/90 sticky top-0 bg-slate-950/95 backdrop-blur-md z-20">
          <button
            id="close-overlay-btn"
            onClick={onClose}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-medium transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
            <span>Schließen</span>
          </button>

          {/* Clean Reader Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-xs font-semibold text-slate-200 border border-slate-700/60 shadow-sm">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Fokussierte Leseansicht</span>
          </div>

          {/* Quick Tools */}
          <div className="flex items-center gap-2">
            {/* Desktop Overlay Positioning Toggle */}
            <button
              id="overlay-position-toggle-btn"
              onClick={toggleOverlayPosition}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl border bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-slate-700/60 transition-all cursor-pointer text-xs font-semibold"
              title={overlayPosition === "center" ? "Als Seitenleiste rechts andocken" : "Zentriert als Modal anzeigen"}
            >
              {overlayPosition === "center" ? (
                <>
                  <PanelRight className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Rechts</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Zentriert</span>
                </>
              )}
            </button>

            {/* Save */}
            <button
              id="overlay-bookmark-btn"
              onClick={() => onToggleSave(article.id)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isSaved
                  ? "bg-indigo-950/60 text-indigo-300 border-indigo-700/80 shadow-inner"
                  : "bg-slate-900/60 text-slate-400 hover:text-white border-slate-800"
              }`}
              title="Artikel speichern"
            >
              <Bookmark className={`w-4.5 h-4.5 ${isSaved ? "fill-current" : ""}`} />
            </button>

            {/* Copy / Share */}
            <button
              id="overlay-share-btn"
              onClick={handleCopyLink}
              className="p-2 rounded-xl border bg-slate-900/60 text-slate-400 hover:text-white border-slate-800 transition-all flex items-center justify-center cursor-pointer"
              title="Artikel-Link kopieren"
            >
              {copied ? (
                <Check className="w-4.5 h-4.5 text-emerald-400" />
              ) : (
                <Share2 className="w-4.5 h-4.5" />
              )}
            </button>

            {/* Direct External Link */}
            <a
              id="overlay-external-link"
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl border bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400/30 transition-all flex items-center gap-1.5 text-xs font-semibold shadow-md shadow-indigo-950"
              title="Originalseite im neuen Tab öffnen"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Original öffnen</span>
            </a>
          </div>
        </div>

        {/* Dynamic Panel Content - Focused Reader Mode */}
        <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100" onScroll={handleScroll}>
          <article className="px-6 md:px-10 py-8 max-w-2xl mx-auto">
            {/* Category & Time */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold font-sans bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 uppercase tracking-wider">
                {article.category}
              </span>
              <span className="text-slate-700">•</span>
              <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>{readingTimeLabel}</span>
              </div>
              <span className="text-slate-700">•</span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                <Zap className="w-3 h-3" />
                KI-Report
              </span>
            </div>

            {/* Title */}
            <h1 className="font-display font-extrabold text-white text-2xl md:text-4xl leading-tight mb-4 tracking-tight">
              {article.title}
            </h1>

            {/* Publisher metadata */}
            <div className="flex items-center justify-between py-3.5 border-y border-slate-800/80 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-700/80 flex-shrink-0">
                  <img 
                    src={`https://www.google.com/s2/favicons?domain=${article.url}&sz=64`}
                    alt=""
                    className="w-4 h-4 object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    {article.sourceName}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {article.publishedAt}
                  </div>
                </div>
              </div>
            </div>

            {/* Immersive Cover Image */}
            {(() => {
              const activeCoverUrl = (!imgError && article.imageUrl && !isAuthorOrLogoUrl(article.imageUrl))
                ? article.imageUrl
                : (scrapedOverlayImg && !isAuthorOrLogoUrl(scrapedOverlayImg))
                  ? scrapedOverlayImg
                  : "";

              if (activeCoverUrl) {
                return (
                  <div className="aspect-video rounded-2xl overflow-hidden mb-8 border border-slate-800 bg-slate-900 relative shadow-md">
                    <img
                      src={activeCoverUrl}
                      alt=""
                      referrerPolicy="no-referrer"
                      onError={() => {
                        if (activeCoverUrl === article.imageUrl) {
                          setImgError(true);
                        } else {
                          setScrapedOverlayImg(null);
                        }
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                );
              }

              return (
                <div className="aspect-video rounded-2xl overflow-hidden mb-8 border border-slate-800 bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900 relative flex flex-col justify-between p-6 md:p-8 shadow-inner">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
                  <div className="flex items-center justify-between z-10">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-widest font-mono">
                      {article.category}
                    </span>
                    <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
                      {article.sourceName}
                    </span>
                  </div>
                  <div className="z-10 my-auto py-2">
                    <p className="text-xl md:text-2xl font-bold text-white line-clamp-3 leading-snug">
                      {article.title}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Original Article Lead / Expanded Teaser Box */}
            <div className="my-6 p-6 md:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-100 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 font-semibold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  <span>Originalmeldung</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {article.content ? (
                  <div 
                    className="text-slate-100 text-base md:text-lg font-medium leading-relaxed font-sans"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                  />
                ) : (
                  <p className="text-slate-100 text-base md:text-lg font-medium leading-relaxed">
                    {article.teaser}
                  </p>
                )}
              </div>
            </div>

            {/* Compact, Non-Intrusive AI Intelligence Bar / Card */}
            <div 
              id="ai-assistant-widget"
              className={`my-6 transition-all duration-300 ${
                summary || isExpanding || loadingSummary
                  ? "p-5 md:p-6 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/40 shadow-xl relative overflow-hidden"
                  : "p-3.5 md:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 hover:border-indigo-500/50 shadow-md"
              }`}
            >
              {/* Background Glow */}
              {(summary || isExpanding || loadingSummary) && (
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />
              )}
              
              <div className="relative z-10">
                {/* Header Row */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-amber-300 flex-shrink-0 shadow-sm">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300">
                          Gemini KI-Assistenz
                        </span>
                        {summary && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-semibold">
                            Analyse aktiv
                          </span>
                        )}
                      </div>
                      {!summary && !isExpanding && !loadingSummary && (
                        <p className="text-xs text-slate-300 hidden sm:block">
                          Zusammenfassung & Fakten-Vertiefung auf Knopfdruck
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Compact Trigger Button */}
                  {(!expandedSuccess || !summary) && (
                    <button
                      id="ai-analysis-btn"
                      onClick={handleAiAnalysis}
                      disabled={isExpanding || loadingSummary}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/30 border border-indigo-400/30 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 ml-auto"
                    >
                      <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isExpanding || loadingSummary ? "animate-spin" : ""}`} />
                      <span>{isExpanding || loadingSummary ? "KI analysiert..." : "✦ KI-Analyse & Text vertiefen"}</span>
                    </button>
                  )}

                  {expandedSuccess && summary && (
                    <button
                      id="ai-reanalyze-btn"
                      onClick={handleAiAnalysis}
                      disabled={isExpanding || loadingSummary}
                      className="px-3 py-1.5 bg-indigo-900/60 hover:bg-indigo-800/60 text-indigo-200 font-semibold text-xs rounded-lg border border-indigo-700/50 flex items-center gap-1.5 transition-all cursor-pointer ml-auto"
                    >
                      <RefreshCw className={`w-3 h-3 ${isExpanding ? "animate-spin" : ""}`} />
                      <span>Erneut analysieren</span>
                    </button>
                  )}
                </div>

                {/* Loading Progress State */}
                {(isExpanding || loadingSummary) && (
                  <div className="mt-4 pt-3 border-t border-indigo-900/50 space-y-2.5 animate-pulse">
                    <div className="flex items-center gap-2 text-indigo-300 font-mono text-xs font-bold uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                      <span>Gemini KI analysiert Beitrag & Hintergründe...</span>
                    </div>
                    <div className="h-3.5 bg-indigo-900/40 rounded w-full"></div>
                    <div className="h-3.5 bg-indigo-900/40 rounded w-4/5"></div>
                  </div>
                )}

                {/* Rendered Summary with Crisp White High-Contrast Typography */}
                {summary && (
                  <div className="mt-4 pt-3 border-t border-indigo-900/60">
                    <h5 className="text-[11px] font-mono uppercase tracking-wider text-indigo-300 font-bold mb-1 flex items-center gap-1.5">
                      <span>Kernaussagen auf einen Blick:</span>
                    </h5>
                    {renderSummary()}
                  </div>
                )}
              </div>
            </div>

            {/* Expanded / Deepened Article Body Display with High-Contrast Typography */}
            {expandedSuccess && (
              <div 
                id="article-body-content"
                className="prose prose-invert max-w-none font-sans leading-relaxed text-base md:text-lg my-8 p-6 md:p-8 bg-slate-900/90 border border-slate-800 text-slate-100 rounded-2xl shadow-xl prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight prose-p:text-slate-200 prose-p:leading-relaxed prose-strong:text-white prose-strong:font-bold prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-950/30 prose-blockquote:text-indigo-200 prose-li:text-slate-200"
                dangerouslySetInnerHTML={{ __html: expandedContent }}
              />
            )}

            {/* End of article content */}
          </article>
        </div>
      </div>
    </div>
  );
}
