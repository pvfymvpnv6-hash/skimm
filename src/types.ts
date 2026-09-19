/**
 * Types and interfaces for the News Application.
 */

export interface Article {
  id: string;
  title: string;
  teaser: string;
  content: string; // Detail reading view content
  category: string; // e.g. "Tech", "Science", "Business", "Design", "Culture"
  sourceId: string;
  sourceName: string;
  url: string;
  imageUrl: string;
  publishedAt: string;
  readingTime: string; // e.g. "4 min read"
  isTrending?: boolean;
  isBreaking?: boolean;
  isRead?: boolean;
  isPrioritized?: boolean;
  isLocal?: boolean;
  location?: string;
  originalDistrict?: string;
  sentiment?: "positive" | "neutral" | "critical";
  summaryBullets?: string[];
}

export interface ForecastHour {
  time: string;
  temp: number;
  condition: string;
  icon: string;
}

export interface WeatherInfo {
  city: string;
  temp: number;
  condition: string;
  icon: string;
  forecast: ForecastHour[];
  apiKeyMissing?: boolean;
  apiError?: boolean;
  localTime?: string;
  timezone?: string;
  utcOffset?: string;
  isDay?: boolean;
}

export interface TopicConfig {
  id: string;
  name: string;
  enabled: boolean;
}

export interface SourceConfig {
  id: string;
  name: string;
  domain: string;
  category?: string;
  enabled: boolean;
  isCustom?: boolean;
  weight?: number; // 1 = Weniger, 2 = Standard, 3 = Mehr
}

export interface StockInfo {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  currency: string;
  sparkline: number[];
  isSimulated?: boolean;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
  prevClose?: number;
  timestamps?: number[];
}

export interface StockPriceAlert {
  id: string;
  symbol: string;
  name: string;
  targetPrice: number;
  condition: "above" | "below";
  currency: string;
  createdAt: number;
  triggered: boolean;
  triggeredAt?: number;
}

export interface BriefingTopic {
  title: string;
  teaser: string;
  bullets: string[];
  articleId?: string;
  articleIndex?: number;
  sourceName?: string;
  articleUrl?: string;
  imageUrl?: string;
  sentiment?: "positive" | "neutral" | "negative" | "urgent";
  impact?: "high" | "medium" | "low";
}

export interface BriefingData {
  summary: string;
  sentimentText?: string;
  takeaway?: string;
  topics: BriefingTopic[];
  isOffline?: boolean;
  isFallback?: boolean;
}
