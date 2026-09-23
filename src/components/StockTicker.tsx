import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  TrendingUp, RefreshCw, ChevronDown,
  Search, X, Check, BarChart3, ArrowUpRight,
  ArrowDownRight, Star, Loader2, Globe, Bell,
  BellRing, Trash2, Plus, AlertCircle, Volume2,
  Cloud, LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StockInfo, StockPriceAlert } from "../types";
import { stripEmojis } from "../utils/textUtils";
import type { User } from "firebase/auth";
import {
  loginWithGoogle,
  logout,
  subscribeToAuth,
  subscribeToMarketFavorites,
  syncMarketFavoritesToCloud,
  migrateLocalMarketFavoritesIfEmpty
} from "../lib/firebase";

export interface StockCatalogItem {
  symbol: string;
  name: string;
  category: "Indizes" | "Aktien (DE)" | "Aktien (US)" | "Krypto";
}

export interface SearchResultItem {
  symbol: string;
  name: string;
  exchange: string;
  category: string;
  quoteType?: string;
}

export interface MultiRangeChartData {
  symbol: string;
  range: string;
  currency: string;
  currentPrice: number;
  startPrice: number;
  changePercent: number;
  high: number;
  low: number;
  points: { time: number; price: number }[];
}

export const STOCK_CATALOG: StockCatalogItem[] = [
  // 1. Leit-Indizes
  { symbol: "^GDAXI", name: "DAX 40 Performance", category: "Indizes" },
  { symbol: "^MDAXI", name: "MDAX Mid-Cap", category: "Indizes" },
  { symbol: "^GSPC", name: "S&P 500 (US Top 500)", category: "Indizes" },
  { symbol: "^IXIC", name: "NASDAQ Composite (Tech)", category: "Indizes" },

  // 2. Deutsche Leitaktien (DAX & MDAX)
  { symbol: "RHM.DE", name: "Rheinmetall AG", category: "Aktien (DE)" },
  { symbol: "HAG.DE", name: "Hensoldt AG (XETRA)", category: "Aktien (DE)" },
  { symbol: "HAG.F", name: "Hensoldt AG (Frankfurt)", category: "Aktien (DE)" },
  { symbol: "SAP", name: "SAP SE", category: "Aktien (DE)" },
  { symbol: "SIE.DE", name: "Siemens AG", category: "Aktien (DE)" },
  { symbol: "BAYN.DE", name: "Bayer AG", category: "Aktien (DE)" },
  { symbol: "BMW.DE", name: "BMW AG", category: "Aktien (DE)" },

  // 3. US Tech & Global Leaders
  { symbol: "NVDA", name: "NVIDIA Corp.", category: "Aktien (US)" },
  { symbol: "AAPL", name: "Apple Inc.", category: "Aktien (US)" },
  { symbol: "MSFT", name: "Microsoft Corp.", category: "Aktien (US)" },
  { symbol: "AMZN", name: "Amazon.com Inc.", category: "Aktien (US)" },
  { symbol: "GOOG", name: "Alphabet Inc. (Google)", category: "Aktien (US)" },
  { symbol: "META", name: "Meta Platforms", category: "Aktien (US)" },
  { symbol: "TSLA", name: "Tesla Inc.", category: "Aktien (US)" },

  // 4. Krypto-Assets
  { symbol: "BTC-USD", name: "Bitcoin (BTC)", category: "Krypto" },
  { symbol: "ETH-USD", name: "Ethereum (ETH)", category: "Krypto" },
  { symbol: "SOL-EUR", name: "Solana EUR (SOL)", category: "Krypto" },
  { symbol: "SOL-USD", name: "Solana USD (SOL)", category: "Krypto" },
];

const DEFAULT_5_FAVORITES = ["^GDAXI", "RHM.DE", "NVDA", "AAPL", "BTC-USD"];

const TIME_RANGES = [
  { key: "1d", label: "1T", title: "24 Stunden (Intraday)" },
  { key: "5d", label: "5T", title: "5 Tage (1h)" },
  { key: "1mo", label: "1M", title: "1 Monat" },
  { key: "6mo", label: "6M", title: "6 Monate" },
  { key: "1y", label: "1J", title: "1 Jahr" },
] as const;

type TimeRangeKey = typeof TIME_RANGES[number]["key"];

// Smooth sound chime for triggered alerts
function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  } catch (e) {
    // ignore audio block
  }
}

