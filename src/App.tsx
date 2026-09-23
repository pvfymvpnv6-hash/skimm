import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Newspaper, Search, SlidersHorizontal, Sun, Moon, Bookmark, 
  Sparkles, X, ChevronRight, ChevronDown, ChevronUp, ArrowUp, Sliders, EyeOff, Layers, Radio, Globe,
  RotateCw, Loader2, Bell, Volume2, VolumeX, Megaphone, Edit2, Zap, Check, Maximize2, ExternalLink,
  AlertTriangle, TrendingUp, Play, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { Article, TopicConfig, SourceConfig, BriefingData } from "./types";
import { DEFAULT_TOPICS, DEFAULT_SOURCES, MOCK_ARTICLES } from "./data/mockNews";
import { getFallbackArticle } from "./data/fallbackArticles";
import WeatherWidget from "./components/WeatherWidget";
import StockTicker from "./components/StockTicker";
import TrafficWidget from "./components/TrafficWidget";
import ManageSourcesModal from "./components/ManageSourcesModal";
import ArticleCard from "./components/ArticleCard";
import ArticleOverlay from "./components/ArticleOverlay";
import AiBriefingModal from "./components/AiBriefingModal";
import NewsTicker from "./components/NewsTicker";
import PoliceTicker from "./components/PoliceTicker";
import { BrandLogo } from "./components/BrandLogo";
import { stripEmojis } from "./utils/textUtils";
import { cleanCanonicalUrl, normalizeTitleFingerprint, generateDeterministicArticleId } from "./utils/articleIdentity";
import { classifyArticleCategory, isSportArticle, isLegitimateBreakingNews } from "./utils/categoryClassifier";

// Simulated breaking news pool removed for production RSS live push integration

