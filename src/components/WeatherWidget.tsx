import { useState, useEffect } from "react";
import { 
  Cloud, Sun, Moon, CloudRain, CloudSnow, CloudLightning, 
  MapPin, Loader2, Compass, Search, X, Clock, AlertCircle
} from "lucide-react";
import { WeatherInfo } from "../types";

// Standardisierte Wetter-Voreinstellungen für deutsche Großstädte
const PRESET_WEATHER: Record<string, WeatherInfo> = {
  "Berlin": {
    city: "Berlin",
    temp: 22,
    condition: "Sonnig",
    icon: "sun",
    forecast: [
      { time: "12:00", temp: 22, condition: "Sonnig", icon: "sun" },
      { time: "13:00", temp: 24, condition: "Sonnig", icon: "sun" },
      { time: "14:00", temp: 25, condition: "Sonnig", icon: "sun" },
      { time: "15:00", temp: 23, condition: "Leicht bewölkt", icon: "cloud" },
    ]
  },
  "München": {
    city: "München",
    temp: 24,
    condition: "Leicht bewölkt",
    icon: "cloud",
    forecast: [
      { time: "12:00", temp: 23, condition: "Sonnig", icon: "sun" },
      { time: "13:00", temp: 24, condition: "Leicht bewölkt", icon: "cloud" },
      { time: "14:00", temp: 25, condition: "Leicht bewölkt", icon: "cloud" },
      { time: "15:00", temp: 24, condition: "Sonnig", icon: "sun" },
    ]
  },
  "Hamburg": {
    city: "Hamburg",
    temp: 17,
    condition: "Regnerisch",
    icon: "rain",
    forecast: [
      { time: "12:00", temp: 16, condition: "Sprühregen", icon: "rain" },
      { time: "13:00", temp: 17, condition: "Regnerisch", icon: "rain" },
      { time: "14:00", temp: 17, condition: "Starker Regen", icon: "rain" },
      { time: "15:00", temp: 16, condition: "Bewölkt", icon: "cloud" },
    ]
  },
  "Frankfurt": {
    city: "Frankfurt",
    temp: 23,
    condition: "Sonnig",
    icon: "sun",
    forecast: [
      { time: "12:00", temp: 22, condition: "Sonnig", icon: "sun" },
      { time: "13:00", temp: 23, condition: "Sehr sonnig", icon: "sun" },
      { time: "14:00", temp: 24, condition: "Sonnig", icon: "sun" },
      { time: "15:00", temp: 23, condition: "Sonnig", icon: "sun" },
    ]
  },
  "Köln": {
    city: "Köln",
    temp: 20,
    condition: "Bewölkt",
    icon: "cloud",
    forecast: [
      { time: "12:00", temp: 19, condition: "Bewölkt", icon: "cloud" },
      { time: "13:00", temp: 20, condition: "Bewölkt", icon: "cloud" },
      { time: "14:00", temp: 21, condition: "Leicht bewölkt", icon: "cloud" },
      { time: "15:00", temp: 20, condition: "Gewittrig", icon: "lightning" },
    ]
  }
};

