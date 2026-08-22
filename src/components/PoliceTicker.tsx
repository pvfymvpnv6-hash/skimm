import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldAlert, RefreshCw, ChevronRight, ChevronDown, ChevronUp, 
  ExternalLink, MapPin, AlertTriangle, Clock, X, Radio, FileText, ChevronLeft
} from "lucide-react";
import { Article } from "../types";
import { stripEmojis } from "../utils/textUtils";

interface PoliceTickerProps {
  onSelectArticle?: (article: Article) => void;
}

type PoliceRegion = "all" | "potsdam" | "pm" | "tf";

export default function PoliceTicker({ onSelectArticle }: PoliceTickerProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeRegion, setActiveRegion] = useState<PoliceRegion>("all");
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [nextSyncSeconds, setNextSyncSeconds] = useState<number>(5 * 60);

  // Interaction State: Pop-up / Dropdown inspection of recent 5 police items
  const [isExpandedListOpen, setIsExpandedListOpen] = useState<boolean>(false);
  const [selectedPoliceDetail, setSelectedPoliceDetail] = useState<Article | null>(null);

  const fetchPoliceArticles = async (region: PoliceRegion = activeRegion) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/news/police?region=${region}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.articles) {
          setArticles(data.articles);
          setCurrentIndex(0);
        }
        if (data.lastSync) setLastUpdated(data.lastSync);
        if (data.nextSyncMs) {
          setNextSyncSeconds(Math.max(10, Math.floor(data.nextSyncMs / 1000)));
        } else {
          setNextSyncSeconds(5 * 60);
        }
      }
    } catch (err) {
      console.warn("Police ticker fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch on region change
  useEffect(() => {
    fetchPoliceArticles(activeRegion);
  }, [activeRegion]);

  // Content-Switcher: Auto-advance to next item every 5s with smooth fade
  useEffect(() => {
    if (articles.length <= 1 || isPaused || isExpandedListOpen) return;

    const switcher = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % articles.length);
    }, 5000);

    return () => clearInterval(switcher);
  }, [articles.length, isPaused, isExpandedListOpen]);

  // Countdown timer & 5-minute sync interval
  useEffect(() => {
    const timer = setInterval(() => {
      setNextSyncSeconds((prev) => {
        if (prev <= 1) {
          fetchPoliceArticles(activeRegion);
          return 5 * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeRegion]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedPoliceDetail) setSelectedPoliceDetail(null);
        if (isExpandedListOpen) setIsExpandedListOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPoliceDetail, isExpandedListOpen]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const currentArticle = articles[currentIndex] || articles[0];

  // Helper to cleanly extract and format location & title
  const formatPoliceHeadline = (art: Article | null | undefined) => {
    if (!art) {
      return {
        location: "Brandenburg",
        title: "Keine aktuellen Meldungen",
        time: "Heute"
      };
    }
    const loc = art.location || "Brandenburg";
    const titleClean = stripEmojis(art.title || "Polizeimeldung");
    return {
      location: loc,
      title: titleClean,
      time: art.publishedAt || "Heute"
    };
  };

  const headlineInfo = currentArticle ? formatPoliceHeadline(currentArticle) : null;

  return (
    <div id="police-radar-bar" className="w-full relative select-none">
      {/* 1-ROW ULTRA COMPACT BAR */}
      <div 
        className="w-full h-11 bg-slate-950/95 border border-slate-800/90 hover:border-blue-500/40 rounded-xl shadow-lg shadow-black/30 backdrop-blur-md px-3 flex items-center justify-between gap-2.5 transition-all duration-200"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* LEFT: Visuelles Branding (Police Radar Badge mit Dual Red/Blue Pulse) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950/70 border border-blue-500/30 text-blue-400 font-mono font-bold text-[10px] uppercase tracking-wider shadow-[0_0_10px_rgba(59,130,246,0.15)]">
            {/* Dual Red/Blue Emergency Pulse Indicator */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-80"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline font-semibold">POLICE RADAR</span>
            <span className="sm:hidden font-semibold">POLIZEI</span>
          </div>
        </div>

        {/* CENTER: Eleganter 5s Content Switcher */}
        <div className="flex-1 min-w-0 h-full flex items-center px-1 overflow-hidden">
          {loading && articles.length === 0 ? (
            <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px] animate-pulse">
              <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />
              <span>Lade aktuelle Polizeieinsätze ({activeRegion.toUpperCase()})...</span>
            </div>
          ) : currentArticle ? (
            <AnimatePresence mode="wait">
              <motion.button
                key={`${currentArticle.id || currentIndex}-${activeRegion}`}
                type="button"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.28, ease: "easeInOut" }}
                onClick={() => setSelectedPoliceDetail(currentArticle)}
                className="w-full text-left flex items-center gap-2 truncate cursor-pointer group text-slate-200 hover:text-blue-300 transition-colors"
                title="Klicken für Einsatz-Details & Protokoll"
              >
                {/* Emergency Tag if breaking */}
                {currentArticle.isBreaking && (
                  <span className="text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                    EIL
                  </span>
                )}

                {/* Location Pill */}
                <span className="text-[10px] font-mono font-semibold bg-slate-900 text-blue-300 border border-slate-800 px-1.5 py-0.5 rounded shrink-0">
                  [{headlineInfo?.location}]
                </span>

                {/* Headline Title */}
                <span className="text-xs font-medium truncate text-slate-200 group-hover:text-blue-300 transition-colors">
                  {headlineInfo?.title}
                </span>

                {/* Time bullet */}
                <span className="text-[10px] font-mono text-slate-500 shrink-0 hidden md:inline">
                  • {headlineInfo?.time}
                </span>

                <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-blue-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </motion.button>
            </AnimatePresence>
          ) : (
            <span className="text-xs text-slate-500 font-mono">Keine aktuellen Meldungen für diese Region.</span>
          )}
        </div>

        {/* RIGHT: Kompakte Region-Pill-Filter & Sync-Status */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Region Pills */}
          <div className="flex items-center gap-0.5 bg-slate-900/90 border border-slate-800/90 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setActiveRegion("all")}
              className={`px-2 py-0.5 text-[10px] font-mono rounded transition-all cursor-pointer ${
                activeRegion === "all" 
                  ? "bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/30" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Alle Meldungen aus Brandenburg"
            >
              Alle
            </button>
            <button
              type="button"
              onClick={() => setActiveRegion("potsdam")}
              className={`px-2 py-0.5 text-[10px] font-mono rounded transition-all cursor-pointer ${
                activeRegion === "potsdam" 
                  ? "bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/30" 
                  : "text-slate-400 hover:text-blue-300"
              }`}
              title="Potsdam Stadt"
            >
              Potsdam
            </button>
            <button
              type="button"
              onClick={() => setActiveRegion("pm")}
              className={`px-2 py-0.5 text-[10px] font-mono rounded transition-all cursor-pointer ${
                activeRegion === "pm" 
                  ? "bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/30" 
                  : "text-slate-400 hover:text-blue-300"
              }`}
              title="Potsdam-Mittelmark"
            >
              PM
            </button>
            <button
              type="button"
              onClick={() => setActiveRegion("tf")}
              className={`px-2 py-0.5 text-[10px] font-mono rounded transition-all cursor-pointer ${
                activeRegion === "tf" 
                  ? "bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/30" 
                  : "text-slate-400 hover:text-blue-300"
              }`}
              title="Teltow-Fläming"
            >
              TF
            </button>
          </div>

          {/* Toggle History List Button */}
          <button
            type="button"
            onClick={() => setIsExpandedListOpen(!isExpandedListOpen)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-[10px] font-mono ${
              isExpandedListOpen 
                ? "bg-blue-600 text-white border-blue-500 shadow-sm" 
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
            }`}
            title="Letzte 5 Polizeieinsätze aufklappen"
          >
            <span className="hidden lg:inline">{articles.length}</span>
            {isExpandedListOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Sync Status Badge */}
          <div 
            className="hidden xl:flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg text-[10px] font-mono cursor-pointer hover:bg-emerald-500/20 transition-all"
            onClick={() => fetchPoliceArticles(activeRegion)}
            title="Klicken zum manuellen Aktualisieren"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{formatCountdown(nextSyncSeconds)}</span>
          </div>
        </div>
      </div>

      {/* 3. INTERAKTIVES DROPDOWN / LISTE DER LETZTEN 5 MELDUNGEN */}
      <AnimatePresence>
        {isExpandedListOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute top-12 left-0 right-0 z-30 bg-slate-950/95 border border-slate-800 rounded-2xl p-3 shadow-2xl backdrop-blur-xl space-y-2 overflow-hidden"
          >
            <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-800/80 text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
                <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
                <span>Aktuelle Polizeiberichte ({activeRegion.toUpperCase()})</span>
              </div>
              <button 
                onClick={() => setIsExpandedListOpen(false)}
                className="text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1 max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {articles.slice(0, 5).map((item, idx) => {
                const info = formatPoliceHeadline(item);
                return (
                  <button
                    key={`${item.id || idx}-drop`}
                    type="button"
                    onClick={() => {
                      setSelectedPoliceDetail(item);
                      setIsExpandedListOpen(false);
                    }}
                    className="w-full p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-blue-500/40 text-left transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 group-hover:bg-blue-600 group-hover:text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0 transition-colors">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-200 group-hover:text-blue-300 truncate">
                          [{info.location}] {info.title}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {info.time} • polizei.brandenburg.de
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 shrink-0" />
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. COMPACT POLICE DETAIL MODAL (Rendered via React Portal at document.body with z-[100]) */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {selectedPoliceDetail && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedPoliceDetail(null)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
              />
              
              {/* Modal Window Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="relative w-full max-w-lg bg-slate-900/95 border border-slate-700/80 rounded-2xl p-6 shadow-2xl shadow-blue-950/70 backdrop-blur-xl z-10 space-y-4"
              >
                {/* Modal Header */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400">
                        Polizeimeldung Brandenburg
                      </span>
                      <h3 className="text-sm font-bold text-white font-display leading-snug">
                        [{selectedPoliceDetail.location || "Brandenburg"}] {stripEmojis(selectedPoliceDetail.title)}
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPoliceDetail(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="space-y-3 text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                  {selectedPoliceDetail.teaser ? (
                    <p className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 text-slate-200">
                      {stripEmojis(selectedPoliceDetail.teaser)}
                    </p>
                  ) : (
                    <p className="text-slate-400 italic">
                      Offizieller Einsatzbericht der Polizeidirektion Brandenburg.
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {selectedPoliceDetail.publishedAt || "Heute"}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      {selectedPoliceDetail.location || "Potsdam / Brandenburg"}
                    </span>
                  </div>
                </div>

                {/* Modal Footer CTA */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
                  <a
                    href={selectedPoliceDetail.url && selectedPoliceDetail.url.startsWith("http") ? selectedPoliceDetail.url : "https://polizei.brandenburg.de/pressemeldungen"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>Auf polizei.brandenburg.de lesen</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    onClick={() => setSelectedPoliceDetail(null)}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-md shadow-blue-600/20"
                  >
                    Schließen
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
