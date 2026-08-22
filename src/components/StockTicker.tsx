import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { 
  TrendingUp, TrendingDown, RefreshCw, ChevronDown, 
  Search, X, Plus, Check, Activity, BarChart3, ArrowUpRight, 
  ArrowDownRight, DollarSign, Layers, Zap, Info, ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StockInfo } from "../types";
import { stripEmojis } from "../utils/textUtils";

export type MarketTab = "top" | "indizes" | "krypto";

interface StockPreset {
  symbol: string;
  name: string;
  cat: string;
  tab: MarketTab;
}

const ALL_AVAILABLE_STOCKS: StockPreset[] = [
  // Top Stocks
  { symbol: "NVDA", name: "NVIDIA Corp.", cat: "Tech / KI", tab: "top" },
  { symbol: "AAPL", name: "Apple Inc.", cat: "Tech", tab: "top" },
  { symbol: "MSFT", name: "Microsoft Corp.", cat: "Cloud / KI", tab: "top" },
  { symbol: "AMZN", name: "Amazon Inc.", cat: "Cloud / E-Com", tab: "top" },
  { symbol: "GOOG", name: "Alphabet Inc.", cat: "Search / KI", tab: "top" },
  { symbol: "META", name: "Meta Platforms", cat: "Social / AI", tab: "top" },
  { symbol: "TSLA", name: "Tesla Inc.", cat: "Auto / Tech", tab: "top" },
  { symbol: "SAP", name: "SAP SE", cat: "Software (DE)", tab: "top" },
  { symbol: "RHM.DE", name: "Rheinmetall AG", cat: "Industrie (DE)", tab: "top" },

  // Indizes
  { symbol: "^GDAXI", name: "DAX 40 Performance", cat: "Index (DE)", tab: "indizes" },
  { symbol: "^GSPC", name: "S&P 500", cat: "Index (US)", tab: "indizes" },
  { symbol: "^IXIC", name: "NASDAQ Composite", cat: "Tech (US)", tab: "indizes" },

  // Krypto
  { symbol: "BTC-USD", name: "Bitcoin", cat: "Krypto (L1)", tab: "krypto" },
  { symbol: "ETH-USD", name: "Ethereum", cat: "Krypto (Smart Contracts)", tab: "krypto" },
  { symbol: "SOL-USD", name: "Solana", cat: "Krypto (High-Speed)", tab: "krypto" },
];

const DEFAULT_PRESETS: Record<MarketTab, string[]> = {
  top: ["NVDA", "AAPL", "MSFT", "AMZN", "SAP"],
  indizes: ["^GDAXI", "^GSPC", "^IXIC", "RHM.DE", "SAP"],
  krypto: ["BTC-USD", "ETH-USD", "SOL-USD", "NVDA", "AAPL"],
};

