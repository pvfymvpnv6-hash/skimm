import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Radio, Pause, Play, ChevronLeft, ChevronRight, Zap, 
  ExternalLink, RotateCw
} from "lucide-react";
import { Article } from "../types";
import { stripEmojis } from "../utils/textUtils";

interface NewsTickerProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
  selectedCategory?: string;
  autoRefreshEnabled?: boolean;
  onToggleAutoRefresh?: () => void;
  autoRefreshCountdown?: number;
  onManualRefresh?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: string;
}

export default function NewsTicker({ 
  articles, 
  onSelectArticle, 
  selectedCategory,
  autoRefreshEnabled = true,
  onToggleAutoRefresh,
  autoRefreshCountdown = 600,
  onManualRefresh,
  isRefreshing = false,
  lastUpdated = ""
}: NewsTickerProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>("all"); // "all", "breaking", "tech", "wirtschaft"

  // Filter articles based on selection
  const filteredArticles = React.useMemo(() => {
    let result = articles;
    if (filterType === "breaking") {
      result = articles.filter(a => a.isBreaking || a.isTrending);
      if (result.length === 0) result = articles.slice(0, 10);
    } else if (filterType === "tech") {
      result = articles.filter(a => a.category?.toLowerCase().includes("tech") || a.category?.toLowerCase().includes("wissen"));
      if (result.length === 0) result = articles.slice(0, 10);
    } else if (filterType === "wirtschaft") {
      result = articles.filter(a => a.category?.toLowerCase().includes("wirtschaft") || a.category?.toLowerCase().includes("finanz"));
      if (result.length === 0) result = articles.slice(0, 10);
    }
    return result.slice(0, 25);
  }, [articles, filterType]);

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [filterType]);

  // Auto-switch news every 6 seconds with stationary opacity crossfade
  useEffect(() => {
    if (isPaused || filteredArticles.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredArticles.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, filteredArticles.length]);

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % filteredArticles.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + filteredArticles.length) % filteredArticles.length);
  };

  if (!articles || articles.length === 0) return null;

  const currentArticle = filteredArticles[currentIndex] || filteredArticles[0];

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  return (
    <div 
      id="news-ticker-container" 
      className="w-full bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-xl shadow-slate-950/20 backdrop-blur-md overflow-hidden transition-all duration-300"
    >
      {/* Top Header & Filter & Sync Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 px-3.5 py-2 border-b border-slate-800/60 bg-slate-950/70 text-xs">
        {/* Left Badge Header */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-red-500/15 border border-red-500/30 text-red-400 px-2.5 py-1 rounded-lg font-mono font-bold text-[10px] uppercase tracking-wider shadow-[0_0_12px_rgba(239,68,68,0.25)]">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span>NEWS-TICKER</span>
          </div>
        </div>

        {/* Filters, Sync & Navigation Controls */}
        <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setFilterType("all")}
              className={`px-2 py-0.5 text-[10px] font-mono rounded transition-all cursor-pointer ${
                filterType === "all" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Alle
            </button>
            <button
              onClick={() => setFilterType("breaking")}
              className={`px-2 py-0.5 text-[10px] font-mono rounded transition-all cursor-pointer flex items-center gap-1 ${
                filterType === "breaking" ? "bg-red-600 text-white font-bold" : "text-slate-400 hover:text-red-400"
              }`}
            >
              <Zap className="w-2.5 h-2.5" />
              Eil
            </button>
            <button
              onClick={() => setFilterType("tech")}
              className={`px-2 py-0.5 text-[10px] font-mono rounded transition-all cursor-pointer ${
                filterType === "tech" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Tech
            </button>
            <button
              onClick={() => setFilterType("wirtschaft")}
              className={`px-2 py-0.5 text-[10px] font-mono rounded transition-all cursor-pointer ${
                filterType === "wirtschaft" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Wirtschaft
            </button>
          </div>

          {/* Integrated Sync Controls (Stramm & Kompakt) */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            {/* Auto-Sync indicator toggle */}
            {onToggleAutoRefresh && (
              <button
                type="button"
                onClick={onToggleAutoRefresh}
                className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                title={autoRefreshEnabled ? `Auto-Sync aktiv (nächster in ${formatCountdown(autoRefreshCountdown)}). Klicken zum Pausieren.` : "Auto-Sync pausiert. Klicken zum Aktivieren."}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${autoRefreshEnabled ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                <span className="hidden md:inline text-[10px]">
                  {autoRefreshEnabled ? formatCountdown(autoRefreshCountdown) : "Pausiert"}
                </span>
              </button>
            )}

            {/* Manual Sync Icon Button */}
            {onManualRefresh && (
              <button
                type="button"
                onClick={onManualRefresh}
                disabled={isRefreshing}
                className="p-1 text-indigo-400 hover:text-indigo-200 hover:bg-slate-800 rounded transition-all disabled:opacity-50 cursor-pointer"
                title={`Meldungen jetzt manuell synchronisieren ${lastUpdated ? `(Zuletzt: ${lastUpdated})` : ""}`}
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-300" : ""}`} />
              </button>
            )}
          </div>

          {/* Item counter */}
          <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800/80">
            {currentIndex + 1} / {filteredArticles.length}
          </span>

          {/* Navigation & Pause/Play */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={handlePrev}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
              title="Vorherige Meldung"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNext}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
              title="Nächste Meldung"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused(!isPaused);
              }}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
              title={isPaused ? "Ticker fortsetzen" : "Ticker anhalten"}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* STATIONARY CROSSFADE DISPLAY (Pure Opacity Fade - No Vertical Movement) */}
      <div 
        className="relative h-12 bg-slate-950/50 px-4 py-2 cursor-pointer overflow-hidden group flex items-center"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onClick={() => onSelectArticle(currentArticle)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentArticle.id}-${currentIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="w-full flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {/* Category / Breaking Badge */}
              {currentArticle.isBreaking ? (
                <span className="text-[9px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded shadow-sm shrink-0 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-red-400 animate-pulse" />
                  EIL
                </span>
              ) : (
                <span className="text-[9px] font-mono font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded shrink-0">
                  {currentArticle.category || "News"}
                </span>
              )}

              {/* Clean Title without Emojis */}
              <span className="text-xs sm:text-sm font-medium text-slate-200 group-hover:text-indigo-300 transition-colors truncate">
                {stripEmojis(currentArticle.title)}
              </span>

              {/* Source & Time */}
              <span className="text-[10px] text-slate-400 font-mono hidden sm:flex items-center gap-1 shrink-0 ml-1">
                <span className="text-slate-600">•</span>
                <span className="text-slate-300">{currentArticle.sourceName}</span>
                {currentArticle.publishedAt && (
                  <span className="text-slate-500">({currentArticle.publishedAt})</span>
                )}
              </span>
            </div>

            {/* Read Indicator */}
            <div className="flex items-center gap-1 text-[11px] font-mono text-indigo-400 group-hover:text-indigo-300 shrink-0 opacity-80 group-hover:opacity-100 transition-all">
              <span className="hidden md:inline font-semibold">Lesen</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
