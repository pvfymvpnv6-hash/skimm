/**
 * Utility function to strip all emojis and symbol prefixes from strings.
 * Ensures strict B2B executive style without icon prefixes.
 */
export function stripEmojis(text: string): string {
  if (!text) return "";
  return text
    // Comprehensive Unicode emoji / symbol range
    .replace(/[\u{1F300}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F004}\u{1F0CF}\u{2B50}\u{2B55}\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, "")
    // Strip leading punctuation or bullet leftovers after emoji removal
    .replace(/^[\s•\-–—:;,\/|>]+/g, "")
    .trim();
}
