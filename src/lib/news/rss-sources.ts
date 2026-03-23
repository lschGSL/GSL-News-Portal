// ============================================================
// GSL News Portal — Pre-configured RSS Sources
// Luxembourg & Grande Région focus
// ============================================================

import type { NewsCategory, SupportedLocale } from "@/lib/types";

export interface RssSourceConfig {
  name: string;
  url: string;
  category: NewsCategory;
  language: SupportedLocale;
  region: string | null;
}

export const DEFAULT_RSS_SOURCES: RssSourceConfig[] = [
  // --- Luxembourg Local ---
  { name: "RTL.lu", url: "https://www.rtl.lu/rss.xml", category: "local", language: "fr", region: "luxembourg" },
  { name: "Paperjam", url: "https://paperjam.lu/feed/rss", category: "economy", language: "fr", region: "luxembourg" },
  { name: "Luxemburger Wort FR", url: "https://www.wort.lu/fr/rss.xml", category: "local", language: "fr", region: "luxembourg" },
  { name: "Luxemburger Wort DE", url: "https://www.wort.lu/de/rss.xml", category: "local", language: "de", region: "luxembourg" },
  { name: "Tageblatt", url: "https://www.tageblatt.lu/feed/", category: "local", language: "de", region: "luxembourg" },
  { name: "L'essentiel", url: "https://www.lessentiel.lu/fr/rss.xml", category: "local", language: "fr", region: "luxembourg" },
  { name: "Chronicle.lu", url: "https://chronicle.lu/rss", category: "economy", language: "en", region: "luxembourg" },

  // --- Grande Région ---
  { name: "Républicain Lorrain", url: "https://www.republicain-lorrain.fr/rss", category: "region", language: "fr", region: "lorraine" },
  { name: "Saarbrücker Zeitung", url: "https://www.saarbruecker-zeitung.de/rss/", category: "region", language: "de", region: "saarland" },
  { name: "Volksfreund Trier", url: "https://www.volksfreund.de/rss/", category: "region", language: "de", region: "trier" },

  // --- Finance ---
  { name: "Les Échos", url: "https://www.lesechos.fr/rss/rss_une.xml", category: "finance", language: "fr", region: null },
  { name: "Financial Times", url: "https://www.ft.com/rss/home", category: "finance", language: "en", region: null },
  { name: "Handelsblatt", url: "https://www.handelsblatt.com/contentexport/feed/", category: "finance", language: "de", region: null },
  { name: "Investir", url: "https://investir.lesechos.fr/rss/rss_une.xml", category: "finance", language: "fr", region: null },
  { name: "Bloomberg Markets", url: "https://feeds.bloomberg.com/markets/news.rss", category: "finance", language: "en", region: null },

  // --- Economy ---
  { name: "Reuters Business", url: "https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best", category: "economy", language: "en", region: null },
  { name: "La Tribune", url: "https://www.latribune.fr/rss/rubriques/economie.html", category: "economy", language: "fr", region: null },
  { name: "Wirtschaftswoche", url: "https://www.wiwo.de/rss/feed.rss", category: "economy", language: "de", region: null },

  // --- Fiscal & Legal (Luxembourg institutional) ---
  { name: "Gouvernement.lu", url: "https://gouvernement.lu/fr/actualites/toutes_actualites.rss", category: "fiscal", language: "fr", region: "luxembourg" },
  { name: "AED (TVA & Enregistrement)", url: "https://aed.gouvernement.lu/fr/actualites.rss", category: "fiscal", language: "fr", region: "luxembourg" },
  { name: "CSSF Publications", url: "https://www.cssf.lu/en/feed/publications", category: "fiscal", language: "en", region: "luxembourg" },
  { name: "PwC Luxembourg Tax", url: "https://blog.pwc.lu/feed/", category: "fiscal", language: "en", region: "luxembourg" },
  { name: "Deloitte Luxembourg", url: "https://www.deloitte.com/lu/en/blog.rss.xml", category: "fiscal", language: "en", region: "luxembourg" },
  { name: "EY Tax Insights", url: "https://www.ey.com/en_gl/tax/rss", category: "fiscal", language: "en", region: null },
  { name: "KPMG Tax News", url: "https://kpmg.com/lu/en/home/insights.rss.xml", category: "fiscal", language: "en", region: "luxembourg" },

  // --- World ---
  { name: "Le Monde", url: "https://www.lemonde.fr/rss/une.xml", category: "world", language: "fr", region: null },
  { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml", category: "world", language: "en", region: null },
  { name: "Tagesschau", url: "https://www.tagesschau.de/xml/rss2/", category: "world", language: "de", region: null },
  { name: "France 24", url: "https://www.france24.com/fr/rss", category: "world", language: "fr", region: null },
  { name: "DW News", url: "https://rss.dw.com/rdf/rss-en-all", category: "world", language: "en", region: null },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", category: "world", language: "en", region: null },

  // --- Wellness ---
  { name: "Psychologies", url: "https://www.psychologies.com/RSS", category: "wellness", language: "fr", region: null },
  { name: "Doctissimo Bien-être", url: "https://www.doctissimo.fr/feeds/bien-etre.xml", category: "wellness", language: "fr", region: null },
  { name: "MindBodyGreen", url: "https://www.mindbodygreen.com/rss", category: "wellness", language: "en", region: null },
  { name: "Greatist", url: "https://greatist.com/feed", category: "wellness", language: "en", region: null },

  // --- Positive News ---
  { name: "Positive News", url: "https://www.positive.news/feed/", category: "positive", language: "en", region: null },
  { name: "Good News Network", url: "https://www.goodnewsnetwork.org/feed/", category: "positive", language: "en", region: null },
  { name: "Bonnes Nouvelles", url: "https://www.linfodurable.fr/rss.xml", category: "positive", language: "fr", region: null },
  { name: "Reasons to be Cheerful", url: "https://reasonstobecheerful.world/feed/", category: "positive", language: "en", region: null },
];
