import { Article, SourceConfig } from "../types";

export function getHashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

export function getBespokeArticle(source: SourceConfig, index: number): Article | null {
  const nameLower = source.name.toLowerCase();
  const domainLower = source.domain.toLowerCase();

  // 1. t3n
  if (nameLower.includes("t3n") || domainLower.includes("t3n.de")) {
    return {
      id: `synth-${source.id}-t3n-bespoke`,
      title: "Künstliche Intelligenz im Redaktionsalltag: Wie Newsrooms produktive KI-Agenten nutzen",
      teaser: "Vom reinen Textentwurf bis zur automatisierten Recherche-Assistenz: t3n zeigt exklusiv, wie moderne deutsche Redaktionen KI-Modelle tief in ihre redaktionellen Workflows integrieren.",
      content: `
        <p class="mb-4 font-semibold text-lg leading-relaxed text-slate-800 dark:text-slate-100">Hannover/Berlin. Künstliche Intelligenz ist längst aus der Experimentierphase heraus. Wie Recherchen von <strong>t3n</strong> zeigen, arbeiten führende Newsrooms bereits mit maßgeschneiderten KI-Agenten.</p>
        <p class="mb-4 text-slate-650 dark:text-slate-300">Diese intelligenten Helfer entwerfen nicht einfach nur automatisierte Meldungen. Sie unterstützen Redakteurinnen und Redakteure bei der Auswertung komplexer Datenberge, prüfen Fakten in Echtzeit gegen verifizierte Datenbanken und schlagen optimierte Teaser-Texte für verschiedene Social-Media-Kanäle vor. Dabei bleibt der Mensch stets die finale Kontrollinstanz.</p>
        <blockquote class="border-l-4 border-indigo-500 pl-4 my-6 italic text-gray-700 dark:text-gray-300">
          "Wir sehen KI nicht als Ersatz für Journalisten, sondern als kognitives Exoskelett. Sie befreit uns von zeitraubender Routinearbeit."
        </blockquote>
        <p class="mb-4 text-slate-650 dark:text-slate-300">Experten betonen jedoch auch die Risiken: Ohne strenge Qualitätsrichtlinien und eine transparente Kennzeichnung droht ein Vertrauensverlust bei den Lesern. t3n beleuchtet die spannendsten Best Practices deutscher Verlage und zeigt, worauf es beim Einsatz ankommt.</p>
      `,
      category: "Technologie",
      sourceId: source.id,
      sourceName: source.name,
      url: `https://t3n.de/news/`,
      imageUrl: "",
      publishedAt: "Vor 12 Min.",
      readingTime: "4 Min. Lesezeit",
      isTrending: true,
    };
  }

  // 2. ntv
  if (nameLower.includes("ntv") || nameLower.includes("n-tv") || domainLower.includes("n-tv.de")) {
    return {
      id: `synth-${source.id}-ntv-bespoke`,
      title: "Zinswende im Euroraum: EZB signalisiert weitere Zinsschritte im kommenden Herbst",
      teaser: "Die Europäische Zentralbank reagiert auf die rückläufige Inflation und bereitet den Markt auf geldpolitische Lockerungen vor. ntv analysiert die Folgen für Häuslebauer und Anleger.",
      content: `
        <p class="mb-4 font-semibold text-lg leading-relaxed text-slate-800 dark:text-slate-100">Frankfurt am Main. Die Zinswende im Euroraum nimmt weiter an Fahrt auf. Wie aus Notenbankkreisen verlautet, signalisiert die EZB zusätzliche Zinssenkungen im Herbst.</p>
        <p class="mb-4 text-slate-650 dark:text-slate-300">Grund hierfür ist die sich spürbar abschwächende Inflationsrate, die sich dem strategischen Zwei-Prozent-Ziel der Währungshüter nähert. Die Erleichterung am Markt is groß: Insbesondere die kriselnde Baukonjunktur erhofft sich durch sinkende Finanzierungskosten neue Impulse.</p>
        <blockquote class="border-l-4 border-emerald-500 pl-4 my-6 italic text-gray-700 dark:text-gray-300">
          "Die Richtung stimmt. Doch die EZB agiert mit maximaler Vorsicht, um ein verfrühtes Aufflammen der Preisspirale unter allen Umständen zu verhindern."
        </blockquote>
        <p class="mb-4 text-slate-650 dark:text-slate-300">Sparer müssen sich im Gegenzug auf sinkende Renditen bei Tages- und Festgeldern einstellen. ntv-Finanzexperten raten Anlegern, sich frühzeitig über alternative Veranlagungen zu informieren, um den Realwert ihres Vermögens zu sichern.</p>
      `,
      category: "Wirtschaft",
      sourceId: source.id,
      sourceName: source.name,
      url: `https://www.n-tv.de/wirtschaft/`,
      imageUrl: "",
      publishedAt: "Vor 25 Min.",
      readingTime: "5 Min. Lesezeit",
      isTrending: false,
    };
  }

  // 3. BZ Berlin
  if (nameLower.includes("bz berlin") || nameLower.includes("bz-berlin") || nameLower.includes("b.z.")) {
    return {
      id: `synth-${source.id}-bz-bespoke`,
      title: "Mega-Projekt am Alexanderplatz: So schreiten die Pläne für den neuen Kultur-Campus voran",
      teaser: "Ein neues urbanes Zentrum für Musik, Kunst und Lifestyle soll das Areal rund um den Berliner Fernsehturm beleben. Die B.Z. wirft einen Blick auf das visionäre 150-Millionen-Projekt.",
      content: `
        <p class="mb-4 font-semibold text-lg leading-relaxed text-slate-800 dark:text-slate-100">Berlin-Mitte. Ein spektakulärer Entwurf verspricht die Revitalisierung des Alexanderplatzes. Ein neuer Kultur-Campus soll Kunstschaffende, Musiker und Gastronomen anziehen.</p>
        <p class="mb-4 text-slate-650 dark:text-slate-300">Die B.Z. konnte die exklusiven Architekturpläne einsehen: Geplant sind begrünte Dachterrassen, offene Ateliers und multifunktionale Veranstaltungsräume, die im Sommer als Open-Air-Bühnen genutzt werden können. Das Ziel ist es, den Platz wieder zu einem lebendigen Treffpunkt für Berliner und Touristen zu machen.</p>
        <blockquote class="border-l-4 border-rose-500 pl-4 my-6 italic text-gray-700 dark:text-gray-300">
          "Wir wollen keinen sterilen Konsumtempel, sondern einen lebendigen Ort der Begegnung und Kreativität mitten im Herzen Berlins."
        </blockquote>
        <p class="mb-4 text-slate-650 dark:text-slate-300">Die Reaktionen aus der Bezirkspolitik sind gemischt. Während Befürworter von einer historischen Chance sprechen, mahnen Kritiker Lärmschutzkonzepte und den Erhalt preiswerter Gewerbeflächen an. Die Bauarbeiten sollen bereits Ende des Jahres beginnen.</p>
      `,
      category: "Kultur & Gesellschaft",
      sourceId: source.id,
      sourceName: source.name,
      url: `https://www.bz-berlin.de/`,
      imageUrl: "",
      publishedAt: "Gerade eben",
      readingTime: "3 Min. Lesezeit",
      isTrending: true,
    };
  }

  // 4. Bild
  if (nameLower.includes("bild") || domainLower.includes("bild.de")) {
    return {
      id: `synth-${source.id}-bild-bespoke`,
      title: "Münchner Raumfahrt-Startup plant erste private Mondlandung bis 2028",
      teaser: "Sensation aus Deutschland: Ein junges Luftfahrt-Unternehmen sichert sich über 200 Millionen Euro Risikokapital, um eine eigene Forschungsfähre zum Erdtrabanten zu schicken.",
      content: `
        <p class="mb-4 font-semibold text-lg leading-relaxed text-slate-800 dark:text-slate-100">München. Deutschland greift nach den Sternen! Ein einheimisches Weltraum-Startup plant eine spektakuläre Mondmission in weniger als vier Jahren.</p>
        <p class="mb-4 text-slate-650 dark:text-slate-300">Wie Recherchen zeigen, konnte das Team namhafte internationale Investoren von seinem Konzept überzeugen. Die geplante Raumsonde soll wissenschaftliche Messgeräte im Auftrag privater und staatlicher Institute auf die Mondoberfläche transportieren. Ein Schwerpunkt liegt auf der Erforschung gefrorenen Wassers in Kratern des Südpols.</p>
        <blockquote class="border-l-4 border-amber-500 pl-4 my-6 italic text-gray-700 dark:text-gray-300">
          "Die Ära des staatlichen Weltraum-Monopols ist vorbei. Deutsche Ingenieurskunst wird beweisen, dass wir im neuen Space Race ganz vorne mitspielen."
        </blockquote>
        <p class="mb-4 text-slate-650 dark:text-slate-300">Kritiker weisen auf das enorme finanzielle und technische Risiko hin: Mehr als die Hälfte aller weltweiten Mondlandungsversuche scheiterten in den letzten Jahren. Doch das Münchner Team zeigt sich optimistisch und hat bereits die ersten Triebwerkstests erfolgreich absolviert.</p>
      `,
      category: "Wissen",
      sourceId: source.id,
      sourceName: source.name,
      url: `https://www.bild.de/digital/`,
      imageUrl: "",
      publishedAt: "Gerade eben",
      readingTime: "3 Min. Lesezeit",
      isTrending: false,
    };
  }

  // 5. Welt
  if (nameLower.includes("welt") || domainLower.includes("welt.de")) {
    return {
      id: `synth-${source.id}-welt-bespoke`,
      title: "Wasserstoff-Infrastruktur im Verzug: Industrie schlägt Alarm und fordert Netzausbau",
      teaser: "Das deutsche Kernnetz für Wasserstoff kommt nur schleppend voran. Führende Industrie-Konzerne warnen vor massiven Wettbewerbsnachteilen und fordern Bürokratieabbau.",
      content: `
        <p class="mb-4 font-semibold text-lg leading-relaxed text-slate-800 dark:text-slate-100">Düsseldorf/Berlin. Die deutsche Wirtschaft blickt mit Sorge auf die schleppende Transformation der Energie-Infrastruktur.</p>
        <p class="mb-4 text-slate-650 dark:text-slate-300">Obwohl Wasserstoff als Schlüssel zur Dekarbonisierung schwerer Industriezweige gilt, fehlen konkrete Meilensteine beim Leitungsbau. Ein Bündnis aus Stahlherstellern, Chemie-Riesen und Netzbetreibern fordert nun von der Bundesregierung sofortige Genehmigungserleichterungen und verlässliche Investitionszuschüsse.</p>
        <blockquote class="border-l-4 border-indigo-500 pl-4 my-6 italic text-gray-700 dark:text-gray-300">
          "Ohne ein leistungsfähiges Wasserstoff-Kernnetz bis 2030 wandern Schlüsselindustrien ab. Wir stehen vor einer existentiellen Weichenstellung."
        </blockquote>
        <p class="mb-4 text-slate-650 dark:text-slate-300">Das Bundeswirtschaftsministerium verspricht Abhilfe und verweist auf neue Beschleunigungsgesetze. Wirtschaftsökonomen betonen jedoch, dass das Tempo auf den Baustellen entscheidend ist, um das Vertrauen des Marktes zu sichern.</p>
      `,
      category: "Wirtschaft",
      sourceId: source.id,
      sourceName: source.name,
      url: `https://www.welt.de/wirtschaft/`,
      imageUrl: "",
      publishedAt: "Vor 18 Min.",
      readingTime: "4 Min. Lesezeit",
      isTrending: true,
    };
  }

  // 6. Süddeutsche (SZ)
  if (nameLower.includes("süddeutsche") || nameLower.includes("sz ") || domainLower.includes("sueddeutsche.de") || nameLower === "sz") {
    return {
      id: `synth-${source.id}-sz-bespoke`,
      title: "Die Krise der Debatte im Digitalen: Wie Algorithmen unsere Wahrnehmung verzerren",
      teaser: "Eine neue soziologische Langzeitstudie zeigt, wie personalisierte Feeds politische Extreme fördern. Die Süddeutsche Zeitung analysiert den schwindenden Konsens.",
      content: `
        <p class="mb-4 font-semibold text-lg leading-relaxed text-slate-800 dark:text-slate-100">München. Der gesellschaftliche Diskurs wird unversöhnlicher. Schuld daran sind laut Forschern maßgeblich die Filtermechanismen großer Technologiekonzerne.</p>
        <p class="mb-4 text-slate-650 dark:text-slate-300">Die groß angelegte Studie belegt, dass Algorithmen bevorzugt emotionale und polarisierende Inhalte ausspielen, um die Verweildauer der Nutzer zu maximieren. Nuancierte, sachliche Argumente gehen in diesem Aufmerksamkeitswettbewerb systematisch unter. Dadurch erodiert das Fundament demokratischer Meinungsbildung.</p>
        <blockquote class="border-l-4 border-indigo-500 pl-4 my-6 italic text-gray-700 dark:text-gray-300">
          "Wir müssen die Funktionsweise sozialer Netzwerke als öffentliche Infrastruktur begreifen und gesetzliche Transparenzpflichten durchsetzen."
        </blockquote>
        <p class="mb-4 text-slate-650 dark:text-slate-300">Die Autoren schlagen vor, Nutzern die Kontrolle über ihre Empfehlungs-Feeds zurückzugeben und gemeinnützige, werbefreie Medienplattformen stärker zu fördern. Die Debatte um eine wirksame Regulierung dürfte im kommenden Wahljahr weiter an Brisanz gewinnen.</p>
      `,
      category: "Politik",
      sourceId: source.id,
      sourceName: source.name,
      url: `https://www.sueddeutsche.de/politik/`,
      imageUrl: "",
      publishedAt: "Vor 45 Min.",
      readingTime: "6 Min. Lesezeit",
      isTrending: false,
    };
  }

  // 7. FAZ
  if (nameLower.includes("faz") || nameLower.includes("frankfurter") || domainLower.includes("faz.net")) {
    return {
      id: `synth-${source.id}-faz-bespoke`,
      title: "VR in der Ausbildung: Wie virtuelle Realität den Fachkräftemangel bekämpfen soll",
      teaser: "Die Frankfurter Allgemeine Zeitung beleuchtet innovative Bildungskonzepte. Erste Pilotprojekte setzen auf praxisnahe Umschulungen per Virtual-Reality-Brille.",
      content: `
        <p class="mb-4 font-semibold text-lg leading-relaxed text-slate-800 dark:text-slate-100">Frankfurt. Der eklatante Mangel an qualifizierten Fachkräften zwingt deutsche Unternehmen zu radikal neuen Ausbildungsmethoden.</p>
        <p class="mb-4 text-slate-650 dark:text-slate-300">Anstatt dicke Lehrbücher zu wälzen oder auf teure Spezialmaschinen zu warten, trainieren Auszubildende im Handwerk und in der Industrie zunehmend in virtuellen Welten. Per VR-Brille können hochkomplexe Arbeitsschritte an Motoren, Industrieanlagen oder medizinischen Geräten gefahrlos und beliebig oft wiederholt werden.</p>
        <blockquote class="border-l-4 border-amber-500 pl-4 my-6 italic text-gray-700 dark:text-gray-300">
          "Die Lerneffekte sind verblüffend. VR macht Ausbildung nicht nur attraktiver für Jugendliche, sondern verkürzt die Einarbeitungszeit drastisch."
        </blockquote>
        <p class="mb-4 text-slate-650 dark:text-slate-300">Befürworter aus Industrie und Handelskammern plädieren für eine bundesweit anerkannte Integration virtueller Module in den offiziellen Lehrplan. Skeptiker betonen jedoch, dass die physische Haptik und der reale Umgang mit Werkstoffen unersetzbar bleiben.</p>
      `,
      category: "Wirtschaft",
      sourceId: source.id,
      sourceName: source.name,
      url: `https://www.faz.net/aktuell/wirtschaft/`,
      imageUrl: "",
      publishedAt: "Vor 1 Std.",
      readingTime: "5 Min. Lesezeit",
      isTrending: false,
    };
  }

  // 8. Tagesschau
  if (nameLower.includes("tagesschau") || domainLower.includes("tagesschau.de")) {
    return {
      id: `synth-${source.id}-tagesschau-bespoke`,
      title: "Bundeskabinett beschließt schärfere Gesetze zur Bekämpfung von Cyberkriminalität",
      teaser: "Mehr Befugnisse für Ermittlungsbehörden im Kampf gegen kriminelle Netzwerke im Internet: Die neuen Richtlinien sollen die nationale digitale Sicherheit massiv stärken.",
      content: `
        <p class="mb-4 font-semibold text-lg leading-relaxed text-slate-800 dark:text-slate-100">Berlin. Als Reaktion auf die rasant gestiegene Zahl von Erpressungsangriffen hat die Bundesregierung ein neues Gesetzespaket verabschiedet.</p>
        <p class="mb-4 text-slate-650 dark:text-slate-300">Die Reform gewährt Sicherheitsbehörden weitreichendere Rechte bei der Verfolgung krimineller Akteure im Darknet. Insbesondere das Einschleusen von Ermittlungs-Software auf Server im Ausland und das Einfrieren von Krypto-Wallets mutmaßlicher Täter sollen vereinfacht werden.</p>
        <blockquote class="border-l-4 border-indigo-500 pl-4 my-6 italic text-gray-700 dark:text-gray-300">
          "Wer unsere kritische Infrastruktur digital angreift, muss mit der vollen Härte und Entschlossenheit des Rechtsstaates rechnen."
        </blockquote>
        <p class="mb-4 text-slate-650 dark:text-slate-300">Datenschützer äußerten scharfe Kritik und warnten vor unverhältnismäßigen Grundrechtseingriffen und der Gefahr von 'Staatstrojanern'. Das Innenministerium betonte hingegen, dass alle Maßnahmen einer strengen richterlichen Anordnung unterliegen.</p>
      `,
      category: "Politik",
      sourceId: source.id,
      sourceName: source.name,
      url: `https://www.tagesschau.de/inland/`,
      imageUrl: "",
      publishedAt: "Vor 34 Min.",
      readingTime: "4 Min. Lesezeit",
      isTrending: true,
    };
  }

  // 9. BILD
  if (nameLower === "bild" || nameLower.includes("bild.de") || domainLower.includes("bild.de")) {
    return {
      id: `synth-${source.id}-bild-bespoke`,
      title: "Extremwetter und Alarmstufe Rot: Einsatzkräfte kämpfen gegen Sturmböen und Unwetter",
      teaser: "Großalarm für die Feuerwehren in mehreren Bundesländern: Umgestürzte Bäume, gesperrte Bahnstrecken und vollgelaufene Keller halten die Rettungskräfte in Atem.",
      content: `
        <p class="mb-4 font-semibold text-lg leading-relaxed text-slate-800 dark:text-slate-100">Dramatische Stunden für Tausende Rettungskräfte in Deutschland: Eine schwere Unwetterfront mit orkanartigen Böen und Starkregen ist über das Land hinweggefegt.</p>
        <p class="mb-4 text-slate-650 dark:text-slate-300">In mehreren Regionen musste der Zugverkehr vorübergehend komplett eingestellt werden, da Äste und Bäume auf die Oberleitungen stürzten. Anwohner meldeten überflutete Straßen und vollgelaufene Keller. Der Deutsche Wetterdienst warnt vor weiteren gefährlichen Gewitterzellen in den kommenden Nachtstunden.</p>
        <blockquote class="border-l-4 border-red-500 pl-4 my-6 italic text-gray-700 dark:text-gray-300">
          "Die Einsatzkräfte arbeiten rund um die Uhr am Limit, um Straßen freizuräumen und Menschen in Not zu sichern."
        </blockquote>
        <p class="mb-4 text-slate-650 dark:text-slate-300">BILD-Reporter vor Ort berichten von massiven Sachschäden, aber auch von vorbildlicher Nachbarschaftshilfe in den betroffenen Gemeinden.</p>
      `,
      category: "Politik",
      sourceId: source.id,
      sourceName: source.name,
      url: `https://www.bild.de/news/`,
      imageUrl: "",
      publishedAt: "Gerade eben",
      readingTime: "3 Min. Lesezeit",
      isTrending: true,
      isBreaking: true
    };
  }

  return null;
}

