import { Article } from "../types";
import { isLegitimateLocalArticle } from "./localNewsClassifier";

const POSITIVE_KEYWORDS = [
  "rekord", "erfolg", "gewinn", "durchbruch", "hoffnung", "innovation",
  "lösung", "chancen", "förderung", "plus", "rettung", "vorteil",
  "rekordhoch", "sieger", "preisverleihung", "aufschwung", "überraschungserfolg"
];

const CRITICAL_KEYWORDS = [
  "krise", "warnung", "streik", "insolvenz", "gefahr", "verlust", "kritik",
  "unfall", "schaden", "stau", "risiko", "rückgang", "stopp", "sorge",
  "konkurs", "verspätung", "problem", "skandal", "drohung", "kürzung",
  "krieg", "militär", "angriff", "rakete", "raketen", "drohne", "drohnen",
  "tod", "tote", "verletzte", "sabotage", "spionage", "eskalation",
  "absturz", "anschlag", "terror", "schüsse", "festnahme", "razzia"
];

/**
 * Hard Crisis & Conflict Veto Regex
 * Under NO CIRCUMSTANCES should military escalation, warfare, violence, casualties or disasters receive a "positive" sentiment badge.
 */
const CONFLICT_DISASTER_VETO_REGEX = /\b(krieg|ukraine-krieg|militär|militärflugzeug|militärmaschine|angriff|raketenangriff|drohnenangriff|frontverlauf|luftschlag|bomben|granaten|panzer|sabotage|spionage|kreml|pentagon|moskau|kiew|gaza|nahost|hisbollah|hamas|israelische armee|idf|truppen|soldaten|tote|getötet|verletzte|opfer|leiche|bluttat|mord|anschlag|terror|flugzeugabsturz|havarie|schiffsunglück|insolvenz|massenentlassung|rezession)\b/i;

export function enrichArticle(article: Article): Article {
  const textToScan = `${article.title} ${article.teaser} ${article.sourceName}`.toLowerCase();

  // 1. Detect Local Status with High Precision Gatekeeper
  const isLocal = isLegitimateLocalArticle({
    title: article.title,
    teaser: article.teaser,
    sourceId: article.sourceId,
    sourceName: article.sourceName,
    category: article.category,
    url: article.url
  });

  // 2. Sentiment Analysis with Crisis & Geopolitics Shield
  let sentiment: "positive" | "neutral" | "critical" = article.sentiment || "neutral";
  
  const isCrisisOrConflict = CONFLICT_DISASTER_VETO_REGEX.test(textToScan);

  if (!article.sentiment || (article.sentiment === "positive" && isCrisisOrConflict)) {
    if (isCrisisOrConflict) {
      // Hard cap: conflict/war/disasters can NEVER be positive
      const critScore = CRITICAL_KEYWORDS.filter(kw => textToScan.includes(kw)).length;
      sentiment = critScore > 0 ? "critical" : "neutral";
    } else {
      const posScore = POSITIVE_KEYWORDS.filter(kw => textToScan.includes(kw)).length;
      const critScore = CRITICAL_KEYWORDS.filter(kw => textToScan.includes(kw)).length;
      if (posScore > critScore) {
        sentiment = "positive";
      } else if (critScore > posScore) {
        sentiment = "critical";
      } else {
        sentiment = "neutral";
      }
    }
  }

  // 3. Generate 3 Bulletpoints for TL;DR Hover
  let summaryBullets = article.summaryBullets;
  if (!summaryBullets || summaryBullets.length === 0) {
    const cleanTeaser = (article.teaser || "").replace(/<[^>]*>/g, "");
    const rawSentences = cleanTeaser
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 10);

    if (rawSentences.length >= 3) {
      summaryBullets = rawSentences.slice(0, 3);
    } else if (rawSentences.length === 2) {
      summaryBullets = [
        rawSentences[0],
        rawSentences[1],
        `Relevante Entwicklungen nach Berichten von ${article.sourceName}.`
      ];
    } else if (rawSentences.length === 1) {
      summaryBullets = [
        rawSentences[0],
        `Meldung veröffentlicht von ${article.sourceName} (${article.publishedAt}).`,
        `Kategorie ${article.category} mit geschätzter Lesezeit von ${article.readingTime}.`
      ];
    } else {
      summaryBullets = [
        article.title,
        `Kompakte Berichterstattung aus dem Bereich ${article.category}.`,
        `Alle Details und Analysen direkt auf ${article.sourceName}.`
      ];
    }
  }

  return {
    ...article,
    isLocal,
    sentiment,
    summaryBullets
  };
}
