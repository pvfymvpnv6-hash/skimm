import { Article, TopicConfig, SourceConfig } from "../types";

export const DEFAULT_TOPICS: TopicConfig[] = [
  { id: "all", name: "Alle News", enabled: true },
  { id: "politik", name: "Politik", enabled: true },
  { id: "wissen", name: "Wissen", enabled: true },
  { id: "technologie", name: "Technologie", enabled: true },
  { id: "wirtschaft", name: "Wirtschaft", enabled: true },
  { id: "kultur_gesellschaft", name: "Kultur & Gesellschaft", enabled: true }
];

export const DEFAULT_SOURCES: SourceConfig[] = [
  { id: "spiegel", name: "SPIEGEL Online", domain: "spiegel.de", category: "Politik", enabled: true, weight: 2 },
  { id: "ntv", name: "n-tv Nachrichten", domain: "n-tv.de", category: "Politik", enabled: true, weight: 2 },
  { id: "merkur", name: "Merkur.de", domain: "merkur.de", category: "Politik", enabled: true, weight: 2 },
  { id: "golem", name: "Golem.de", domain: "golem.de", category: "Technologie", enabled: true, weight: 2 },
  { id: "heise", name: "Heise Online", domain: "heise.de", category: "Technologie", enabled: true, weight: 2 },
  { id: "tagesschau", name: "Tagesschau", domain: "tagesschau.de", category: "Politik", enabled: true, weight: 2 },
  { id: "zeit", name: "ZEIT Online", domain: "zeit.de", category: "Kultur & Gesellschaft", enabled: true, weight: 2 },
  { id: "handelsblatt", name: "Handelsblatt", domain: "handelsblatt.com", category: "Wirtschaft", enabled: true, weight: 2 },
  { id: "welt", name: "WELT", domain: "welt.de", category: "Politik", enabled: true, weight: 2 },
  { id: "bild", name: "BILD", domain: "bild.de", category: "Politik", enabled: true, weight: 2 },
  { id: "faz", name: "FAZ.NET", domain: "faz.net", category: "Politik", enabled: true, weight: 2 },
  { id: "focus", name: "FOCUS Online", domain: "focus.de", category: "Politik", enabled: true, weight: 2 },
  { id: "tonline", name: "t-online", domain: "t-online.de", category: "Politik", enabled: true, weight: 2 },
  { id: "electrive", name: "Electrive.net", domain: "electrive.net", category: "Technologie", enabled: true, weight: 2 },
  { id: "ifun", name: "iFun.de", domain: "ifun.de", category: "Technologie", enabled: true, weight: 2 },
  { id: "apfelpage", name: "Apfelpage.de", domain: "apfelpage.de", category: "Technologie", enabled: true, weight: 2 },
  { id: "mobiflip", name: "mobiFlip", domain: "mobiflip.de", category: "Technologie", enabled: true, weight: 2 },
  { id: "rbb24", name: "rbb24 Berlin & Brandenburg", domain: "rbb24.de", category: "Politik", enabled: true, weight: 2 },
  { id: "polizei-brandenburg", name: "Polizei Brandenburg", domain: "polizei.brandenburg.de", category: "Blaulicht", enabled: true, weight: 1 }
];

