/**
 * Robust Category Classifier & Breaking News Gatekeeper
 * Ensures strict semantic boundaries between Politics, Economy, Tech, Culture/Gossip, and Sports.
 */

export interface ArticleInputForClassification {
  title: string;
  teaser?: string;
  content?: string;
  url?: string;
  sourceId?: string;
  pubDate?: string | Date;
  rawCategories?: string[];
}

/**
 * 1. Geopolitics, Military, International Security & War
 * MUST ALWAYS be "Politik" with HIGHEST PRIORITY (overriding economy/culture/source defaults).
 */
const GEOPOLITICS_MILITARY_REGEX = /\b(ukraine-krieg|ukrainekrieg|russland-ukraine|us-militär|militärflugzeug|militärmaschine|globemaster|us air force|luftwaffe|kriegsgebiet|kriegsschiff|flugzeugträger|panzer|leopard 2|abrams|himars|raketenangriff|drohnenangriff|marschflugkörper|luftangriff|frontverlauf|kreml|pentagon|weißes haus|weisses haus|moskau|kiew|taipeh|peking|teheran|gaza|nahost-konflikt|nahostkonflikt|hisbollah|hamas|israelische armee|idf|generalstab|verteidigungsministerium|verteidigungsminister|boris pistorius|lloyd austin|pete hegseth|nato-gipfel|nato-bündnis|sicherheitsrat|un-sicherheitsrat|atomwaffen|nuklear|spionage|sabotage|geheimdienst|cia|bnd|mossad|fsb|truppen|soldaten|streitkräfte|bundeswehr|rüstungsindustrie|waffenlieferung|waffenlieferungen|sanktionen gegen russland|völkerrecht|kriegsverbrechen|waffenstillstand|friedensverhandlungen)\b/i;

/**
 * 2. Pure Politics Patterns (National & International)
 */
const POLITICS_REGEX = /\b(politik|politiker|politikerin|bundesregierung|bundestag|bundesrat|bundeskanzler|bundeskanzlerin|olaf scholz|friedrich merz|robert habeck|annalena baerbock|christian lindner|markus söder|bundespräsident|frank-walter steinmeier|landtag|landtagswahl|bundestagswahl|europawahl|us-wahl|wahlkampf|wahlergebnis|umfrage|infratest|forsa|cdu|csu|spd|grüne|bündnis 90|fdp|afd|bsw|sahra wagenknecht|die linke|gesetzentwurf|gesetzgebung|parlament|minister|ministerium|haushaltsausschuss|haushaltsstreit|bundesverfassungsgericht|verfassungsgericht|eu-kommission|europaparlament|ursula von der leyen|diplomatie|staatsbesuch|abkommen|staatsvertrag|asylpolitik|migrationspolitik|innenpolitik|außenpolitik|aussenpolitik)\b/i;

/**
 * 3. Technology & Autonomous Systems Patterns
 * (Schlägt Politik-Defaults bei Themen wie Robotaxis, KI, Apple, Google, Chips)
 */
const TECH_REGEX = /\b(robotaxi|robotaxis|waymo|cruise|zoox|selbstfahrend|selbstfahrende|autonomes fahren|autonome autos|künstliche intelligenz|ki-start|ki-modell|sprachmodell|llm|software|hardware|computer|tech|technologie|digital|digitalisierung|smartphone|smartphones|iphone|ipad|macbook|mac mini|mac studio|apple watch|android|samsung galaxy|pixel 9|pixel 8|roboter|robotik|quantencomputer|cybersecurity|hacker|malware|ransomware|cloud|app|apps|elektroauto|elektromobilität|e-auto|e-fahrzeug|ladestation|wallbox|akku|batterietechnologie|halbleiter|chipkrise|m6-chip|m5-chip|m5 ultra|m6 pro|nvidia|openai|chatgpt|anthropic|claude|gemini|deepmind|meta ai|microsoft copilot|google cloud|aws|intel|amd|tsmc|qualcomm|playstation|xbox|nintendo switch|home hub|smart home)\b/i;

/**
 * 4. Boulevard, Celebrity Gossip & Trash-TV Patterns
 * These must NEVER be classified as Politik, Wirtschaft, or Wissenschaft.
 */
