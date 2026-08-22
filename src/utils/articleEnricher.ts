import { Article } from "../types";

const LOCAL_KEYWORDS = [
  "berlin", "potsdam", "brandenburg", "cottbus", "bsr", "havel", "spree",
  "s-bahn", "a10", "a115", "vbb", "schönefeld", "ber", "oder-spree",
  "dahme", "oberhavel", "teltow", "märkisch", "nuthetal", "babelsberg",
  "werder", "kleinmachnow", "stahnsdorf", "strausberg", "bernau"
];

const POSITIVE_KEYWORDS = [
  "rekord", "erfolg", "gewinn", "durchbruch", "hoffnung", "innovation",
  "lösung", "chancen", "investition", "wachstum", "förderung", "plus",
  "rettung", "vorteil", "rekordhoch", "sieger", "preisverleihung", "aufschwung"
];

const CRITICAL_KEYWORDS = [
  "krise", "warnung", "streik", "insolvenz", "gefahr", "verlust", "kritik",
  "unfall", "schaden", "stau", "risiko", "rückgang", "stopp", "sorge",
  "konkurs", "verspätung", "problem", "skandal", "drohung", "kürzung"
];

export function enrichArticle(article: Article): Article {
  const textToScan = `${article.title} ${article.teaser} ${article.sourceName}`.toLowerCase();

  // 1. Detect Local Status
  const isLocal = article.isLocal ?? LOCAL_KEYWORDS.some(kw => textToScan.includes(kw));

  // 2. Sentiment Analysis
  let sentiment: "positive" | "neutral" | "critical" = article.sentiment || "neutral";
  if (!article.sentiment) {
    const posScore = POSITIVE_KEYWORDS.filter(kw => textToScan.includes(kw)).length;
    const critScore = CRITICAL_KEYWORDS.filter(kw => textToScan.includes(kw)).length;
    if (posScore > critScore) {
      sentiment = "positive";
    } else if (critScore > posScore) {
      sentiment = "critical";
    }
  }

  // 3. Generate 3 Bulletpoints for TL;DR Hover
  let summaryBullets = article.summaryBullets;
  if (!summaryBullets || summaryBullets.length === 0) {
    // Split teaser into sentences or craft 3 logical bullets
    const cleanTeaser = article.teaser.replace(/<[^>]*>/g, "");
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
