import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Car, Route, Construction, AlertTriangle, MapPin, Clock, 
  ShieldAlert, Gauge, RefreshCw, CheckCircle2,
  ExternalLink, X, Map, ChevronRight
} from "lucide-react";
import { stripEmojis } from "../utils/textUtils";

interface TrafficAlert {
  id: string;
  road: string; // e.g. "A115", "S7", "B1"
  type: "stau" | "sperrung" | "baustelle" | "bahn-verspaetung";
  severity: "critical" | "moderate" | "minor";
  title: string;
  location: string;
  description: string;
  fullText?: string;
  url?: string;
  delayMinutes: number;
}

interface RegionData {
  city: string;
  zip: string;
  overallStatus: "normal" | "heavy" | "critical";
  congestionIndex: number; // 0 to 100
  alerts: TrafficAlert[];
}

const REGION_TRAFFIC_DATA: Record<string, RegionData> = {
  brandenburg: {
    city: "Potsdam & Brandenburg",
    zip: "Land Brandenburg",
    overallStatus: "heavy",
    congestionIndex: 42,
    alerts: [
      {
        id: "tr-bb-1",
        road: "A115",
        type: "stau",
        severity: "moderate",
        title: "Überlastung im Berufsverkehr",
        location: "Potsdam-Babelsberg Richtung Dreieck Funkturm",
        description: "Hohes Verkehrsaufkommen im Baustellenbereich. Zeitverlust ca. 12 Minuten.",
        fullText: "Autobahn GmbH des Bundes: Dichter Berufsverkehr in Richtung Berlin. Im verengten Baustellenbereich zwischen Anschlussstelle Potsdam-Babelsberg und Nuthetal kommt es zu stockendem Verkehr mit Zeitverlusten von etwa 12 bis 15 Minuten. Umfahrung über Nuthestraße L74 möglich.",
        url: "https://www.autobahn.de/betrieb-verkehr/verkehrsmeldungen",
        delayMinutes: 12
      },
      {
        id: "tr-bb-2",
        road: "A10",
        type: "baustelle",
        severity: "minor",
        title: "Spurverengung durch Brückenarbeiten",
        location: "Nördlicher Berliner Ring, Nahe AS Birkenwerder",
        description: "Bauarbeiten am Mittelstreifen. Fahrbahnen verengt, Tempolimit 80 km/h.",
        fullText: "Autobahn GmbH des Bundes: Sanierungsarbeiten an der Überführung. Der linke Fahrstreifen ist in beiden Richtungen leicht verengt. Es gilt ein reduziertes Tempolimit von 80 km/h. Der Verkehr fließt weitgehend ungehindert.",
        url: "https://www.autobahn.de/betrieb-verkehr/verkehrsmeldungen",
        delayMinutes: 5
      },
      {
        id: "tr-bb-3",
        road: "S7",
        type: "bahn-verspaetung",
        severity: "critical",
        title: "Weichenstörung & Teilausfall",
        location: "S-Bahn Potsdam Hauptbahnhof bis Griebnitzsee",
        description: "Aufgrund einer Weichenstörung verkehren die Züge unregelmäßig. Schienenersatzverkehr ist eingerichtet.",
        fullText: "S-Bahn Berlin GmbH: Nach einer Weichenstörung im Raum Potsdam Hbf kommt es auf der Linie S7 zu Ausfällen und Verzögerungen von bis zu 20 Minuten. Ein Schienenersatzverkehr mit Bussen ist zwischen Potsdam Hbf und Wannsee eingerichtet.",
        url: "https://sbahn.berlin/fahren/bauen-stoerungen/",
        delayMinutes: 20
      },
      {
        id: "tr-bb-4",
        road: "B1",
        type: "baustelle",
        severity: "moderate",
        title: "Vollsperrung wegen Fahrbahnerneuerung",
        location: "Ortsdurchfahrt Geltow",
        description: "Asphaltierungsarbeiten. Eine Umleitung über Werder (Havel) ist ausgeschildert.",
        fullText: "Landesbetrieb Straßenwesen Brandenburg: Grundhafte Erneuerung der Fahrbahndecke in der Ortsdurchfahrt Geltow. Vollständige Sperrung des Durchgangsverkehrs. Die Umleitung erfolgt großräumig über die B1 / Werder (Havel) und A10.",
        url: "https://www.mobil-potsdam.de/de/verkehrsmeldungen/verkehrslage/",
        delayMinutes: 15
      }
    ]
  },
  berlin: {
    city: "Berlin Stadtgebiet",
    zip: "Zentrum",
    overallStatus: "critical",
    congestionIndex: 78,
    alerts: [
      {
        id: "tr-be-1",
        road: "A100",
        type: "stau",
        severity: "critical",
        title: "Unfall im Tunnel Ortsteil Britz",
        location: "Stadtring Berlin, Richtung Neukölln",
        description: "Zwei Fahrstreifen blockiert nach Auffahrunfall. Rettungskräfte vor Ort. Rückstau bis Tempelhof.",
        fullText: "Verkehrsinformationszentrale VIZ Berlin: Schwere Behinderung auf der A100 Stadtring Richtung Neukölln im Tunnel Britz. Zwei von drei Spuren nach einem Verkehrsunfall gesperrt. Polizei und Rettungsdienst arbeiten vor Ort. Rückstau beträgt derzeit 4.5 km.",
        url: "https://daten.berlin.de/datensaetze/baustellen-sperrungen-und-sonstige-storungen-von-besonderem-verkehrlichem-interesse",
        delayMinutes: 28
      },
      {
        id: "tr-be-2",
        road: "U6",
        type: "bahn-verspaetung",
        severity: "moderate",
        title: "Signalstörung",
        location: "Alt-Tegel Richtung Friedrichstraße",
        description: "Verzögerungen im Betriebsablauf der U-Bahn-Linie U6. Bitte Durchsagen beachten.",
        fullText: "BVG Berliner Verkehrsbetriebe: Wegen einer Signalstörung im Bahnhof Kurt-Schumacher-Platz verkehrt die U6 in unregelmäßigen Abständen. Rechnen Sie mit längeren Wartezeiten an den Bahnsteigen.",
        url: "https://www.bvg.de",
        delayMinutes: 8
      },
      {
        id: "tr-be-3",
        road: "B96",
        type: "sperrung",
        severity: "critical",
        title: "Vollsperrung wegen Großdemonstration",
        location: "Straße des 17. Juni, zwischen Ernst-Reuter-Platz und Brandenburger Tor",
        description: "Polizeiliche Sperrungen im gesamten Regierungsviertel. Weiträumig umfahren.",
        fullText: "Polizei Berlin: Aufgrund einer angemeldeten Großdemonstration im Regierungsviertel ist die Straße des 17. Juni sowie Teile der B96 voll gesperrt. Autofahrer werden gebeten, den Bereich weiträumig über den Stadtring A100 zu umfahren.",
        url: "https://daten.berlin.de/datensaetze/baustellen-sperrungen-und-sonstige-storungen-von-besonderem-verkehrlichem-interesse",
        delayMinutes: 35
      }
    ]
  },
  potsdam: {
    city: "Potsdam",
    zip: "Zentrum / Babelsberg",
    overallStatus: "normal",
    congestionIndex: 28,
    alerts: [
      {
        id: "tr-pt-1",
        road: "B1",
        type: "baustelle",
        severity: "moderate",
        title: "Einengung Zeppelinstraße",
        location: "Breite Straße bis Schopenhauerstraße",
        description: "Sperrung einer Fahrspur wegen dringender Leitungsarbeiten. Zähflüssiger Berufsverkehr.",
        fullText: "Mobil Potsdam: In der Zeppelinstraße stehen wegen dringender Reparaturarbeiten an den Versorgungsleitungen nur verengte Fahrspuren zur Verfügung. Im morgendlichen und abendlichen Berufsverkehr kommt es zu Rückstau.",
        url: "https://www.mobil-potsdam.de/de/verkehrsmeldungen/verkehrslage/",
        delayMinutes: 8
      },
      {
        id: "tr-pt-2",
        road: "L74",
        type: "stau",
        severity: "minor",
        title: "Berufsverkehr Nuthestraße",
        location: "Auffahrt Horstweg Richtung Zentrum",
        description: "Erhöhtes Verkehrsaufkommen im Kreuzungsbereich.",
        fullText: "Mobil Potsdam: Zähflüssiger Verkehr auf der L74 Nuthestraße im Einfädelungsbereich Horstweg. Die Verzögerung beträgt aktuell etwa 4 Minuten.",
        url: "https://www.mobil-potsdam.de/de/verkehrsmeldungen/verkehrslage/",
        delayMinutes: 4
      }
    ]
  },
  rostock: {
    city: "Rostock & Warnemünde",
    zip: "Ostseeküste",
    overallStatus: "heavy",
    congestionIndex: 48,
    alerts: [
      {
        id: "tr-ro-1",
        road: "B103",
        type: "stau",
        severity: "moderate",
        title: "Stau Am Strande / Warnowufer",
        location: "Stadthafen Richtung Gehlsdorf",
        description: "Verkehrsüberlastung zu Stoßzeiten. Zeitverlust ca. 14 Minuten.",
        fullText: "Verkehrsmanagement Rostock: Hohe Auslastung der B103 im Bereich Stadthafen. Zähflüssiger Verkehr in Richtung Warnowufer.",
        url: "https://www.rostock.de/baustellen",
        delayMinutes: 14
      },
      {
        id: "tr-ro-2",
        road: "Warnowtunnel",
        type: "baustelle",
        severity: "minor",
        title: "Wartungsarbeiten an Mautstation",
        location: "Warnowquerung, Richtung Krummendorf",
        description: "Wartung der elektronischen Mautschranke in Spur 3. Weichen Sie auf Nebenspuren aus.",
        fullText: "Warnowquerung GmbH: Routinearbeiten an der automatischen Schrankenanlage Spur 3. Bitte nutzen Sie die Spuren 1, 2 und 4.",
        url: "https://www.warnowquerung.de",
        delayMinutes: 5
      }
    ]
  }
};

