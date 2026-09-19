/**
 * Article Identity & Canonical Normalization Utilities
 * Ensures deterministic article IDs, canonical URL normalization,
 * and robust deduplication across backend and frontend.
 */

/**
 * Strips tracking parameters, query strings, hashes, and protocol nuances
 * to create a stable, canonical URL representation for deduplication.
 */
export function cleanCanonicalUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  try {
    let url = rawUrl.trim();
    // Normalize protocol
    if (url.startsWith("//")) url = "https:" + url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) return url.toLowerCase();

    const parsed = new URL(url);
    // Remove trailing slashes from pathname
    let pathname = parsed.pathname.replace(/\/+$/, "");
    if (!pathname) pathname = "/";

    // Clean tracking query parameters (UTM, ref, fbclid, etc.)
    const trackingParams = new Set([
      "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
      "ref", "source", "fbclid", "gclid", "zanpid", "wt_mc", "wt_zmc",
      "pk_campaign", "pk_kwd", "at_medium", "at_campaign"
    ]);

    const remainingParams = new URLSearchParams();
    parsed.searchParams.forEach((val, key) => {
      const lowerKey = key.toLowerCase();
      if (!trackingParams.has(lowerKey) && !lowerKey.startsWith("utm_")) {
        remainingParams.append(key, val);
      }
    });

    const queryString = remainingParams.toString();
    return `${parsed.hostname.toLowerCase()}${pathname}${queryString ? `?${queryString}` : ""}`;
  } catch (e) {
    // Fallback: simple string replacement
    return rawUrl
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/[?#].*$/, "")
      .replace(/\/+$/, "")
      .trim();
  }
}

/**
 * Normalizes an article title for duplicate detection.
 * Removes extra whitespace, common publisher suffixes (e.g., "| SPIEGEL", "- mobiFlip").
 */
export function normalizeTitleFingerprint(rawTitle: string): string {
  if (!rawTitle || typeof rawTitle !== "string") return "";
  return rawTitle
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/[\u2018\u2019\u201C\u201D"']/g, "")
    .replace(/\s*[-–—|•].*$/, "") // Remove publisher suffixes
    .replace(/[^\p{L}\p{N}\s]/gu, " ") // Keep only letters, digits, spaces
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fast 32-bit FNV-1a non-cryptographic hash for deterministic string identifiers.
 */
export function fnv1aHash(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(36);
}

/**
 * Generates a completely stable, deterministic article ID based on source, canonical URL, and title.
 */
export function generateDeterministicArticleId(sourceId: string, url: string, title: string): string {
  const canonicalUrl = cleanCanonicalUrl(url);
  const titleNorm = normalizeTitleFingerprint(title);
  const seed = `${sourceId}::${canonicalUrl || titleNorm}`;
  const hash = fnv1aHash(seed);
  return `art-${sourceId}-${hash}`;
}