export default function StockTicker({ className = "" }: { className?: string }) {
  const [activeTab, setActiveTab] = useState<MarketTab>(() => {
    const saved = localStorage.getItem("news_market_active_tab");
    if (saved === "indizes" || saved === "krypto" || saved === "top") return saved;
    return "top";
  });

  const [selectedStocks, setSelectedStocks] = useState<string[]>(() => {
    const saved = localStorage.getItem("news_selected_stocks_v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 3) {
          return parsed;
        }
      } catch (e) {}
    }
    return DEFAULT_PRESETS.top;
  });

  const [stocksData, setStocksData] = useState<StockInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModalStock, setSelectedModalStock] = useState<StockInfo | null>(null);
  
  // Highlighting effects to flash green/red when price changes
  const [flashStates, setFlashStates] = useState<Record<string, "up" | "down" | null>>({});
  const prevPricesRef = useRef<Record<string, number>>({});

  // Sync tab change
  const handleTabChange = (tab: MarketTab) => {
    setActiveTab(tab);
    localStorage.setItem("news_market_active_tab", tab);
    const presets = DEFAULT_PRESETS[tab];
    setSelectedStocks(presets);
    localStorage.setItem("news_selected_stocks_v2", JSON.stringify(presets));
  };

  // Sync selected stocks to local storage
  useEffect(() => {
    localStorage.setItem("news_selected_stocks_v2", JSON.stringify(selectedStocks));
    fetchStocksData();
  }, [selectedStocks]);

  // Clear search query on dropdown index change
  useEffect(() => {
    setSearchQuery("");
  }, [activeDropdownIndex]);

  // Set up periodic automatic polling (every 12 seconds) for active live feeling
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStocksData(true); // silent background update
    }, 12000);

    return () => clearInterval(interval);
  }, [selectedStocks]);

  const fetchStocksData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const url = `/api/stocks?symbols=${selectedStocks.join(",")}`;
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
      
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err) {
      // Handled silently
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleSelectStock = (indexToReplace: number, newSymbol: string) => {
    const updated = [...selectedStocks];
    updated[indexToReplace] = newSymbol;
    setSelectedStocks(updated);
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

  // Render SVG Sparkline with smooth opacity gradient under the line
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
    const strokeColor = isPositive ? "#10b981" : "#f43f5e"; // Emerald-500 (#10b981) or Rose-500 (#f43f5e)
    const gradId = `spark-grad-${isPositive ? "emerald" : "rose"}-${Math.abs(changePercent).toFixed(2).replace(".", "-")}-${Math.floor(prices[0] || 0)}`;

    return (
      <svg width={width} height={height} className="overflow-visible block">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.20" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {/* Shaded Area Under Line (Area-Gradient: 20% opacity at top to 0% transparent at bottom) */}
        <motion.path 
          d={areaPath} 
          fill={`url(#${gradId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        />
        
        {/* Stroke Line */}
        <motion.path 
          d={linePath} 
          fill="none" 
          stroke={strokeColor} 
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />

        {/* Live Pulse Dot at Latest Value */}
        <circle
          cx={coords[coords.length - 1].x}
          cy={coords[coords.length - 1].y}
          r="2.2"
          fill={strokeColor}
        />
      </svg>
    );
  };

  // Render Detailed Modal SVG Chart
  const renderDetailChart = (prices: number[], changePercent: number) => {
    if (!prices || prices.length < 2) return null;
    const width = 420;
    const height = 120;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min === 0 ? 1 : max - min;
    const padding = 8;

    const coords = prices.map((price, idx) => {
      const x = (idx / (prices.length - 1)) * (width - 16) + 8;
      const y = height - padding - ((price - min) / range) * (height - padding * 2);
      return { x, y };
    });

    const linePath = `M ${coords[0].x} ${coords[0].y} ` + coords.slice(1).map(c => `L ${c.x} ${c.y}`).join(" ");
    const areaPath = `${linePath} L ${width - 8} ${height} L 8 ${height} Z`;

    const isPositive = changePercent >= 0;
    const strokeColor = isPositive ? "#10b981" : "#f43f5e";

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="modal-chart-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill="url(#modal-chart-grad)" />
        <path 
          d={linePath} 
          fill="none" 
          stroke={strokeColor} 
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={i === coords.length - 1 ? 4 : 2}
            fill={i === coords.length - 1 ? strokeColor : "#94a3b8"}
            opacity={i === coords.length - 1 ? 1 : 0.4}
          />
        ))}
      </svg>
    );
  };

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
                {stripEmojis("Märkte & Indizes")}
              </h4>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-mono font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {lastUpdated ? `Sync: ${lastUpdated} Uhr` : "Realtime Quotes"}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => fetchStocksData()}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
            title="Aktienkurse manuell aktualisieren"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mini-Tabs: Top, Indizes, Krypto */}
      <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 self-start w-full">
        <button
          type="button"
          onClick={() => handleTabChange("top")}
          className={`flex-1 text-[11px] font-mono font-semibold py-1 px-2 rounded-lg transition-all cursor-pointer text-center ${
            activeTab === "top"
              ? "bg-indigo-600 text-white shadow-sm font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Top
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("indizes")}
          className={`flex-1 text-[11px] font-mono font-semibold py-1 px-2 rounded-lg transition-all cursor-pointer text-center ${
            activeTab === "indizes"
              ? "bg-indigo-600 text-white shadow-sm font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Indizes
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("krypto")}
          className={`flex-1 text-[11px] font-mono font-semibold py-1 px-2 rounded-lg transition-all cursor-pointer text-center ${
            activeTab === "krypto"
              ? "bg-indigo-600 text-white shadow-sm font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Krypto
        </button>
      </div>

      {/* 2. Rows: Clean Flex-Grid with SVG Sparklines */}
      <div className="flex flex-col gap-1.5">
        {selectedStocks.map((ticker, index) => {
          const stock = stocksData.find(s => s.symbol.toUpperCase() === ticker.toUpperCase());
          const isDropdownOpen = activeDropdownIndex === index;
          const flash = flashStates[ticker];
          
          const isPositive = stock ? stock.changePercent >= 0 : true;
          const changeSign = isPositive ? "+" : "";

          return (
            <div 
              key={`${ticker}-${index}`}
              id={`stock-row-${index}`}
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
              title="Klicken für 24h-Detailansicht"
            >
              {/* Links: Symbol in Fettschrift + Name abgedunkelt darunter */}
              <div className="flex flex-col items-start min-w-[80px] sm:min-w-[90px] shrink-0">
                <div className="relative">
                  <div className="flex items-center gap-1 font-mono font-bold text-xs text-white group-hover:text-indigo-300 transition-colors">
                    <span>{stock?.symbol || ticker}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdownIndex(isDropdownOpen ? null : index);
                      }}
                      className="p-0.5 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                      title="Wertpapier austauschen"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Dropdown Menu to switch stock */}
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-1.5 w-64 bg-slate-900 border border-slate-750 rounded-xl shadow-2xl z-40 flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-2 border-b border-slate-800 bg-slate-900 sticky top-0 z-10 flex flex-col gap-1.5">
                          <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider px-1 font-mono">
                            Wertpapier Wählen
                          </div>
                          <div className="relative flex items-center">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-500 pointer-events-none" />
                            <input
                              type="text"
                              autoFocus
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Kürzel (z.B. GOOG, SAP, BTC)..."
                              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 outline-none font-sans"
                            />
                            {searchQuery && (
                              <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2 p-0.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 py-1 flex flex-col">
                          {(() => {
                            const filtered = ALL_AVAILABLE_STOCKS.filter((item) =>
                              item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              item.cat.toLowerCase().includes(searchQuery.toLowerCase())
                            );

                            return (
                              <>
                                {filtered.map((item) => {
                                  const isSelected = selectedStocks.includes(item.symbol);
                                  return (
                                    <button
                                      key={item.symbol}
                                      type="button"
                                      onClick={() => handleSelectStock(index, item.symbol)}
                                      className={`w-full text-left px-2.5 py-1.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                        isSelected 
                                          ? "bg-indigo-600/15 text-indigo-400 font-semibold" 
                                          : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                                      }`}
                                    >
                                      <div className="truncate pr-2">
                                        <span className="font-mono font-semibold block">{item.symbol}</span>
                                        <span className="text-[10px] text-slate-500 block truncate">{item.name}</span>
                                      </div>
                                      <div className="shrink-0 flex items-center gap-1">
                                        <span className="text-[8px] text-slate-500 font-mono font-medium px-1.5 py-0.5 bg-slate-800 rounded">
                                          {item.cat}
                                        </span>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                                      </div>
                                    </button>
                                  );
                                })}

                                {searchQuery.trim().length > 0 && !ALL_AVAILABLE_STOCKS.some(i => i.symbol.toLowerCase() === searchQuery.trim().toLowerCase()) && (
                                  <button
                                    type="button"
                                    onClick={() => handleSelectStock(index, searchQuery.trim())}
                                    className="w-full text-left px-2.5 py-2 text-xs flex items-center gap-2 text-emerald-400 hover:bg-slate-800/60 transition-colors border-t border-slate-800 cursor-pointer font-semibold"
                                  >
                                    <Plus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <div className="truncate">
                                      <span className="font-mono font-bold text-emerald-300 block">"{searchQuery.trim().toUpperCase()}"</span>
                                      <span className="text-[9px] text-slate-500 block">Als individuelles Symbol abrufen</span>
                                    </div>
                                  </button>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="text-[10px] text-slate-500 truncate max-w-[85px] sm:max-w-[95px] leading-tight mt-0.5">
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

              {/* Rechts: Rechtsbündiger Preis & farbiges Prozent-Badge */}
              <div className="flex flex-col items-end shrink-0 text-right min-w-[76px]">
                <div className="text-xs font-semibold font-mono text-white leading-none tracking-tight">
                  {stock ? stock.price.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "---"}
                  <span className="text-[10px] text-slate-500 font-normal font-sans ml-0.5">
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

      {/* 3. Detail Modal mit 24h-Chart, Hoch/Tief & Volumen via React Portal */}
      {typeof document !== "undefined" && selectedModalStock && createPortal(
        <AnimatePresence>
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
            onClick={() => setSelectedModalStock(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15, transition: { duration: 0.15 } }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative flex flex-col gap-4 text-slate-100 overflow-hidden"
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
                      Währung: {selectedModalStock.currency} • {selectedModalStock.isSimulated ? "Simulation Engine" : "Echtzeit-Feed"}
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

              {/* Primary Price & Change Highlight */}
              <div className="flex items-baseline justify-between gap-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Aktueller Kurs</span>
                  <div className="text-2xl font-bold font-mono text-white mt-0.5">
                    {selectedModalStock.price.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                    <span className="text-sm text-slate-400 font-normal">{getCurrencySymbol(selectedModalStock.currency)}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">24h Performance</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border mt-0.5 ${
                    selectedModalStock.changePercent >= 0 
                      ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30" 
                      : "text-rose-400 bg-rose-500/15 border-rose-500/30"
                  }`}>
                    {selectedModalStock.changePercent >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {selectedModalStock.changePercent >= 0 ? "+" : ""}{selectedModalStock.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* 24h Chart Canvas */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                  <span className="flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                    24h Intraday Trend
                  </span>
                  <span className="text-[10px] text-slate-500">15m Intervalle</span>
                </div>

                <div className="h-32 w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex items-center justify-center">
                  {renderDetailChart(selectedModalStock.sparkline, selectedModalStock.changePercent)}
                </div>
              </div>

              {/* Key Metrics: Day High, Day Low, Volume */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-xl">
                  <span className="text-[9px] font-mono text-slate-500 uppercase block">Tages-Hoch</span>
                  <span className="text-xs font-mono font-bold text-emerald-400 mt-0.5 block">
                    {selectedModalStock.dayHigh 
                      ? `${selectedModalStock.dayHigh.toLocaleString("de-DE", { minimumFractionDigits: 2 })} ${getCurrencySymbol(selectedModalStock.currency)}`
                      : `${(selectedModalStock.price * 1.01).toFixed(2)} ${getCurrencySymbol(selectedModalStock.currency)}`}
                  </span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-xl">
                  <span className="text-[9px] font-mono text-slate-500 uppercase block">Tages-Tief</span>
                  <span className="text-xs font-mono font-bold text-rose-400 mt-0.5 block">
                    {selectedModalStock.dayLow 
                      ? `${selectedModalStock.dayLow.toLocaleString("de-DE", { minimumFractionDigits: 2 })} ${getCurrencySymbol(selectedModalStock.currency)}`
                      : `${(selectedModalStock.price * 0.99).toFixed(2)} ${getCurrencySymbol(selectedModalStock.currency)}`}
                  </span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-xl">
                  <span className="text-[9px] font-mono text-slate-500 uppercase block">Volumen</span>
                  <span className="text-xs font-mono font-bold text-indigo-300 mt-0.5 block">
                    {selectedModalStock.volume 
                      ? selectedModalStock.volume >= 1000000 
                        ? `${(selectedModalStock.volume / 1000000).toFixed(1)}M`
                        : `${(selectedModalStock.volume / 1000).toFixed(0)}k`
                      : "24.5M"}
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
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
    </div>
  );
}