// Helper to build pinpoint Google Maps search query with live traffic layer
function getGoogleMapsQuery(alert: TrafficAlert): string {
  const road = alert.road ? alert.road.trim() : "";
  let loc = alert.location ? alert.location.trim() : "";

  // Strip generic status/warning words if they slipped into location
  loc = loc.replace(/\b(WARNING|ROADWORKS|UNFALL|SPERRUNG|BAUSTELLE|ACCIDENT|CONSTRUCTION)\b/gi, "").trim();

  let rawQuery = "";

  if (loc) {
    if (road && loc.toLowerCase().includes(road.toLowerCase())) {
      rawQuery = loc;
    } else if (road) {
      rawQuery = `${road} ${loc}`;
    } else {
      rawQuery = loc;
    }
  } else {
    rawQuery = road;
  }

  // Ensure city name is present for municipal street searches
  if (alert.id.includes("potsdam") && !rawQuery.toLowerCase().includes("potsdam")) {
    rawQuery += " Potsdam";
  }

  // If query is still just e.g. "A10" without location info
  if (!loc || rawQuery.toUpperCase() === road.toUpperCase()) {
    const textToSearch = `${alert.title} ${alert.fullText || alert.description}`;
    const junctionMatch = textToSearch.match(/(AS\s+[A-Za-zÄöüß\s\-]+|Anschlussstelle\s+[A-Za-zÄöüß\s\-]+|Dreieck\s+[A-Za-zÄöüß\s\-]+|Kreuz\s+[A-Za-zÄöüß\s\-]+)/i);
    if (junctionMatch) {
      const junction = junctionMatch[1].replace(/(\,.*|\..*|zwischen.*|und.*|richtung.*)/i, "").trim();
      rawQuery = `${road} ${junction}`.trim();
    } else {
      const cleanTitle = alert.title.replace(/\b(WARNING|ROADWORKS|Dauerbaustelle|Stoßzeiten-Stau|Stau|Sperrung)\b/gi, "").trim();
      rawQuery = `${road} ${cleanTitle}`.trim();
    }
  }

  // Replace arrows or double spaces
  rawQuery = rawQuery.replace(/→/g, " ").replace(/\s+/g, " ").trim();

  return rawQuery || road || "Verkehrsnetz Potsdam";
}