// Helper to calculate Calendar Week (KW) according to ISO-8601
function getCalendarWeek(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

export default function App() {
  // --- Persistent States ---
  const [topics, setTopics] = useState<TopicConfig[]>(() => {
    const saved = localStorage.getItem("news_topics");
    return saved ? JSON.parse(saved) : DEFAULT_TOPICS;
  });

  const [deutscheQuellenPool, setDeutscheQuellenPool] = useState<SourceConfig[]>(() => {
    const saved = localStorage.getItem("deutsche_quellen_pool");
    if (saved) {
      try {
        const parsed: SourceConfig[] = JSON.parse(saved);
        // Actively filter out removed/deprecated sources such as MAZ
        const withoutDeprecated = parsed.filter(s => {
          const id = (s.id || "").toString().toLowerCase();
          const name = (s.name || "").toString().toLowerCase();
          const domain = (s.domain || "").toString().toLowerCase();
          return id !== "maz" && !name.includes("märkische") && !domain.includes("maz-online");
        });
        // Repair outdated or corrupted domain mappings from previous sessions
        const sanitized = withoutDeprecated.map(s => {
          const defaultMatch = DEFAULT_SOURCES.find(ds => ds.id === s.id);
          if (defaultMatch) {
            return { ...s, domain: defaultMatch.domain, name: defaultMatch.name };
          }
          return s;
        });
        const existingIds = new Set(sanitized.map(s => s.id));
        const missingDefaults = DEFAULT_SOURCES.filter(ds => !existingIds.has(ds.id));
        const finalPool = [...sanitized, ...missingDefaults];
        localStorage.setItem("deutsche_quellen_pool", JSON.stringify(finalPool));
        return finalPool;
      } catch (e) {}
    }
    return DEFAULT_SOURCES;
  });

  const [savedArticlesStore, setSavedArticlesStore] = useState<Article[]>(() => {
    const saved = localStorage.getItem("news_saved_articles_store");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  const [savedArticleIds, setSavedArticleIds] = useState<string[]>(() => {
    const savedStore = localStorage.getItem("news_saved_articles_store");
    if (savedStore) {
      try {
        const parsed: Article[] = JSON.parse(savedStore);
        return parsed.map(a => a.id);
      } catch (e) {}
    }
    const saved = localStorage.getItem("news_saved_ids");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  const [dismissedStreamArticleIds, setDismissedStreamArticleIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("news_dismissed_stream_articles");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  const handleDismissArticle = (e: React.MouseEvent, articleId: string) => {
    e.stopPropagation();
    setDismissedStreamArticleIds((prev) => {
      if (prev.includes(articleId)) return prev;
      const updated = [...prev, articleId];
      localStorage.setItem("news_dismissed_stream_articles", JSON.stringify(updated));
      return updated;
    });
  };

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("news_dark_mode");
    if (saved) return JSON.parse(saved);
    // Fallback to system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // --- UI States ---
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isBriefingModalOpen, setIsBriefingModalOpen] = useState(false);
  const [initialFocusTopicId, setInitialFocusTopicId] = useState<string | null>(null);

  // --- Real-time Live News States ---
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // --- Auto-Refresh & Batch Pagination States ---
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState<number>(600); // 10 minutes interval
  const [visibleArticleLimit, setVisibleArticleLimit] = useState<number>(24); // Initial batch size (24 articles)
  const [readingDepth, setReadingDepth] = useState<"skimm" | "deep">("deep");

  // --- Live Push Notification States ---
  const [pushEnabled, setPushEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("news_push_enabled");
    return saved ? JSON.parse(saved) : true;
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("news_sound_enabled");
    return saved ? JSON.parse(saved) : true;
  });
  const [activeAlert, setActiveAlert] = useState<Article | null>(null);
  const [pushHistory, setPushHistory] = useState<Article[]>(() => {
    const saved = localStorage.getItem("news_push_history");
    if (!saved) return [];
    try {
      const parsed: Article[] = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(a => a && a.title && isLegitimateBreakingNews(a.title, a.teaser, a.sourceId));
      }
    } catch (e) {}
    return [];
  });
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>(() => {
    const saved = localStorage.getItem("news_dismissed_alerts");
    return saved ? JSON.parse(saved) : [];
  });
  const [deletedAlerts, setDeletedAlerts] = useState<string[]>(() => {
    const saved = localStorage.getItem("news_deleted_alerts");
    return saved ? JSON.parse(saved) : [];
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- Dynamic User & Streak States ---
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem("news_username") || "Thomas";
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(username);

  // --- Live Clock State ---
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 350) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- AI Briefing States ---
  const [briefings, setBriefings] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem("news_briefings");
    return saved ? JSON.parse(saved) : {};
  });
  const [briefingObjects, setBriefingObjects] = useState<Record<string, BriefingData>>(() => {
    const saved = localStorage.getItem("news_briefing_objects");
    return saved ? JSON.parse(saved) : {};
  });
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [briefingStatusText, setBriefingStatusText] = useState("");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Sync user and briefings
  useEffect(() => {
    localStorage.setItem("news_username", username);
  }, [username]);

  useEffect(() => {
    localStorage.setItem("news_briefings", JSON.stringify(briefings));
  }, [briefings]);

  useEffect(() => {
    localStorage.setItem("news_briefing_objects", JSON.stringify(briefingObjects));
  }, [briefingObjects]);

  useEffect(() => {
    localStorage.setItem("news_dismissed_alerts", JSON.stringify(dismissedAlerts));
  }, [dismissedAlerts]);

  useEffect(() => {
    localStorage.setItem("news_deleted_alerts", JSON.stringify(deletedAlerts));
  }, [deletedAlerts]);

  useEffect(() => {
    localStorage.setItem("news_push_history", JSON.stringify(pushHistory));
  }, [pushHistory]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // --- Greeting Helpers ---
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) return "Hallo Nachtschwärmer";
    if (hour < 12) return "Guten Morgen";
    if (hour < 18) return "Guten Tag";
    return "Guten Abend";
  };

  const handleToggleSpeech = (textToSpeak: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    // Clean markdown characters from text for a natural read
    const cleanText = textToSpeak
      .replace(/\*\*|__/g, "") // Remove bold
      .replace(/[*#_\-`]/g, "") // Remove other markdown
      .replace(/\[.*?\]/g, "") // Remove offline/api warnings
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "de-DE";
    
    utterance.onend = () => {
      setIsPlayingAudio(false);
    };
    
    utterance.onerror = () => {
      setIsPlayingAudio(false);
    };

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const generateBriefing = async () => {
    if (filteredArticles.length === 0) return;
    
    setIsBriefingLoading(true);
    setBriefingStatusText("Kompiliere Berichte & erstelle visuelle Themen-Cluster...");
    
    // Stop any current audio
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }

    try {
      const payloadArticles = filteredArticles.slice(0, 6).map(a => ({
        id: a.id,
        title: a.title,
        teaser: a.teaser,
        sourceName: a.sourceName,
        url: a.url,
        imageUrl: a.imageUrl
      }));

      const activeCategoryObj = topics.find(t => t.id === selectedCategory);
      const catLabel = activeCategoryObj ? activeCategoryObj.name : "Top-Meldungen";

      const res = await fetch("/api/news/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: catLabel,
          articles: payloadArticles
        })
      });

      if (!res.ok) throw new Error("Briefing request failed");

      const data = await res.json();
      if (data && data.briefing) {
        setBriefings(prev => ({
          ...prev,
          [selectedCategory]: data.briefing
        }));
      }
      if (data && data.briefingData) {
        setBriefingObjects(prev => ({
          ...prev,
          [selectedCategory]: data.briefingData
        }));
      }
    } catch (err) {
      console.error("Error fetching news briefing:", err);
      // High-quality offline fallback
      const activeCategoryObj = topics.find(t => t.id === selectedCategory);
      const catLabel = activeCategoryObj ? activeCategoryObj.name : "Top-Meldungen";
      const fallbackTopics = filteredArticles.slice(0, 4).map((art, idx) => ({
        articleId: art.id,
        articleIndex: idx + 1,
        title: `🎯 ${art.title || "Themen-Fokus"}`,
        teaser: art.teaser || "Aktuelle Berichte deuten auf nachhaltige Dynamiken hin.",
        bullets: [
          `Quelle: **${art.sourceName}**`,
          `Umfassende Zusammenfassung der Ereignisse in ${catLabel}`
        ],
        sourceName: art.sourceName,
        articleUrl: art.url,
        imageUrl: art.imageUrl,
        sentiment: "neutral" as const,
        impact: idx === 0 ? ("high" as const) : ("medium" as const)
      }));

      const summary = `Hey! Hier ist dein schnelles Fokus-Update für die Kategorie **${catLabel}**:`;
      const takeaway = `Verfolge die Detailberichte direkt in den verlinkten Quellen.`;

      const fallbackText = [
        summary,
        ...fallbackTopics.map(t => `**${t.title}**\n${t.teaser}\n` + t.bullets.map(b => `• ${b}`).join("\n")),
        `**💡 Was bedeutet das für dich?**\n${takeaway}`
      ].join("\n\n");

      setBriefings(prev => ({
        ...prev,
        [selectedCategory]: fallbackText
      }));

      setBriefingObjects(prev => ({
        ...prev,
        [selectedCategory]: {
          summary,
          sentimentText: "Ausgewogen • Aktualisiert",
          takeaway,
          topics: fallbackTopics,
          isOffline: true
        }
      }));
    } finally {
      setIsBriefingLoading(false);
      setBriefingStatusText("");
    }
  };

  // Sync push settings
  useEffect(() => {
    localStorage.setItem("news_push_enabled", JSON.stringify(pushEnabled));
  }, [pushEnabled]);

  useEffect(() => {
    localStorage.setItem("news_sound_enabled", JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem("news_push_history", JSON.stringify(pushHistory));
  }, [pushHistory]);

  // Click outside notification history dropdown to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsHistoryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const playPushSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      // Tone 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      gain1.gain.setValueAtTime(0, ctx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.4);

      // Tone 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      gain2.gain.setValueAtTime(0, ctx.currentTime + 0.12);
      gain2.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.17);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.55);
    } catch (e) {
      console.warn("Audio Context blocked or not supported:", e);
    }
  };

  const activeCustomSourcesHash = useMemo(() => {
    return deutscheQuellenPool
      .filter(s => s.isCustom && s.enabled)
      .map(s => `${s.id}-${s.domain}`)
      .join(",");
  }, [deutscheQuellenPool]);

  // Initial mounting effect to load real-time news
  useEffect(() => {
    fetchNews();
  }, [activeCustomSourcesHash]);

  // Auto-refresh timer (10 minutes / 600 seconds)
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      setAutoRefreshCountdown(prev => {
        if (prev <= 1) {
          if (typeof document !== "undefined" && document.visibilityState === "visible") {
            fetchNews(true);
          }
          return 600; // Reset timer to 10 minutes
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, activeCustomSourcesHash]);

  // Reset pagination limit on category or search query change
  useEffect(() => {
    setVisibleArticleLimit(24);
  }, [selectedCategory, searchQuery]);

  // --- Effects ---
  // Apply theme class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("news_dark_mode", JSON.stringify(darkMode));
  }, [darkMode]);

  // Sync settings to localStorage
  useEffect(() => {
    localStorage.setItem("news_topics", JSON.stringify(topics));
  }, [topics]);

  useEffect(() => {
    localStorage.setItem("deutsche_quellen_pool", JSON.stringify(deutscheQuellenPool));
  }, [deutscheQuellenPool]);

  useEffect(() => {
    localStorage.setItem("news_saved_ids", JSON.stringify(savedArticleIds));
  }, [savedArticleIds]);

  useEffect(() => {
    localStorage.setItem("news_saved_articles_store", JSON.stringify(savedArticlesStore));
  }, [savedArticlesStore]);

  // Fetch real-time news from backend RSS parser
  const fetchNews = async (force = false) => {
    if (force) {
      setIsRefreshing(true);
    } else {
      setIsLoadingNews(true);
    }
    try {
      // Pass custom sources dynamically to the backend to fetch real live articles!
      const customSources = deutscheQuellenPool.filter(s => s.isCustom && s.enabled);
      const customParam = encodeURIComponent(JSON.stringify(customSources));
      const url = `/api/news?refresh=${force}${customSources.length > 0 ? `&customSources=${customParam}` : ""}`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (data && Array.isArray(data.articles)) {
        setArticles(data.articles);

        // Real Live Push Notification Automation:
        // Automatically scan incoming articles for "isBreaking" flags
        if (pushEnabled) {
          const breakingArticles = data.articles.filter((art: Article) => {
            if (!art.isBreaking) return false;
            if (!isLegitimateBreakingNews(art.title, art.teaser, art.sourceId)) return false;
            if (deletedAlerts.includes(art.id)) return false;

            const normTitle = (art.title || "").toLowerCase().trim();
            const normTeaser = (art.teaser || "").toLowerCase().trim();
            const normUrl = (art.url || "").toLowerCase().trim();

            // Veto commercial or sponsored posts from breaking news notifications
            const isCommercial =
              normTitle.includes("anzeige") ||
              normTitle.includes("werbung") ||
              normTitle.includes("sponsoring") ||
              normTitle.includes("sponsored") ||
              normTitle.includes("deal") ||
              normTitle.includes("angebot") ||
              normTitle.includes("reduziert") ||
              normTitle.includes("amazon") ||
              normTitle.includes("rabatt") ||
              normTitle.includes("schnäppchen") ||
              normTitle.includes("gutschein") ||
              normTeaser.includes("anzeige:");

            if (isCommercial) return false;

            const isDismissed = dismissedAlerts.some(d => {
              if (!d) return false;
              const l = d.toLowerCase().trim();
              return l === art.id.toLowerCase() || (normUrl && l === normUrl) || (normTitle && l === normTitle);
            });
            return !isDismissed;
          });

          if (breakingArticles.length > 0) {
            setPushHistory(prevHistory => {
              const updatedHistory = [...prevHistory];
              let newlyTriggered = false;

              breakingArticles.forEach((art: Article) => {
                const normTitle = (art.title || "").toLowerCase().trim();
                const normUrl = (art.url || "").toLowerCase().trim();

                const isAlreadyInHistory = updatedHistory.some(h => 
                  h.id === art.id || 
                  (normUrl && h.url && h.url.toLowerCase().trim() === normUrl) ||
                  (normTitle && h.title && h.title.toLowerCase().trim() === normTitle)
                );

                if (!isAlreadyInHistory) {
                  updatedHistory.unshift({ ...art, isRead: false });

                  // Fire the visual toast alert for the first brand-new breaking news discovered
                  if (!newlyTriggered) {
                    setActiveAlert(art);
                    newlyTriggered = true;
                    if (soundEnabled) {
                      playPushSound();
                    }
                  }
                }
              });

              return updatedHistory;
            });
          }
        }

        if (data.updatedAt) {
          const dateObj = new Date(data.updatedAt);
          setLastUpdated(dateObj.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch live news:", err);
    } finally {
      setIsLoadingNews(false);
      setIsRefreshing(false);
    }
  };

function isSportArticleClient(art: Article): boolean {
  if (!art) return false;
  return isSportArticle(art.title, art.teaser || art.content || "", art.url, art.category);
}

  const dynamicArticles = useMemo(() => {
    const rawBaseArticles = articles.length > 0 ? articles : MOCK_ARTICLES;

    // 1. Normalize all live articles with deterministic IDs & robust classification
    const baseArticles = rawBaseArticles.map((art) => {
      const canonicalUrl = cleanCanonicalUrl(art.url);
      const titleNorm = normalizeTitleFingerprint(art.title);
      const stableId = (art.id && !art.id.includes("NaN")) 
        ? art.id 
        : generateDeterministicArticleId(art.sourceId, art.url, art.title);
      const category = classifyArticleCategory(art.title, art.teaser || art.content || "", art.url, art.category);
      return {
        ...art,
        id: stableId,
        category
      };
    });

    // 2. Normalize and integrate saved articles store
    const normalizedSavedStore = savedArticlesStore.map((savedArt) => {
      const stableId = (savedArt.id && !savedArt.id.includes("NaN")) 
        ? savedArt.id 
        : generateDeterministicArticleId(savedArt.sourceId, savedArt.url, savedArt.title);
      const category = classifyArticleCategory(savedArt.title, savedArt.teaser || savedArt.content || "", savedArt.url, savedArt.category);
      return {
        ...savedArt,
        id: stableId,
        category
      };
    });

    // 3. Robust multi-level deduplication:
    // Check ID, Canonical URL and Title Fingerprint (per source)
    const seenIds = new Set<string>();
    const seenUrls = new Set<string>();
    const seenSourceTitles = new Set<string>();
    const uniqueArticles: Article[] = [];

    // Prioritize live stream articles first
    for (const art of baseArticles) {
      if (!art || !art.title) continue;
      if (isSportArticleClient(art)) continue;

      const artId = art.id;
      const canonicalUrl = cleanCanonicalUrl(art.url);
      const titleNorm = normalizeTitleFingerprint(art.title);
      const sourceTitleKey = `${art.sourceId}::${titleNorm}`;

      if (artId && seenIds.has(artId)) continue;
      if (canonicalUrl && seenUrls.has(canonicalUrl)) continue;
      if (titleNorm && seenSourceTitles.has(sourceTitleKey)) continue;

      if (artId) seenIds.add(artId);
      if (canonicalUrl) seenUrls.add(canonicalUrl);
      if (titleNorm) seenSourceTitles.add(sourceTitleKey);

      uniqueArticles.push(art);
    }

    // Append historical saved articles if they dropped out of live RSS feed
    for (const savedArt of normalizedSavedStore) {
      if (!savedArt || !savedArt.title) continue;
      if (isSportArticleClient(savedArt)) continue;

      const artId = savedArt.id;
      const canonicalUrl = cleanCanonicalUrl(savedArt.url);
      const titleNorm = normalizeTitleFingerprint(savedArt.title);
      const sourceTitleKey = `${savedArt.sourceId}::${titleNorm}`;

      if (artId && seenIds.has(artId)) continue;
      if (canonicalUrl && seenUrls.has(canonicalUrl)) continue;
      if (titleNorm && seenSourceTitles.has(sourceTitleKey)) continue;

      if (artId) seenIds.add(artId);
      if (canonicalUrl) seenUrls.add(canonicalUrl);
      if (titleNorm) seenSourceTitles.add(sourceTitleKey);

      uniqueArticles.push(savedArt);
    }

    return uniqueArticles;
  }, [articles, savedArticlesStore]);

  // --- Filtering & Prioritized Sorting Logic ---
  const filteredArticles = useMemo(() => {
    // Keep track of occurrences of each sourceId during filter to cap weight = 1 (Weniger)
    const sourceArticleCounts: Record<string, number> = {};

    const filtered = dynamicArticles.filter((article) => {
      // 0. Filter out closed/dismissed stream articles
      if (dismissedStreamArticleIds.includes(article.id)) return false;

      // 1. Filter by Enabled Topics
      const topicConfig = topics.find(t => t.name.toLowerCase() === article.category.toLowerCase());
      // If the topic exists and is disabled, hide it
      if (topicConfig && !topicConfig.enabled) return false;

      // 2. Filter by Enabled Sources
      const sourceConfig = deutscheQuellenPool.find(s => s.id === article.sourceId);
      if (sourceConfig && !sourceConfig.enabled) return false;

      // Apply Source Weight: limit to maximum 2 articles if weight is 1 (Weniger)
      const weight = sourceConfig?.weight ?? 2;
      if (weight === 1) {
        if (!sourceArticleCounts[article.sourceId]) {
          sourceArticleCounts[article.sourceId] = 0;
        }
        if (sourceArticleCounts[article.sourceId] >= 2) {
          return false;
        }
        sourceArticleCounts[article.sourceId]++;
      }

      // 3. Filter by Selected Category Tabs ("all", "saved", "tech", "science"...)
      if (selectedCategory === "saved") {
        if (!savedArticleIds.includes(article.id)) return false;
      } else if (selectedCategory !== "all") {
        const matchingTopic = topics.find(t => t.name.toLowerCase() === article.category.toLowerCase());
        if (!matchingTopic || matchingTopic.id !== selectedCategory) return false;
      }

      // 4. Filter by Search Query (Title, Teaser, Source, Category)
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesTitle = article.title.toLowerCase().includes(query);
        const matchesTeaser = article.teaser.toLowerCase().includes(query);
        const matchesSource = article.sourceName.toLowerCase().includes(query);
        const matchesCategory = article.category.toLowerCase().includes(query);
        return matchesTitle || matchesTeaser || matchesSource || matchesCategory;
      }

      return true;
    });

    // Helper to parse published time string to approximate timestamp for sorting
    const getApproximateTimestamp = (publishedAtStr: string) => {
      const now = Date.now();
      if (!publishedAtStr || publishedAtStr === "Gerade eben") return now;
      const minMatch = publishedAtStr.match(/Vor\s+(\d+)\s+Min/i);
      if (minMatch) return now - parseInt(minMatch[1], 10) * 60 * 1000;
      const stdMatch = publishedAtStr.match(/Vor\s+(\d+)\s+Std/i);
      if (stdMatch) return now - parseInt(stdMatch[1], 10) * 60 * 60 * 1000;
      // If full date format "DD.MM., HH:mm"
      const dateMatch = publishedAtStr.match(/(\d{2})\.(\d{2})\.?,\s*(\d{2}):(\d{2})/);
      if (dateMatch) {
        const [_, day, month, hour, min] = dateMatch;
        const currentYear = new Date().getFullYear();
        const d = new Date(currentYear, parseInt(month, 10) - 1, parseInt(day, 10), parseInt(hour, 10), parseInt(min, 10));
        return d.getTime();
      }
      return now - 2 * 60 * 60 * 1000; // fallback
    };

    // --- Weighted Anti-Clustering Interleaving Algorithm ---
    // 1. Breaking News always take absolute precedence at the very top
    const breakingArticles = filtered.filter(a => a.isBreaking);
    const regularArticles = filtered.filter(a => !a.isBreaking);

    // 2. Group articles by source and sort internally by priority & freshness
    interface SourceQueueGroup {
      sourceId: string;
      weight: number;
      items: typeof regularArticles;
      lastPlacedIndex: number;
    }

    const sourceGroupsMap = new Map<string, SourceQueueGroup>();

    regularArticles.forEach(art => {
      const sId = art.sourceId || "general";
      if (!sourceGroupsMap.has(sId)) {
        const sourceConfig = deutscheQuellenPool.find(s => s.id === sId);
        sourceGroupsMap.set(sId, {
          sourceId: sId,
          weight: sourceConfig?.weight ?? 2,
          items: [],
          lastPlacedIndex: -999
        });
      }
      sourceGroupsMap.get(sId)!.items.push(art);
    });

    // Sort items within each source group: Prioritized pins first, then newest first
    sourceGroupsMap.forEach(group => {
      group.items.sort((a, b) => {
        if (a.isPrioritized && !b.isPrioritized) return -1;
        if (!a.isPrioritized && b.isPrioritized) return 1;
        return getApproximateTimestamp(b.publishedAt) - getApproximateTimestamp(a.publishedAt);
      });
    });

    // 3. Interleave articles ensuring variety and weighted distribution
    const interleavedResult: typeof regularArticles = [];
    let currentIndex = 0;

    while (true) {
      const activeGroups = Array.from(sourceGroupsMap.values()).filter(g => g.items.length > 0);
      if (activeGroups.length === 0) break;

      // Filter candidates to strictly avoid repeating the immediate predecessor if other sources are available
      let candidates = activeGroups;
      if (activeGroups.length > 1) {
        const nonImmediate = activeGroups.filter(g => g.lastPlacedIndex !== currentIndex - 1);
        if (nonImmediate.length > 0) {
          candidates = nonImmediate;
        }
      }

      // Rank candidate sources:
      // Score = (Distance since last placed) * WeightMultiplier
      // - Weight 3 ("Mehr") has a multiplier of 1.75 -> drawn roughly every 2-3 items
      // - Weight 2 ("Standard") has a multiplier of 1.0 -> regular turn
      // - Weight 1 ("Weniger") has a multiplier of 0.5 -> rare turn
      candidates.sort((a, b) => {
        const distA = currentIndex - a.lastPlacedIndex;
        const distB = currentIndex - b.lastPlacedIndex;

        const weightMultA = a.weight === 3 ? 1.75 : a.weight === 1 ? 0.5 : 1.0;
        const weightMultB = b.weight === 3 ? 1.75 : b.weight === 1 ? 0.5 : 1.0;

        const scoreA = distA * weightMultA;
        const scoreB = distB * weightMultB;

        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }

        // Secondary tie-breaker: Freshness of next available item in queue
        const timeA = getApproximateTimestamp(a.items[0]?.publishedAt || "");
        const timeB = getApproximateTimestamp(b.items[0]?.publishedAt || "");
        return timeB - timeA;
      });

      const selectedGroup = candidates[0];
      const nextArticle = selectedGroup.items.shift();
      if (nextArticle) {
        interleavedResult.push(nextArticle);
        selectedGroup.lastPlacedIndex = currentIndex;
        currentIndex++;
      }
    }

    return [...breakingArticles, ...interleavedResult];
  }, [dynamicArticles, topics, deutscheQuellenPool, selectedCategory, savedArticleIds, searchQuery, dismissedStreamArticleIds]);

  const visibleArticles = useMemo(() => {
    return filteredArticles.slice(0, visibleArticleLimit);
  }, [filteredArticles, visibleArticleLimit]);

  // Auto-clean any stale/orphaned IDs that have no article payload anywhere
  useEffect(() => {
    if (!isLoadingNews && dynamicArticles.length > 0) {
      setSavedArticleIds(prev => {
        const validIds = prev.filter(id => dynamicArticles.some(a => a.id === id));
        if (validIds.length !== prev.length) {
          return validIds;
        }
        return prev;
      });
    }
  }, [isLoadingNews, dynamicArticles]);

  // If saved category is selected but valid saved articles count drops to 0, reset category
  const validSavedArticlesCount = useMemo(() => {
    return dynamicArticles.filter(a => savedArticleIds.includes(a.id)).length;
  }, [dynamicArticles, savedArticleIds]);

  useEffect(() => {
    if (selectedCategory === "saved" && validSavedArticlesCount === 0) {
      setSelectedCategory("all");
    }
  }, [selectedCategory, validSavedArticlesCount]);

  // Reset pagination limit to 24 whenever category or search filter changes
  useEffect(() => {
    setVisibleArticleLimit(24);
  }, [selectedCategory, searchQuery]);

  // --- Article Saved Handlers ---
  const handleToggleSave = (articleId: string) => {
    const isSaved = savedArticleIds.includes(articleId);
    if (isSaved) {
      setSavedArticleIds((prev) => prev.filter((savedId) => savedId !== articleId));
      setSavedArticlesStore((prev) => prev.filter((art) => art.id !== articleId));
    } else {
      const targetArticle = dynamicArticles.find((art) => art.id === articleId);
      if (targetArticle) {
        setSavedArticleIds((prev) => [...prev, articleId]);
        setSavedArticlesStore((prev) => [...prev, targetArticle]);
      }
    }
  };

  const handleSelectArticle = (article: Article) => {
    const artId = article.id;
    const artUrl = article.url ? article.url.toLowerCase().trim() : "";
    const artTitle = article.title ? article.title.toLowerCase().trim() : "";

    setPushHistory((prev) => 
      prev.map((p) => {
        const pUrl = p.url ? p.url.toLowerCase().trim() : "";
        const pTitle = p.title ? p.title.toLowerCase().trim() : "";
        if (p.id === artId || (artUrl && pUrl === artUrl) || (artTitle && pTitle === artTitle)) {
          return { ...p, isRead: true };
        }
        return p;
      })
    );

    setDismissedAlerts((prev) => {
      const set = new Set(prev);
      if (artId) set.add(artId);
      if (artUrl) set.add(artUrl);
      if (artTitle) set.add(artTitle);
      const updated = Array.from(set);
      localStorage.setItem("news_dismissed_alerts", JSON.stringify(updated));
      return updated;
    });

    if (activeAlert) {
      const actUrl = activeAlert.url ? activeAlert.url.toLowerCase().trim() : "";
      const actTitle = activeAlert.title ? activeAlert.title.toLowerCase().trim() : "";
      if (activeAlert.id === artId || (actUrl && artUrl && actUrl === artUrl) || (actTitle && artTitle && actTitle === artTitle)) {
        setActiveAlert(null);
      }
    }

    setSelectedArticle(article);
  };

  const handleIgnoreAlert = (articleId: string) => {
    const target = (activeAlert && activeAlert.id === articleId) ? activeAlert : articles.find(a => a.id === articleId) || activeAlert;
    const artUrl = target?.url ? target.url.toLowerCase().trim() : "";
    const artTitle = target?.title ? target.title.toLowerCase().trim() : "";

    setDismissedAlerts((prev) => {
      const set = new Set(prev);
      if (articleId) set.add(articleId);
      if (artUrl) set.add(artUrl);
      if (artTitle) set.add(artTitle);
      const updated = Array.from(set);
      localStorage.setItem("news_dismissed_alerts", JSON.stringify(updated));
      return updated;
    });

    setPushHistory((prev) => 
      prev.map((p) => {
        const pUrl = p.url ? p.url.toLowerCase().trim() : "";
        const pTitle = p.title ? p.title.toLowerCase().trim() : "";
        if (p.id === articleId || (artUrl && pUrl === artUrl) || (artTitle && pTitle === artTitle)) {
          return { ...p, isRead: true };
        }
        return p;
      })
    );

    setActiveAlert(null);
  };

  const unreadCount = useMemo(() => {
    return pushHistory.filter((item) => !item.isRead).length;
  }, [pushHistory]);

  // --- Active Filters Count ---
  const disabledTopicsCount = topics.filter(t => !t.enabled).length;
  const disabledSourcesCount = deutscheQuellenPool.filter(s => !s.enabled).length;
  const activeFiltersCount = disabledTopicsCount + disabledSourcesCount;

  // Render Category Tab Row (Only show topics that are enabled, plus 'All' and 'Saved')
  const visibleCategories = useMemo(() => {
    const list = [{ id: "all", name: "Alle Artikel" }];
    
    // Saved Count (Only show tab if there are actual valid saved articles)
    if (validSavedArticlesCount > 0) {
      list.push({ id: "saved", name: `Gespeichert (${validSavedArticlesCount})` });
    }

    // Active Topics
    topics.forEach(t => {
      if (t.enabled && t.id !== "all") {
        list.push({ id: t.id, name: t.name });
      }
    });

    return list;
  }, [topics, validSavedArticlesCount]);

  return (
    <div 
      id="app-root-container"
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-400"
    >
      {/* 1. NAVIGATION BAR */}
      <nav 
        id="navbar-container"
        className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 h-16"
      >
        <div className="flex items-center gap-8 flex-1">
          {/* Brand Logo */}
          <BrandLogo 
            size="md" 
            onClick={() => { 
              setSelectedCategory("all"); 
              window.scrollTo({ top: 0, behavior: 'smooth' }); 
            }} 
          />

          {/* Elegant Search Bar */}
          <div className="hidden md:flex items-center bg-slate-900 border border-slate-800 rounded-full px-4 py-1.5 w-80 shadow-inner">
            <Search className="w-4 h-4 text-slate-500 mr-2" />
            <input
              id="desktop-search-input"
              type="text"
              placeholder="Perspektiven durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-xs w-full focus:outline-none placeholder-slate-600 text-slate-200"
            />
            {searchQuery && (
              <button
                id="clear-search-desktop"
                onClick={() => setSearchQuery("")}
                className="text-slate-500 hover:text-slate-300 ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Action Tools */}
        <div className="flex items-center gap-4">
          {/* Echtzeit Push Zentrale Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="push-bell-btn"
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="relative p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-all text-slate-300 hover:text-white cursor-pointer"
              title="Push-Benachrichtigungs-Zentrale"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold border-2 border-slate-950 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isHistoryOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 overflow-hidden text-left"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
                      <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                      <span>Echtzeit Live-Push</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`p-1 rounded transition-colors ${soundEnabled ? "text-indigo-400 bg-indigo-500/10" : "text-slate-500 bg-slate-800/50"}`}
                        title={soundEnabled ? "Sound an" : "Sound aus"}
                      >
                        {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => setPushEnabled(!pushEnabled)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                          pushEnabled ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {pushEnabled ? "Aktiv" : "Inaktiv"}
                      </button>
                    </div>
                  </div>

                  {/* Notification History list */}
                  <div className="max-h-[280px] overflow-y-auto space-y-2 scrollbar-none">
                    <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-800/40">
                      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Meldungen</div>
                      <div className="flex items-center gap-1.5">
                        {unreadCount > 0 && (
                          <button
                            onClick={() => {
                              setPushHistory(prev => prev.map(item => ({ ...item, isRead: true })));
                            }}
                            className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider cursor-pointer"
                          >
                            Alle lesen
                          </button>
                        )}
                        {unreadCount > 0 && pushHistory.length > 0 && (
                          <span className="text-slate-700 text-[9px]">•</span>
                        )}
                        {pushHistory.length > 0 && (
                          <button
                            onClick={() => {
                              const allIds = pushHistory.map(item => item.id);
                              setDeletedAlerts(prev => {
                                const updated = [...prev];
                                allIds.forEach(id => {
                                  if (!updated.includes(id)) updated.push(id);
                                });
                                return updated;
                              });
                              setPushHistory([]);
                            }}
                            className="text-[9px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider cursor-pointer"
                          >
                            Alle löschen
                          </button>
                        )}
                      </div>
                    </div>
                    {pushHistory.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-500 font-sans">
                        Bisher keine Live-Meldungen empfangen. Neue Eilmeldungen werden hier automatisch protokolliert...
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <AnimatePresence initial={false}>
                          {pushHistory.map((item) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, height: 0, y: -10 }}
                              animate={{ opacity: 1, height: "auto", y: 0 }}
                              exit={{ opacity: 0, height: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                              onClick={() => {
                                handleSelectArticle(item);
                                setIsHistoryOpen(false);
                              }}
                              className={`p-2 border rounded-xl cursor-pointer transition-all flex items-start gap-2 group relative overflow-hidden ${
                                item.isRead 
                                  ? "bg-slate-950/20 hover:bg-slate-900/40 border-slate-900/40 text-slate-400" 
                                  : "bg-slate-950/60 hover:bg-slate-800/80 border-slate-850 hover:border-slate-700 text-slate-200"
                              }`}
                            >
                              {/* Status indicator button to toggle read/unread */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPushHistory(prev =>
                                    prev.map(p => p.id === item.id ? { ...p, isRead: !p.isRead } : p)
                                  );
                                }}
                                className="relative flex items-center justify-center w-5 h-5 -ml-1 mt-0.5 shrink-0 hover:bg-slate-800 rounded-full transition-all group/dot cursor-pointer"
                                title={item.isRead ? "Als ungelesen markieren" : "Als gelesen markieren"}
                              >
                                {item.isRead ? (
                                  <span className="w-1.5 h-1.5 rounded-full border border-slate-600 bg-transparent group-hover/dot:bg-slate-400 transition-colors"></span>
                                ) : (
                                  <span className="w-2 h-2 rounded-full bg-red-500 group-hover/dot:scale-125 transition-transform shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse"></span>
                                )}
                              </button>

                              <div className="flex-1 min-w-0 pr-5">
                                <h4 className={`text-xs line-clamp-1 leading-snug group-hover:text-indigo-300 transition-colors ${
                                  item.isRead ? "font-medium text-slate-400" : "font-bold text-slate-200"
                                }`}>
                                  {item.title}
                                </h4>
                                <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono mt-0.5">
                                  <span>{item.sourceName}</span>
                                  <span>•</span>
                                  <span>{item.publishedAt}</span>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletedAlerts(prev => prev.includes(item.id) ? prev : [...prev, item.id]);
                                  setPushHistory(prev => prev.filter(p => p.id !== item.id));
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-800 text-slate-500 hover:text-red-400 rounded transition-all cursor-pointer shrink-0 absolute right-1.5 top-1.5"
                                title="Meldung löschen"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Lesetiefe Global Slider (Skimm | Deep Dive) */}
          <div className="hidden md:flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-[10px] font-mono font-medium">
            <span className="text-slate-500 px-1.5 flex items-center gap-1 font-semibold uppercase tracking-wider text-[9px]">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Tiefe:
            </span>
            <button
              id="lesetiefe-skimm-btn"
              onClick={() => setReadingDepth("skimm")}
              className={`px-2.5 py-1 rounded-lg transition-all font-bold cursor-pointer ${
                readingDepth === "skimm"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
              title="Skimm: Nur Fakten & 3-Bullet Points"
            >
              ⚡ Skimm
            </button>
            <button
              id="lesetiefe-deep-btn"
              onClick={() => setReadingDepth("deep")}
              className={`px-2.5 py-1 rounded-lg transition-all font-bold cursor-pointer ${
                readingDepth === "deep"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
              title="Deep Dive: Erweiterte Hintergründe & Analysen"
            >
              🔬 Deep Dive
            </button>
          </div>

          <button
            id="manage-sources-nav-btn"
            onClick={() => setIsManageModalOpen(true)}
            className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors text-xs font-medium text-slate-300 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Themen & Quellen</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 bg-indigo-600 text-white rounded-full text-[9px] flex items-center justify-center font-bold font-mono">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Search - Visible only on small screens */}
      <div className="px-4 py-3 bg-slate-950 border-b border-slate-900/60 block md:hidden">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="mobile-search-input"
            type="text"
            placeholder="Artikel durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 text-slate-200 pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-800 focus:border-indigo-500/30 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              id="clear-search-mobile"
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN CONTAINER */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex-1 flex flex-col gap-6">
        
        {/* Lighter, premium contrast section for high-level widgets to soften the overall dark canvas */}
        <section 
          id="widgets-ambient-wrapper" 
          className="bg-gradient-to-br from-slate-800/85 via-slate-800/70 to-slate-850/85 border border-slate-600/40 ring-1 ring-indigo-500/25 rounded-[40px] p-6 shadow-2xl shadow-slate-950/50 backdrop-blur-md relative overflow-hidden"
        >
          {/* Intensified high-contrast ambient radial glow layers */}
          <motion.div 
            animate={{ 
              scale: [1, 1.25, 1], 
              opacity: [0.25, 0.45, 0.25],
              x: [0, 20, 0],
              y: [0, -15, 0]
            }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            className="absolute top-[-25%] left-[-15%] w-[65%] h-[75%] rounded-full bg-gradient-to-br from-indigo-500/35 via-violet-600/25 to-transparent blur-[90px] pointer-events-none" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1], 
              opacity: [0.2, 0.4, 0.2],
              x: [0, -25, 0],
              y: [0, 20, 0]
            }}
            transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[-25%] right-[-15%] w-[60%] h-[70%] rounded-full bg-gradient-to-tl from-cyan-500/30 via-indigo-600/25 to-transparent blur-[85px] pointer-events-none" 
          />
          <motion.div 
            animate={{ 
              scale: [0.9, 1.2, 0.9], 
              opacity: [0.15, 0.3, 0.15]
            }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 2 }}
            className="absolute top-[20%] left-[30%] w-[40%] h-[50%] rounded-full bg-violet-500/20 blur-[75px] pointer-events-none" 
          />

          {/* Top Horizontal Police & Emergency Feed Bar (polizei.brandenburg.de/rss/) */}
          <div className="relative z-10 mb-4">
            <PoliceTicker onSelectArticle={handleSelectArticle} />
          </div>

          <div id="header-weather-section" className="grid grid-cols-1 lg:grid-cols-12 gap-4 relative z-10 items-stretch">
            <div className="lg:col-span-4 flex flex-col gap-4 h-full">
              {/* 1. Welcome & Time Card */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/30 rounded-2xl p-5 shadow-lg shadow-slate-950/10 shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="text-slate-500 text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
                      <span>
                        {currentTime.toLocaleDateString("de-DE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                      </span>
                      <span className="text-slate-700 dark:text-slate-650 font-bold">•</span>
                      <span className="text-indigo-400 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 shadow-sm">
                        KW {getCalendarWeek(currentTime)}
                      </span>
                    </div>
                    <div className="text-base font-bold font-mono tracking-tight text-slate-300">
                      {currentTime.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} Uhr
                    </div>
                  </div>
                  {/* AI Radar display in top corner */}
                  <div className="flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full text-indigo-400 text-[10px] font-mono font-bold shadow-[0_0_8px_rgba(99,102,241,0.1)]">
                    <Sparkles className="w-3 h-3 fill-indigo-500/15" />
                    <span>NEWS-RADAR</span>
                  </div>
                </div>
                
                {/* Dynamic Welcome Heading */}
                <div className="mt-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isEditingName ? (
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (nameInput.trim()) {
                            setUsername(nameInput.trim());
                          }
                          setIsEditingName(false);
                        }}
                        className="flex items-center gap-1.5 mt-0.5"
                      >
                        <input 
                          type="text"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          className="bg-slate-950 text-white font-display font-extrabold text-lg px-2 py-0.5 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500 max-w-[140px]"
                          autoFocus
                          onBlur={() => {
                            if (nameInput.trim()) {
                              setUsername(nameInput.trim());
                            }
                            setIsEditingName(false);
                          }}
                        />
                        <button type="submit" className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded-md font-sans font-semibold cursor-pointer">OK</button>
                      </form>
                    ) : (
                      <div className="flex items-center gap-1.5 group">
                        <h3 className="text-slate-400 font-sans text-xs font-medium">
                          {getGreeting()},
                        </h3>
                        <span 
                          onClick={() => setIsEditingName(true)}
                          className="text-white font-display font-bold text-sm cursor-pointer hover:text-indigo-400 border-b border-dashed border-slate-700 hover:border-indigo-400 transition-all flex items-center gap-1"
                          title="Namen ändern"
                        >
                          {username}
                          <Edit2 className="w-2.5 h-2.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                      </div>
                    )}
                  </div>
                  <h2 className="font-display font-extrabold text-xl text-white tracking-tight leading-tight mt-1">
                    Dein persönliches Journal
                  </h2>
                </div>
              </div>

              {/* StockTicker Watchlist (flex-1 h-full for bottom edge alignment with right column) */}
              <div className="flex-1 flex flex-col min-h-0">
                <StockTicker className="flex-1 h-full" />
              </div>
            </div>

            <div className="lg:col-span-8 flex flex-col gap-4 h-full">
              <WeatherWidget />

              {/* 2. KI News-Radar Briefing Cockpit (Executive B2B Quality - Level 1) */}
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl shadow-slate-950/30">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] text-indigo-300 font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg shadow-[0_0_12px_rgba(99,102,241,0.1)]">
                      <Zap className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20" />
                      KI-Blitz-Briefing Cockpit
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono font-medium hidden sm:inline">
                      • {topics.find(t => t.id === selectedCategory)?.name || (selectedCategory === "saved" ? "Gespeichert" : "Schlagzeilen")}
                    </span>
                  </div>

                  {/* Clean Header Action Buttons */}
                  <div className="flex items-center gap-1.5">
                    {briefings[selectedCategory] && (
                      <>
                        {/* Subtle Audio Button in Header */}
                        <button
                          onClick={() => handleToggleSpeech(briefings[selectedCategory])}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all cursor-pointer ${
                            isPlayingAudio 
                              ? "bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25 shadow-[0_0_10px_rgba(244,63,94,0.2)]" 
                              : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white"
                          }`}
                          title={isPlayingAudio ? "Vorlesen anhalten" : "Briefing anhören"}
                        >
                          {isPlayingAudio ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                              <span className="text-[10px] hidden sm:inline">Stoppen</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                              <span className="text-[10px] hidden sm:inline">Anhören</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={generateBriefing}
                          className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700 transition-all cursor-pointer"
                          title="Briefing neu generieren"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (typeof window !== "undefined" && window.speechSynthesis) {
                              window.speechSynthesis.cancel();
                              setIsPlayingAudio(false);
                            }
                            setBriefings(prev => {
                              const copy = { ...prev };
                              delete copy[selectedCategory];
                              return copy;
                            });
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-300 bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700 transition-all cursor-pointer"
                          title="Briefing ausblenden"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isBriefingLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <div className="relative flex items-center justify-center">
                      <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute w-12 h-12 rounded-full border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                      />
                      <div className="bg-indigo-500/10 p-3 rounded-full border border-indigo-500/30">
                        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                      </div>
                    </div>
                    <span className="text-xs text-slate-300 font-mono animate-pulse">{briefingStatusText}</span>
                  </div>
                ) : briefings[selectedCategory] ? (
                  <div className="space-y-4">
                    {/* Speech synthesis visual audio equalizer bar */}
                    {isPlayingAudio && (
                      <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-xl shadow-[0_0_12px_rgba(99,102,241,0.1)]">
                        <span className="text-[10px] text-indigo-300 font-mono font-semibold animate-pulse flex items-center gap-1.5">
                          <Radio className="w-3 h-3 text-indigo-400" />
                          Audio-Wiedergabe aktiv
                        </span>
                        <div className="flex items-end gap-1 h-3.5 shrink-0">
                          <motion.div animate={{ height: [4, 14, 4] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }} className="w-1 bg-indigo-400 rounded-full" />
                          <motion.div animate={{ height: [10, 4, 10] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.15 }} className="w-1 bg-indigo-400 rounded-full" />
                          <motion.div animate={{ height: [3, 13, 3] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.3 }} className="w-1 bg-indigo-400 rounded-full" />
                          <motion.div animate={{ height: [7, 14, 7] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.45 }} className="w-1 bg-indigo-400 rounded-full" />
                        </div>
                      </div>
                    )}

                    {/* 1. Cockpit Intelligence-Strip */}
                    {(() => {
                      const topicList = briefingObjects[selectedCategory]?.topics || [];
                      const sourceCount = topicList.length > 0 
                        ? new Set(topicList.map(t => t.sourceName).filter(Boolean)).size || topicList.length 
                        : (articles && articles.length > 0 ? new Set(articles.map(a => a.sourceName)).size || 4 : 4);

                      return (
                        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] text-slate-300 font-mono shadow-inner">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="font-semibold text-slate-200">
                              Synthetisiert aus {sourceCount} Quellen
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1 text-indigo-300 font-medium">
                              <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                              Konfidenz: 98%
                            </span>
                            <span className="text-slate-700 hidden sm:inline">•</span>
                            <span className="flex items-center gap-1 text-emerald-400">
                              <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                              Live-Update
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Executive Summary Synthese Box (Clean line-clamp-3, no rigid height constraints) */}
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 relative overflow-hidden space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                          <Zap className="w-3 h-3 text-indigo-400" />
                          Executive Meta-Synthese
                        </span>
                        {briefingObjects[selectedCategory]?.sentimentText && (
                          <span className="text-[10px] font-mono text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-indigo-400" />
                            {stripEmojis(briefingObjects[selectedCategory].sentimentText)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed font-sans line-clamp-3 overflow-hidden">
                        {(() => {
                          const raw = briefingObjects[selectedCategory]?.summary || briefings[selectedCategory]?.split("\n\n")[0]?.replace(/\*\*/g, "") || "";
                          const clean = stripEmojis(raw);
                          // Extract up to 2 concise sentences cleanly if available
                          const sentences = clean.match(/[^.!?]+[.!?]+/g);
                          if (sentences && sentences.length >= 2) {
                            return `${sentences[0].trim()} ${sentences[1].trim()}`;
                          }
                          return clean;
                        })()}
                      </p>
                    </div>

                    {/* 4 Interactive Topic Cards (Click triggers Level 2 Modal with Topic Focus) */}
                    {briefingObjects[selectedCategory]?.topics && briefingObjects[selectedCategory].topics.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-0.5">
                          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider flex items-center gap-1.5">
                            <Radio className="w-3 h-3 text-indigo-400" />
                            Top-Themen im Fokus ({Math.min(4, briefingObjects[selectedCategory].topics.length)})
                          </span>
                          <span className="text-[9px] font-mono text-slate-500">Klick öffnet Detailfokus</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {briefingObjects[selectedCategory].topics.slice(0, 4).map((topic, tIdx) => {
                            const topicKey = topic.articleId || `topic-${tIdx}`;
                            const isUrgent = topic.sentiment === "urgent";
                            const isHighImpact = topic.impact === "high";

                            return (
                              <button
                                key={tIdx}
                                type="button"
                                onClick={() => {
                                  setInitialFocusTopicId(topicKey);
                                  setIsBriefingModalOpen(true);
                                }}
                                className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800/90 hover:border-indigo-500/50 cursor-pointer transition-all duration-200 group flex items-start gap-2.5 text-left shadow-sm hover:shadow-[0_0_14px_rgba(99,102,241,0.12)] active:scale-[0.99]"
                              >
                                <div className="mt-0.5 p-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0 group-hover:bg-indigo-500/20 group-hover:scale-105 transition-all">
                                  {isUrgent ? (
                                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                                  ) : isHighImpact ? (
                                    <TrendingUp className="w-3 h-3 text-amber-400" />
                                  ) : (
                                    <Radio className="w-3 h-3 text-indigo-400" />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0 space-y-0.5">
                                  <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 truncate font-display">
                                    {stripEmojis(topic.title)}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate font-sans">
                                    {topic.sourceName ? `Quelle: ${topic.sourceName}` : topic.teaser}
                                  </div>
                                </div>

                                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-all" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Redesigned Slim Main CTA */}
                    <div className="pt-0.5">
                      <button
                        onClick={() => {
                          setInitialFocusTopicId(null);
                          setIsBriefingModalOpen(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-bold rounded-xl cursor-pointer shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/35 active:scale-[0.99] transition-all group"
                      >
                        <span>Vollständiges Briefing ({Math.min(4, briefingObjects[selectedCategory]?.topics?.length || 4)} Themen)</span>
                        <ChevronRight className="w-3.5 h-3.5 text-indigo-200 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 py-1">
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      Erhalte in Sekunden eine hochkarätige KI-Synthese aller aktuellen Top-Meldungen in <strong className="text-indigo-300 font-semibold">{topics.find(t => t.id === selectedCategory)?.name || (selectedCategory === "saved" ? "gespeicherten Artikeln" : "allen Schlagzeilen")}</strong>.
                    </p>
                    <button
                      onClick={generateBriefing}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-bold rounded-xl cursor-pointer shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/35 active:scale-[0.99] transition-all relative overflow-hidden group"
                    >
                      <Zap className="w-3.5 h-3.5 text-indigo-200" />
                      <span>Jetzt KI-Blitz-Briefing erstellen</span>
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-200 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                )}
              </div>

              <TrafficWidget />
            </div>
          </div>
        </section>

        {/* Search Result banner if search active */}
        {searchQuery && (
          <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-2.5 px-4 text-xs">
            <span className="text-slate-300">
              Ergebnisse für <strong className="text-indigo-400 font-semibold">"{searchQuery}"</strong>: {filteredArticles.length} Artikel gefunden.
            </span>
            <button
              id="clear-search-banner-btn"
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs font-semibold text-indigo-400 hover:underline cursor-pointer"
            >
              Suche zurücksetzen
            </button>
          </div>
        )}

        {/* 3. MERGED NEWS TICKER WITH EMBEDDED SYNC & CONTROLS */}
        <NewsTicker 
          articles={filteredArticles}
          onSelectArticle={(article) => setSelectedArticle(article)}
          selectedCategory={selectedCategory}
          autoRefreshEnabled={autoRefreshEnabled}
          onToggleAutoRefresh={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
          autoRefreshCountdown={autoRefreshCountdown}
          onManualRefresh={() => {
            fetchNews(true);
            setAutoRefreshCountdown(600);
          }}
          isRefreshing={isRefreshing}
          lastUpdated={lastUpdated}
        />

        {/* 4. NEWS ARTICLES FEED IN BENTO GRID */}
        <section id="news-feed-grid" className="flex-1 flex flex-col">
          {isLoadingNews ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 animate-pulse">
              <div className="col-span-1 md:col-span-2 lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl h-[380px] p-6 flex flex-col justify-between">
                <div className="w-20 h-5 bg-slate-800 rounded-lg"></div>
                <div className="space-y-3">
                  <div className="w-full h-8 bg-slate-800 rounded-lg"></div>
                  <div className="w-2/3 h-5 bg-slate-800 rounded-lg"></div>
                </div>
              </div>
              <div className="col-span-1 md:col-span-1 lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl h-[380px] p-6 flex flex-col justify-between">
                <div className="w-20 h-5 bg-slate-800 rounded-lg"></div>
                <div className="space-y-3">
                  <div className="w-full h-6 bg-slate-800 rounded-lg"></div>
                  <div className="w-3/4 h-5 bg-slate-800 rounded-lg"></div>
                </div>
              </div>
              <div className="col-span-1 md:col-span-1 lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl h-[380px] p-6 flex flex-col justify-between">
                <div className="w-20 h-5 bg-slate-800 rounded-lg"></div>
                <div className="space-y-3">
                  <div className="w-full h-6 bg-slate-800 rounded-lg"></div>
                  <div className="w-3/4 h-5 bg-slate-800 rounded-lg"></div>
                </div>
              </div>
              <div className="col-span-1 md:col-span-2 lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl h-[280px] p-6 flex flex-col justify-between">
                <div className="w-20 h-5 bg-slate-800 rounded-lg"></div>
                <div className="space-y-3">
                  <div className="w-full h-6 bg-slate-800 rounded-lg"></div>
                  <div className="w-3/4 h-5 bg-slate-800 rounded-lg"></div>
                </div>
              </div>
              <div className="col-span-1 md:col-span-1 lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl h-[280px] p-6 flex flex-col justify-between">
                <div className="w-20 h-5 bg-slate-800 rounded-lg"></div>
                <div className="space-y-3">
                  <div className="w-full h-6 bg-slate-800 rounded-lg"></div>
                  <div className="w-3/4 h-5 bg-slate-800 rounded-lg"></div>
                </div>
              </div>
            </div>
          ) : filteredArticles.length > 0 ? (
            <div className="flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
                {visibleArticles.map((article, index) => {
                  // Compute Bento properties
                  let variant: "hero" | "standard" | "wide" = "standard";
                  let spanClass = "col-span-1 md:col-span-1 lg:col-span-4";

                  if (index === 0) {
                    variant = "hero";
                    spanClass = "col-span-1 md:col-span-2 lg:col-span-5";
                  } else if (index === 1) {
                    variant = "standard";
                    spanClass = "col-span-1 md:col-span-1 lg:col-span-3";
                  } else if (index === 2) {
                    variant = "standard";
                    spanClass = "col-span-1 md:col-span-1 lg:col-span-4";
                  } else if (index === 3) {
                    variant = "wide";
                    spanClass = "col-span-1 md:col-span-2 lg:col-span-7";
                  } else if (index === 4) {
                    variant = "standard";
                    spanClass = "col-span-1 md:col-span-1 lg:col-span-5";
                  } else {
                    // Beautiful repeating loop
                    const mod = (index - 5) % 5;
                    if (mod === 0) {
                      variant = "standard";
                      spanClass = "col-span-1 md:col-span-1 lg:col-span-4";
                    } else if (mod === 1) {
                      variant = "standard";
                      spanClass = "col-span-1 md:col-span-1 lg:col-span-4";
                    } else if (mod === 2) {
                      variant = "standard";
                      spanClass = "col-span-1 md:col-span-1 lg:col-span-4";
                    } else if (mod === 3) {
                      variant = "wide";
                      spanClass = "col-span-1 md:col-span-2 lg:col-span-7";
                    } else {
                      variant = "standard";
                      spanClass = "col-span-1 md:col-span-1 lg:col-span-5";
                    }
                  }

                  return (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      variant={variant}
                      readingDepth={readingDepth}
                      className={spanClass}
                      onSelect={handleSelectArticle}
                      isSaved={savedArticleIds.includes(article.id)}
                      onToggleSave={(e, id) => {
                        e.stopPropagation();
                        handleToggleSave(id);
                      }}
                      onDismiss={(e, id) => handleDismissArticle(e, id)}
                    />
                  );
                })}
              </div>

              {/* Batch Expansion & Load More Bar */}
              {filteredArticles.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:px-6 backdrop-blur-sm shadow-xl"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                    <span>
                      Zeige <strong className="text-white font-bold">{visibleArticles.length}</strong> von <strong className="text-indigo-400 font-bold">{filteredArticles.length}</strong> Artikeln
                      <span className="text-slate-500 ml-1.5 font-mono text-[11px]">(24er-Batching)</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {visibleArticleLimit < filteredArticles.length ? (
                      <>
                        <button
                          id="load-more-news-btn"
                          onClick={() => setVisibleArticleLimit(prev => Math.min(prev + 24, filteredArticles.length))}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                        >
                          <span>Weitere 24 Artikel laden (+24)</span>
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          id="show-all-news-btn"
                          onClick={() => setVisibleArticleLimit(filteredArticles.length)}
                          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition-all cursor-pointer border border-slate-700"
                        >
                          Alle {filteredArticles.length} anzeigen
                        </button>
                      </>
                    ) : filteredArticles.length > 24 ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          id="reset-news-limit-btn"
                          onClick={() => setVisibleArticleLimit(24)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition-all cursor-pointer border border-slate-700"
                        >
                          Auf erste 24 zurücksetzen
                        </button>
                        <button
                          id="inline-scroll-top-btn"
                          onClick={scrollToTop}
                          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer active:scale-95"
                        >
                          <ChevronUp className="w-4 h-4" />
                          <span>Nach oben</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-slate-500 font-mono">Alle Artikel dieser Ansicht geladen</span>
                        <button
                          id="inline-scroll-top-btn-small"
                          onClick={scrollToTop}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl border border-slate-700 transition-all cursor-pointer active:scale-95"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>Nach oben</span>
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            /* Immersive empty states */
            <div className="flex-1 flex flex-col items-center justify-center text-center py-16 md:py-24 bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl p-6">
              <div className="w-16 h-16 bg-slate-900 text-slate-600 rounded-2xl flex items-center justify-center mb-4 border border-slate-800">
                <EyeOff className="w-8 h-8" />
              </div>
              <h3 className="font-display font-semibold text-white text-lg mb-1.5">
                Keine Artikel gefunden
              </h3>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-6">
                Möglicherweise sind deine Themenfilter zu restriktiv oder die Suche ergab keine Übereinstimmungen.
              </p>
              
              <div className="flex flex-wrap gap-2.5 justify-center">
                <button
                  id="reset-all-filters-btn"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setTopics(DEFAULT_TOPICS);
                    setDeutscheQuellenPool(DEFAULT_SOURCES);
                    setDismissedStreamArticleIds([]);
                    localStorage.removeItem("news_dismissed_stream_articles");
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow"
                >
                  Alle Filter zurücksetzen
                </button>
                <button
                  id="empty-state-manage-btn"
                  onClick={() => setIsManageModalOpen(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer border border-slate-800"
                >
                  Themen & Quellen öffnen
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* 5. FOOTER */}
      <footer 
        id="app-footer"
        className="bg-slate-950 border-t border-slate-900 px-6 py-5 flex flex-col md:flex-row items-center justify-between text-[10px] text-slate-500 font-sans mt-12 gap-3"
      >
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> 
            Verbunden mit {deutscheQuellenPool.filter(s => s.enabled).length} Medienquellen
          </span>
          <span className="border-l border-slate-800 pl-4 uppercase tracking-widest hidden sm:inline">
            Chronicle Bento Grid Edition
          </span>
        </div>
        <div className="uppercase tracking-widest">
          Aktualisiert: {new Date().toLocaleTimeString()}
        </div>
      </footer>

      {/* 6. SETTINGS MODAL */}
      <ManageSourcesModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        topics={topics}
        setTopics={setTopics}
        sources={deutscheQuellenPool}
        setSources={setDeutscheQuellenPool}
        dismissedCount={dismissedStreamArticleIds.length}
        onResetDismissed={() => {
          setDismissedStreamArticleIds([]);
          localStorage.removeItem("news_dismissed_stream_articles");
        }}
      />

      {/* 7. IMMERSIVE ARTICLE OVERLAY */}
      {selectedArticle && (
        <ArticleOverlay
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          isSaved={savedArticleIds.includes(selectedArticle.id)}
          onToggleSave={handleToggleSave}
        />
      )}

      {/* 8. FLOATING LIVE PUSH NOTIFICATION TOAST */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9, transition: { duration: 0.15 } }}
            className="fixed bottom-6 right-6 z-50 w-full max-w-sm bg-slate-900/95 backdrop-blur-md border border-red-500/30 rounded-2xl shadow-2xl shadow-red-950/20 p-4 font-sans text-left overflow-hidden before:absolute before:top-0 before:left-0 before:w-1.5 before:h-full before:bg-red-500"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-500/10 rounded-xl text-red-500 shrink-0 border border-red-500/20">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono animate-pulse">
                    Eilmeldung
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {activeAlert.sourceName}
                  </span>
                </div>
                <h3 className="text-xs font-extrabold text-white leading-snug line-clamp-2">
                  {activeAlert.title}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {activeAlert.teaser}
                </p>
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-800/60">
                  <button
                    onClick={() => {
                      handleSelectArticle(activeAlert);
                      setActiveAlert(null);
                    }}
                    className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-all text-center cursor-pointer active:scale-95 shadow-lg shadow-red-900/20"
                  >
                    Jetzt lesen
                  </button>
                  <button
                    onClick={() => handleIgnoreAlert(activeAlert.id)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium rounded-lg transition-all cursor-pointer"
                  >
                    Ignorieren
                  </button>
                </div>
              </div>
              <button
                onClick={() => handleIgnoreAlert(activeAlert.id)}
                className="text-slate-500 hover:text-slate-300 p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING BACK TO TOP BUTTON */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            id="floating-scroll-top-btn"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20, transition: { duration: 0.15 } }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.92 }}
            onClick={scrollToTop}
            className={`fixed ${activeAlert ? "bottom-28" : "bottom-6"} right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-slate-900/90 hover:bg-slate-800 text-white font-medium text-xs rounded-2xl shadow-2xl shadow-indigo-950/50 border border-indigo-500/30 backdrop-blur-md transition-all duration-300 cursor-pointer group`}
            title="Zurück nach oben springen"
            aria-label="Zurück nach oben springen"
          >
            <div className="p-1.5 bg-indigo-600/30 group-hover:bg-indigo-600 text-indigo-400 group-hover:text-white rounded-xl transition-colors">
              <ChevronUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
            </div>
            <span className="font-semibold tracking-wide text-slate-200 group-hover:text-white hidden sm:inline">
              Nach oben
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* KI-Blitz-Briefing Zoomable Pop-up Modal */}
      <AiBriefingModal
        isOpen={isBriefingModalOpen}
        onClose={() => setIsBriefingModalOpen(false)}
        briefingText={briefings[selectedCategory] || ""}
        briefingData={briefingObjects[selectedCategory] || null}
        categoryName={topics.find(t => t.id === selectedCategory)?.name || (selectedCategory === "saved" ? "Gespeichert" : "Schlagzeilen")}
        isLoading={isBriefingLoading}
        initialFocusTopicId={initialFocusTopicId}
        onRegenerate={() => {
          generateBriefing();
        }}
        isPlayingAudio={isPlayingAudio}
        onToggleSpeech={(text) => handleToggleSpeech(text)}
        onSelectArticleUrl={(target) => {
          if (!target) return;

          const isObj = typeof target === "object" && target !== null;
          const targetTopic = isObj ? (target as any) : null;
          const targetStr = isObj ? (targetTopic.articleUrl || targetTopic.articleId || targetTopic.title || "") : (target as string);

          // 1. Exact match in active articles array
          let matched = articles.find(a => 
            (targetStr && (a.url === targetStr || a.id === targetStr || a.slug === targetStr)) ||
            (targetTopic && (a.title === targetTopic.title || (a.url && targetTopic.articleUrl && a.url === targetTopic.articleUrl)))
          );
          
          // 2. Fuzzy match by title or url substring
          if (!matched && targetStr) {
            const targetLower = targetStr.toLowerCase();
            const targetTitle = (targetTopic?.title || targetStr).toLowerCase();
            matched = articles.find(a => 
              (a.title && a.title.toLowerCase().includes(targetTitle.substring(0, 20))) ||
              (a.url && targetLower.length > 10 && a.url.toLowerCase().includes(targetLower)) ||
              (a.id && targetLower.includes(a.id.toLowerCase()))
            );
          }

          if (matched) {
            setSelectedArticle(matched);
            return;
          }

          // 3. Fallback: Synthesize in-memory Article from topic so reader overlay opens without 404!
          const topicTitle = targetTopic?.title || (typeof target === "string" && !target.startsWith("http") ? target : "KI Briefing Thema");
          const topicTeaser = targetTopic?.teaser || targetTopic?.bullets?.join(" ") || "Zusammenfassung aus den aktuellen Nachrichten.";
          const topicBullets: string[] = targetTopic?.bullets || [];
          const topicSource = targetTopic?.sourceName || "KI Briefing";
          const topicCategory = selectedCategory && selectedCategory !== "all" ? selectedCategory : "Technologie";
          const topicImg = targetTopic?.imageUrl || "";
          const cleanUrl = (targetTopic?.articleUrl && targetTopic.articleUrl.startsWith("http")) 
            ? targetTopic.articleUrl 
            : (typeof target === "string" && target.startsWith("http") ? target : `https://www.google.com/search?q=${encodeURIComponent(topicTitle)}`);

          const syntheticArticle: Article = {
            id: `briefing-topic-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            title: topicTitle,
            teaser: topicTeaser,
            content: `
              <p class="mb-4 font-medium text-slate-200 text-lg leading-relaxed">${topicTeaser}</p>
              ${topicBullets.length > 0 ? `
                <div class="my-6 space-y-3 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                  <h4 class="font-bold text-white text-base">Wichtigste Erkenntnisse</h4>
                  <ul class="space-y-2.5">
                    ${topicBullets.map(b => `<li class="flex items-start gap-2.5 text-slate-300 text-sm"><span class="text-indigo-400 font-bold mt-0.5">•</span><span>${b}</span></li>`).join("")}
                  </ul>
                </div>
              ` : ""}
              <p class="mb-4 text-slate-400">Dieser Artikel fasst die aktuellen Berichte von <strong>${topicSource}</strong> zusammen.</p>
            `,
            category: topicCategory,
            sourceId: topicSource.toLowerCase().replace(/[^a-z0-9]/g, "") || "ki-briefing",
            sourceName: topicSource,
            url: cleanUrl,
            imageUrl: topicImg,
            publishedAt: "Aktuell",
            readingTime: "3 Min. Lesezeit",
            summaryBullets: topicBullets,
            sentiment: targetTopic?.sentiment === "urgent" ? "critical" : targetTopic?.sentiment === "positive" ? "positive" : "neutral",
            isLocal: false
          };

          setSelectedArticle(syntheticArticle);
        }}
        lastUpdated={lastUpdated}
      />
    </div>
  );
}