export const FALLBACK_ARTICLES_POOL = [
  {
    title: "Geheimnisvolle Tiefsee: Expedition entdeckt spektakuläre neue Lebensformen in 4000 Metern Tiefe",
    teaser: "In der absoluten Finsternis des Marianengrabens stießen Meeresbiologen auf unbekannte glühende Organismen, die ganz ohne Sonnenlicht gedeihen.",
    category: "Wissen",
    imageUrl: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80",
    readingTime: "5 Min. Lesezeit",
    slug: "tiefsee-expedition-neue-arten-entdeckt",
    content: `
      <p class="mb-4 font-semibold text-lg leading-relaxed text-slate-800 dark:text-slate-100">Eine Tiefsee-Expedition hat bahnbrechende biologische Funde ans Licht gebracht. In Tausenden Metern Tiefe stießen Forscher auf ein völlig autarkes Ökosystem.</p>
      <p class="mb-4 text-slate-650 dark:text-slate-300">Mithilfe modernster Tauchroboter dokumentierten die Wissenschaftler biolumineszierende Quallen, transparente Krebstiere und schwefeloxidierende Bakterien an hydrothermalen Quellen. Diese faszinierenden Organismen gewinnen ihre Energie nicht über Photosynthese, sondern durch Chemosynthese aus den heißen Gasen der Erdkruste.</p>
      <blockquote class="border-l-4 border-cyan-500 pl-4 my-6 italic text-gray-700 dark:text-gray-300">
        "Diese Entdeckungen erweitern unsere Vorstellung davon, unter welchen extremen Bedingungen Leben entstehen und florieren kann – ein Meilenstein auch für die Astrobiologie."
      </blockquote>
      <p class="mb-4 text-slate-650 dark:text-slate-300">Die gesammelten Proben sollen nun genetisch analysiert werden. Die Forscher erhoffen sich davon wichtige Impulse für die medizinische Forschung und die Entwicklung neuartiger Enzyme für den Umweltschutz.</p>
    `
  },
  {
    title: "Der Wettlauf um das autonome Fahren: Stehen wir kurz vor dem Durchbruch des Level-5-Standards?",
    teaser: "Selbstfahrende Shuttles erobern die ersten Großstädte, doch die vollständige KI-Steuerung bei widrigen Wetterbedingungen bleibt eine gigantische Herausforderung.",
    category: "Technologie",
    imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80",
    readingTime: "4 Min. Lesezeit",
    slug: "autonomes-fahren-level-5-ki-herausforderung",
    content: `
      <p class="mb-4 font-semibold text-lg leading-relaxed text-slate-800 dark:text-slate-100">Das autonome Fahren steht an einer entscheidenden Schwelle. Während Testflotten florieren, kämpfen Entwickler mit extremen Randfällen.</p>
      <p class="mb-4 text-slate-650 dark:text-slate-300">Die technischen Hürden für echtes Level-5-Fahren – also das vollkommen fahrerlose Bewegen in jeder erdenklichen Umgebung – sind massiv. Starkregen, Schneestürme und unvorhersehbares Verhalten menschlicher Verkehrsteilnehmer verlangen den verbauten KI-Systemen Höchstleistungen ab. Neue Sensorfusions-Architekturen aus Lidar, Radar und Kameras sollen nun Abhilfe schaffen.</p>
      <blockquote class="border-l-4 border-indigo-500 pl-4 my-6 italic text-gray-700 dark:text-gray-300">
        "Sicherheit hat oberste Priorität. Eine KI darf in kritischen Sekundenbruchteilen keine Fehler machen. Hier liegt die wahre Kunst der Software-Entwicklung."
      </blockquote>
      <p class="mb-4 text-slate-650 dark:text-slate-300">Gleichzeitig wächst der Druck der Regulierungsbehörden. Umfragen zeigen, dass das Vertrauen der Bevölkerung in autonome Fahrzeuge erst durch transparente Sicherheitsnachweise und klare gesetzliche Haftungsregeln wachsen wird.</p>
    `
  },
  {
    title: "Nachhaltige Investments im Aufwind: Warum grüne Anleihen historische Rekorde brechen",
    teaser: "Immer mehr Anleger lenken ihr Kapital gezielt in ökologische Projekte. Finanzökonomen analysieren, wie stabil der Trend zu 'Green Bonds' langfristig ist.",
    category: "Wirtschaft",
    imageUrl: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1200&q=80",
    readingTime: "5 Min. Lesezeit",
    slug: "green-bonds-nachhaltige-investments-rekord",
    content: `
      <p class="mb-4 font-semibold text-lg leading-relaxed text-slate-800 dark:text-slate-100">Die Finanzwelt erlebt eine grüne Revolution. Nachhaltiges Anlegen ist längst kein Nischenprodukt für Idealisten mehr.</p>
      <p class="mb-4 text-slate-650 dark:text-slate-300">Sogenannte Green Bonds, deren Emissionserlöse ausschließlich in Umwelt- und Klimaschutzprojekte fließen, verzeichnen seit Monaten Rekordzuflüsse. Sowohl institutionelle Großanleger als auch Privatanleger fordern zunehmend die Einhaltung strenger ESG-Kriterien (Environment, Social, Governance) für ihre Portfolios ein.</p>
      <blockquote class="border-l-4 border-amber-500 pl-4 my-6 italic text-gray-700 dark:text-gray-300">
        "Ökologische Nachhaltigkeit und finanzielle Rendite schließen sich nicht aus. Ganz im Gegenteil: Klimarisiken sind handfeste finanzielle Risiken."
      </blockquote>
      <p class="mb-4 text-slate-650 dark:text-slate-300">Analysten mahnen jedoch vor 'Greenwashing'. Ohne einheitliche europäische Standards und unabhängige Prüfsiegel bleibe es für Anleger schwierig, die tatsächliche ökologische Wirkung eines Finanzprodukts präzise zu bewerten.</p>
    `
  },
  {
    title: "Die Renaissance des Analogen: Warum die klassische Schallplatte die Streaming-Ära überlebt",
    teaser: "Totgesagte leben länger: Vinyl verzeichnet im Zeitalter digitaler Flatrates ungeahnte Zuwächse. Eine Spurensuche nach der Faszination des Haptischen.",
    category: "Kultur & Gesellschaft",
    imageUrl: "https://images.unsplash.com/photo-1539386115456-6218151f1585?auto=format&fit=crop&w=1200&q=80",
    readingTime: "4 Min. Lesezeit",
    slug: "vinyl-schallplatten-renaissance-analoger-sound",
    content: `
      <p class="mb-4 font-semibold text-lg leading-relaxed text-slate-800 dark:text-slate-100">In einer Welt des unbegrenzten digitalen Streamings sehnen sich immer mehr Musikliebhaber nach Entschleunigung.</p>
      <p class="mb-4 text-slate-650 dark:text-slate-300">Die Verkaufszahlen von Vinyl-Schallplatten steigen seit Jahren kontinuierlich an. Liebhaber schätzen das haptische Erlebnis des Auflegens, das bewusste Betrachten des kunstvollen Covers und den warmen, charakteristischen Klang der analogen Rille. Musik wird wieder als ganzheitliches Kunstwerk konsumiert, statt als flüchtige Hintergrundbeschallung.</p>
      <blockquote class="border-l-4 border-rose-500 pl-4 my-6 italic text-gray-700 dark:text-gray-300">
        "Vinyl ist ein Statement gegen die Beliebigkeit der Algorithmen. Es ist ein rituelles, fast meditatives Musikhören, das uns die Zeit zurückgibt."
      </blockquote>
      <p class="mb-4 text-slate-650 dark:text-slate-300">Dieser Trend belebt auch unabhängige Plattenläden und kleine Presswerke, die mit der enormen Nachfrage kaum hinterherkommen. Die Platte beweist, dass emotionale Bindung und Haptik im digitalen Kosmos unschlagbare Trümpfe bleiben.</p>
    `
  },
  {
    title: "Globale Handelsrouten im Umbruch: Wie geopolitische Krisen den Welthandel neu ordnen",
    teaser: "Unternehmen verlagern ihre Produktionsstätten vermehrt näher an ihre Heimatmärkte. Dieses 'Nearshoring' verändert Lieferketten fundamental.",
    category: "Politik",
    imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
    readingTime: "5 Min. Lesezeit",
    slug: "weltwirtschaft-lieferketten-nearshoring-geopolitik",
    content: `
      <p class="mb-4 font-semibold text-lg leading-relaxed text-slate-800 dark:text-slate-100">Die goldenen Jahrzehnte der hyperglobalisierten Just-in-time-Lieferketten neigen sich dem Ende zu.</p>
      <p class="mb-4 text-slate-650 dark:text-slate-300">Geopolitische Spannungen, Handelskriege und Klimaveränderungen zwingen multinationale Konzerne zu einem radikalen Umdenken. Um die Lieferfähigkeit auch in Krisenzeiten zu sichern, setzen immer mehr Industrieunternehmen auf Diversifizierung und 'Nearshoring' – die Verlagerung von Produktionsstätten in befreundete oder geografisch naheliegende Regionen.</p>
      <blockquote class="border-l-4 border-emerald-500 pl-4 my-6 italic text-gray-700 dark:text-gray-300">
        "Resilienz schlägt Effizienz. Unternehmen sind heute bereit, höhere Produktionskosten in Kauf zu nehmen, um das Risiko totaler Lieferausfälle zu minimieren."
      </blockquote>
      <p class="mb-4 text-slate-650 dark:text-slate-300">Diese Neuausrichtung führt zu einer schrittweisen Fragmentierung der Weltwirtschaft in regionale Handelsblöcke. Gewinner dieser Entwicklung sind Länder im östlichen Europa und in Mittelamerika, die von massiven ausländischen Direktinvestitionen profitieren.</p>
    `
  },
  {
    title: "Mars-Forschung: Hochauflösende Aufnahmen kartieren antike Wassersysteme auf dem Roten Planeten",
    teaser: "Ein fahrender Forschungsroboter liefert neue Aufnahmen von ausgetrockneten Canyons und Flusstälern. Diese weisen auf eine ehemals lebensfreundliche Umwelt hin.",
    category: "Wissen",
    imageUrl: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=1200&q=80",
    readingTime: "3 Min. Lesezeit",
    slug: "mars-rover-wasser-canyons-lebensfreundliche-umwelt",
    content: `
      <p class="mb-4 font-semibold text-lg leading-relaxed text-slate-800 dark:text-slate-100">Der Rote Planet fasziniert Geologen mit spektakulären Zeugnissen seiner feuchten Vergangenheit.</p>
      <p class="mb-4 text-slate-650 dark:text-slate-300">Aktuelle Panoramaaufnahmen und Gesteinsanalysen eines Mars-Rovers im Jezero-Krater belegen zweifelsfrei, dass dort vor Jahrmilliarden ein tiefer See existierte, der von mehreren Flüssen gespeist wurde. Sedimentstrukturen in deltaartigen Formationen deuten darauf hin, dass die Umweltbedingungen damals stabil genug für mikrobielles Leben gewesen sein könnten.</p>
      <blockquote class="border-l-4 border-cyan-500 pl-4 my-6 italic text-gray-700 dark:text-gray-300">
        "Wir untersuchen hier die ältesten erhaltenen Flussdeltas unseres Sonnensystems. Die Suche nach fossilen Biosignaturen im Marsboden geht in die heißeste Phase."
      </blockquote>
      <p class="mb-4 text-slate-650 dark:text-slate-300">Spezielle Bohrinstrumente haben bereits vielversprechende Gesteinskerne gesichert. Diese Proben sollen im Rahmen einer zukünftigen, kooperativen Raumfahrtmission zur Erde zurücktransportiert und in hochspezialisierten Laboren untersucht werden.</p>
    `
  },
  {
    title: "Verschlüsselung der Zukunft: Wie Post-Quanten-Kryptographie die Cybersicherheit retten soll",
    teaser: "Sobald Quantencomputer die nötige Rechenleistung erreichen, knacken sie heutige Verschlüsselungen mühelos. Kryptographen arbeiten an neuen Schutzwänden.",
    category: "Technologie",
    imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
    readingTime: "4 Min. Lesezeit",
    slug: "post-quanten-kryptographie-verschluesselung-ki-sicherheit",
    content: `
      <p class="mb-4 font-semibold text-lg leading-relaxed text-slate-800 dark:text-slate-100">Das digitale Fundament von Online-Banking, staatlicher Kommunikation und vertraulichen Daten ist akut bedroht.</p>
      <p class="mb-4 text-slate-650 dark:text-slate-300">Bisherige asymmetrische Verschlüsselungsverfahren wie RSA basieren auf mathematischen Problemen, die für klassische Rechner unlösbar sind. Leistungsstarke Quantencomputer werden diese Schutzmauern jedoch dank Shor-Algorithmus in Sekundenschnelle einreißen. Um diesen 'Day Zero' zu verhindern, entwickeln Forscher global standardisierte Post-Quanten-Algorithmen.</p>
      <blockquote class="border-l-4 border-indigo-500 pl-4 my-6 italic text-gray-700 dark:text-gray-300">
        "Die Migration auf quantenresistente Algorithmen ist eine der komplexesten IT-Herausforderungen der Menschheitsgeschichte. Wir müssen heute handeln, nicht morgen."
      </blockquote>
      <p class="mb-4 text-slate-650 dark:text-slate-300">Viele Unternehmen und staatliche Behörden haben bereits damit begonnen, ihre sensitiven Datenbestände schrittweise auf die neuen, gitterbasierten Krypto-Verfahren umzustellen, um auch rückwirkende Entschlüsselungen unmöglich zu machen.</p>
    `
  },
  {
    title: "Kollektives Wohnen: Wie urbane Baugenossenschaften bezahlbaren Wohnraum sichern",
    teaser: "Gemeinschaftliches Eigentum statt hoher Mieten: Innovative genossenschaftliche Wohnprojekte verbinden bezahlbare Mieten mit lebendiger Nachbarschaftspflege.",
    category: "Wirtschaft",
    imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80",
    readingTime: "4 Min. Lesezeit",
    slug: "baugenossenschaften-bezahlbarer-wohnraum-kollektives-wohnen",
    content: `
      <p class="mb-4 font-semibold text-lg leading-relaxed text-slate-800 dark:text-slate-100">In den überhitzten Ballungsräumen formiert sich kreativer Widerstand gegen explodierende Mietpreise.</p>
      <p class="mb-4 text-slate-650 dark:text-slate-300">Neue urbane Baugenossenschaften kaufen Grundstücke gemeinschaftlich, um dort dauerhaft spekulationsfreien Wohnraum zu errichten. Die Besonderheit: Den Genossenschaftsmitgliedern gehören die Wohnungen nicht individuell, sondern kollektiv. Das schützt die Immobilien vor dem Wiederverkauf auf dem freien Markt und sichert dauerhaft extrem günstige Nutzungsgebühren.</p>
      <blockquote class="border-l-4 border-amber-500 pl-4 my-6 italic text-gray-700 dark:text-gray-300">
        "Wohnen ist keine Ware, sondern ein Grundbedürfnis. Genossenschaften zeigen, dass man hochwertige Architektur mit sozialer Gerechtigkeit vereinen kann."
      </blockquote>
      <p class="mb-4 text-slate-650 dark:text-slate-300">Zudem legen diese Projekte großen Wert auf gemeinschaftliche Flächen: Integrierte Kitas, Co-Working-Spaces und Dachgärten fördern das nachbarschaftliche Miteinander und senken gleichzeitig den individuellen Ressourcenverbrauch.</p>
    `
  },
  {
    title: "Urban Gardening im großen Stil: Wie smarte Dachgärten das Mikroklima von Megastädten kühlen",
    teaser: "Grüne Oasen statt heißem Asphalt: Immer mehr Metropolen nutzen ungenutzte Flachdächer für den Gemüseanbau und senken damit die sommerlichen Hitzerekorde.",
    category: "Kultur & Gesellschaft",
    imageUrl: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=1200&q=80",
    readingTime: "3 Min. Lesezeit",
    slug: "urban-gardening-smart-roofs-stadtklima-kuehlung",
    content: `
      <p class="mb-4 font-semibold text-lg leading-relaxed text-slate-800 dark:text-slate-100">Beton und Glas speichern sommerliche Hitze und machen Großstädte zu unerträglichen Wärmeinseln.</p>
      <p class="mb-4 text-slate-650 dark:text-slate-300">Die Lösung liegt auf den Dächern: Durch systematische Bepflanzung ungenutzter Industriedächer entstehen kühlende Grünflächen. Diese dämpfen die Aufheizung der Gebäude, binden Tonnen von Feinstaub und entlasten bei Starkregen die Kanalisation durch Wasserspeicherung. Gleichzeitig ernten Anwohner frischen Salat und Gemüse direkt vor der eigenen Haustür.</p>
      <blockquote class="border-l-4 border-rose-500 pl-4 my-6 italic text-gray-700 dark:text-gray-300">
        "Jedes begrünte Dach ist eine Klimaanlage für das gesamte Viertel und ein wertvolles Biotop für bedrohte Insektenarten mitten im urbanen Raum."
      </blockquote>
      <p class="mb-4 text-slate-650 dark:text-slate-300">Stadtplaner fordern eine gesetzliche Verpflichtung zur Dachbegrünung bei Neubauten. Erste Pilotstädte fördern entsprechende Sanierungen bereits mit großzügigen steuerlichen Anreizen und verzeichnen spürbare ökologische Erfolge.</p>
    `
  },
  {
    title: "Kampf um das blaue Gold: Neue internationale Richtlinien zur Sicherung grenzüberschreitender Flüsse",
    teaser: "Wassermangel verschärft globale Konflikte. Experten fordern völkerrechtliche Abkommen für Flusssysteme, um gerechte Verteilungen zu sichern.",
    category: "Politik",
    imageUrl: "https://images.unsplash.com/photo-1468421870903-4df1664cf249?auto=format&fit=crop&w=1200&q=80",
    readingTime: "4 Min. Lesezeit",
    slug: "wasserrechte-abkommen-flusssysteme-geopolitik",
    content: `
      <p class="mb-4 font-semibold text-lg leading-relaxed text-slate-800 dark:text-slate-100">Der Klimawandel macht eine der kostbarsten Ressourcen der Erde zunehmend knapp: sauberes Süßwasser.</p>
      <p class="mb-4 text-slate-650 dark:text-slate-300">Besonders an Flüssen, die durch mehrere Staaten fließen, drohen erbitterte Verteilungskämpfe. Wenn ein Oberanlieger Staudämme zur Stromerzeugung baut, sinkt flussabwärts der Wasserstand für die Landwirtschaft der Nachbarländer. Um Kriege um Wasserrechte zu verhindern, erarbeiten Diplomaten neue völkerrechtliche Rahmenverträge.</p>
      <blockquote class="border-l-4 border-emerald-500 pl-4 my-6 italic text-gray-700 dark:text-gray-300">
        "Wasser darf nicht als geopolitische Waffe missbraucht werden. Grenzüberschreitende Flüsse verlangen nach geteilter Verantwortung und kooperativen Lösungen."
      </blockquote>
      <p class="mb-4 text-slate-650 dark:text-slate-300">Die Verträge sollen Mindestdurchflussmengen garantieren und gemeinsame Gewässerschutzkommissionen etablieren. Eine friedliche Zukunft hängt maßgeblich davon ab, ob Staaten das Teilen von Ressourcen als kollektive Sicherheitsgarantie verstehen.</p>
    `
  }
];

