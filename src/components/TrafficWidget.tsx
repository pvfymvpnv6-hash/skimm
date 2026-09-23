import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Route, Construction, AlertTriangle, MapPin, Clock,
  RefreshCw, CheckCircle2, ShieldAlert,
  ExternalLink, X, Map, ChevronRight
} from "lucide-react";
import { stripEmojis } from "../utils/textUtils";

// Live data comes from the official Autobahn GmbH API (Bundesautobahnen
// only - no city streets or public transit), so there's no numeric delay-
// in-minutes or congestion-percentage field to show; overallStatus/stats
// below are derived from real counts instead.
interface TrafficAlert {
  id: string;
  road: string; // e.g. "A115", "A10"
  type: "stau" | "sperrung" | "baustelle";
  severity: "critical" | "moderate" | "minor";
  title: string;
  location: string;
  description: string;
  fullText?: string;
  url?: string;
}

interface RegionData {
  city: string;
  roads: string[];
  overallStatus: "normal" | "heavy" | "critical";
  stats: { warnings: number; roadworks: number; closures: number };
  alerts: TrafficAlert[];
  dataSource?: string;
}

const EMPTY_REGION: RegionData = {
  city: "",
  roads: [],
  overallStatus: "normal",
  stats: { warnings: 0, roadworks: 0, closures: 0 },
  alerts: []
};

const REGION_LABELS: Record<string, string> = {
  brandenburg: "Brandenburg",
  berlin: "Berlin",
  potsdam: "Potsdam",
  rostock: "Rostock"
};

