import { useEffect, useState } from "react";
import { ExternalLink, Quote, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

type Article = {
  title: string;
  description: string;
  extract: string;
  image: string | null;
  url: string;
};

type DailyQuote = {
  quote: string;
  author: string;
};

const fallbacks: Record<string, DailyQuote> = {
  "pt-BR": { quote: "A criatividade é a inteligência se divertindo.", author: "Albert Einstein" },
  es: { quote: "La creatividad es la inteligencia divirtiéndose.", author: "Albert Einstein" },
  en: { quote: "Creativity is intelligence having fun.", author: "Albert Einstein" }
};

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function quoteFrom(data: unknown, language: string): DailyQuote | null {
  if (!data || typeof data !== "object") return null;
  const value = data as Record<string, unknown>;
  const nested = value.data && typeof value.data === "object" ? value.data as Record<string, unknown> : value;
  const quote = stringValue(nested.quote) || stringValue(nested.phrase) || stringValue(nested.frase);
  const author = stringValue(nested.author) || stringValue(nested.autor) || stringValue(nested.author_name);
  return quote ? { quote, author: author || (language === "pt-BR" ? "autor desconhecido" : language === "es" ? "autor desconocido" : "unknown author") } : null;
}

function quoteEndpoint(language: string) {
  if (language === "pt-BR") return "https://ferramentasdaweb.com.br/mensagens-motivacionais/api/v1/frases.php/hoje";
  if (language === "es") return "https://frasedeldia.azurewebsites.net/api/phrase";
  return "https://dumbapis.com/daily/quote";
}

export function SidebarInsights() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? "en";
  const [article, setArticle] = useState<Article | null>(null);
  const [quote, setQuote] = useState<DailyQuote>(fallbacks[language] ?? fallbacks.en!);
  const [quoteLoading, setQuoteLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const wikiLanguage = language === "pt-BR" ? "pt" : language;
    setArticle(null);

    fetch(`https://${wikiLanguage}.wikipedia.org/api/rest_v1/page/random/summary`, {
      signal: controller.signal,
      headers: { Accept: "application/json" }
    })
      .then((response) => response.ok ? response.json() as Promise<Record<string, unknown>> : Promise.reject(new Error(String(response.status))))
      .then((data) => {
        const thumbnail = data.thumbnail && typeof data.thumbnail === "object" ? (data.thumbnail as Record<string, unknown>).source : null;
        const urls = data.content_urls && typeof data.content_urls === "object" ? (data.content_urls as Record<string, unknown>).desktop : null;
        const page = urls && typeof urls === "object" ? (urls as Record<string, unknown>).page : null;
        const title = stringValue(data.title);
        const extract = stringValue(data.extract);
        if (!title || !extract || typeof page !== "string") return;
        setArticle({
          title,
          description: stringValue(data.description),
          extract,
          image: typeof thumbnail === "string" ? thumbnail : null,
          url: page
        });
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [language]);

  useEffect(() => {
    const controller = new AbortController();
    setQuoteLoading(true);
    setQuote(fallbacks[language] ?? fallbacks.en!);

    fetch(quoteEndpoint(language), { signal: controller.signal, headers: { Accept: "application/json" } })
      .then((response) => response.ok ? response.json() as Promise<unknown> : Promise.reject(new Error(String(response.status))))
      .then((data) => {
        const next = quoteFrom(data, language);
        if (next) setQuote(next);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!controller.signal.aborted) setQuoteLoading(false);
      });

    return () => controller.abort();
  }, [language]);

  return (
    <div className="mt-auto space-y-3">
      <section className="overflow-hidden rounded-[1.75rem] border border-border bg-elevated">
        <div className="flex items-center justify-between px-4 pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{t("sidebar.discovery")}</p>
          <span className="text-[11px] text-muted">wikipedia</span>
        </div>
        {article?.image && (
          <a href={article.url} target="_blank" rel="noreferrer" className="mt-3 block aspect-[16/9] overflow-hidden bg-surface">
            <img src={article.image} alt={article.title} loading="lazy" className="size-full object-cover transition-transform duration-500 hover:scale-[1.03]" />
          </a>
        )}
        <div className="space-y-2 p-4 pt-3">
          {article ? (
            <>
              <a href={article.url} target="_blank" rel="noreferrer" className="group flex items-start justify-between gap-2">
                <span className="text-sm font-semibold leading-snug">{article.title}</span>
                <ExternalLink size={14} className="mt-0.5 shrink-0 text-muted transition-colors group-hover:text-foreground" />
              </a>
              {article.description && <p className="text-xs font-medium text-muted">{article.description}</p>}
              <p className="line-clamp-4 text-xs leading-relaxed text-muted">{article.extract}</p>
            </>
          ) : (
            <p className="py-3 text-xs text-muted">{t("sidebar.loadingArticle")}</p>
          )}
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{t("sidebar.quote")}</p>
          <Quote size={15} className="text-accent" />
        </div>
        <blockquote className="text-sm leading-relaxed">“{quote.quote}”</blockquote>
        <p className="mt-3 text-xs font-medium text-muted">— {quote.author}</p>
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted">
          <RefreshCw size={11} className={quoteLoading ? "animate-spin" : ""} />
          {t("sidebar.daily")}
        </div>
      </section>
    </div>
  );
}