export default function StockTicker({ className = "" }: { className?: string }) {
  // Single 5-Favorites Watchlist with durable persistence
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("news_market_favorites_v5");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 5) {
          return parsed;
        }
      }
    } catch (e) {}
    return DEFAULT_5_FAVORITES;
  });

  const [stocksData, setStocksData] = useState<StockInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("Alle");
  const [isSearchingServer, setIsSearchingServer] = useState(false);
  const [serverSearchResults, setServerSearchResults] = useState<SearchResultItem[]>([]);
  
  // Modal State
  const [selectedModalStock, setSelectedModalStock] = useState<StockInfo | null>(null);
  const [modalTab, setModalTab] = useState<"chart" | "alerts">("chart");
  const [selectedRange, setSelectedRange] = useState<TimeRangeKey>("1d");
  const [rangeChartData, setRangeChartData] = useState<MultiRangeChartData | null>(null);
  const [isRangeLoading, setIsRangeLoading] = useState<boolean>(false);
  const chartCacheRef = useRef<Record<string, MultiRangeChartData>>({});
  
  // Chart Hover Tooltip
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Price Alerts State
  const [alerts, setAlerts] = useState<StockPriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem("news_market_price_alerts_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // Alert Creation Form State
  const [alertTargetPrice, setAlertTargetPrice] = useState<string>("");
  const [alertSuccessMsg, setAlertSuccessMsg] = useState<string>("");
  
  // Active in-app Toast Notification for triggered alert
  const [activeToastAlert, setActiveToastAlert] = useState<{
    alert: StockPriceAlert;
    currentPrice: number;
  } | null>(null);

  // Highlighting effects to flash green/red when price changes
  const [flashStates, setFlashStates] = useState<Record<string, "up" | "down" | null>>({});
  const prevPricesRef = useRef<Record<string, number>>({});

  // Optional Google account sync for the 5 market favorites (device-local by
  // default via localStorage above; logging in mirrors them to Firestore so
  // they follow the user across devices/browsers).
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);

      if (currentUser) {
        // One-time seed: if this is the first login and the cloud has no
        // favorites yet, push up whatever is currently saved locally.
        let localFavs: string[] = DEFAULT_5_FAVORITES;
        try {
          const saved = localStorage.getItem("news_market_favorites_v5");
          const parsed = saved ? JSON.parse(saved) : null;
          if (Array.isArray(parsed) && parsed.length === 5) localFavs = parsed;
        } catch (e) {}
        migrateLocalMarketFavoritesIfEmpty(currentUser.uid, localFavs, currentUser.email, currentUser.displayName);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Live-subscribe to cloud favorites once signed in, so changes on another
  // device show up here too.
  useEffect(() => {
    if (!user) return;
    const unsubscribeFavs = subscribeToMarketFavorites(user.uid, (cloudFavorites) => {
      if (cloudFavorites.length === 5) {
        setFavorites(cloudFavorites);
      }
    });
    return () => unsubscribeFavs();
  }, [user]);

  const handleGoogleSignIn = async () => {
    try {
      setIsAuthLoading(true);
      await loginWithGoogle();
    } catch (err) {
      console.error("Google login error:", err);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Google logout error:", err);
    }
  };

  // Sync favorites & alerts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("news_market_favorites_v5", JSON.stringify(favorites));
    } catch (e) {}
    fetchStocksData();
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem("news_market_price_alerts_v1", JSON.stringify(alerts));
    } catch (e) {}
  }, [alerts]);

  // Request notification permission if user opens alert tab
  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        await Notification.requestPermission();
      } catch (e) {}
    }
  };

  // Reset search state on dropdown open/close
  useEffect(() => {
    setSearchQuery("");
    setCategoryFilter("Alle");
    setServerSearchResults([]);
    setIsSearchingServer(false);
  }, [activeDropdownIndex]);

  // Real-time server search with debouncing (200ms)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setServerSearchResults([]);
      setIsSearchingServer(false);
      return;
    }

    setIsSearchingServer(true);
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setServerSearchResults(data);
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          // ignore abort
        }
      } finally {
        setIsSearchingServer(false);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  // Fetch Multi-Range Historical Chart Data when Modal or Range changes
  useEffect(() => {
    if (!selectedModalStock) {
      setRangeChartData(null);
      setHoverIndex(null);
      return;
    }

    const cacheKey = `${selectedModalStock.symbol}_${selectedRange}`;
    if (chartCacheRef.current[cacheKey]) {
      setRangeChartData(chartCacheRef.current[cacheKey]);
      setHoverIndex(null);
      return;
    }

    let isMounted = true;
    setIsRangeLoading(true);
    setHoverIndex(null);

    fetch(`/api/stocks/chart?symbol=${encodeURIComponent(selectedModalStock.symbol)}&range=${selectedRange}`)
      .then((res) => {
        if (!res.ok) throw new Error("Chart fetch failed");
        return res.json();
      })
      .then((data: MultiRangeChartData) => {
        if (isMounted && data && Array.isArray(data.points)) {
          chartCacheRef.current[cacheKey] = data;
          setRangeChartData(data);
        }
      })
      .catch(() => {
        // Fallback to stock sparkline if historical fetch fails
        if (isMounted) {
          const sparkline = selectedModalStock.sparkline || [];
          const pts = sparkline.map((p, i) => ({
            time: Date.now() - (sparkline.length - i) * 15 * 60 * 1000,
            price: p
          }));
          const fallbackData: MultiRangeChartData = {
            symbol: selectedModalStock.symbol,
            range: selectedRange,
            currency: selectedModalStock.currency,
            currentPrice: selectedModalStock.price,
            startPrice: sparkline[0] || selectedModalStock.price,
            changePercent: selectedModalStock.changePercent,
            high: selectedModalStock.dayHigh || selectedModalStock.price,
            low: selectedModalStock.dayLow || selectedModalStock.price,
            points: pts
          };
          setRangeChartData(fallbackData);
        }
      })
      .finally(() => {
        if (isMounted) setIsRangeLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedModalStock, selectedRange]);

  // Track currently opened stock symbol to avoid resetting user input/tab on background price ticks
  const lastOpenedSymbolRef = useRef<string | null>(null);

  // When opening modal, pre-fill alert target price ONLY if opening a different stock
  useEffect(() => {
    if (selectedModalStock) {
      if (lastOpenedSymbolRef.current !== selectedModalStock.symbol.toUpperCase()) {
        lastOpenedSymbolRef.current = selectedModalStock.symbol.toUpperCase();
        setAlertTargetPrice(selectedModalStock.price.toFixed(2));
        setAlertSuccessMsg("");
        setModalTab("chart");
        setSelectedRange("1d");
      }
    } else {
      lastOpenedSymbolRef.current = null;
    }
  }, [selectedModalStock]);

  // Evaluates price alerts against fresh stock quotes using functional state updater
  const checkAlerts = useCallback((incomingStocks: StockInfo[]) => {
    setAlerts((prevAlerts) => {
      let hasTriggered = false;
      const nextAlerts = prevAlerts.map((al) => {
        if (al.triggered) return al;
        const matchingStock = incomingStocks.find((s) => s.symbol.toUpperCase() === al.symbol.toUpperCase());
        if (!matchingStock) return al;

        const isConditionMet =
          al.condition === "above"
            ? matchingStock.price >= al.targetPrice
            : matchingStock.price <= al.targetPrice;

        if (isConditionMet) {
          hasTriggered = true;
          // Trigger Toast & Sound
          playNotificationChime();
          setActiveToastAlert({
            alert: al,
            currentPrice: matchingStock.price
          });

          // Trigger Browser Native Notification if allowed
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            try {
              new Notification(`🎯 Kursalarm erreicht: ${al.symbol}`, {
                body: `${al.name}: Aktueller Kurs ${matchingStock.price.toFixed(2)} ${al.currency} hat das Ziel von ${al.targetPrice.toFixed(2)} ${al.currency} (${al.condition === "above" ? "≥" : "≤"}) erreicht!`,
                icon: "/favicon.ico"
              });
            } catch (e) {}
          }

          return {
            ...al,
            triggered: true,
            triggeredAt: Date.now()
          };
        }
        return al;
      });

      return hasTriggered ? nextAlerts : prevAlerts;
    });
  }, []);

  // Stable ref for fetchStocksData to decouple interval timer from closures
  const fetchStocksDataRef = useRef<((isBackground?: boolean) => Promise<void>) | null>(null);

  // Periodic automatic polling (every 15 seconds) for real-time feel
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStocksDataRef.current?.(true); // background silent update
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const fetchStocksData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const url = `/api/stocks?symbols=${favorites.join(",")}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Netzwerkfehler beim Abrufen der Marktdaten.");
      
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("Ungültiges Antwortformat.");
      }

      const data: StockInfo[] = await res.json();
      if (!Array.isArray(data)) return;
      
      // Compute price changes to flash up or down
      const nextFlashStates: Record<string, "up" | "down" | null> = {};
      let hasPriceChanges = false;

      data.forEach((stock) => {
        const prevPrice = prevPricesRef.current[stock.symbol];
        if (prevPrice !== undefined && prevPrice !== stock.price) {
          nextFlashStates[stock.symbol] = stock.price > prevPrice ? "up" : "down";
          hasPriceChanges = true;
        }
        prevPricesRef.current[stock.symbol] = stock.price;
      });

      if (hasPriceChanges) {
        setFlashStates(nextFlashStates);
        setTimeout(() => {
          setFlashStates({});
        }, 1200);
      }

      setStocksData(data);
      checkAlerts(data);
      
      // Keep currently opened modal stock updated with live price ONLY IF modal is actively open
      setSelectedModalStock((current) => {
        if (!current) return null; // ZERO REGRESSION: Never reopen modal if user closed it
        const updatedSelected = data.find(s => s.symbol.toUpperCase() === current.symbol.toUpperCase());
        return updatedSelected || current;
      });

      const now = new Date();
      setLastUpdated(now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err) {
      // Failover smoothly
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocksDataRef.current = fetchStocksData;
  });

  const handleSelectFavorite = (slotIndex: number, newSymbol: string) => {
    const cleanSym = newSymbol.trim().toUpperCase();
    const updated = [...favorites];
    updated[slotIndex] = cleanSym;

    setFavorites(updated);
    try {
      localStorage.setItem("news_market_favorites_v5", JSON.stringify(updated));
    } catch (e) {}

    if (user) {
      setIsCloudSyncing(true);
      syncMarketFavoritesToCloud(user.uid, updated, user.email, user.displayName).finally(() => {
        setIsCloudSyncing(false);
      });
    }

    setActiveDropdownIndex(null);
  };

  const handleResetToDefaults = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(DEFAULT_5_FAVORITES);
    try {
      localStorage.setItem("news_market_favorites_v5", JSON.stringify(DEFAULT_5_FAVORITES));
    } catch (e) {}

    if (user) {
      setIsCloudSyncing(true);
      syncMarketFavoritesToCloud(user.uid, DEFAULT_5_FAVORITES, user.email, user.displayName).finally(() => {
        setIsCloudSyncing(false);
      });
    }

    setActiveDropdownIndex(null);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdownIndex(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Helper to format currency symbol
  const getCurrencySymbol = (currency: string) => {
    if (currency === "USD") return "$";
    if (currency === "EUR") return "€";
    return currency;
  };

  // Kursalarm erstellen
  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModalStock) return;

    const parsedPrice = parseFloat(alertTargetPrice.replace(",", "."));
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setAlertSuccessMsg("Bitte einen gültigen Preis eingeben.");
      return;
    }

    if (Math.abs(parsedPrice - selectedModalStock.price) < 0.001) {
      setAlertSuccessMsg("Bitte einen Zielkurs über oder unter dem aktuellen Kurs festlegen.");
      return;
    }

    const condition: "above" | "below" = parsedPrice > selectedModalStock.price ? "above" : "below";
    const newAlert: StockPriceAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      symbol: selectedModalStock.symbol,
      name: selectedModalStock.name,
      currency: selectedModalStock.currency,
      targetPrice: Number(parsedPrice.toFixed(2)),
      condition,
      createdAt: Date.now(),
      triggered: false
    };

    setAlerts((prev) => [newAlert, ...prev]);
    setAlertSuccessMsg(`Kursalarm für ${newAlert.targetPrice.toFixed(2)} ${getCurrencySymbol(newAlert.currency)} (${condition === "above" ? "≥" : "≤"}) aktiviert!`);
    playNotificationChime();

    setTimeout(() => {
      setAlertSuccessMsg("");
    }, 3000);
  };

  const handleDeleteAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  // Helper for quick percentage buttons (+5%, +10%, -5%, -10%)
  const handleQuickPercent = (percent: number) => {
    if (!selectedModalStock) return;
    const target = selectedModalStock.price * (1 + percent / 100);
    setAlertTargetPrice(target.toFixed(2));
  };

  // Render SVG Sparkline for the compact 5-rows overview
  const renderSparkline = (prices: number[], changePercent: number, height = 26, width = 88) => {
    if (!prices || prices.length < 2) return null;
    
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min === 0 ? 1 : max - min;
    const padding = 2;

    const coords = prices.map((price, idx) => {
      const x = (idx / (prices.length - 1)) * width;
      const y = height - padding - ((price - min) / range) * (height - padding * 2);
      return { x, y };
    });

    const linePath = `M ${coords[0].x} ${coords[0].y} ` + coords.slice(1).map(c => `L ${c.x} ${c.y}`).join(" ");
    const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

    const isPositive = changePercent >= 0;
    const strokeColor = isPositive ? "#10b981" : "#f43f5e";
    const gradId = `spark-grad-${isPositive ? "emerald" : "rose"}-${Math.abs(changePercent).toFixed(2).replace(".", "-")}-${Math.floor(prices[0] || 0)}`;

    return (
      <svg width={width} height={height} className="overflow-visible block">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.22" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        <motion.path 
          d={areaPath} 
          fill={`url(#${gradId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
        
        <motion.path 
          d={linePath} 
          fill="none" 
          stroke={strokeColor} 
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />

        <circle
          cx={coords[coords.length - 1].x}
          cy={coords[coords.length - 1].y}
          r="2.2"
          fill={strokeColor}
        />
      </svg>
    );
  };

  // Format date/time for chart tooltip
  const formatTimestamp = (timeMs: number, rangeKey: TimeRangeKey) => {
    const d = new Date(timeMs);
    if (rangeKey === "1d") {
      return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) + " Uhr";
    }
    if (rangeKey === "5d") {
      return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }) + ", " + 
             d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: rangeKey === "1y" ? "2-digit" : undefined });
  };

  // Render Interactive Multi-Period Detailed Modal Chart with Scrubber
  const renderInteractiveDetailChart = (
    data: MultiRangeChartData | null,
    rangeKey: TimeRangeKey
  ) => {
    if (!data || !data.points || data.points.length < 2) {
      return (
        <div className="h-40 w-full flex items-center justify-center text-slate-500 font-mono text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-400 mr-2" />
          Lade Kursverlauf...
        </div>
      );
    }

    const points = data.points;
    const prices = points.map(p => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min === 0 ? 1 : max - min;
    
    const svgWidth = 460;
    const svgHeight = 150;
    const paddingX = 14;
    const paddingY = 12;

    const coords = points.map((pt, idx) => {
      const x = paddingX + (idx / (points.length - 1)) * (svgWidth - paddingX * 2);
      const y = svgHeight - paddingY - ((pt.price - min) / range) * (svgHeight - paddingY * 2);
      return { x, y, price: pt.price, time: pt.time };
    });

    const linePath = `M ${coords[0].x} ${coords[0].y} ` + coords.slice(1).map(c => `L ${c.x} ${c.y}`).join(" ");
    const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${svgHeight} L ${coords[0].x} ${svgHeight} Z`;

    const isPositive = data.changePercent >= 0;
    const strokeColor = isPositive ? "#10b981" : "#f43f5e";

    const hovered = hoverIndex !== null && coords[hoverIndex] ? coords[hoverIndex] : null;

    return (
      <div 
        className="relative w-full h-44 bg-slate-950/80 border border-slate-800 rounded-xl p-2 select-none overflow-hidden"
        onMouseLeave={() => setHoverIndex(null)}
      >
        <svg 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
          className="w-full h-full overflow-visible block cursor-crosshair"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const normX = mouseX / rect.width;
            const closestIdx = Math.round(normX * (coords.length - 1));
            const clamped = Math.max(0, Math.min(coords.length - 1, closestIdx));
            setHoverIndex(clamped);
          }}
          onTouchMove={(e) => {
            if (e.touches.length > 0) {
              const rect = e.currentTarget.getBoundingClientRect();
              const touchX = e.touches[0].clientX - rect.left;
              const normX = touchX / rect.width;
              const closestIdx = Math.round(normX * (coords.length - 1));
              const clamped = Math.max(0, Math.min(coords.length - 1, closestIdx));
              setHoverIndex(clamped);
            }
          }}
        >
          <defs>
            <linearGradient id="detail-chart-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.32" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines */}
          <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4" />
          <line x1={paddingX} y1={svgHeight / 2} x2={svgWidth - paddingX} y2={svgHeight / 2} stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.3" />
          <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4" />

          {/* Area under curve */}
          <path d={areaPath} fill="url(#detail-chart-gradient)" />
          
          {/* Main Line */}
          <path 
            d={linePath} 
            fill="none" 
            stroke={strokeColor} 
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover Scrubber Line & Circle */}
          {hovered && (
            <>
              <line 
                x1={hovered.x} 
                y1={paddingY} 
                x2={hovered.x} 
                y2={svgHeight - paddingY} 
                stroke="#94a3b8" 
                strokeWidth="1.2" 
                strokeDasharray="2 2"
              />
              <circle 
                cx={hovered.x} 
                cy={hovered.y} 
                r="4.5" 
                fill={strokeColor}
                stroke="#ffffff"
                strokeWidth="2"
              />
            </>
          )}

          {/* End Dot (if not hovering) */}
          {!hovered && (
            <circle
              cx={coords[coords.length - 1].x}
              cy={coords[coords.length - 1].y}
              r="3.5"
              fill={strokeColor}
            />
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hovered && (
          <div 
            className="absolute top-2.5 left-3 pointer-events-none bg-slate-900/95 border border-slate-700/90 rounded-lg px-2.5 py-1 text-[11px] shadow-lg flex items-center gap-2 backdrop-blur-md"
          >
            <div className="flex items-center gap-1.5 font-mono">
              <span className="font-bold text-white">
                {hovered.price.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getCurrencySymbol(data.currency)}
              </span>
              <span className="text-slate-400 text-[10px]">
                • {formatTimestamp(hovered.time, rangeKey)}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const categories = ["Alle", "Indizes", "Aktien (DE)", "Aktien (US)", "Krypto"];

  // Active alerts for the selected stock
  const stockAlerts = useMemo(() => {
    if (!selectedModalStock) return [];
    return alerts.filter(a => a.symbol.toUpperCase() === selectedModalStock.symbol.toUpperCase());
  }, [alerts, selectedModalStock]);

  return (
    <div 
      id="stock-ticker-main-container"
      className={`bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 transition-all duration-300 shadow-xl shadow-slate-950/20 justify-between ${className}`}
    >
      {/* 1. Header & Live Indicator */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.12)] shrink-0">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="font-bold text-slate-200 text-sm font-sans tracking-tight">
                {stripEmojis("Märkte & Favoriten")}
              </h4>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-mono font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {lastUpdated ? `Sync: ${lastUpdated} Uhr` : "Realtime-Quotes"}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          {user ? (
            <button
              type="button"
              onClick={handleGoogleSignOut}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 cursor-pointer transition-colors text-[10px] font-mono font-medium"
              title={`Als ${user.email || "Google-Konto"} synchronisiert - klicken zum Abmelden`}
            >
              <Cloud className={`w-3.5 h-3.5 ${isCloudSyncing ? "animate-pulse" : ""}`} />
              <span className="hidden sm:inline">Synchronisiert</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isAuthLoading}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors text-[10px] font-mono font-medium disabled:opacity-50"
              title="Favoriten mit Google-Konto geräteübergreifend synchronisieren"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAuthLoading ? "..." : "Google Sync"}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => fetchStocksData()}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
            title="Kurse manuell aktualisieren"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Favoriten Infoleiste */}
      <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5 font-medium text-slate-300">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
          Deine 5 Markt-Favoriten
        </span>
        <button
          type="button"
          onClick={handleResetToDefaults}
          className="text-[10px] text-slate-400 hover:text-indigo-400 transition-colors font-mono cursor-pointer"
          title="Auf Standardwerte zurücksetzen"
        >
          Zurücksetzen
        </button>
      </div>

      {/* 2. Rows: 5 Custom Favoriten Slots mit SVG Sparklines & Alert Badge */}
      <div className="flex flex-col gap-1.5">
        {favorites.map((ticker, index) => {
          const stock = stocksData.find(s => s.symbol.toUpperCase() === ticker.toUpperCase());
          const isDropdownOpen = activeDropdownIndex === index;
          const flash = flashStates[ticker];
          
          const isPositive = stock ? stock.changePercent >= 0 : true;
          const changeSign = isPositive ? "+" : "";

          // Check if there is an active alert for this stock
          const hasActiveAlert = alerts.some(a => a.symbol.toUpperCase() === ticker.toUpperCase() && !a.triggered);

          return (
            <div 
              key={`fav-slot-${index}-${ticker}`}
              id={`stock-slot-${index}`}
              onClick={() => {
                if (stock) setSelectedModalStock(stock);
              }}
              className={`group bg-slate-950/40 hover:bg-white/5 border rounded-xl px-3 py-2 flex items-center justify-between gap-3 relative transition-all duration-200 cursor-pointer ${
                flash === "up" 
                  ? "border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.1)]" 
                  : flash === "down"
                    ? "border-rose-500/40 bg-rose-500/10 shadow-[0_0_12px_rgba(244,63,94,0.1)]"
                    : "border-slate-800/60 hover:border-slate-700/80"
              }`}
              title="Klicken für Multi-Zeitraum-Chart & Kursalarm"
            >
              {/* Links: Symbol in Fettschrift + Dropdown-Trigger + Alert-Icon */}
              <div className="flex flex-col items-start min-w-[84px] sm:min-w-[94px] shrink-0">
                <div className="relative">
                  <div className="flex items-center gap-1 font-mono font-bold text-xs text-white group-hover:text-indigo-300 transition-colors">
                    <span>{stock?.symbol || ticker}</span>
                    
                    {/* Active Alert Icon Indicator */}
                    {hasActiveAlert && (
                      <span title="Aktiver Kursalarm eingerichtet" className="text-amber-400">
                        <BellRing className="w-3 h-3 animate-pulse" />
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdownIndex(isDropdownOpen ? null : index);
                      }}
                      className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                      title="Wert an dieser Position ändern"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Dropdown Menu to switch stock: opens UPWARDS on lower rows (index >= 3) to prevent clipping */}
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: index >= 3 ? -6 : 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: index >= 3 ? -6 : 6, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className={`absolute left-0 w-80 bg-slate-900 border border-slate-700/90 rounded-xl shadow-2xl shadow-black/90 z-50 flex flex-col overflow-hidden ${
                          index >= 3 
                            ? "bottom-full mb-2 origin-bottom-left" 
                            : "top-full mt-2 origin-top-left"
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Header & Search */}
                        <div className="p-2.5 border-b border-slate-800 bg-slate-900 sticky top-0 z-10 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">
                              Slot {index + 1} belegen
                            </span>
                            <span className="text-[9px] text-indigo-400 font-mono">
                              Aktuell: {ticker}
                            </span>
                          </div>

                          {/* Search Input */}
                          <div className="relative flex items-center">
                            {isSearchingServer ? (
                              <Loader2 className="w-3.5 h-3.5 absolute left-2.5 text-indigo-400 animate-spin pointer-events-none" />
                            ) : (
                              <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-500 pointer-events-none" />
                            )}
                            <input
                              type="text"
                              autoFocus
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Aktie, Ticker oder WKN suchen (z. B. Hensoldt, Bayer)..."
                              className="w-full bg-slate-950 text-white placeholder-slate-500 text-xs pl-8 pr-7 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans"
                            />
                            {searchQuery && (
                              <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2 text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {/* Quick Category Chips */}
                          {!searchQuery && (
                            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                              {categories.map((cat) => (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => setCategoryFilter(cat)}
                                  className={`text-[9px] font-mono px-2 py-0.5 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                                    categoryFilter === cat
                                      ? "bg-indigo-600 text-white font-bold"
                                      : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                                  }`}
                                >
                                  {cat}
                                </button>
                              ))}
                            </div>
                          )}

                          {searchQuery && (
                            <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono px-1">
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3 text-indigo-400" />
                                Yahoo Finanzen Live-Suche
                              </span>
                              {serverSearchResults.length > 0 && (
                                <span className="text-emerald-400">{serverSearchResults.length} Treffer</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* List of Assets */}
                        <div className="max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900 py-1 flex flex-col">
                          {searchQuery.trim().length > 0 ? (
                            <>
                              {isSearchingServer && serverSearchResults.length === 0 && (
                                <div className="p-4 text-center flex flex-col items-center gap-2 text-slate-400 text-xs">
                                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                                  <span>Suche bei Yahoo Finanzen...</span>
                                </div>
                              )}

                              {!isSearchingServer && serverSearchResults.length === 0 && (
                                <div className="p-4 text-center text-xs text-slate-500 font-mono">
                                  Keine Treffer für "{searchQuery}" gefunden.
                                </div>
                              )}

                              {serverSearchResults.map((item) => {
                                const isCurrentSlot = favorites[index] === item.symbol;
                                const isSelected = favorites.includes(item.symbol);

                                return (
                                  <button
                                    key={`search-${item.symbol}`}
                                    type="button"
                                    onClick={() => handleSelectFavorite(index, item.symbol)}
                                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer border-b border-slate-800/40 last:border-0 ${
                                      isCurrentSlot
                                        ? "bg-indigo-600/20 text-indigo-300 font-semibold"
                                        : isSelected
                                          ? "text-slate-400 hover:bg-slate-800/40"
                                          : "text-slate-200 hover:bg-slate-800/60"
                                    }`}
                                  >
                                    <div className="truncate pr-2">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-mono font-bold text-white">{item.symbol}</span>
                                        <span className="text-[8px] text-slate-400 font-mono font-medium px-1.5 py-0.2 bg-slate-800 rounded">
                                          {item.exchange}
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-slate-400 block truncate mt-0.5">{item.name}</span>
                                    </div>
                                    <div className="shrink-0 flex items-center gap-1">
                                      <span className="text-[8px] text-indigo-400/80 font-mono">
                                        {item.category}
                                      </span>
                                      {isCurrentSlot && <Check className="w-3.5 h-3.5 text-indigo-400 ml-1" />}
                                    </div>
                                  </button>
                                );
                              })}
                            </>
                          ) : (
                            <>
                              {STOCK_CATALOG.filter((item) => categoryFilter === "Alle" || item.category === categoryFilter).map((item) => {
                                const isSelected = favorites.includes(item.symbol);
                                const isCurrentSlot = favorites[index] === item.symbol;

                                return (
                                  <button
                                    key={`catalog-${item.symbol}`}
                                    type="button"
                                    onClick={() => handleSelectFavorite(index, item.symbol)}
                                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                      isCurrentSlot
                                        ? "bg-indigo-600/20 text-indigo-300 font-semibold"
                                        : isSelected
                                          ? "text-slate-400 hover:bg-slate-800/40"
                                          : "text-slate-200 hover:bg-slate-800/60"
                                    }`}
                                  >
                                    <div className="truncate pr-2">
                                      <span className="font-mono font-semibold block text-white">{item.symbol}</span>
                                      <span className="text-[10px] text-slate-400 block truncate">{item.name}</span>
                                    </div>
                                    <div className="shrink-0 flex items-center gap-1">
                                      <span className="text-[8px] text-slate-400 font-mono font-medium px-1.5 py-0.5 bg-slate-800 rounded">
                                        {item.category}
                                      </span>
                                      {isCurrentSlot && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                                    </div>
                                  </button>
                                );
                              })}
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="text-[10px] text-slate-400 truncate max-w-[85px] sm:max-w-[95px] leading-tight mt-0.5">
                  {stock?.name || "Lade Daten..."}
                </div>
              </div>

              {/* Mitte: SVG Sparkline mit Gradient Fill */}
              <div className="flex-1 flex items-center justify-center max-w-[100px] h-[26px]">
                {stock ? (
                  renderSparkline(stock.sparkline, stock.changePercent)
                ) : (
                  <div className="w-[88px] h-[22px] bg-slate-900 rounded animate-pulse" />
                )}
              </div>

              {/* Rechts: Preis & Prozent-Badge */}
              <div className="flex flex-col items-end shrink-0 text-right min-w-[76px]">
                <div className="text-xs font-semibold font-mono text-white leading-none tracking-tight">
                  {stock ? stock.price.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "---"}
                  <span className="text-[10px] text-slate-400 font-normal font-sans ml-0.5">
                    {stock ? getCurrencySymbol(stock.currency) : ""}
                  </span>
                </div>
                
                <div className="mt-1">
                  {stock ? (
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
                      isPositive 
                        ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/25" 
                        : "text-rose-400 bg-rose-500/15 border-rose-500/25"
                    }`}>
                      {isPositive ? (
                        <ArrowUpRight className="w-2.5 h-2.5" />
                      ) : (
                        <ArrowDownRight className="w-2.5 h-2.5" />
                      )}
                      <span>{changeSign}{stock.changePercent.toFixed(2)}%</span>
                    </span>
                  ) : (
                    <span className="inline-block w-9 h-3 bg-slate-900 rounded animate-pulse"></span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Detail Modal mit Multi-Perioden Chart, Hoch/Tief & Kursalarm */}
      {typeof document !== "undefined" && selectedModalStock && createPortal(
        <AnimatePresence>
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md overflow-y-auto"
            onClick={() => setSelectedModalStock(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15, transition: { duration: 0.15 } }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-750 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative flex flex-col gap-4 text-slate-100 overflow-hidden"
            >
              {/* Top Accent Gradient */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />

              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-800 rounded-xl border border-slate-700 font-mono font-bold text-sm text-indigo-400">
                    {selectedModalStock.symbol}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base leading-tight font-sans">
                      {selectedModalStock.name}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Währung: {selectedModalStock.currency} • Realtime-Feed
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedModalStock(null)}
                  className="flex items-center gap-1 px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 rounded-xl transition-all cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Navigation Tabs: [ Kursverlauf & Analyse ] vs [ Kursalarm (x) ] */}
              <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalTab("chart")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    modalTab === "chart"
                      ? "bg-slate-800 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Kursverlauf & Analyse</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalTab("alerts");
                    requestNotificationPermission();
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    modalTab === "alerts"
                      ? "bg-slate-800 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kursalarm</span>
                  {stockAlerts.length > 0 && (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                      {stockAlerts.length}
                    </span>
                  )}
                </button>
              </div>

              {/* TAB 1: KURSVERLAUF & ANALYSE */}
              {modalTab === "chart" && (
                <>
                  {/* Primary Price & Change Highlight (Dynamisch für gewählten Zeitraum) */}
                  <div className="flex items-baseline justify-between gap-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                        Aktueller Kurs
                      </span>
                      <div className="text-2xl font-bold font-mono text-white mt-0.5">
                        {selectedModalStock.price.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                        <span className="text-sm text-slate-400 font-normal">{getCurrencySymbol(selectedModalStock.currency)}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                        Performance ({selectedRange.toUpperCase()})
                      </span>
                      {rangeChartData ? (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border mt-0.5 ${
                          rangeChartData.changePercent >= 0 
                            ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30" 
                            : "text-rose-400 bg-rose-500/15 border-rose-500/30"
                        }`}>
                          {rangeChartData.changePercent >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {rangeChartData.changePercent >= 0 ? "+" : ""}{rangeChartData.changePercent.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="inline-block w-16 h-5 bg-slate-800 rounded animate-pulse" />
                      )}
                    </div>
                  </div>

                  {/* Multi-Period Selector Bar: 1T | 5T | 1M | 6M | 1J */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                        Zeitraum auswählen
                      </span>

                      {/* Time Range Pills */}
                      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        {TIME_RANGES.map((r) => {
                          const isActive = selectedRange === r.key;
                          return (
                            <button
                              key={r.key}
                              type="button"
                              onClick={() => setSelectedRange(r.key)}
                              title={r.title}
                              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                                isActive
                                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                              }`}
                            >
                              {r.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Interactive SVG Chart Canvas */}
                    <div className="relative">
                      {isRangeLoading && (
                        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center rounded-xl z-10">
                          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-indigo-300 font-mono">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Lade Daten ({selectedRange.toUpperCase()})...</span>
                          </div>
                        </div>
                      )}
                      {renderInteractiveDetailChart(rangeChartData, selectedRange)}
                    </div>
                  </div>

                  {/* Range Key Metrics: High, Low, Period Start */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-xl">
                      <span className="text-[9px] font-mono text-slate-500 uppercase block">Periode Hoch</span>
                      <span className="text-xs font-mono font-bold text-emerald-400 mt-0.5 block">
                        {rangeChartData?.high
                          ? `${rangeChartData.high.toLocaleString("de-DE", { minimumFractionDigits: 2 })} ${getCurrencySymbol(selectedModalStock.currency)}`
                          : "---"}
                      </span>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-xl">
                      <span className="text-[9px] font-mono text-slate-500 uppercase block">Periode Tief</span>
                      <span className="text-xs font-mono font-bold text-rose-400 mt-0.5 block">
                        {rangeChartData?.low
                          ? `${rangeChartData.low.toLocaleString("de-DE", { minimumFractionDigits: 2 })} ${getCurrencySymbol(selectedModalStock.currency)}`
                          : "---"}
                      </span>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-xl">
                      <span className="text-[9px] font-mono text-slate-500 uppercase block">
                        {selectedRange === "1d" ? "Schluss Vortag" : "Startkurs"}
                      </span>
                      <span className="text-xs font-mono font-bold text-indigo-300 mt-0.5 block">
                        {selectedRange === "1d" && selectedModalStock.prevClose
                          ? `${selectedModalStock.prevClose.toLocaleString("de-DE", { minimumFractionDigits: 2 })} ${getCurrencySymbol(selectedModalStock.currency)}`
                          : rangeChartData?.startPrice
                            ? `${rangeChartData.startPrice.toLocaleString("de-DE", { minimumFractionDigits: 2 })} ${getCurrencySymbol(selectedModalStock.currency)}`
                            : "---"}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: KURSALARM & BENACHRICHTIGUNG */}
              {modalTab === "alerts" && (
                <div className="flex flex-col gap-4">
                  {/* Alert Creation Card */}
                  <form 
                    onSubmit={handleCreateAlert}
                    className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-amber-500/15 border border-amber-500/30 rounded-lg text-amber-400">
                          <BellRing className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white font-sans">Neuen Kursalarm einrichten</h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Basis: {selectedModalStock.price.toFixed(2)} {getCurrencySymbol(selectedModalStock.currency)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Percentage Buttons */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        Schnellauswahl relativ zum Kurs
                      </label>
                      <div className="grid grid-cols-6 gap-1">
                        {[-10, -5, -2, 2, 5, 10].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => handleQuickPercent(pct)}
                            className={`py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                              pct > 0
                                ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {pct > 0 ? `+${pct}%` : `${pct}%`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price Input & Condition Indicator */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        Zielkurs festlegen ({getCurrencySymbol(selectedModalStock.currency)})
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={alertTargetPrice}
                          onChange={(e) => setAlertTargetPrice(e.target.value)}
                          placeholder="z. B. 90.50"
                          className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-base px-3.5 py-2 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />
                        <span className="absolute right-3.5 text-xs font-mono text-slate-400 font-bold">
                          {getCurrencySymbol(selectedModalStock.currency)}
                        </span>
                      </div>

                      {/* Direction Preview */}
                      {parseFloat(alertTargetPrice.replace(",", ".")) > 0 && (
                        <div className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5 mt-0.5">
                          {Math.abs(parseFloat(alertTargetPrice.replace(",", ".")) - selectedModalStock.price) < 0.001 ? (
                            <span className="text-amber-400 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Zielkurs entspricht aktuellem Kurs (bitte Schwellenwert anpassen)
                            </span>
                          ) : parseFloat(alertTargetPrice.replace(",", ".")) > selectedModalStock.price ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              Auslösung bei Anstieg auf oder über (≥)
                            </span>
                          ) : (
                            <span className="text-rose-400 flex items-center gap-1">
                              <ArrowDownRight className="w-3.5 h-3.5" />
                              Auslösung bei Abfall auf oder unter (≤)
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {alertSuccessMsg && (
                      <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-mono flex items-center gap-1.5 animate-fadeIn">
                        <Check className="w-3.5 h-3.5" />
                        <span>{alertSuccessMsg}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs font-sans rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      Alarm scharf schalten
                    </button>
                  </form>

                  {/* Existing Alerts for this Stock */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                      <span>Eingerichtete Alarme für {selectedModalStock.symbol}</span>
                      <span>{stockAlerts.length} aktiv/ausgelöst</span>
                    </div>

                    {stockAlerts.length === 0 ? (
                      <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl text-center text-xs text-slate-500 font-mono">
                        Noch keine Alarme für diesen Wert eingerichtet.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                        {stockAlerts.map((al) => (
                          <div 
                            key={al.id}
                            className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-mono ${
                              al.triggered
                                ? "bg-slate-950/40 border-slate-800 text-slate-500"
                                : "bg-slate-950/80 border-slate-700 text-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {al.condition === "above" ? (
                                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <ArrowDownRight className="w-4 h-4 text-rose-400" />
                              )}
                              <div>
                                <span className="font-bold text-white">
                                  {al.condition === "above" ? "≥" : "≤"} {al.targetPrice.toFixed(2)} {getCurrencySymbol(al.currency)}
                                </span>
                                <span className="text-[10px] text-slate-400 block">
                                  {al.triggered 
                                    ? `Ausgelöst am ${new Date(al.triggeredAt || Date.now()).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr`
                                    : `Erstellt am ${new Date(al.createdAt).toLocaleDateString("de-DE")}`}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {al.triggered ? (
                                <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-sans">
                                  Erledigt
                                </span>
                              ) : (
                                <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md font-sans font-bold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                  Aktiv
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteAlert(al.id)}
                                className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Alarm löschen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-500 font-mono">
                  {modalTab === "chart" ? `Historie: ${selectedRange.toUpperCase()}` : "Alarm-Engine v2"}
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedModalStock(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer active:scale-95"
                >
                  Schließen
                </button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

      {/* 4. Floating Toast Notification when Price Alert is Triggered */}
      {typeof document !== "undefined" && activeToastAlert && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-4 right-4 z-[120] max-w-sm w-full bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-4 shadow-2xl shadow-amber-500/20 text-white backdrop-blur-lg flex flex-col gap-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400 animate-bounce">
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-mono text-amber-400 flex items-center gap-1.5">
                    KURSALARM ERREICHT!
                  </h4>
                  <span className="text-xs font-bold font-sans text-white block">
                    {activeToastAlert.alert.symbol} • {activeToastAlert.alert.name}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveToastAlert(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Zielkurs:</span>
              <span className="font-bold text-amber-300">
                {activeToastAlert.alert.targetPrice.toFixed(2)} {getCurrencySymbol(activeToastAlert.alert.currency)}
              </span>
              <span className="text-slate-400">Aktuell:</span>
              <span className="font-bold text-white">
                {activeToastAlert.currentPrice.toFixed(2)} {getCurrencySymbol(activeToastAlert.alert.currency)}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const targetStock = stocksData.find(s => s.symbol.toUpperCase() === activeToastAlert.alert.symbol.toUpperCase());
                  if (targetStock) {
                    setSelectedModalStock(targetStock);
                    setModalTab("alerts");
                  }
                  setActiveToastAlert(null);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Details ansehen
              </button>
              <button
                type="button"
                onClick={() => setActiveToastAlert(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors cursor-pointer"
              >
                Verwerfen
              </button>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