export default function TrafficWidget() {
  const [selectedRegion, setSelectedRegion] = useState<string>(() => {
    const saved = localStorage.getItem("traffic_selected_region");
    return saved && REGION_LABELS[saved] ? saved : "brandenburg";
  });
  const [trafficData, setTrafficData] = useState<(RegionData & { isRealApi?: boolean; lastSync?: string }) | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // --- Modal & Detail States ---
  const [selectedAlert, setSelectedAlert] = useState<TrafficAlert | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Close modal on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedAlert) {
        setSelectedAlert(null);
      }
    };
    if (selectedAlert) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedAlert]);

  // --- Traffic Radar Auto-Sync States ---
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number>(600); // 10 minutes auto-sync interval
  const [isLivePulse, setIsLivePulse] = useState<boolean>(false);

  // Switch region handler
  const handleSelectRegion = (regionKey: string) => {
    if (regionKey === selectedRegion) return;
    setSelectedRegion(regionKey);
    localStorage.setItem("traffic_selected_region", regionKey);
    fetchTraffic(regionKey, false);
  };

  useEffect(() => {
    localStorage.setItem("traffic_selected_region", selectedRegion);
    fetchTraffic(selectedRegion, false);
  }, [selectedRegion]);

  const fetchTraffic = async (regionKey: string, isAuto = false) => {
    if (!isAuto) setIsLoading(true);
    setIsRefreshing(true);
    if (isAuto) {
      setIsLivePulse(true);
      setTimeout(() => setIsLivePulse(false), 2000);
    }

    try {
      const res = await fetch(`/api/traffic?region=${encodeURIComponent(regionKey)}`);
      if (res.ok) {
        const data = await res.json();
        setTrafficData(data);
        setHasError(false);
        if (data.lastSync) {
          setLastUpdated(data.lastSync);
        }
      } else {
        throw new Error("Traffic API error");
      }
    } catch (err) {
      console.warn("Traffic fetch failed:", err);
      setHasError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Traffic Radar Auto-Sync countdown effect
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (typeof document !== "undefined" && document.visibilityState === "visible") {
            fetchTraffic(selectedRegion, true);
          }
          return 600; // reset to 10 minutes
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshEnabled, selectedRegion]);

  const handleRefresh = (isAuto = false) => {
    fetchTraffic(selectedRegion, isAuto);
    setCountdown(600);
  };

  const region = trafficData || { ...EMPTY_REGION, city: REGION_LABELS[selectedRegion] || "" };

  // Helper to determine status style
  const getStatusColor = (status: "normal" | "heavy" | "critical") => {
    switch (status) {
      case "normal":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/25",
          text: "text-emerald-400",
          dot: "bg-emerald-500",
          label: "Normaler Verkehrsfluss"
        };
      case "heavy":
        return {
          bg: "bg-amber-500/10 border-amber-500/25",
          text: "text-amber-400",
          dot: "bg-amber-500",
          label: "Erhöhtes Aufkommen"
        };
      case "critical":
        return {
          bg: "bg-rose-500/10 border-rose-500/25",
          text: "text-rose-400",
          dot: "bg-rose-500",
          label: "Kritische Verzögerungen"
        };
    }
  };

  const currentStatus = getStatusColor(region.overallStatus);

  const getAlertIcon = (type: TrafficAlert["type"]) => {
    switch (type) {
      case "stau":
        return <Clock className="w-3.5 h-3.5 text-amber-400" />;
      case "sperrung":
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
      case "baustelle":
        return <Construction className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const getSeverityBadgeClass = (severity: TrafficAlert["severity"]) => {
    switch (severity) {
      case "critical":
        return "bg-rose-500/15 border border-rose-500/30 text-rose-400";
      case "moderate":
        return "bg-amber-500/15 border border-amber-500/25 text-amber-400";
      case "minor":
        return "bg-slate-800 text-slate-400 border border-slate-700/60";
    }
  };

  return (
    <div 
      id="traffic-widget"
      className={`bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 relative overflow-hidden backdrop-blur-md shadow-xl shadow-slate-950/20 transition-all duration-700 ${
        isLivePulse ? "ring-2 ring-indigo-500/50 shadow-indigo-500/20" : ""
      }`}
    >
      {/* Background visual detail */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* 1. Header & Navigation: Clean Lucide-Badge, stripEmojis, Compact Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.15)] shrink-0">
            <Route className="w-4 h-4 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-200 text-sm font-sans tracking-tight">
                {stripEmojis("Echtzeit-Verkehrsradar")}
              </h3>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-medium flex items-center gap-1" title="Echtzeit Autobahn GmbH des Bundes">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AUTOBAHN-RADAR
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5" title={trafficData?.dataSource}>
              {trafficData?.dataSource || "Autobahn GmbH des Bundes (verkehr.autobahn.de)"}
            </p>
          </div>
        </div>

        {/* Region selector pills - compact height */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 self-start sm:self-center shrink-0">
          {Object.entries(REGION_LABELS).map(([key, label]) => (
            <button
              key={key}
              id={`traffic-region-${key}`}
              type="button"
              onClick={() => handleSelectRegion(key)}
              className={`text-[10px] font-mono font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                selectedRegion === key
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Side-by-side Grid Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* Left Column: Schlankes Umfeld-Status & Index Layout */}
        <div className="lg:col-span-5 flex flex-col gap-2.5 justify-between">
          
          {/* Status block */}
          <div className="flex flex-col gap-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">Umfeld-Status</span>
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-semibold truncate max-w-[150px]">
                {stripEmojis(region.city)}
              </span>
            </div>
            
            <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${currentStatus.bg} ${currentStatus.text}`}>
              <div className="relative flex h-2 w-2 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${currentStatus.dot} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${currentStatus.dot}`} />
              </div>
              <span className="truncate text-[11px] font-medium">{currentStatus.label}</span>
            </div>
          </div>

          {/* Meldungsübersicht: echte Zähler statt erfundenem Auslastungs-Prozentwert */}
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 flex flex-col gap-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
              Meldungsübersicht
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <div className="flex flex-col items-center gap-1 bg-slate-900/60 border border-amber-500/20 rounded-lg py-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-sm font-bold text-amber-400 leading-none">{region.stats.warnings}</span>
                <span className="text-[9px] text-slate-500 font-mono">Stau</span>
              </div>
              <div className="flex flex-col items-center gap-1 bg-slate-900/60 border border-amber-500/20 rounded-lg py-1.5">
                <Construction className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-sm font-bold text-amber-400 leading-none">{region.stats.roadworks}</span>
                <span className="text-[9px] text-slate-500 font-mono">Baustellen</span>
              </div>
              <div className="flex flex-col items-center gap-1 bg-slate-900/60 border border-rose-500/20 rounded-lg py-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-sm font-bold text-rose-400 leading-none">{region.stats.closures}</span>
                <span className="text-[9px] text-slate-500 font-mono">Sperrungen</span>
              </div>
            </div>
          </div>

          {/* Refresh/Updated row with Auto-Sync controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/40 px-2.5 py-1.5 rounded-xl border border-slate-800/60">
            <button
              type="button"
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className="flex items-center gap-1.5 py-1 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] font-mono transition-all cursor-pointer"
              title={autoRefreshEnabled ? "Verkehrs-Auto-Sync pausieren" : "Verkehrs-Auto-Sync aktivieren"}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${autoRefreshEnabled ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span className="text-slate-300">
                {autoRefreshEnabled 
                  ? `Radar-Sync: ${Math.floor(countdown / 60)}m ${String(countdown % 60).padStart(2, "0")}s`
                  : "Radar-Sync: Pausiert"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                handleRefresh(false);
                setCountdown(600);
              }}
              disabled={isRefreshing}
              className="py-1 px-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 active:scale-[0.98] rounded-lg text-indigo-300 transition-all cursor-pointer flex items-center gap-1.5 font-mono text-[10px]"
              title="Verkehrsradar manuell aktualisieren"
            >
              <RefreshCw className={`w-3 h-3 text-indigo-400 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{lastUpdated ? (lastUpdated.includes("Uhr") ? lastUpdated : `${lastUpdated} Uhr`) : "Live"}</span>
            </button>
          </div>

        </div>

        {/* 3. Right Column: Compact List-Rows instead of bulky cards */}
        <div className="lg:col-span-7 flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
              Meldungen ({region.alerts.length})
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              Klick für Details
            </span>
          </div>
          
          <div className="max-h-[160px] sm:max-h-[175px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950/50">
            <AnimatePresence mode="popLayout">
              {region.alerts.length === 0 && hasError ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-6 gap-1.5 text-slate-400 bg-slate-950/30 border border-slate-800/60 rounded-xl px-4 text-center"
                >
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-semibold text-slate-200">Daten momentan nicht verfügbar</span>
                  <span className="text-[11px] text-slate-400 max-w-xs">Die Autobahn-API war gerade nicht erreichbar. Versuch's gleich nochmal.</span>
                </motion.div>
              ) : region.alerts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-6 gap-1.5 text-slate-400 bg-slate-950/30 border border-slate-800/60 rounded-xl px-4 text-center"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-200">Freier Verkehrsfluss</span>
                  <span className="text-[11px] text-slate-400 max-w-xs">Keine akuten Stau- oder Baustellenmeldungen auf den Autobahnen der Region.</span>
                </motion.div>
              ) : (
                region.alerts.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: index * 0.04, duration: 0.2 }}
                    id={`traffic-alert-${alert.id}`}
                    onClick={() => setSelectedAlert(alert)}
                    className="group relative flex items-center justify-between gap-3 w-full px-3 py-2 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-850 hover:border-indigo-500/40 rounded-xl transition-all cursor-pointer shadow-sm"
                    title="Klicken für Volltext & Kartendetails"
                  >
                    {/* Left Icon */}
                    <div className="p-1.5 bg-slate-900 border border-slate-800 group-hover:border-indigo-500/30 rounded-lg shrink-0 flex-shrink-0 transition-colors">
                      {getAlertIcon(alert.type)}
                    </div>

                    {/* Middle Info: flex-1 min-w-0 with clean truncation & no duplicated text */}
                    {(() => {
                      const cleanRoad = stripEmojis(alert.road || "").trim();
                      const cleanLoc = stripEmojis(alert.location || "").replace(/,\s*Potsdam$/i, "").trim();
                      let cleanTitle = stripEmojis(alert.title || "").trim();
                      let cleanDesc = stripEmojis(alert.description || "").trim();
                      
                      // Strip road name prefix or mention from location, title, and desc so road only appears once in the badge
                      const sanitizeAgainstRoad = (text: string) => {
                        if (!cleanRoad || !text) return text;
                        let res = text;
                        // Escape regex specials in cleanRoad
                        const escapedRoad = cleanRoad.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
                        // Remove prefix like "Großbeerenstraße: ", "Großbeerenstraße - ", "Großbeerenstraße (Abschnitt)", "Stau: Großbeerenstraße"
                        res = res.replace(new RegExp(`^(?:(?:Stau|Gefahr|Unfall|Baustelle|Sperrung|Warnung)\\s*[:\\-]?\\s*)?${escapedRoad}\\s*[:\\-–—,]?\\s*`, "i"), "");
                        res = res.replace(new RegExp(`\\b${escapedRoad}\\b\\s*[:\\-–—,]?\\s*`, "gi"), "");
                        res = res.replace(/^\((.*?)\)$/, "$1");
                        return res.trim();
                      };

                      const subLoc = sanitizeAgainstRoad(cleanLoc);
                      const subTitle = sanitizeAgainstRoad(cleanTitle);
                      const subDesc = sanitizeAgainstRoad(cleanDesc);

                      // Determine section / detail string (pure section without road duplication)
                      let sectionText = "";
                      if (subLoc && subLoc.toLowerCase() !== cleanRoad.toLowerCase()) {
                        sectionText = subLoc;
                      } else if (subTitle && subTitle.toLowerCase() !== cleanRoad.toLowerCase()) {
                        sectionText = subTitle;
                      } else if (subDesc && subDesc.toLowerCase() !== cleanRoad.toLowerCase()) {
                        sectionText = subDesc;
                      } else {
                        sectionText = "Behinderung gemeldet";
                      }

                      // Additional details for larger screens if distinct
                      const extraDetail = subDesc && subDesc !== sectionText && subDesc.length < 60 ? subDesc : "";

                      return (
                        <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden">
                          <span className="text-xs font-bold font-mono text-indigo-400 group-hover:text-indigo-300 transition-colors shrink-0 flex-shrink-0">
                            {cleanRoad || "Verkehrsmeldung"}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                            {sectionText}
                          </span>
                          {extraDetail && (
                            <span className="text-[10px] text-slate-400 font-sans truncate hidden md:inline">
                              • {extraDetail}
                            </span>
                          )}
                        </div>
                      );
                    })()}

                    {/* Right Severity Badge: flex-shrink-0, relative, clean spacing */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-shrink-0 relative">
                      <div className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap ${getSeverityBadgeClass(alert.severity)}`}>
                        {alert.type === "stau" ? "Stau" : alert.type === "baustelle" ? "Baustelle" : "Sperrung"}
                      </div>

                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* --- TRAFFIC ALERT FULL DETAILS MODAL VIA REACT PORTAL --- */}
      {typeof document !== "undefined" && selectedAlert && createPortal(
        <AnimatePresence>
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
            onClick={() => setSelectedAlert(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15, transition: { duration: 0.15 } }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full max-h-[85vh] p-5 sm:p-6 shadow-2xl relative flex flex-col gap-4 text-slate-100 overflow-hidden"
            >
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3 shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 bg-indigo-600 text-white font-mono font-bold text-xs rounded-xl shadow-sm">
                    {selectedAlert.road}
                  </span>
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg uppercase tracking-wider ${getSeverityBadgeClass(selectedAlert.severity)}`}>
                    {selectedAlert.type === "stau" ? "Stau" : selectedAlert.type === "sperrung" ? "Sperrung" : "Baustelle"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  className="flex items-center gap-1 px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 rounded-xl transition-all cursor-pointer shrink-0"
                  title="Fenster schließen (ESC)"
                  aria-label="Fenster schließen"
                >
                  <span className="text-xs font-semibold">Schließen</span>
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>

              {/* Content Body */}
              <div className="flex flex-col gap-3 overflow-y-auto pr-1 flex-1 min-h-0 custom-scrollbar">
                <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                  {stripEmojis(selectedAlert.title)}
                </h3>

                <div className="flex items-center gap-2 text-xs text-indigo-300 font-medium bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-xl">
                  <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{stripEmojis(selectedAlert.location)}</span>
                </div>

                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl text-xs sm:text-sm leading-relaxed text-slate-200 font-sans space-y-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-semibold">
                    Vollständige Meldung:
                  </span>
                  <p className="whitespace-pre-wrap">{stripEmojis(selectedAlert.fullText || selectedAlert.description)}</p>
                </div>
              </div>

              {/* Action Footer */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800 shrink-0 flex-wrap sm:flex-nowrap">
                <a
                  href={selectedAlert.url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedAlert.road)}&layer=t`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                  title="Meldungsort in Google Maps mit Live-Verkehrslage anzeigen"
                >
                  <Map className="w-4 h-4 text-white" />
                  <span>In Google Maps öffnen (Live-Verkehr)</span>
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-200" />
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
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