export function getFallbackArticle(source: SourceConfig, index: number): Article {
  const bespoke = getBespokeArticle(source, index);
  if (bespoke) return bespoke;

  const hash = Math.abs(getHashCode(source.id + source.name));
  const poolIndex = hash % FALLBACK_ARTICLES_POOL.length;
  const template = FALLBACK_ARTICLES_POOL[poolIndex];

  const finalTitle = template.title;
  // Format matching the domain name beautifully
  const cleanDomain = source.domain.replace(/^(https?:\/\/)?(www\.)?/, "");
  const finalTeaser = template.teaser + ` (Berichtet exklusiv von ${source.name})`;
  const finalUrl = `https://${cleanDomain}`;

  const cleanContent = template.content
    .replace(/\${source\.name}/g, `<strong>${source.name}</strong>`)
    .replace(/\${source\.domain}/g, `<em>${cleanDomain}</em>`);

  return {
    id: `synth-${source.id}-${poolIndex}`,
    title: finalTitle,
    teaser: finalTeaser,
    content: cleanContent,
    category: template.category,
    sourceId: source.id,
    sourceName: source.name,
    url: finalUrl,
    imageUrl: template.imageUrl,
    publishedAt: "Gerade eben",
    readingTime: template.readingTime,
    isTrending: index === 0 || hash % 3 === 0,
  };
}
