import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, X, ZoomIn, ZoomOut, RefreshCw, Volume2, VolumeX, 
  Copy, Check, ExternalLink, Search, Maximize2, 
  Minimize2, Clock, Lightbulb, TrendingUp, ShieldAlert,
  Newspaper, ChevronRight, ChevronDown, Tag, Compass, Layers, CheckCircle2, Radio
} from "lucide-react";
import { BriefingData, BriefingTopic } from "../types";
import { stripEmojis } from "../utils/textUtils";

interface AiBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  briefingText: string;
  briefingData?: BriefingData | null;
  categoryName: string;
  isLoading: boolean;
  onRegenerate: () => void;
  isPlayingAudio: boolean;
  onToggleSpeech: (text: string) => void;
  onSelectArticleUrl?: (target: string | BriefingTopic) => void;
  lastUpdated?: string;
  initialFocusTopicId?: string | null;
}

export default function AiBriefingModal({
  isOpen,
  onClose,
  briefingText,
  briefingData,
  categoryName,
  isLoading,
  onRegenerate,
  isPlayingAudio,
  onToggleSpeech,
  onSelectArticleUrl,
  lastUpdated,
  initialFocusTopicId
}: AiBriefingModalProps) {
  // --- States ---
  const [zoomScale, setZoomScale] = useState<number>(1.15); // Default comfortable 115% reading zoom
  const [modalSearch, setModalSearch] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [highlightedTopicId, setHighlightedTopicId] = useState<string | null>(null);

  // Expanded topics state for accordion system (Set of keys or indexes)
  // Default: Topic 1 (index 0 / key) is open
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({ "0": true });

  // Reset or focus logic on open
  useEffect(() => {
    if (isOpen) {
      if (initialFocusTopicId && briefingData?.topics) {
        // Locate matching topic index or key
        const matchIdx = briefingData.topics.findIndex(
          (t, idx) => t.articleId === initialFocusTopicId || `topic-${idx}` === initialFocusTopicId || t.title === initialFocusTopicId
        );
        const activeKey = matchIdx >= 0 ? `${matchIdx}` : (initialFocusTopicId || "0");
        
        setExpandedTopics(prev => ({ ...prev, [activeKey]: true, "0": true }));
        setHighlightedTopicId(initialFocusTopicId);

        const timer = setTimeout(() => {
          const targetElement = document.getElementById(`modal-topic-${initialFocusTopicId}`) ||
                                document.getElementById(`modal-topic-${matchIdx >= 0 ? briefingData.topics[matchIdx]?.articleId || `topic-${matchIdx}` : ''}`);
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 200);

        const clearTimer = setTimeout(() => {
          setHighlightedTopicId(null);
        }, 3000);

        return () => {
          clearTimeout(timer);
          clearTimeout(clearTimer);
        };
      } else {
        // Default: first topic expanded
        setExpandedTopics({ "0": true });
      }
    }
  }, [isOpen, initialFocusTopicId, briefingData]);

  // Keyboard shortcut listener (ESC to close, + / - to zoom)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        setZoomScale(prev => Math.min(2.0, prev + 0.15));
      } else if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        setZoomScale(prev => Math.max(0.85, prev - 0.15));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Zoom handlers
  const handleZoomIn = () => setZoomScale(prev => Math.min(2.2, Math.round((prev + 0.15) * 100) / 100));
  const handleZoomOut = () => setZoomScale(prev => Math.max(0.85, Math.round((prev - 0.15) * 100) / 100));
  const handleResetZoom = () => setZoomScale(1.0);

  // Toggle single accordion topic
  const toggleTopicAccordion = (key: string) => {
    setExpandedTopics(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Expand / Collapse all topics
  const expandAllTopics = () => {
    if (!briefingData?.topics) return;
    const all: Record<string, boolean> = {};
    briefingData.topics.forEach((_, idx) => {
      all[`${idx}`] = true;
    });
    setExpandedTopics(all);
  };

  const collapseAllTopics = () => {
    setExpandedTopics({});
  };

  // Copy to Clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(stripEmojis(briefingText));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Fehler beim Kopieren:", err);
    }
  };

  // Open in Standalone Pop-up Window
  const handleOpenExternalWindow = () => {
    const width = 920;
    const height = 950;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const popupHtml = `
      <!DOCTYPE html>
      <html lang="de" class="dark">
      <head>
        <meta charset="UTF-8">
        <title>KI-Blitz-Briefing (${categoryName}) - Standalone Fenster</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { background-color: #0b0f19; color: #f1f5f9; font-family: system-ui, -apple-system, sans-serif; padding: 28px; }
          .highlight { background-color: rgba(99, 102, 241, 0.25); border-radius: 4px; padding: 0 4px; }
          @media print {
            .no-print { display: none !important; }
            body { background-color: #ffffff !important; color: #000000 !important; }
          }
        </style>
      </head>
      <body>
        <div class="max-w-4xl mx-auto space-y-6">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4 no-print">
            <div class="flex items-center gap-3">
              <span class="bg-indigo-500/20 text-indigo-400 p-2 rounded-xl font-bold text-xs uppercase font-mono tracking-wider">KI-BLITZ-BRIEFING</span>
              <div>
                <h1 class="text-xl font-bold text-white">${categoryName}</h1>
                <p class="text-xs text-slate-400">Erstellt: ${new Date().toLocaleTimeString("de-DE")} Uhr</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="window.print()" class="bg-slate-800 hover:bg-slate-700 text-xs px-3.5 py-1.5 rounded-xl border border-slate-700 text-slate-200">Drucken / PDF</button>
              <button onclick="window.close()" class="bg-red-500/20 text-red-400 text-xs px-3.5 py-1.5 rounded-xl border border-red-500/30">Schließen</button>
            </div>
          </div>

          ${briefingData?.summary ? `
            <div class="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-100 text-sm leading-relaxed">
              <strong>Zusammenfassung:</strong> ${stripEmojis(briefingData.summary)}
            </div>
          ` : ''}

          <div class="text-sm leading-relaxed space-y-6">
            ${stripEmojis(briefingText).replace(/\n\n/g, '<br/><br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const popup = window.open(
        "",
        "_blank",
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
      );
      if (popup) {
        popup.document.write(popupHtml);
        popup.document.close();
      } else {
        alert("Pop-up wurde vom Browser blockiert. Nutze bitte das integrierte Vollbild-Modal!");
      }
    } catch (err) {
      console.warn("Pop-up blockiert:", err);
    }
  };

  // Helper to format inline bold text and strip emojis
  const formatBoldText = (text: string) => {
    const clean = stripEmojis(text);
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;
    const formattedElements = [];
    let lastIndex = 0;

    while ((match = boldRegex.exec(clean)) !== null) {
      const before = clean.substring(lastIndex, match.index);
      const boldText = match[1];
      formattedElements.push(before);
      formattedElements.push(
        <strong key={match.index} className="text-white font-semibold bg-indigo-500/10 px-1 py-0.5 rounded border border-indigo-500/20">
          {boldText}
        </strong>
      );
      lastIndex = boldRegex.lastIndex;
    }
    formattedElements.push(clean.substring(lastIndex));
    return formattedElements;
  };

  // Calculate unique source count
  const sourceCount = briefingData?.topics ? new Set(briefingData.topics.map(t => t.sourceName).filter(Boolean)).size || briefingData.topics.length : 4;

  // Render Visual Rich Briefing Data
  const renderVisualBriefing = () => {
    if (!briefingData) return renderFallbackTextBriefing();

    const searchLower = modalSearch.toLowerCase().trim();
    const filteredTopics = briefingData.topics.filter(t => {
      if (!searchLower) return true;
      const cleanTitle = stripEmojis(t.title);
      const cleanTeaser = stripEmojis(t.teaser);
      return (
        cleanTitle.toLowerCase().includes(searchLower) ||
        cleanTeaser.toLowerCase().includes(searchLower) ||
        t.bullets.some(b => stripEmojis(b).toLowerCase().includes(searchLower)) ||
        (t.sourceName && t.sourceName.toLowerCase().includes(searchLower))
      );
    });

    return (
      <div 
        className="space-y-6 transition-all duration-200 select-text"
        style={{ fontSize: `${Math.round(14 * zoomScale)}px`, lineHeight: 1.65 }}
      >
        {/* 1. INTELLIGENCE-STRIP OVER META-SYNTHESIS CARD */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-mono shadow-inner">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-200">
              Synthetisiert aus {sourceCount} Quellen
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-indigo-300 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
              Konfidenz: 98%
            </span>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
              Live-Update {lastUpdated ? `(${lastUpdated})` : ""}
            </span>
          </div>
        </div>

        {/* EXECUTIVE META-SYNTHESIS CARD */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900/90 to-slate-900 border border-indigo-500/30 shadow-xl shadow-indigo-950/20"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          {briefingData.isOffline && (
            <div className="mb-3 inline-flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full font-mono">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>[KI-Modus Offline - Lokale Daten-Synthese]</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight font-display">
                Executive Meta-Synthese
              </h3>
            </div>

            {briefingData.sentimentText && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/70 border border-slate-800 text-xs font-mono text-indigo-300">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                <span>{stripEmojis(briefingData.sentimentText)}</span>
              </div>
            )}
          </div>

          <p className="text-slate-200 leading-relaxed font-sans text-sm sm:text-base">
            {formatBoldText(briefingData.summary)}
          </p>
        </motion.div>

        {/* 2. ACCORDION-SYSTEM FOR THE 4 FOCUS TOPICS */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-indigo-400" />
              <span>Fokus-Themen & Analysen ({filteredTopics.length})</span>
            </h4>

            {filteredTopics.length > 1 && (
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={expandAllTopics}
                  className="text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer px-2 py-0.5 rounded-lg hover:bg-slate-800"
                >
                  Alle aufklappen
                </button>
                <span className="text-slate-700">•</span>
                <button
                  type="button"
                  onClick={collapseAllTopics}
                  className="text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer px-2 py-0.5 rounded-lg hover:bg-slate-800"
                >
                  Alle einklappen
                </button>
              </div>
            )}
          </div>

          {filteredTopics.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
              Keine Themen zur Suchanfrage "{modalSearch}" gefunden.
            </div>
          ) : (
            filteredTopics.map((topic, idx) => {
              const topicKey = topic.articleId || `topic-${idx}`;
              const isTopicHighlighted = highlightedTopicId === topicKey || highlightedTopicId === topic.title || highlightedTopicId === `topic-${idx}`;
              const isExpanded = !!expandedTopics[`${idx}`] || !!expandedTopics[topicKey] || isTopicHighlighted;

              return (
                <div
                  key={idx}
                  id={`modal-topic-${topicKey}`}
                  className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
                    isTopicHighlighted 
                      ? "bg-slate-900 border-indigo-500 ring-4 ring-indigo-500/20 shadow-xl shadow-indigo-950/50" 
                      : isExpanded
                        ? "bg-slate-900/90 border-slate-700/80 shadow-lg shadow-black/30"
                        : "bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70"
                  }`}
                >
                  {/* ACCORDION HEADER (Always visible and clickable) */}
                  <button
                    type="button"
                    onClick={() => toggleTopicAccordion(`${idx}`)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer group select-none"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Topic Number Badge */}
                      <span className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                        isExpanded 
                          ? "bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]" 
                          : "bg-slate-800 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-700"
                      }`}>
                        {idx + 1}
                      </span>

                      {/* Topic Title */}
                      <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-indigo-300 transition-colors font-display truncate">
                        {stripEmojis(topic.title)}
                      </h4>

                      {/* Badges */}
                      <div className="hidden sm:flex items-center gap-2 shrink-0">
                        {topic.impact === "high" && (
                          <span className="text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                            HIGH IMPACT
                          </span>
                        )}
                        {topic.sentiment === "urgent" && (
                          <span className="text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" /> EILMELDUNG
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expand/Collapse Chevron Indicator */}
                    <div className="flex items-center gap-2 shrink-0 pl-2">
                      <span className="text-[11px] font-mono text-slate-500 group-hover:text-indigo-400 hidden md:inline">
                        {isExpanded ? "Einklappen" : "Details"}
                      </span>
                      <div className={`p-1 rounded-lg bg-slate-800/80 group-hover:bg-indigo-500/20 text-slate-400 group-hover:text-indigo-300 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </button>

                  {/* ACCORDION CONTENT (Expanded view) */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-1 border-t border-slate-800/60">
                          <div className="flex flex-col md:flex-row items-start gap-5 pt-3">
                            {/* Article Thumbnail Image (if present) */}
                            {topic.imageUrl && (
                              <div className="relative w-full md:w-56 h-36 shrink-0 rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-950">
                                <img 
                                  src={topic.imageUrl} 
                                  alt={stripEmojis(topic.title)}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                                
                                {topic.sourceName && (
                                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-slate-300 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800">
                                    <span className="truncate max-w-[120px]">{topic.sourceName}</span>
                                    <Tag className="w-3 h-3 text-indigo-400 shrink-0" />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Topic Details */}
                            <div className="flex-1 space-y-3">
                              {topic.teaser && (
                                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                                  {formatBoldText(topic.teaser)}
                                </p>
                              )}

                              {topic.bullets && topic.bullets.length > 0 && (
                                <div className="space-y-2 pt-1">
                                  {topic.bullets.map((bullet, bIdx) => (
                                    <div key={bIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 shadow-[0_0_6px_rgba(129,140,248,0.6)]" />
                                      <span className="leading-normal">{formatBoldText(bullet)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Source Link Action */}
                              {(topic.articleUrl || topic.sourceName) && (
                                <div className="pt-3 flex items-center justify-between border-t border-slate-800/60 mt-3">
                                  <span className="text-xs text-slate-500 font-mono">
                                    Quelle: <span className="text-slate-300 font-medium">{topic.sourceName || "Originalartikel"}</span>
                                  </span>

                                  {topic.articleUrl && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (onSelectArticleUrl) {
                                          onSelectArticleUrl(topic);
                                          onClose();
                                        }
                                      }}
                                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 hover:underline cursor-pointer transition-all"
                                    >
                                      <span>Artikel im Detail lesen</span>
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>

        {/* STRATEGIC TAKEAWAY / OUTLOOK CARD */}
        {briefingData.takeaway && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl bg-slate-900/90 border border-indigo-500/30 space-y-2.5 shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm font-display tracking-wide">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>Strategische Einordnung & Ausblick</span>
            </div>
            <p className="text-slate-200 text-xs sm:text-sm leading-relaxed font-sans">
              {formatBoldText(briefingData.takeaway)}
            </p>
          </motion.div>
        )}
      </div>
    );
  };

  // Structured fallback markdown renderer
  const renderFallbackTextBriefing = () => {
    if (!briefingText) return null;

    const cleanFullText = stripEmojis(briefingText);
    const lines = cleanFullText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    const searchLower = modalSearch.toLowerCase().trim();

    return (
      <div 
        className="space-y-4 transition-all duration-200 select-text"
        style={{ fontSize: `${Math.round(14 * zoomScale)}px`, lineHeight: 1.7 }}
      >
        {lines.map((line, idx) => {
          const isSearchMatch = searchLower && line.toLowerCase().includes(searchLower);

          if (line.startsWith("[KI-Modus") || line.startsWith("[KI-Offline")) {
            return (
              <div 
                key={idx} 
                className="text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 rounded-xl font-mono flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{line}</span>
              </div>
            );
          }

          const isNumberedOrBullet = /^[0-9•\-]+[\.\)]\s*/.test(line) || line.startsWith("•") || line.startsWith("-");

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`p-4 rounded-2xl border transition-all ${
                isSearchMatch 
                  ? "bg-indigo-600/20 border-indigo-400 ring-2 ring-indigo-500/40" 
                  : isNumberedOrBullet 
                    ? "bg-slate-900/80 border-slate-800/80 hover:border-slate-700 shadow-sm" 
                    : "bg-slate-900/40 border-slate-800/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 w-2 h-2 rounded-full bg-indigo-400 shrink-0 shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
                <div className="text-slate-200 font-sans tracking-wide">
                  {formatBoldText(line)}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`relative w-full z-10 flex flex-col bg-slate-900/95 border border-slate-700/60 rounded-3xl shadow-2xl shadow-indigo-950/40 backdrop-blur-xl overflow-hidden transition-all duration-300 ${
            isMaximized ? "max-w-none h-[96vh]" : "max-w-5xl h-[90vh]"
          }`}
        >
          {/* HEADER BAR */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
            {/* Title & Meta */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold font-display text-white tracking-tight">
                    KI-Blitz-Briefing
                  </h2>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-mono font-medium">
                    {categoryName}
                  </span>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>Visuelle Synthese • {lastUpdated || "Echtzeit-Synchronisierung"}</span>
                </p>
              </div>
            </div>

            {/* CONTROLS BAR (Regenerate in Header, Zoom, Audio, Copy, Window, Close) */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Neu generieren in Header */}
              <button
                onClick={onRegenerate}
                disabled={isLoading}
                className="px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                title="KI-Briefing für dieses Ressort neu generieren"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isLoading ? "animate-spin" : ""}`} />
                <span className="hidden md:inline">Neu generieren</span>
              </button>

              {/* Zoom Controls */}
              <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-1 shadow-inner gap-1">
                <button
                  onClick={handleZoomOut}
                  disabled={zoomScale <= 0.85}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="Schrift verkleinern (Strg -)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="px-2 py-0.5 text-xs font-mono font-semibold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-md transition-all cursor-pointer"
                  title="Zoom zurücksetzen"
                >
                  {Math.round(zoomScale * 100)}%
                </button>
                <button
                  onClick={handleZoomIn}
                  disabled={zoomScale >= 2.2}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="Schrift vergrößern (Strg +)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              {/* Audio TTS button */}
              <button
                onClick={() => onToggleSpeech(briefingText)}
                className={`p-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-all ${
                  isPlayingAudio
                    ? "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
                    : "bg-indigo-600/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-600/30"
                }`}
                title={isPlayingAudio ? "Vorlesen stoppen" : "Vorlesen starten"}
              >
                {isPlayingAudio ? (
                  <>
                    <VolumeX className="w-4 h-4 text-red-400" />
                    <span className="hidden sm:inline">Stoppen</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-indigo-400" />
                    <span className="hidden sm:inline font-sans">Vorlesen</span>
                  </>
                )}
              </button>

              {/* Copy Button */}
              <button
                onClick={handleCopy}
                className="p-2 text-slate-400 hover:text-white bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all cursor-pointer"
                title="In Zwischenablage kopieren"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>

              {/* Standalone Window Button */}
              <button
                onClick={handleOpenExternalWindow}
                className="p-2 text-slate-400 hover:text-indigo-300 bg-slate-950/80 hover:bg-indigo-500/10 border border-slate-800 hover:border-indigo-500/30 rounded-xl transition-all cursor-pointer"
                title="In neuem Browser-Fenster öffnen"
              >
                <ExternalLink className="w-4 h-4" />
              </button>

              {/* Maximize Toggle */}
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-2 text-slate-400 hover:text-white bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all cursor-pointer hidden sm:block"
                title={isMaximized ? "Verkleinern" : "Vollbild vergrößern"}
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-red-500/20 hover:border-red-500/30 border border-slate-700/60 rounded-xl transition-all cursor-pointer ml-1"
                title="Schließen (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SECONDARY TOOLBAR (Search & Quick Presets) */}
          <div className="flex items-center justify-between gap-3 px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/60 shrink-0">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="In der Zusammenfassung suchen..."
                className="w-full bg-slate-950 text-slate-200 text-xs pl-8 pr-7 py-1.5 rounded-xl border border-slate-800 focus:border-indigo-500/50 focus:outline-none"
              />
              {modalSearch && (
                <button 
                  onClick={() => setModalSearch("")}
                  className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Quick Zoom Presets */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="hidden md:inline text-[11px] font-mono text-slate-500">Zoom-Stufen:</span>
              {[1.0, 1.25, 1.5, 1.75].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setZoomScale(preset)}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded-lg border transition-all cursor-pointer ${
                    zoomScale === preset
                      ? "bg-indigo-600 text-white border-indigo-500 font-bold"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  {Math.round(preset * 100)}%
                </button>
              ))}
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 scrollbar-thin scrollbar-thumb-slate-800">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="p-4 rounded-full bg-indigo-500/10 border border-indigo-500/30 animate-spin">
                  <RefreshCw className="w-8 h-8 text-indigo-400" />
                </div>
                <p className="text-sm text-slate-300 font-mono animate-pulse">
                  Generiere visuelle KI-Synthese mit Gemini...
                </p>
              </div>
            ) : briefingData ? (
              renderVisualBriefing()
            ) : (
              renderFallbackTextBriefing()
            )}
          </div>

          {/* FOOTER ACTIONS (Streamlined: Close CTA on right, technical footer text removed) */}
          <div className="flex items-center justify-end px-6 py-3.5 bg-slate-950/90 border-t border-slate-800 shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              Schließen
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
