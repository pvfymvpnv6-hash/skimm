/**
 * High-Precision Local News Classifier for Berlin & Brandenburg
 * Eliminates false positives from substring matching (e.g. "ber" in "September", "A10" in Apple A10).
 */

export interface ArticleForLocalCheck {
  title: string;
  teaser?: string;
  sourceId?: string;
  sourceName?: string;
  category?: string;
  url?: string;
  isLocal?: boolean;
}

/**
 * Sources that are inherently local to the Berlin/Brandenburg metropolitan region.
 */
const INHERENTLY_LOCAL_SOURCES = new Set([
  "rbb24",
  "polizei-brandenburg",
  "polizei_brandenburg",
  "tagesspiegel-berlin",
  "berliner-zeitung",
  "morgenpost",
  "maz",
  "pnn",
  "moz"
]);

/**
 * Pure global tech/finance sources that should NEVER be flagged as local
 * unless Berlin/Brandenburg is explicitly mentioned in the title.
 */
const GLOBAL_TECH_FINANCE_SOURCES = new Set([
  "heise",
  "golem",
  "t3n",
  "macwelt",
  "apfelpage",
  "ifun",
  "mobiflip",
  "electrive",
  "finanzen",
  "handelsblatt",
  "wiwo",
  "manager-magazin"
]);

/**
 * Strictest Word-Boundary Regex for genuine Berlin / Brandenburg geographic & institutional entities.
 * NOTE: Never match short 3-letter words like 'ber', 'a10', 'bsr' without explicit context.
 */
const LOCAL_GEO_REGEX = /\b(berlin|berliner|potsdam|potsdamer|brandenburg|brandenburger|cottbus|cottbuser|frankfurt \(oder\)|frankfurt\/oder|oranienburg|falkensee|bernau|eberswalde|königs wusterhausen|fürstenwalde|neuruppin|strausberg|schwedt|hennigsdorf|ludwigsfelde|teltow|werder \(havel\)|werder\/havel|rathenow|senftenberg|kleinmachnow|stahnsdorf|nuthetal|schönefeld|babelsberg|oberhavel|dahme-spree|oder-spree|barnim|havelland|uckermark|märkisch-oderland|prignitz|ostprignitz|spree-neisse|elbe-elster|teltow-fläming)\b/i;

const LOCAL_INSTITUTIONS_REGEX = /\b(bvg|s-bahn berlin|berliner s-bahn|flughafen ber|airport ber|berliner senat|rot-schwarz.*senat|senat von berlin|abgeordnetenhaus von berlin|brandenburger landtag|landtag brandenburg|polizei berlin|polizei brandenburg|feuerwehr berlin|feuerwehr potsdam|charité|vivantes|vbb|verkehrsverbund berlin-brandenburg|berliner stadtreinigung|märkische allgemeine|rbb)\b/i;

/**
 * Validates whether an article has genuine local relevance to Berlin/Brandenburg.
 */
export function isLegitimateLocalArticle(article: ArticleForLocalCheck): boolean {
  if (!article) return false;

  const sourceId = (article.sourceId || "").toLowerCase();
  const title = (article.title || "").trim();
  const teaser = (article.teaser || "").trim();
  const category = (article.category || "").toLowerCase();
  const textToScan = `${title} ${teaser}`;

  // 1. If it comes from an inherently local source (e.g. rbb24, Polizei Brandenburg), it is local
  if (INHERENTLY_LOCAL_SOURCES.has(sourceId)) {
    return true;
  }

  // 2. If it is a global tech/finance publication:
  // ONLY flag as local if Berlin/Potsdam/Brandenburg is explicitly in the TITLE.
  if (GLOBAL_TECH_FINANCE_SOURCES.has(sourceId) || category === "technologie" || category === "tech") {
    return /\b(berlin|potsdam|brandenburg|bvg|flughafen ber|charité)\b/i.test(title);
  }

  // 3. Title check has highest priority for general news
  if (LOCAL_GEO_REGEX.test(title) || LOCAL_INSTITUTIONS_REGEX.test(title)) {
    return true;
  }

  // 4. Teaser check: Only count if combined with local context (avoid single passing mention)
  if (LOCAL_GEO_REGEX.test(teaser) || LOCAL_INSTITUTIONS_REGEX.test(teaser)) {
    // Negative guard: Ignore if it's international politics or global sports
    if (/\b(us-wahl|white house|pentagon|kreml|peking|tokio|bundesliga-spieltag|champions league)\b/i.test(title)) {
      return false;
    }
    return true;
  }

  return false;
}