const BOULEVARD_GOSSIP_REGEX = /\b(fans fassungslos|fassungslos:|schock-nachricht|tränen-beichte|liebes-aus|trennung|baby-news|hochzeit|dschungelcamp|promi|promis|prominente|promi-news|reality-star|reality-tv|trash-tv|gntm|gzsz|bauer sucht frau|sommerhaus der stars|bachelor|bachelorette|let's dance|hubert fella|matthias mangiapane|heidi klum|helene fischer|florian silbereisen|dieter bohlen|amira pocher|oliver pocher|cathy hummels|yeliz koc|dani büchner|geissens|die geissens|katzenberger|daniela katzenberger|lombardi|pietro lombardi|sarah engels|iris klein|peter klein|walentina doronina|laura müller|michael wendler|royals|prinz harry|meghan markle|könig charles|kate middleton|prinz william|königshaus|influencer|influencerin|tiktok-star|instagram-story|onlyfans|playboy|nacktfoto|nackt-foto|sexy foto|bikinifoto|untreue|affäre|ehe-aus|fremdgehen|schlagerstar|trash tv|tv-star|serien-star|hollywood-star|schauspielerin|schauspieler|moderatorin|moderator|tierschutz-hund|tierschutzhund|haustier|hund abgegeben)\b/i;

/**
 * 5. Sports Patterns
 */
const SPORTS_REGEX = /\b(fussball|fußball|bundesliga|2\. bundesliga|champions league|europa league|conference league|dfb-pokal|dfb|nationalelf|nationalmannschaft|fc bayern|bayern münchen|bvb|borussia dortmund|bayer leverkusen|rb leipzig|eintracht frankfurt|vfb stuttgart|vfl wolfsburg|werder bremen|borussia mönchengladbach|schalke 04|1\. fc köln|hsv|hertha bsc|1\. fc union berlin|st\. pauli|real madrid|fc barcelona|manchester city|manchester united|liverpool fc|psg|palhinha|harry kane|musiala|thomas müller|manuel neuer|leroy sané|serge gnabry|joshua kimmich|vincent kompany|thomas tuchel|julian nagelsmann|jürgen klopp|mbappé|messi|ronaldo|haaland|bellingham|xabi alonso|uli hoeneß|max eberl|formel 1|formel1|f1|grand prix|tennis|wimbledon|us open|australian open|french open|roland garros|basketball|nba|eishockey|del|handball|nfl|super bowl|olympia|olympische spiele|wintersport|skispringen|biathlon|radsport|tour de france|darts|spieltag|tore|torwart|stürmer|startelf|tabellenführer|tabellenplatz|abstiegskampf|elfmeter|schiedsrichter|cheftrainer|transfer|transfermarkt|ablösesumme|neuzugang)\b/i;

/**
 * 6. Economy & Finance Patterns
 */
const ECONOMY_REGEX = /\b(wirtschaft|finanz|finanzen|börse|aktie|aktien|dax|dow jones|nasdaq|s&p 500|euro stoxx|inflation|teuerung|leitzins|zinsen|ezb|fed|notenbank|währung|wechselkurs|bruttoinlandsprodukt|bip|konjunktur|rezession|arbeitsmarkt|arbeitslosenquote|unternehmen|konzern|insolvenz|pleite|quartalszahlen|bilanz|umsatz|gewinnwarnung|aktienkurs|investition|übernahme|fusion|kartellamt|wall street|rohstoffe|ölpreis|gaspreis|goldpreis|immobilienpreise|mietpreise)\b/i;

/**
 * 7. Science & Knowledge Patterns
 */
const SCIENCE_REGEX = /\b(wissenschaft|forschung|forscher|forscherteam|studie|studien|medizin|mediziner|impfstoff|therapie|krebsforschung|universum|astronomie|weltall|kosmos|teleskop|james webb|hubble|nasa|esa|planet|galaxie|mars-rover|schwarzes loch|biologie|physik|quantenphysik|chemie|klimaforschung|klimawandel|ozeane|artensterben|archäologie|ausgrabung|fossil|genetik)\b/i;

/**
 * 8. Blaulicht Patterns
 */
const BLAULICHT_REGEX = /\b(blaulicht|polizei|polizeimeldung|feuerwehr|großbrand|brandstiftung|verkehrsunfall|tödlicher unfall|schwerer unfall|mord|totschlag|festnahme|razzia|zeugenaufruf|vermisst|fahndung|messerangriff|schießerei|einbruch|raubüberfall|ermittlungsverfahren|haftbefehl|staatsanwaltschaft ermittelt)\b/i;

/**
 * Determines if an article is a sports article based on content, URL, and metadata.
 */
export function isSportArticle(title: string, content: string = "", url: string = "", category: string = ""): boolean {
  const text = `${title || ""} ${content || ""}`.toLowerCase();
  const rawUrl = (url || "").toLowerCase();
  const cat = (category || "").toLowerCase();

  if (cat.includes("sport") || cat.includes("fussball") || cat.includes("fußball") || cat.includes("bundesliga")) {
    return true;
  }

  if (
    rawUrl.includes("/sport/") ||
    rawUrl.includes("/sports/") ||
    rawUrl.includes("/fussball/") ||
    rawUrl.includes("/fußball/") ||
    rawUrl.includes("/bundesliga/") ||
    rawUrl.includes("/champions-league/") ||
    rawUrl.includes("/formel1/") ||
    rawUrl.includes("/f1/") ||
    rawUrl.includes("/tennis/") ||
    rawUrl.includes("kicker.de") ||
    rawUrl.includes("sport1.de") ||
    rawUrl.includes("transfermarkt.de")
  ) {
    return true;
  }

  return SPORTS_REGEX.test(text);
}

/**
 * Classifies an article into one of the established app topics:
 * - "Politik"
 * - "Wirtschaft"
 * - "Technologie"
 * - "Wissen"
 * - "Kultur & Gesellschaft"
 * - "Blaulicht"
 * - "Sport"
 */
export function classifyArticleCategory(
  title: string,
  content: string = "",
  url: string = "",
  defaultCat: string = "Politik"
): string {
  const combinedText = `${title || ""} ${content || ""}`.trim();
  const lowerTitle = (title || "").toLowerCase();
  const rawUrl = (url || "").toLowerCase();

  // 1. HIGHEST PRIORITY: Geopolitics, Military, War & International Crises
  // Must be "Politik" regardless of publishing domain (e.g. Handelsblatt or t-online)
  if (GEOPOLITICS_MILITARY_REGEX.test(combinedText)) {
    return "Politik";
  }

  // 2. Sport check
  if (isSportArticle(title, content, url, defaultCat)) {
    return "Sport";
  }

  // 3. Blaulicht check
  if (rawUrl.includes("polizei") || BLAULICHT_REGEX.test(combinedText)) {
    return "Blaulicht";
  }

  // 4. Technology & Autonomous systems (e.g. Robotaxis in München, Apple M6, ChatGPT)
  // Higher priority than standard Economy/Politics regex so Robotaxis aren't hijacked by "EU" or "München"
  if (
    TECH_REGEX.test(combinedText) ||
    rawUrl.includes("golem.de") ||
    rawUrl.includes("heise.de") ||
    rawUrl.includes("t3n.de") ||
    rawUrl.includes("macwelt.de") ||
    rawUrl.includes("ifun.de") ||
    rawUrl.includes("apfelpage.de") ||
    rawUrl.includes("mobiflip.de") ||
    rawUrl.includes("electrive.net")
  ) {
    // Negative override: if it's explicitly about government digital regulation / antitrust laws
    if (/\b(kartellamt zerschlägt|eu-kartellstrafe|digital services act verfahren)\b/i.test(combinedText)) {
      return "Politik";
    }
    return "Technologie";
  }

  // 5. PRIORITY NEGATIVE CHECK: Boulevard, Celebrity Gossip, Trash-TV, Entertainment
  // If matched, it MUST become "Kultur & Gesellschaft" and CANNOT become Politik/Wirtschaft.
  const isBoulevard = BOULEVARD_GOSSIP_REGEX.test(combinedText);
  if (isBoulevard) {
    return "Kultur & Gesellschaft";
  }

  // 6. Science & Knowledge
  if (
    SCIENCE_REGEX.test(combinedText) ||
    rawUrl.includes("spektrum.de") ||
    rawUrl.includes("nationalgeographic.de") ||
    rawUrl.includes("scinexx.de")
  ) {
    return "Wissen";
  }

  // 7. Economy & Finance
  if (
    ECONOMY_REGEX.test(combinedText) ||
    rawUrl.includes("finanzen.net") ||
    rawUrl.includes("manager-magazin.de") ||
    rawUrl.includes("wiwo.de") ||
    (rawUrl.includes("handelsblatt.com") && !POLITICS_REGEX.test(combinedText))
  ) {
    return "Wirtschaft";
  }

  // 8. General Politics
  if (POLITICS_REGEX.test(combinedText)) {
    return "Politik";
  }

  // 9. General Culture & Society
  if (/\b(kultur|kino|film|filme|musik|album|song|konzert|theater|oper|literatur|buch|bestseller|ausstellung|museum|festival)\b/i.test(combinedText)) {
    return "Kultur & Gesellschaft";
  }

  // 10. Intelligent Fallback for Generic Portals (t-online, Focus, Merkur, etc.)
  // If title indicates world events, security or government -> Politik
  if (/\b(krieg|angriff|flugzeug|mission|diplomaten|botschaft|vertrag|senat|regierung|minister|wahl|grenze)\b/i.test(lowerTitle)) {
    return "Politik";
  }

  return defaultCat || "Politik";
}

/**
 * Strict Breaking News Gatekeeper
 * Restricts isBreaking to true only if:
 * 1. Published recently (< 180 minutes)
 * 2. Has high-authority journalistic source
 * 3. Contains explicit breaking signal prefix
 * 4. Is NOT sport, boulevard, commercial, or regular scheduled live-ticker
 */
export function isLegitimateBreakingNews(
  title: string,
  teaser: string = "",
  sourceId: string = "",
  pubDateStr?: string | Date
): boolean {
  const normTitle = (title || "").trim();
  const lowerTitle = normTitle.toLowerCase();
  const lowerTeaser = (teaser || "").toLowerCase();
  const text = `${lowerTitle} ${lowerTeaser}`;

  // 1. Hard veto for Boulevard, Gossip, Commercial, Trash
  if (BOULEVARD_GOSSIP_REGEX.test(text)) return false;
  if (SPORTS_REGEX.test(text)) return false;
  if (/\b(anzeige|werbung|sponsoring|sponsored|deal|angebot|rabatt|schnäppchen|gutschein|gewinnspiel)\b/i.test(text)) return false;

  // 2. Veto routine scheduled live-tickers (e.g. "Liveticker zum Krieg", "Pressekonferenz im Liveticker")
  if (/\b(liveticker|live-ticker|ticker:|live-blog|liveblog)\b/i.test(lowerTitle) && !lowerTitle.includes("eilmeldung")) {
    return false;
  }

  // 3. Time decay check: must be published within the last 3 hours (180 mins)
  if (pubDateStr) {
    try {
      const pubTime = new Date(pubDateStr).getTime();
      const now = Date.now();
      if (!isNaN(pubTime)) {
        const ageInMinutes = (now - pubTime) / (60 * 1000);
        if (ageInMinutes > 180) {
          return false; // Expired breaking news
        }
      }
    } catch (e) {}
  }

  // 4. Source credibility filter for breaking news pushes
  const allowedBreakingSources = new Set([
    "tagesschau", "spiegel", "ntv", "zeit", "welt", "faz", "handelsblatt", "dpa", "reuters", "rbb24"
  ]);

  if (sourceId && !allowedBreakingSources.has(sourceId.toLowerCase())) {
    return false;
  }

  // 5. Explicit breaking news signal syntax required
  const explicitBreakingSyntax =
    normTitle.startsWith("+++") ||
    /^\s*(eilmeldung|eil:|breaking news|breaking:)/i.test(normTitle) ||
    lowerTitle.includes("+++ eilmeldung") ||
    lowerTitle.includes("+++ eil +++") ||
    lowerTitle.includes("eilmeldung:") ||
    lowerTitle.includes("eil:");

  return explicitBreakingSyntax;
}