export const MOCK_ARTICLES: Article[] = [
  {
    id: "art-politik-1",
    title: "Bundestag beschließt wegweisendes Gesetz zur Energiewende in Kommunen",
    teaser: "Mit einer breiten Mehrheit hat das Parlament neue Vorgaben für den beschleunigten Ausbau von Solar- und Windkraft verabschiedet. Kommunen erhalten künftig direkte finanzielle Beteiligungen.",
    content: `
      <p class="mb-4">Der Deutsche Bundestag hat in seiner heutigen Sitzung ein umfassendes Gesetzespaket zur Beschleunigung der Energiewende verabschiedet. Das neue Gesetz sieht vor, bürokratische Hürden bei der Genehmigung von Windkraft- und Solaranlagen drastisch zu senken.</p>
      
      <p class="mb-4">Besonders innovativ ist die finanzielle Beteiligungsklausel: Kommunen, auf deren Gebiet neue Windräder errichtet werden, erhalten künftig einen festen Anteil der Erträge. Dies soll die Akzeptanz der Bürgerinnen und Bürger vor Ort nachhaltig stärken und den Ausbau in ländlichen Regionen vorantreiben.</p>
      
      <p class="mb-4">"Wir machen die Menschen vor Ort zu Partnern der Energiewende, nicht nur zu Zuschauern," erklärte der zuständige Bundesminister in seiner Rede. "Das ist ein historischer Meilenstein für den Klimaschutz und die regionale Wirtschaftskraft."</p>

      <blockquote class="border-l-4 border-emerald-500 pl-4 my-6 italic text-gray-300">
        "Wir machen die Menschen vor Ort zu Partnern der Energiewende, nicht nur zu Zuschauern."
      </blockquote>

      <p class="mb-4">Die Opposition äußerte zwar Bedenken hinsichtlich des Artenschutzes, stimmte dem Entwurf in Teilen jedoch ebenfalls zu, da die Beteiligungskonzepte als wegweisend erachtet wurden. Die neuen Regelungen treten bereits zum ersten Tag des kommenden Monats in Kraft.</p>
    `,
    category: "Politik",
    sourceId: "spiegel",
    sourceName: "SPIEGEL Online",
    url: "https://www.spiegel.de/politik/deutschland/",
    imageUrl: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "Heute, 08:30",
    readingTime: "5 Min. Lesezeit",
    isBreaking: true
  },
  {
    id: "art-politik-2",
    title: "Steuerreform 2026: Entlastungen für mittlere Einkommen und Familien verabschiedet",
    teaser: "Das Bundeskabinett hat sich auf die Eckpunkte geeinigt. Durch eine Anpassung des Steuertarifs und höhere Freibeträge sollen vor allem Familien spürbar mehr Netto vom Brutto erhalten.",
    content: `
      <p class="mb-4">Das Bundeskabinett hat heute den Entwurf für die Steuerreform 2026 auf den Weg gebracht. Nach wochenlangen Verhandlungen einigte sich die Regierungskoalition auf spürbare Entlastungen, die insbesondere der arbeitenden Mitte und Familien zugutekommen sollen.</p>
      
      <p class="mb-4">Der Grundfreibetrag wird deutlich angehoben, und der Steuertarif wird so angepasst, dass die sogenannte 'kalte Progression' vollständig ausgeglichen wird. Zudem steigen die Kinderfreibeträge und das Kindergeld wird auf einen neuen Rekordwert angepasst.</p>
      
      <p class="mb-4">"Wir entlasten diejenigen, die das Land jeden Tag am Laufen halten," betonte der Bundesfinanzminister. "In Zeiten anhaltender Inflation ist dies das richtige Signal zur Stärkung der Kaufkraft und der sozialen Gerechtigkeit."</p>

      <p class="mb-4">Die Entlastungen belaufen sich auf schätzungsweise 15 Milliarden Euro pro Jahr. Kritiker weisen darauf hin, dass dadurch Spielräume für wichtige Investitionen in Bildung und Schienennetz schrumpfen könnten. Die Regierung betont jedoch, dass der Konsumanreiz die Steuereinnahmen mittelfristig wieder stabilisieren werde.</p>
    `,
    category: "Politik",
    sourceId: "zeit",
    sourceName: "ZEIT Online",
    url: "https://www.zeit.de/politik/index",
    imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "Heute, 06:15",
    readingTime: "4 Min. Lesezeit",
    isTrending: true
  },
  {
    id: "art-1",
    title: "Der Durchbruch bei Quantencomputern: Fehlerkorrektur erreicht historischen Meilenstein",
    teaser: "Deutsche Forscher haben eine neue Methode zur Fehlerkorrektur entwickelt, die Quantenberechnungen stabilisiert. Dies könnte den Weg für kommerzielle Quantencomputer ebnen.",
    content: `
      <p class="mb-4">Die Quantentechnologie steht vor ihrem bisher größten Sprung. Physiker und Ingenieure haben ein neuartiges Protokoll zur aktiven Fehlerkorrektur implementiert, das die Dekohärenz-Zeiten von Qubits um das Zehnfache verlängert.</p>
      
      <p class="mb-4">Bisher litten Quantencomputer unter extremer Störanfälligkeit durch thermisches Rauschen und elektromagnetische Felder. Mit der neuen topologischen Fehlerkorrektur können Fehler in Echtzeit erkannt und korrigiert werden, ohne den Berechnungszustand zu zerstören.</p>
      
      <p class="mb-4">"Wir sprechen hier nicht mehr von theoretischen Konzepten," erklärt Prof. Dr. Angela Weber, Leiterin des Instituts für Quantenoptik. "Das ist der fundamentale Baustein, den wir für fehlertolerante Quantencomputer im industriellen Maßstab benötigt haben. Die kommerzielle Nutzung rückt in greifbare Nähe."</p>

      <blockquote class="border-l-4 border-indigo-500 pl-4 my-6 italic text-gray-300">
        "Das ist der fundamentale Baustein, den wir für fehlertolerante Quantencomputer im industriellen Maßstab benötigt haben."
      </blockquote>

      <p class="mb-4">Die Auswirkungen auf die Kryptographie, die Medikamentenentwicklung und die Materialforschung sind immens. Komplexe Molekülsimulationen, für die klassische Supercomputer Jahrtausende bräuchten, könnten bald in wenigen Minuten durchgeführt werden.</p>
      
      <p class="mb-4">Branchenexperten rechnen damit, dass erste kommerziell nutzbare Systeme mit fehlerkorrigierten Qubits bereits Ende dieses Jahrzehnts in Cloud-Rechenzentren integriert werden könnten. Deutschland positioniert sich hierbei als einer der führenden Forschungs- und Entwicklungsstandorte weltweit.</p>
    `,
    category: "Technologie",
    sourceId: "heise",
    sourceName: "Heise Online",
    url: "https://www.heise.de/thema/Quantencomputer",
    imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "Gestern, 14:20",
    readingTime: "4 Min. Lesezeit"
  },
  {
    id: "art-2",
    title: "Digitalpakt 2.0: Bundeskabinett beschließt Milliardenförderung für Schulen",
    teaser: "Nach monatelangen Verhandlungen steht die Einigung: Bund und Länder investieren massiv in die digitale Infrastruktur, Fortbildung von Lehrkräften und moderne Lernplattformen.",
    content: `
      <p class="mb-4">Das Bundeskabinett hat heute den lang erwarteten 'Digitalpakt 2.0' auf den Weg gebracht. Insgesamt f&uuml;nf Milliarden Euro sollen in den kommenden f&uuml;nf Jahren flie&szlig;en, um Schulen fit f&uuml;r das digitale Zeitalter zu machen.</p>
      
      <p class="mb-4">Im Gegensatz zum ersten Digitalpakt steht diesmal nicht nur die Hardware im Fokus. Ein Gro&szlig;teil der Mittel ist explizit f&uuml;r die IT-Administration, die Fortbildung der Lehrkr&auml;fte und die Entwicklung bundeseinheitlicher, datenschutzkonformer Lernplattformen reserviert.</p>
      
      <p class="mb-4">"Wir d&uuml;rfen unsere Schulen nicht nur mit iPads ausstatten und sie dann mit der Technik allein lassen," betonte die Bundesbildungsministerin bei der Pressekonferenz. "Der Digitalpakt 2.0 stellt sicher, dass die P&auml;dagogik mit der Technik Schritt h&auml;lt und Schulen dauerhaften IT-Support erhalten."</p>

      <p class="mb-4">Kritiker bem&auml;ngeln jedoch die b&uuml;rokratischen H&uuml;rden bei der Antragsstellung, die bereits den ersten Pakt verlangsamt hatten. Um dem entgegenzuwirken, soll ein vereinfachtes, rein digitales Abrufverfahren etabliert werden, bei dem Schultr&auml;ger Antr&auml;ge innerhalb weniger Wochen genehmigt bekommen.</p>
      
      <p class="mb-4">Die Bundesl&auml;nder haben sich im Gegenzug dazu verpflichtet, digitale Bildung fest in den Lehrpl&auml;nen aller Schulformen zu verankern. Damit soll langfristig eine Chancengleichheit bei der Vermittlung digitaler Kompetenzen gew&auml;hrleistet werden.</p>
    `,
    category: "Wissen",
    sourceId: "spiegel",
    sourceName: "SPIEGEL Online",
    url: "https://www.spiegel.de/thema/digitalisierung_in_schulen/",
    imageUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "Heute, 11:05",
    readingTime: "5 Min. Lesezeit"
  },
  {
    id: "art-3",
    title: "Wirtschaft im Wandel: EZB signalisiert Zinswende zur Stärkung des Wachstums",
    teaser: "Angesichts sinkender Inflationsraten deutet die Europäische Zentralbank eine Lockerung der Geldpolitik an. Deutsche Unternehmen reagieren mit Optimismus auf die Ankündigung.",
    content: `
      <p class="mb-4">Die Zeichen an den europäischen Finanzmärkten stehen auf Entspannung. Auf ihrer jüngsten Sitzung in Frankfurt hat die Europäische Zentralbank (EZB) angedeutet, dass der Leitzins im kommenden Quartal gesenkt werden könnte.</p>
      
      <p class="mb-4">Grund für den Kurswechsel is die spürbare Stabilisierung der Inflationsrate, die sich dem Zielwert von zwei Prozent annähert. Gleichzeitig schwächelt das Wirtschaftswachstum in der Eurozone, insbesondere im verarbeitenden Gewerbe und im Bausektor, die stark unter den hohen Finanzierungskosten leiden.</p>
      
      <p class="mb-4">"Die straffe Geldpolitik hat ihre Wirkung gezeigt und die Teuerung eingedämmt," erklärte die EZB-Präsidentin. "Nun müssen wir darauf achten, die wirtschaftliche Erholung nicht durch dauerhaft zu hohe Zinsen abzuwürgen."</p>

      <blockquote class="border-l-4 border-amber-500 pl-4 my-6 italic text-gray-300">
        "Nun müssen wir darauf achten, die wirtschaftliche Erholung nicht durch dauerhaft zu hohe Zinsen abzuwürgen."
      </blockquote>

      <p class="mb-4">Der Deutsche Industrie- und Handelskammertag (DIHK) begrüßte die Signale. Viele mittelständische Unternehmen hatten geplante Investitionen in grüne Transformationen und Digitalisierung aufgrund der hohen Kreditkosten auf Eis gelegt.</p>
      
      <p class="mb-4">Analysten erwarten, dass eine Zinssenkung um 25 Basispunkte den Startschuss für eine neue Investitionswelle geben könnte, was sich positiv auf den Aktienmarkt und den Arbeitsmarkt im gesamten Euroraum auswirken dürfte.</p>
    `,
    category: "Wirtschaft",
    sourceId: "handelsblatt",
    sourceName: "Handelsblatt",
    url: "https://www.handelsblatt.com/politik/konjunktur/",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "Heute, 09:15",
    readingTime: "6 Min. Lesezeit"
  },
  {
    id: "art-4",
    title: "Die Rückkehr des Analogen: Warum die Schallplatte im Streaming-Zeitalter boomt",
    teaser: "Entschleunigung als Trend: Trotz Spotify und Co. verzeichnen Schallplatten und analoge Medien Rekordumsätze. Junge Generationen entdecken den bewussten Musikgenuss für sich.",
    content: `
      <p class="mb-4">Im Zeitalter der algorithmisch kuratierten Playlists und des endlosen Musik-Streamings feiert ein fast vergessenes Medium ein triumphales Comeback: die Vinyl-Schallplatte.</p>
      
      <p class="mb-4">Was als Nischenphänomen für Audiophile begann, hat sich zu einem handfesten Massentrend entwickelt. Presswerke weltweit arbeiten an den Kapazitätsgrenzen, um die enorme Nachfrage zu bedienen. Überraschenderweise sind es vor allem Jugendliche und junge Erwachsene, die das physische Album wiederentdecken.</p>
      
      <p class="mb-4">"Eine Schallplatte aufzulegen ist ein ritueller Akt," sagt der Kulturwissenschaftler Dr. Jonas Lang. "Es erfordert Aufmerksamkeit und Entschleunigung. Man skippt keine Songs im Sekundentakt, sondern lässt sich auf das Gesamtkunstwerk eines Künstlers ein."</p>

      <p class="mb-4">Neben dem warmen, analogen Klang schätzen Käufer das haptische Erlebnis: das große Cover-Artwork, die bedruckten Innentaschen und das Gefühl, Musik tatsächlich zu 'besitzen'. Im Gegensatz zu digitalen Dateien, die nur lizenziert sind, stellt die Platte einen dauerhaften, materiellen Wert dar.</p>
      
      <p class="mb-4">Dieser Trend erstreckt sich auch auf andere Lebensbereiche. Ob analoge Fotografie, mechanische Schreibmaschinen oder gedruckte Bücher – die Sehnsucht nach dem Greifbaren und Unvollkommenen wächst in einer zunehmend digitalisierten und optimierten Welt stetig an.</p>
    `,
    category: "Kultur & Gesellschaft",
    sourceId: "zeit",
    sourceName: "ZEIT Online",
    url: "https://www.zeit.de/kultur/index",
    imageUrl: "https://images.unsplash.com/photo-1539386115456-6218151f1585?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "Gestern, 17:45",
    readingTime: "5 Min. Lesezeit"
  },
  {
    id: "art-5",
    title: "AI Act der EU tritt in Kraft: Neue Spielregeln für künstliche Intelligenz in Europa",
    teaser: "Das weltweit erste umfassende Gesetz zur Regulierung von KI setzt strenge Grenzen für Gesichtserkennung und generative Modelle. Was das für Startups und Tech-Konzerne bedeutet.",
    content: `
      <p class="mb-4">Europa übernimmt die weltweite Vorreiterrolle bei der Regulierung von Zukunftstechnologien. Mit dem offiziellen Inkrafttreten des 'AI Act' gelten in der Europäischen Union ab sofort strenge, risikobasierte Regeln für den Einsatz künstlicher Intelligenz.</p>
      
      <p class="mb-4">Das Gesetz teilt KI-Anwendungen in verschiedene Risikoklassen ein. Während harmlose Spam-Filter kaum reguliert werden, müssen Hochrisiko-Systeme – etwa in der Medizin, im Personalwesen oder bei der Kreditvergabe – strenge Auflagen zu Transparenz, Cybersicherheit und menschlicher Aufsicht erfüllen.</p>
      
      <p class="mb-4">"Wir verbieten nicht die Technologie, sondern schützen unsere Grundrechte," erläutert ein Sprecher der EU-Kommission. "Der AI Act schafft Rechtssicherheit für Unternehmen und stärkt das Vertrauen der Bürgerinnen und Bürger in diese revolutionäre Technologie."</p>

      <blockquote class="border-l-4 border-emerald-500 pl-4 my-6 italic text-gray-300">
        "Der AI Act schafft Rechtssicherheit für Unternehmen und stärkt das Vertrauen der Bürgerinnen und Bürger in diese revolutionäre Technologie."
      </blockquote>

      <p class="mb-4">Besonders stark reguliert werden generative KI-Modelle wie ChatGPT. Entwickler müssen offenlegen, mit welchen urheberrechtlich geschützten Daten ihre Modelle trainiert wurden. Zudem sind bestimmte Anwendungen, wie die Echtzeit-Biometrie im öffentlichen Raum oder das Social Scoring, komplett untersagt.</p>
      
      <p class="mb-4">Während Verbraucherschützer das Gesetz feiern, äußert die europäische Digitalwirtschaft Besorgnis. Viele Startups befürchten, durch den hohen bürokratischen Aufwand im Vergleich zu Konkurrenten aus den USA und China ins Hintertreffen zu geraten.</p>
    `,
    category: "Technologie",
    sourceId: "golem",
    sourceName: "Golem.de",
    url: "https://www.golem.de/specials/ai-act/",
    imageUrl: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "Vor 2 Tagen",
    readingTime: "5 Min. Lesezeit"
  },
  {
    id: "art-6",
    title: "Erkundung der Meere: Sensationsfund neuer Tierarten in der Tiefsee der Azoren",
    teaser: "Ein internationales Forschungsteam hat bei einer Tauchexpedition im Atlantik über ein Dutzend bisher völlig unbekannte Meereslebewesen gefilmt und katalogisiert.",
    content: `
      <p class="mb-4">Die Tiefsee ist weniger erforscht als die Oberfläche des Mondes. Wie wahr dieser Satz ist, bewies eine Expedition des deutschen Forschungsschiffs 'Sonne' im Gewässer rund um das Azoren-Archipel.</p>
      
      <p class="mb-4">Mithilfe eines unbemannten Tauchroboters drangen die Wissenschaftler in Tiefen von bis zu 4.500 Metern vor. In der ewigen Dunkelheit am Mittelatlantischen Rücken stießen sie auf ein pulsierendes Ökosystem rund um hydrothermale Quellen – sogenannte Schwarze Raucher.</p>
      
      <p class="mb-4">Zu den spektakulärsten Funden gehört eine leuchtende Qualle, die biologisches Licht in rhythmischen Mustern aussendet, sowie eine Krebsart, die sich ausschließlich von Bakterien ernährt, die auf ihren eigenen haarigen Scheren wachsen.</p>

      <p class="mb-4">"Wir waren sprachlos," berichtet die Expeditionsleiterin Dr. Carmen Vogt. "Fast jeder zweite Tauchgang lieferte uns Arten, die kein Mensch zuvor gesehen hat. Diese Organismen haben extreme Anpassungsstrategien an die Dunkelheit und den enormen Druck entwickelt, die für die Wissenschaft von unschätzbarem Wert sind."</p>
      
      <p class="mb-4">Die Forscher mahnen gleichzeitig zur Vorsicht: Die unberührten Lebensräume der Tiefsee sind durch den drohenden Tiefseebergbau akut gefährdet. Der Fund zeigt, wie viele Geheimnisse die Ozeane noch bergen, bevor sie durch industrielle Eingriffe zerstört werden.</p>
    `,
    category: "Wissen",
    sourceId: "zeit",
    sourceName: "ZEIT Online",
    url: "https://www.zeit.de/wissen/umwelt/index",
    imageUrl: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "Vor 2 Tagen",
    readingTime: "6 Min. Lesezeit"
  },
  {
    id: "art-7",
    title: "Grüne Startups im Fokus: Investitionen in Klimatechnologie steigen rasant",
    teaser: "Trotz allgemeiner Flaute im Venture-Capital-Bereich verzeichnen europäische Startups im Bereich erneuerbare Energien und CO2-Speicherung Rekord-Investitionen.",
    content: `
      <p class="mb-4">Während die Finanzierung für klassische E-Commerce- und Software-Startups im vergangenen Jahr spürbar zurückgegangen ist, erlebt ein Sektor einen regelrechten Boom: Climate Tech.</p>
      
      <p class="mb-4">Laut einem neuen Branchenreport flossen im vergangenen Halbjahr mehr als drei Milliarden Euro Risikokapital in europäische Jungunternehmen, die an Lösungen gegen die Erderwärmung arbeiten. Besonders hoch im Kurs stehen Startups in den Bereichen effiziente Energiespeicherung, Dekarbonisierung der Industrie und synthetische Kraftstoffe.</p>
      
      <p class="mb-4">"Investoren suchen heute nach nachhaltiger Wertschöpfung mit realem Impact," erklärt eine renommierte VC-Geberin aus Berlin. "Klimatechnologie ist kein reines Trendthema mehr, sondern der größte Wachstumsmarkt der nächsten zwei Jahrzehnte."</p>

      <p class="mb-4">Ein Paradebeispiel ist ein Münchener Startup, das einen neuartigen Feststoff-Stromspeicher für Industrieanlagen entwickelt hat und sich jüngst eine Finanzierungsrunde von 120 Millionen Euro sichern konnte. Solche Technologien sind der Schlüssel, um die schwankende Stromerzeugung aus Wind und Sonne industrietauglich zu puffern.</p>
      
      <p class="mb-4">Experten betonen, dass staatliche Förderprogramme wie der European Green Deal als Katalysator wirken. Sie geben privaten Investoren die nötige Planungssicherheit, um auch kapitalintensive Hardware-Projekte in der Frühphase zu finanzieren.</p>
    `,
    category: "Wirtschaft",
    sourceId: "handelsblatt",
    sourceName: "Handelsblatt",
    url: "https://www.handelsblatt.com/technologie/",
    imageUrl: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "Vor 3 Tagen",
    readingTime: "4 Min. Lesezeit"
  }
];