export default function WeatherWidget() {
  const [activeCity, setActiveCity] = useState(() => {
    return localStorage.getItem("news_weather_city") || "Berlin";
  });
  const [weather, setWeather] = useState<WeatherInfo>(() => {
    const city = localStorage.getItem("news_weather_city") || "Berlin";
    return PRESET_WEATHER[city] || PRESET_WEATHER["Berlin"];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const fetchWeather = async (cityParam?: string, lat?: number, lon?: number) => {
    setLoading(true);
    setError(null);
    try {
      let url = "/api/weather";
      const targetCity = cityParam !== undefined ? cityParam : activeCity;
      if (lat !== undefined && lon !== undefined) {
        url += `?lat=${lat}&lon=${lon}`;
      } else {
        url += `?city=${encodeURIComponent(targetCity)}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errorMsg = errData.error || `Ort "${targetCity}" nicht gefunden.`;
        setError(errorMsg);
        return;
      }
      const data: WeatherInfo = await res.json();
      setWeather(data);
      if (data.city) {
        setActiveCity(data.city);
        localStorage.setItem("news_weather_city", data.city);
        setSearchInput("");
      }
      if (data.apiKeyMissing) {
        setError("API-Key fehlt (Demo-Modus)");
      } else if (data.apiError) {
        setError("API-Fehler (Demo-Modus)");
      }
    } catch (err: any) {
      console.error("Fehler beim Laden des Wetters:", err);
      setError("Verbindung fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  // Standorterkennung
  const detectLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolokalisierung wird nicht unterstützt.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeather(undefined, latitude, longitude);
      },
      (err) => {
        console.warn("Geolocation-Fehler:", err);
        setError("Standortzugriff verweigert.");
        setLoading(false);
      },
      { timeout: 8000 }
    );
  };

  useEffect(() => {
    fetchWeather(activeCity);
  }, []);

  // Wettersymbole zuordnen
  const getWeatherIcon = (iconName: string, className = "w-5 h-5") => {
    switch (iconName) {
      case "sun":
        return <Sun className={`${className} text-amber-500 animate-spin-slow`} />;
      case "moon":
        return <Moon className={`${className} text-indigo-300`} />;
      case "rain":
        return <CloudRain className={`${className} text-blue-400`} />;
      case "lightning":
        return <CloudLightning className={`${className} text-indigo-400`} />;
      case "snow":
        return <CloudSnow className={`${className} text-sky-300`} />;
      case "cloud":
      default:
        return <Cloud className={`${className} text-slate-400`} />;
    }
  };

  return (
    <div 
      id="weather-widget-container"
      className="bg-slate-800/50 backdrop-blur-md border border-slate-700/30 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 transition-all duration-300 shadow-lg shadow-slate-950/10 overflow-hidden"
    >
      {/* Stadt-Details */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 flex items-center justify-center border border-indigo-500/20">
          {getWeatherIcon(weather.icon, "w-8 h-8")}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display font-semibold text-white text-lg md:text-xl">
              {weather.city}
            </span>
            <button 
              id="locate-btn"
              onClick={detectLocation}
              disabled={loading}
              className="text-slate-500 hover:text-indigo-400 transition-colors p-1 rounded-md hover:bg-slate-800 cursor-pointer"
              title="Aktuellen Standort ermitteln"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Compass className="w-4 h-4" />
              )}
            </button>

            {/* Accurate Local Time Badge (2-Zeilig & platzsparend) */}
            {weather.localTime && (
              <div 
                className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-300 shrink-0"
                title={`Aktuelle Ortszeit in ${weather.city} (${weather.utcOffset || 'UTC'})`}
              >
                <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <div className="flex flex-col text-left leading-none">
                  <span className="text-[11px] font-mono font-semibold tracking-tight text-indigo-200">{weather.localTime} Uhr</span>
                  {weather.utcOffset && (
                    <span className="text-[9px] font-mono text-indigo-400/90 mt-0.5">({weather.utcOffset})</span>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400 font-sans mt-0.5">
            <span className="font-semibold text-white">{weather.temp}°C</span>
            <span>•</span>
            <span>{weather.condition}</span>
            {(weather.apiKeyMissing || weather.apiError) && (
              <>
                <span>•</span>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md font-mono font-medium tracking-wider" title="Wetterdienst im Fallback-Modus">
                  DEMO-MODUS
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stündliche Vorhersage */}
      <div className="flex-1 min-w-0 flex items-center gap-1.5 py-1 md:py-0 border-t md:border-t-0 border-slate-800/60 pt-3 md:pt-0">
        <div className="flex items-center gap-1.5 md:gap-2 flex-1 min-w-0 overflow-x-auto overflow-y-hidden scrollbar-none">
          {weather.forecast.slice(0, 4).map((fc, index) => (
            <div 
              key={index} 
              id={`forecast-hour-${index}`}
              className="flex flex-col items-center min-w-[46px] md:min-w-[50px] bg-slate-800/30 py-1 px-1.5 rounded-lg border border-slate-800/30 shrink-0"
            >
              <span className="text-[10px] text-slate-400 font-mono font-medium">
                {fc.time}
              </span>
              <div className="my-0.5">
                {getWeatherIcon(fc.icon, "w-4 h-4")}
              </div>
              <span className="text-xs font-semibold text-slate-200">
                {fc.temp}°C
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Ort-Suche */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          if (searchInput.trim()) {
            fetchWeather(searchInput.trim());
          }
        }}
        className="relative flex items-center gap-2 border-t md:border-t-0 border-slate-800/60 pt-3 md:pt-0 justify-between md:justify-end shrink-0"
      >
        {error && (
          <div className="absolute -top-7 right-0 bg-rose-950/95 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-md text-[10px] font-sans font-medium shadow-xl z-20 flex items-center gap-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
            <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
            <span>{error}</span>
            <button 
              type="button" 
              onClick={() => setError(null)}
              className="ml-1 text-rose-400 hover:text-rose-200 cursor-pointer"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        )}

        <div className="relative flex items-center flex-1 md:w-32 lg:w-36 xl:w-40">
          <MapPin className={`absolute left-2.5 w-3.5 h-3.5 ${error ? 'text-rose-400' : 'text-slate-500'}`} />
          <input 
            type="text"
            placeholder="Ort suchen..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              if (error) setError(null);
            }}
            className={`w-full bg-slate-900/80 text-xs font-sans font-medium text-slate-200 border rounded-lg pl-8 pr-7 py-1.5 focus:outline-none transition-all placeholder:text-slate-600 ${
              error 
                ? 'border-rose-500/60 focus:ring-1 focus:ring-rose-500 focus:border-rose-500 text-rose-200' 
                : 'border-slate-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500'
            }`}
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                if (error) setError(null);
              }}
              className="absolute right-2 text-slate-500 hover:text-slate-300 transition-colors p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <button 
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-lg border border-indigo-500/30 font-medium transition-all cursor-pointer flex items-center justify-center shadow-md shadow-indigo-900/10 active:scale-95"
          title="Suchen"
        >
          <Search className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