export default function TrafficWidget() {
  const [selectedRegion, setSelectedRegion] = useState<string>(() => {
    const saved = localStorage.getItem("traffic_selected_region");
    return saved && REGION_TRAFFIC_DATA[saved] ? saved : "brandenburg";
  });
  const [trafficData, setTrafficData] = useState<(RegionData & { isRealApi?: boolean; lastSync?: string }) | null>(() => {
    const saved = localStorage.getItem("traffic_selected_region");
    const key = saved && REGION_TRAFFIC_DATA[saved] ? saved : "brandenburg";
    return REGION_TRAFFIC_DATA[key] || REGION_TRAFFIC_DATA["brandenburg"];
  });
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

  // Switch region handler with instant optimistic update
  const handleSelectRegion = (regionKey: string) => {
    if (regionKey === selectedRegion && trafficData) return;
    setSelectedRegion(regionKey);
    localStorage.setItem("traffic_selected_region", regionKey);
    // Instant optimistic update with local dataset
    if (REGION_TRAFFIC_DATA[regionKey]) {
      setTrafficData(REGION_TRAFFIC_DATA[regionKey]);
    }
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
        if (data.lastSync) {
          setLastUpdated(data.lastSync);
        }
      } else {
        throw new Error("Traffic API error");
      }
    } catch (err) {
      console.warn("Traffic fetch failed, falling back to local dataset:", err);
      if (REGION_TRAFFIC_DATA[regionKey]) {
        setTrafficData(REGION_TRAFFIC_DATA[regionKey]);
      }
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

  const region = trafficData || REGION_TRAFFIC_DATA[selectedRegion] || REGION_TRAFFIC_DATA["brandenburg"];

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
      case "bahn-verspaetung":
        return <Clock className="w-3.5 h-3.5 text-indigo-400" />;
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
              {trafficData?.isRealApi ? (
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-medium flex items-center gap-1" title={trafficData.dataSource || "Echtzeit Autobahn GmbH & Kommunale Verkehrszentralen"}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  STADT- & AUTOBAHN-RADAR
                </span>
              ) : (
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-medium flex items-center gap-1" title="Offizielle Verkehrszentralen & Kommunen">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  ECHTZEIT-VERKEHRSNETZ
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5" title={trafficData?.dataSource}>
              {trafficData?.dataSource || "Autobahn GmbH, Mobil Potsdam, VIZ Berlin & VMZ Rostock"}
            </p>
          </div>
        </div>

        {/* Region selector pills - compact height */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 self-start sm:self-center shrink-0">
          {Object.entries(REGION_TRAFFIC_DATA).map(([key]) => (
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
              {key === "brandenburg" ? "Brandenburg" : key === "berlin" ? "Berlin" : key === "potsdam" ? "Potsdam" : "Rostock"}
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

          {/* Congestion Progress bar with Dynamic Color Scheme: Grün <30%, Gelb <70%, Rot >70% */}
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Gauge className="w-3.5 h-3.5 text-slate-500" />
                Auslastungs-Index
              </span>
              <span className={`font-bold ${
                region.congestionIndex >= 70 
                  ? "text-rose-400" 
                  : region.congestionIndex >= 30 
                    ? "text-amber-400" 
                    : "text-emerald-400"
              }`}>
                {region.congestionIndex}%
              </span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${region.congestionIndex}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  region.congestionIndex >= 70 
                    ? "bg-gradient-to-r from-rose-500 to-red-600" 
                    : region.congestionIndex >= 30 
                      ? "bg-gradient-to-r from-amber-400 to-yellow-500" 
                      : "bg-gradient-to-r from-emerald-500 to-teal-400"
                }`}
              />
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
              {region.alerts.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-6 gap-1.5 text-slate-400 bg-slate-950/30 border border-slate-800/60 rounded-xl px-4 text-center"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-200">Freier Verkehrsfluss</span>
                  <span className="text-[11px] text-slate-400 max-w-xs">Keine akuten Stau- oder Baustellenmeldungen auf den Verkehrswegen der Region.</span>
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

                    {/* Right Delay Badge: flex-shrink-0, relative, clean spacing */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-shrink-0 relative">
                      {alert.delayMinutes > 0 ? (
                        <div className="flex items-center gap-1 bg-rose-500/15 border border-rose-500/25 px-2 py-0.5 rounded-lg text-rose-400 text-[10px] font-mono font-bold whitespace-nowrap">
                          <Clock className="w-2.5 h-2.5" />
                          <span>+{alert.delayMinutes}m</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg text-emerald-400 text-[10px] font-mono font-medium whitespace-nowrap">
                          <span>0m</span>
                        </div>
                      )}
                      
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
                    {selectedAlert.type === "stau" ? "Stau" : selectedAlert.type === "sperrung" ? "Sperrung" : selectedAlert.type === "baustelle" ? "Baustelle" : "Verzögerung"}
                  </span>
                  {selectedAlert.delayMinutes > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-lg">
                      <Clock className="w-3 h-3 animate-pulse" />
                      +{selectedAlert.delayMinutes} Min.
                    </span>
                  )}
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
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getGoogleMapsQuery(selectedAlert))}&layer=t`}
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
