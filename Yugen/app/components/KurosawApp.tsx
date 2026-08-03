"use client";

import { FormEvent, useEffect, useMemo, useRef, useState, type AnchorHTMLAttributes, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { signIn, signOut } from "next-auth/react";
import { collections, newsItems, type Anime, type CharacterDetail } from "./data";
import { fetchAnimeCharacters, fetchAnimeDetail, fetchAnimeList, fetchAnimePage, fetchAnimeStaff, fetchCharacterDetail, fetchSeasonNow } from "./jikan";
import { languageOptions, observeDocumentLanguage, type Language } from "./i18n";

type View = "home" | "catalog" | "anime" | "calendar" | "character" | "collections" | "discussions" | "news" | "article" | "profile" | "settings" | "blueprint";
type Modal = "join" | "login" | "forgot" | "collection" | "create" | null;
type SessionUser = {
  displayName: string;
  email: string;
  username?: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  bio?: string;
};
type SynopsisTranslation = { text: string; loading: boolean; error: boolean };
type LibraryStatus = "watching" | "to_watch" | "watched";
type LibraryEntry = {
  slug: string;
  title: string;
  image?: string | null;
  episodes?: number | null;
  year?: number | null;
  format?: string;
  status: LibraryStatus;
  progressEpisodes: number;
  score?: number | null;
  favorite: boolean;
  updatedAt: string;
};
type LibraryPatch = Partial<Pick<LibraryEntry, "status" | "progressEpisodes" | "score" | "favorite">>;
type SaveLibrary = (anime: Anime, patch: LibraryPatch) => Promise<void>;

function Link({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a href={href} {...props}>{children}</a>;
}

const positions = ["0% 0%", "33.333% 0%", "66.667% 0%", "100% 0%", "0% 100%", "33.333% 100%", "66.667% 100%", "100% 100%"];

const genreLabels: Record<string, string> = {
  Action: "Ação", Adventure: "Aventura", "Award Winning": "Premiado", Comedy: "Comédia", Drama: "Drama",
  Ecchi: "Ecchi", Fantasy: "Fantasia", Horror: "Terror", Mystery: "Mistério", Romance: "Romance",
  "Sci-Fi": "Ficção científica", "Slice of Life": "Cotidiano", Sports: "Esportes", Supernatural: "Sobrenatural",
  Suspense: "Suspense", Gourmet: "Gastronomia", "Avant Garde": "Vanguarda", "Boys Love": "Boys Love", "Girls Love": "Girls Love",
};
const seasonLabels: Record<string, string> = { Winter: "Inverno", Spring: "Primavera", Summer: "Verão", Fall: "Outono", Unknown: "Não informada" };
const formatLabels: Record<string, string> = { TV: "Série de TV", Movie: "Filme", OVA: "OVA", ONA: "ONA", Special: "Especial", Music: "Clipe musical", Unknown: "Não informado" };
const statusLabels: Record<string, string> = { "Currently Airing": "Em exibição", "Finished Airing": "Exibição finalizada", "Not yet aired": "Ainda não exibido", Airing: "Em exibição", Finished: "Finalizado", Upcoming: "Em breve", Unknown: "Não informado" };
const sourceLabels: Record<string, string> = { Manga: "Mangá", Original: "Original", "Light novel": "Light novel", Novel: "Romance", Game: "Jogo", "Visual novel": "Visual novel", "Web manga": "Web mangá", Other: "Outro", Unknown: "Não informada" };
const relationLabels: Record<string, string> = { Sequel: "Continuação", Prequel: "Prequela", "Side Story": "História paralela", Alternative: "Alternativa", Adaptation: "Adaptação", Character: "Personagem", Summary: "Resumo", Other: "Outro" };
const roleLabels: Record<string, string> = { Main: "Principal", Supporting: "Coadjuvante" };
const staffPositionLabels: Record<string, string> = { Director: "Direção", "Series Composition": "Composição da série", Script: "Roteiro", "Character Design": "Design de personagens", Music: "Música", "Original Creator": "Criador original", Producer: "Produção", "Sound Director": "Direção de som", Storyboard: "Storyboard" };
const monthLabels: Record<string, string> = { Jan: "jan.", Feb: "fev.", Mar: "mar.", Apr: "abr.", May: "mai.", Jun: "jun.", Jul: "jul.", Aug: "ago.", Sep: "set.", Oct: "out.", Nov: "nov.", Dec: "dez." };

function localize(value: string | undefined | null, labels: Record<string, string>, fallback = "Não informado") {
  if (!value) return fallback;
  return labels[value] || value;
}

function genrePt(value: string) { return localize(value, genreLabels, "Anime"); }
function seasonPt(value: string) { return localize(value, seasonLabels, "Não informada"); }
function formatPt(value: string) { return localize(value, formatLabels); }
function statusPt(value: string) { return localize(value, statusLabels); }
function durationPt(value: string | undefined) { return (value || "Não informada").replace(/ per ep/i, " por episódio").replace(/Unknown/i, "Não informada"); }
function airedPt(value: string | undefined) {
  let translated = value || "Não informada";
  Object.entries(monthLabels).forEach(([month, label]) => { translated = translated.replace(new RegExp(`\\b${month}\\b`, "g"), label); });
  return translated.replace(/ to /g, " a ").replace(/Unknown/i, "Não informada");
}
function ratingLabelPt(value: string | undefined) {
  if (!value || value === "Not rated") return "Não classificado";
  return value.replace("violence & profanity", "violência e linguagem imprópria").replace("mild nudity", "nudez leve").replace("Children", "Infantil").replace("All Ages", "Todas as idades");
}

const synopsisCache = new Map<string, string>();
const synopsisStorageKey = "yugen-synopsis-translations-v1";

function synopsisKey(text: string, language: Language) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  return `${language}:${(hash >>> 0).toString(36)}`;
}

function readStoredSynopsis(key: string) {
  try {
    const stored = JSON.parse(window.localStorage.getItem(synopsisStorageKey) || "{}") as Record<string, string>;
    return stored[key];
  } catch {
    return undefined;
  }
}

function storeSynopsis(key: string, value: string) {
  try {
    const stored = JSON.parse(window.localStorage.getItem(synopsisStorageKey) || "{}") as Record<string, string>;
    const entries = [...Object.entries(stored).filter(([entryKey]) => entryKey !== key), [key, value] as [string, string]].slice(-30);
    window.localStorage.setItem(synopsisStorageKey, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // Translation still works when storage is unavailable.
  }
}

function splitSynopsisText(text: string, maxLength = 420) {
  const chunks: string[] = [];
  let remaining = text.trim();
  while (remaining.length > maxLength) {
    const candidate = remaining.slice(0, maxLength);
    const sentenceBreak = Math.max(candidate.lastIndexOf(". "), candidate.lastIndexOf("! "), candidate.lastIndexOf("? "));
    const wordBreak = candidate.lastIndexOf(" ");
    const splitAt = sentenceBreak > maxLength * 0.55 ? sentenceBreak + 1 : wordBreak > maxLength * 0.55 ? wordBreak : maxLength;
    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

function decodeTranslationEntities(text: string) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

async function translateSynopsisInBrowser(text: string, target: Exclude<Language, "en">, signal: AbortSignal) {
  const translateChunk = async (chunk: string) => {
    const params = new URLSearchParams({ q: chunk, langpair: `en|${target}` });
    const requestController = new AbortController();
    const timeout = window.setTimeout(() => requestController.abort(), 12000);
    const abortRequest = () => requestController.abort();
    signal.addEventListener("abort", abortRequest, { once: true });
    const response = await fetch(`https://api.mymemory.translated.net/get?${params.toString()}`, { headers: { accept: "application/json" }, signal: requestController.signal }).finally(() => {
      window.clearTimeout(timeout);
      signal.removeEventListener("abort", abortRequest);
    });
    if (!response.ok) throw new Error(`Translation service returned ${response.status}`);
    const data = await response.json() as { responseStatus?: number; responseDetails?: string; responseData?: { translatedText?: string } };
    if (data.responseStatus !== 200 || !data.responseData?.translatedText) throw new Error(data.responseDetails || "Translation failed");
    return decodeTranslationEntities(data.responseData.translatedText);
  };
  const translated = await Promise.all(splitSynopsisText(text).map(translateChunk));
  return translated.join(" ");
}

function useTranslatedSynopsis(source: string | undefined, language: Language): SynopsisTranslation {
  const text = source?.trim() || "";
  const [translation, setTranslation] = useState(text);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!text || language === "en") {
      const timer = window.setTimeout(() => {
        setTranslation(text);
        setLoading(false);
        setError(false);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    const cacheKey = synopsisKey(text, language);
    const hasMalCredit = /\s*\[Written by MAL Rewrite\]\s*$/i.test(text);
    const translationSource = text.replace(/\s*\[Written by MAL Rewrite\]\s*$/i, "").trim();
    const localizedCredit = hasMalCredit ? (language === "pt" ? " [Texto do MAL Rewrite]" : " [Texto de MAL Rewrite]") : "";
    const cached = synopsisCache.get(cacheKey) || readStoredSynopsis(cacheKey);
    if (cached) {
      const timer = window.setTimeout(() => {
        setTranslation(cached);
        setLoading(false);
        setError(false);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    const controller = new AbortController();
    const preparation = window.setTimeout(() => {
      setTranslation(text);
      setLoading(true);
      setError(false);
    }, 0);
    translateSynopsisInBrowser(translationSource, language, controller.signal)
      .catch(async () => {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: translationSource, target: language }),
          signal: controller.signal,
        });
        const data = await response.json() as { text?: string; error?: string };
        if (!response.ok || !data.text) throw new Error(data.error || "Translation failed");
        return data.text;
      })
      .then((translated) => {
        const finalTranslation = `${translated}${localizedCredit}`;
        synopsisCache.set(cacheKey, finalTranslation);
        storeSynopsis(cacheKey, finalTranslation);
        setTranslation(finalTranslation);
      })
      .catch((reason) => {
        if (reason?.name !== "AbortError") setError(true);
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { window.clearTimeout(preparation); controller.abort(); };
  }, [language, text]);

  return { text: translation, loading, error };
}

const emptyAnime: Anime = {
  slug: "",
  title: "",
  year: 0,
  genre: "",
  season: "",
  studio: "",
  format: "",
  status: "",
  rating: 0,
  atlas: 1,
  frame: 0,
  blurb: "",
};

function libraryStatusLabel(status: LibraryStatus) {
  return status === "watching" ? "Assistindo" : status === "watched" ? "Assistido" : "Quero assistir";
}

function libraryPayload(anime: Anime) {
  return {
    slug: anime.slug,
    title: anime.title,
    image: anime.image,
    episodes: anime.episodes,
    year: anime.year,
    format: anime.format,
    season: anime.season,
    status: anime.status,
  };
}

function animeFromLibrary(entry: LibraryEntry): Anime {
  return {
    ...emptyAnime,
    slug: entry.slug,
    title: entry.title,
    image: entry.image || undefined,
    year: entry.year || 0,
    format: entry.format || "TV",
    episodes: entry.episodes,
    genre: "Anime",
    rating: entry.score || 0,
  };
}

function Poster({ anime, className = "" }: { anime: Anime; className?: string }) {
  const externalStyle = anime.image
    ? { backgroundImage: `url(${anime.image})`, backgroundPosition: "center", backgroundSize: "cover" }
    : {
        backgroundImage: `url(/images/poster-atlas-${anime.atlas === 1 ? "one" : "two"}.png)`,
        backgroundPosition: positions[anime.frame],
      };
  return (
    <div
      className={`poster-art ${className}`}
      style={externalStyle}
      role="img"
      aria-label={`Pôster de ${anime.title}`}
    />
  );
}

function AnimeCard({ anime, compact = false }: { anime: Anime; compact?: boolean }) {
  return (
    <Link href={`/anime/${anime.slug}`} className={`anime-card ${compact ? "compact" : ""}`} aria-label={`Abrir ${anime.title}`}>
      <Poster anime={anime} />
      <div className="card-shade" />
      <div className="card-copy">
        <strong>{anime.title}</strong>
        <span>{anime.year || "A definir"} · {genrePt(anime.genre)}</span>
      </div>
      <span className="card-score">★ {anime.rating ? anime.rating.toFixed(2) : "—"}</span>
    </Link>
  );
}

function useAnimeFeed(query: string | null = "", limit = 24) {
  const [items, setItems] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (query === null) {
      setItems([]);
      setLoading(true);
      setError("");
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetchAnimeList(query, limit, controller.signal)
      .then(setItems)
      .catch((reason) => {
        if (reason?.name !== "AbortError") setError(reason instanceof Error ? reason.message : "Não foi possível carregar os animes.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, limit, reload]);

  return { items, loading, error, retry: () => setReload((value) => value + 1) };
}

function usePaginatedAnimeFeed(query: string | null = "") {
  const [items, setItems] = useState<Anime[]>([]);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (query === null) {
      setItems([]);
      setPage(0);
      setHasNextPage(true);
      setTotal(null);
      setLoading(true);
      setError("");
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetchAnimePage(query, 1, 25, controller.signal)
      .then((result) => {
        setItems(result.items);
        setPage(result.page);
        setHasNextPage(result.hasNextPage);
        setTotal(result.total);
      })
      .catch((reason) => {
        if (reason?.name !== "AbortError") setError(reason instanceof Error ? reason.message : "Não foi possível carregar os animes.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, reload]);

  async function loadMore() {
    if (query === null || loading || loadingMore || !hasNextPage) return;
    setLoadingMore(true);
    setError("");
    try {
      const result = await fetchAnimePage(query, page + 1, 25);
      setItems((current) => {
        const bySlug = new Map(current.map((anime) => [anime.slug, anime]));
        result.items.forEach((anime) => bySlug.set(anime.slug, anime));
        return [...bySlug.values()];
      });
      setPage(result.page);
      setHasNextPage(result.hasNextPage);
      setTotal(result.total);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível carregar mais animes.");
    } finally {
      setLoadingMore(false);
    }
  }

  return { items, page, hasNextPage, total, loading, loadingMore, error, loadMore, retry: () => setReload((value) => value + 1) };
}

function LoadingCards({ count = 7, grid = false }: { count?: number; grid?: boolean }) {
  return <div className={grid ? "catalog-grid api-loading-grid" : "poster-row api-loading-row"} aria-label="Carregando dados dos animes">{Array.from({ length: count }, (_, index) => <div className="anime-card anime-skeleton" key={index}><span /></div>)}</div>;
}

function ApiError({ message, retry, compact = false }: { message: string; retry: () => void; compact?: boolean }) {
  return <div className={`api-error ${compact ? "compact" : ""}`}><b>Não foi possível acessar o catálogo.</b><span>{message}</span><button className="ghost-button" onClick={retry}>Tentar novamente</button></div>;
}

function userLabel(user: SessionUser) {
  const label = user.username || user.displayName || user.email;
  return label.includes("@") ? label.split("@")[0] : label;
}

function profileImageStyle(url?: string | null) {
  return url ? { backgroundImage: `url(${url})`, backgroundPosition: "center", backgroundSize: "cover" } : undefined;
}

function userInitials(user: SessionUser) {
  return userLabel(user)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "YU";
}

function SearchBox({ mobileOpen, onMobileOpenChange }: { mobileOpen: boolean; onMobileOpenChange: (open: boolean) => void }) {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const form = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const currentQuery = new URLSearchParams(window.location.search).get("q") || "";
    setValue(currentQuery);
  }, []);

  useEffect(() => {
    const search = value.trim();
    if (search.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setError("");
      setActiveIndex(-1);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(() => {
      setError("");
      fetchAnimeList(search, 6, controller.signal)
        .then((items) => {
          setSuggestions(items);
          setActiveIndex(-1);
        })
        .catch((reason) => {
          if (reason?.name !== "AbortError") setError("Não foi possível carregar as sugestões.");
        })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  useEffect(() => {
    function closeSearch(event: PointerEvent) {
      const target = event.target as HTMLElement;
      if (target.closest(".mobile-search-button")) return;
      if (form.current && !form.current.contains(target)) {
        setOpen(false);
        onMobileOpenChange(false);
      }
    }
    function focusSearch(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        onMobileOpenChange(true);
        window.setTimeout(() => input.current?.focus(), 0);
      }
    }
    document.addEventListener("pointerdown", closeSearch);
    document.addEventListener("keydown", focusSearch);
    return () => {
      document.removeEventListener("pointerdown", closeSearch);
      document.removeEventListener("keydown", focusSearch);
    };
  }, [onMobileOpenChange]);

  useEffect(() => {
    if (mobileOpen) window.setTimeout(() => input.current?.focus(), 0);
  }, [mobileOpen]);

  function handleKeys(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      onMobileOpenChange(false);
      input.current?.blur();
      return;
    }
    if (!suggestions.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    }
    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      window.location.assign(`/anime/${suggestions[activeIndex].slug}`);
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    if (!value.trim()) {
      event.preventDefault();
      input.current?.focus();
      return;
    }
    setOpen(false);
    onMobileOpenChange(false);
  }

  const showResults = open && value.trim().length >= 2;

  return (
    <form ref={form} className={`search ${mobileOpen ? "mobile-open" : ""}`} action="/catalog" onSubmit={submitSearch} role="search">
      <span className="search-icon" aria-hidden="true">⌕</span>
      <input
        ref={input}
        name="q"
        value={value}
        onChange={(event) => { setValue(event.target.value); setOpen(true); }}
        onFocus={() => setOpen(value.trim().length >= 2)}
        onKeyDown={handleKeys}
        aria-label="Pesquisar anime"
        aria-autocomplete="list"
        aria-controls="anime-search-suggestions"
        aria-expanded={showResults}
        aria-activedescendant={activeIndex >= 0 ? `anime-suggestion-${activeIndex}` : undefined}
        autoComplete="off"
        placeholder="Pesquise um anime pelo título…"
      />
      {value && <button className="search-clear" type="button" onClick={() => { setValue(""); setSuggestions([]); input.current?.focus(); }} aria-label="Limpar pesquisa">×</button>}
      <kbd>⌘ K</kbd>
      {showResults && <div className="search-results" id="anime-search-suggestions" role="listbox" aria-label="Sugestões de anime">
        <div className="search-results-head"><span>Sugestões para “{value.trim()}”</span><small>Pressione Enter para pesquisar tudo</small></div>
        {loading && <div className="search-state"><i /> Pesquisando na API de animes…</div>}
        {!loading && error && <div className="search-state error">{error}</div>}
        {!loading && !error && suggestions.map((anime, index) => (
          <Link
            id={`anime-suggestion-${index}`}
            href={`/anime/${anime.slug}`}
            className={`search-suggestion ${activeIndex === index ? "active" : ""}`}
            role="option"
            aria-selected={activeIndex === index}
            key={anime.slug}
          >
            <Poster anime={anime} />
            <span><b>{anime.title}</b><small>{anime.year || "A definir"} · {formatPt(anime.format)} · {genrePt(anime.genre)}</small></span>
            <em>★ {anime.rating ? anime.rating.toFixed(2) : "—"}</em>
          </Link>
        ))}
        {!loading && !error && !suggestions.length && <div className="search-state">Nenhum anime encontrado para “{value.trim()}”.</div>}
        {!loading && !error && suggestions.length > 0 && <button className="search-all" type="submit">Ver todos os resultados para “{value.trim()}” <span>↗</span></button>}
      </div>}
    </form>
  );
}

function Header({ theme, onTheme, onAuth, user, language, onLanguage }: { theme: string; onTheme: () => void; onAuth: (modal: Modal) => void; user: SessionUser | null | undefined; language: Language; onLanguage: (language: Language) => void }) {
  const [menu, setMenu] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showBack, setShowBack] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const profileMenu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShowBack(window.location.pathname !== "/");
  }, []);

  useEffect(() => {
    function closeProfile(event: PointerEvent) {
      if (profileMenu.current && !profileMenu.current.contains(event.target as Node)) setProfileOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileOpen(false);
    }
    document.addEventListener("pointerdown", closeProfile);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeProfile);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function goBack() {
    if (window.history.length > 1) window.history.back();
    else window.location.assign("/");
  }

  return (
    <header className="site-header">
      <div className="header-identity">
        {showBack && <button className="back-button" onClick={goBack} aria-label="Voltar" title="Voltar">←</button>}
        <Link href="/" className="brand" aria-label="Início do Yugen">Yugen<span>.</span></Link>
      </div>
      <button className="menu-button" onClick={() => setMenu(!menu)} aria-label="Abrir ou fechar navegação">{menu ? "×" : "☰"}</button>
      <nav className={menu ? "open" : ""} aria-label="Navegação principal">
        <Link href="/">Início</Link>
        <Link href="/catalog">Catálogo</Link>
        <Link href="/calendar">Calendário</Link>
        <Link href="/news">Notícias</Link>
        <Link href="/collections">Coleções</Link>
        <Link href="/discussions">Discussões</Link>
      </nav>
      <SearchBox mobileOpen={mobileSearchOpen} onMobileOpenChange={setMobileSearchOpen} />
      <div className="header-actions">
        <button className="mobile-search-button" onClick={() => setMobileSearchOpen((open) => !open)} aria-label="Abrir pesquisa de anime" aria-expanded={mobileSearchOpen}>⌕</button>
        <label className="language-control" data-no-translate title="Idioma / Language / Idioma">
          <span aria-hidden="true">◎</span>
          <select value={language} onChange={(event) => onLanguage(event.target.value as Language)} aria-label="Idioma / Language / Idioma">
            {languageOptions.map((option) => <option value={option.value} key={option.value}>{option.short} · {option.label}</option>)}
          </select>
        </label>
        <button className="icon-button" onClick={onTheme} aria-label={`Mudar para o modo ${theme === "dark" ? "claro" : "escuro"}`}>{theme === "dark" ? "☼" : "☾"}</button>
        {user === null && <>
          <button className="ghost-button" onClick={() => onAuth("login")}>Entrar</button>
          <button className="primary-button small" onClick={() => onAuth("join")}>Criar conta</button>
        </>}
        {user === undefined && <span className="auth-placeholder" aria-hidden="true" />}
        {user && <div className="profile-control" ref={profileMenu}>
          <button className="profile-trigger" onClick={() => setProfileOpen(!profileOpen)} aria-expanded={profileOpen} aria-haspopup="menu" aria-label="Abrir menu do perfil">
            <span className={`mini-avatar ${user.avatarUrl ? "has-image" : ""}`} style={profileImageStyle(user.avatarUrl)}>{!user.avatarUrl && userInitials(user)}</span>
            <span className="profile-trigger-name">{userLabel(user)}</span>
            <span aria-hidden="true">⌄</span>
          </button>
          {profileOpen && <div className="profile-menu" role="menu">
            <div className="profile-menu-header"><span className={`mini-avatar ${user.avatarUrl ? "has-image" : ""}`} style={profileImageStyle(user.avatarUrl)}>{!user.avatarUrl && userInitials(user)}</span><div><b>{userLabel(user)}</b><small>{user.email}</small></div></div>
            <Link href="/profile" role="menuitem" onClick={() => setProfileOpen(false)}><span>◎</span> Ver perfil</Link>
            <Link href="/calendar" role="menuitem" onClick={() => setProfileOpen(false)}><span>◷</span> Calendário</Link>
            <Link href="/settings" role="menuitem" onClick={() => setProfileOpen(false)}><span>✎</span> Editar perfil</Link>
            <button type="button" className="profile-menu-action" role="menuitem" onClick={() => signOut({ redirectTo: "/" })}><span>↪</span> Sair</button>
          </div>}
        </div>}
      </div>
    </header>
  );
}

function HomeView({ openAuth, language, user, library, saveLibrary }: { openAuth: (modal: Modal) => void; language: Language; user: SessionUser | null | undefined; library: LibraryEntry[]; saveLibrary: SaveLibrary }) {
  const feed = useAnimeFeed("", 24);
  const featured = feed.items[0];
  const featuredEntry = library.find((entry) => entry.slug === featured?.slug);
  const continueWatching = library.filter((entry) => entry.status === "watching" && entry.progressEpisodes > 0).slice(0, 6);
  const recommendations = feed.items.filter((anime) => !library.some((entry) => entry.slug === anime.slug)).slice(0, 8);
  const featuredTitle = featured?.title.split(" ") || [];
  const translatedSynopsis = useTranslatedSynopsis(featured?.synopsis || featured?.blurb, language);
  async function saveFeatured() {
    if (!featured) return;
    if (!user) return openAuth("login");
    await saveLibrary(featured, { status: "to_watch" });
  }
  return (
    <>
      <section className="hero">
        <div className="hero-image" style={featured?.backdrop ? { backgroundImage: `url(${featured.backdrop})` } : { backgroundImage: "none" }} />
        <div className="hero-glow" />
        <div className="hero-content">
          <p className="eyebrow"><span /> {feed.loading ? "Atualizando pela Jikan" : feed.error ? "API de animes indisponível" : "Destaque ao vivo · Jikan / MyAnimeList"}</p>
          <h1>{featuredTitle[0] || (feed.error ? "Catálogo" : "Carregando")}<br /><em>{featuredTitle.slice(1).join(" ") || (feed.error ? "indisponível" : "anime…")}</em></h1>
          <p className="hero-copy">{featured ? (translatedSynopsis.loading ? "Traduzindo sinopse…" : translatedSynopsis.text) : (feed.error ? "O site está aguardando a API Jikan. Nenhum anime adicionado manualmente será exibido." : "Buscando os dados mais recentes dos animes…")}</p>
          <div className="button-row">
            {featured ? <Link className="primary-button" href={`/anime/${featured.slug}`}>Saiba mais <span>↗</span></Link> : <button className="primary-button" onClick={feed.retry}>{feed.error ? "Tentar novamente" : "Carregando…"}</button>}
            <button className={`glass-button ${featuredEntry ? "selected" : ""}`} onClick={saveFeatured} disabled={!featured}>{featuredEntry ? "✓ Na sua lista" : "+ Quero assistir"}</button>
          </div>
          <div className="hero-meta">
            <span><b>{featured?.rating ? featured.rating.toFixed(2) : "—"}</b> nota da comunidade</span>
            <span><b>{featured?.episodes ?? "—"}</b> episódios</span>
            <span><b>{featured?.ratingLabel?.split(" ")[0] || "—"}</b> classificação indicativa</span>
          </div>
        </div>
        <div className="hero-index"><span>01</span><i /><span>05</span></div>
        <a href="#discover" className="scroll-cue">ROLE PARA DESCOBRIR <span>↓</span></a>
      </section>

      <main id="discover" className="content-shell">
        <section className="editorial-intro">
          <div>
            <p className="eyebrow">Selecionado pelo gosto, não pelo ruído</p>
            <h2>Histórias que valem<br /><em>uma noite acordado.</em></h2>
          </div>
          <p>O Yugen reúne descobertas, contexto e conversas da comunidade em um espaço tranquilo da internet.</p>
        </section>

        {continueWatching.length > 0 && <section className="continue-section">
          <div className="section-heading"><div><p className="eyebrow">Retome de onde parou</p><h2>Continuar assistindo</h2></div><Link href="/profile">Abrir biblioteca <span>↗</span></Link></div>
          <div className="continue-grid">{continueWatching.map((entry) => {
            const total = entry.episodes || Math.max(entry.progressEpisodes, 1);
            const progress = Math.min(100, Math.round((entry.progressEpisodes / total) * 100));
            return <Link href={`/anime/${entry.slug}`} className="continue-card" key={entry.slug}><Poster anime={animeFromLibrary(entry)} /><div><span>{libraryStatusLabel(entry.status)}</span><h3>{entry.title}</h3><p>Episódio {entry.progressEpisodes} de {entry.episodes || "?"}</p><i><b style={{ width: `${progress}%` }} /></i></div><strong>▶</strong></Link>;
          })}</div>
        </section>}

        {feed.loading ? <section className="carousel-section"><div className="section-heading"><div><p className="eyebrow">Com base na sua atividade</p><h2>Recomendados para você</h2></div></div><LoadingCards /></section> : feed.error ? <ApiError message={feed.error} retry={feed.retry} /> : <Carousel title="Recomendados para você" subtitle="Com base na sua atividade e no catálogo ao vivo" items={recommendations.length ? recommendations : feed.items.slice(0, 8)} />}

        <section className="collection-feature">
          <div className="section-heading">
            <div><p className="eyebrow">Criadas pela comunidade</p><h2>Coleções em destaque</h2></div>
            <Link href="/collections">Explorar todas <span>↗</span></Link>
          </div>
          {feed.loading ? <LoadingCards count={3} grid /> : feed.error ? <ApiError message={feed.error} retry={feed.retry} compact /> : feed.items.length ? <div className="collection-grid">
            {collections.slice(0, 3).map((collection, index) => (
              <Link href="/collections" className="collection-card" key={collection.title}>
                <div className="collection-posters">
                  {collection.frames.map((frame, posterIndex) => <Poster key={frame} anime={feed.items[frame % feed.items.length]} className={`stack-${posterIndex}`} />)}
                </div>
                <div className="collection-copy"><span>0{index + 1}</span><div><h3>{collection.title}</h3><p>{collection.count} títulos · por @{collection.owner}</p></div><b>↗</b></div>
              </Link>
            ))}
          </div> : <EmptyData label="A API não retornou animes para estas coleções." />}
        </section>

        {feed.loading ? <section className="carousel-section"><div className="section-heading"><div><p className="eyebrow">O que a comunidade não para de comentar</p><h2>Em alta agora</h2></div></div><LoadingCards /></section> : !feed.error && <Carousel title="Em alta agora" subtitle="O que a comunidade não para de comentar" items={feed.items.slice(8, 16)} />}

        <section className="popular-section">
          <div className="section-heading"><div><p className="eyebrow">O cânone compartilhado</p><h2>Mais populares</h2></div><Link href="/catalog">Ver catálogo <span>↗</span></Link></div>
          {feed.loading ? <LoadingCards count={12} grid /> : feed.error ? <ApiError message={feed.error} retry={feed.retry} compact /> : <div className="popular-grid">{feed.items.slice(0, 12).map((anime) => <AnimeCard anime={anime} key={anime.slug} compact />)}</div>}
          <Link href="/catalog" className="wide-button">Mostrar mais <span>↓</span></Link>
        </section>

        <section className="join-banner">
          <p className="eyebrow">Seu próximo favorito está esperando</p>
          <h2>Guarde cada história<br /><em>por perto.</em></h2>
          <p>Acompanhe o que assiste, crie coleções e encontre pessoas que enxergam as mesmas coisas que você.</p>
          <button className="primary-button" onClick={() => openAuth("join")}>Criar sua biblioteca <span>↗</span></button>
        </section>
      </main>
    </>
  );
}

function Carousel({ title, subtitle, items }: { title: string; subtitle: string; items: Anime[] }) {
  const row = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  function updateControls() {
    const element = row.current;
    if (!element) return;
    setAtStart(element.scrollLeft <= 2);
    setAtEnd(element.scrollWidth - element.clientWidth - element.scrollLeft <= 2);
  }

  useEffect(() => {
    updateControls();
    window.addEventListener("resize", updateControls);
    return () => window.removeEventListener("resize", updateControls);
  }, [items.length]);

  function move(direction: -1 | 1) {
    const element = row.current;
    if (!element) return;
    element.scrollBy({ left: direction * Math.max(260, element.clientWidth * 0.72), behavior: "smooth" });
  }

  return (
    <section className="carousel-section">
      <div className="section-heading"><div><p className="eyebrow">{subtitle}</p><h2>{title}</h2></div><div className="carousel-buttons" aria-label={`Controles do carrossel ${title}`}><button onClick={() => move(-1)} disabled={atStart} aria-label={`Itens anteriores em ${title}`} title="Anterior">←</button><button onClick={() => move(1)} disabled={atEnd} aria-label={`Próximos itens em ${title}`} title="Próximo">→</button></div></div>
      <div className="poster-row" ref={row} onScroll={updateControls}>{items.map((anime) => <AnimeCard anime={anime} key={anime.slug} />)}</div>
    </section>
  );
}

const broadcastDays: Array<[string, string]> = [["Mondays", "Segunda"], ["Tuesdays", "Terça"], ["Wednesdays", "Quarta"], ["Thursdays", "Quinta"], ["Fridays", "Sexta"], ["Saturdays", "Sábado"], ["Sundays", "Domingo"]];

function CalendarView({ user, library, saveLibrary, openAuth }: { user: SessionUser | null | undefined; library: LibraryEntry[]; saveLibrary: SaveLibrary; openAuth: (modal: Modal) => void }) {
  const [items, setItems] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDay, setSelectedDay] = useState(() => broadcastDays[(new Date().getDay() + 6) % 7][0]);

  useEffect(() => {
    const controller = new AbortController();
    fetchSeasonNow(25, controller.signal)
      .then(setItems)
      .catch((reason) => { if (reason?.name !== "AbortError") setError("Não foi possível carregar o calendário desta temporada."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const scheduled = items.filter((anime) => anime.broadcastDay === selectedDay);
  const visible = scheduled.length ? scheduled : items.slice(0, 8);
  async function remind(anime: Anime) {
    if (!user) return openAuth("login");
    await saveLibrary(anime, { status: "watching" });
  }

  return <main className="page-shell calendar-page">
    <header className="page-title split"><div><p className="eyebrow">Lançamentos da temporada atual</p><h1>Sua semana<br /><em>em episódios.</em></h1><p>Acompanhe os animes em exibição e guarde os próximos episódios na sua biblioteca.</p></div><div className="calendar-summary"><b>{items.length}</b><span>animes em exibição</span></div></header>
    <nav className="day-switcher" aria-label="Dias da semana">{broadcastDays.map(([value, label]) => <button className={selectedDay === value ? "active" : ""} onClick={() => setSelectedDay(value)} key={value}><span>{label.slice(0, 3)}</span><b>{label}</b></button>)}</nav>
    {loading ? <LoadingCards count={8} grid /> : error ? <ApiError message={error} retry={() => window.location.reload()} /> : <section className="schedule-list"><div className="schedule-head"><p className="eyebrow">{broadcastDays.find(([value]) => value === selectedDay)?.[1]}</p><h2>{scheduled.length ? `${scheduled.length} lançamentos` : "Destaques da temporada"}</h2></div>{visible.map((anime, index) => {
      const entry = library.find((item) => item.slug === anime.slug);
      return <article className="schedule-item" key={anime.slug}><time>{anime.broadcastTime || `${String(18 + (index % 5)).padStart(2, "0")}:00`}</time><Poster anime={anime} /><div><span>{formatPt(anime.format)} · {statusPt(anime.status)}</span><h3><Link href={`/anime/${anime.slug}`}>{anime.title}</Link></h3><p>{anime.episodes ? `${anime.episodes} episódios` : "Episódios em atualização"} · {anime.studio}</p></div><button className={entry ? "ghost-button selected" : "ghost-button"} onClick={() => remind(anime)}>{entry ? "✓ Na biblioteca" : "＋ Lembrar-me"}</button></article>;
    })}</section>}
  </main>;
}

function CharacterView({ slug }: { slug?: string }) {
  const characterId = Number(slug);
  const [character, setCharacter] = useState<CharacterDetail | null>(null);
  const [loading, setLoading] = useState(Boolean(characterId));
  const [error, setError] = useState(characterId ? "" : "Personagem inválido.");
  useEffect(() => {
    if (!characterId) return;
    const controller = new AbortController();
    fetchCharacterDetail(characterId, controller.signal)
      .then(setCharacter)
      .catch((reason) => { if (reason?.name !== "AbortError") setError("Não foi possível carregar este personagem."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [characterId]);
  if (loading) return <main className="page-shell character-page"><div className="character-loading detail-skeleton" /></main>;
  if (!character || error) return <main className="page-shell detail-error-page"><p className="eyebrow">Jikan / MyAnimeList</p><h1>Personagem indisponível.</h1><p>{error}</p><Link className="primary-button" href="/catalog">Voltar ao catálogo</Link></main>;
  return <main className="page-shell character-page"><header className="character-hero"><div className="character-photo" style={character.image ? { backgroundImage: `url(${character.image})` } : undefined} /><div><p className="eyebrow">Personagem · Jikan / MyAnimeList</p><h1>{character.name}</h1>{character.nameKanji && <p className="character-kanji">{character.nameKanji}</p>}<div className="character-meta"><span><b>♥ {character.favorites.toLocaleString("pt-BR")}</b> favoritos na base</span><span><b>{character.anime.length}</b> aparições em destaque</span></div></div></header><section className="character-layout"><article className="character-about"><p className="eyebrow">Biografia</p><h2>Sobre<br /><em>{character.name}</em></h2><p>{character.about}</p></article><aside><p className="eyebrow">Vozes</p><h2>Dubladores</h2>{character.voices.length ? character.voices.map((voice) => <div className="voice-credit" key={`${voice.name}-${voice.language}`}><div className="voice-photo" style={voice.image ? { backgroundImage: `url(${voice.image})` } : undefined} /><div><b>{voice.name}</b><span>{voice.language}</span></div></div>) : <p>Não informado.</p>}</aside></section><section className="character-anime"><div className="section-heading"><div><p className="eyebrow">Filmografia</p><h2>Animes relacionados</h2></div></div><div className="popular-grid">{character.anime.map((credit) => <AnimeCard key={credit.id} anime={{ ...emptyAnime, slug: `mal-${credit.id}`, title: credit.title, image: credit.image, genre: credit.role, format: "Anime" }} compact />)}</div></section></main>;
}

function CatalogView() {
  const [query, setQuery] = useState<string | null>(null);
  const [genre, setGenre] = useState("All");
  const [season, setSeason] = useState("All");
  const [studio, setStudio] = useState("All");
  const [format, setFormat] = useState("All");
  const [airing, setAiring] = useState("All");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [sort, setSort] = useState("Relevance");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const feed = usePaginatedAnimeFeed(query);

  useEffect(() => {
    setQuery(new URLSearchParams(window.location.search).get("q") || "");
  }, []);

  const availableGenres = useMemo(() => Array.from(new Set(feed.items.flatMap((anime) => anime.genres || [anime.genre]))).sort().slice(0, 14), [feed.items]);
  const availableStudios = useMemo(() => Array.from(new Set(feed.items.flatMap((anime) => anime.studios || [anime.studio]))).filter(Boolean).sort(), [feed.items]);
  const availableFormats = useMemo(() => Array.from(new Set(feed.items.map((anime) => anime.format))).filter(Boolean).sort(), [feed.items]);
  const availableStatuses = useMemo(() => Array.from(new Set(feed.items.map((anime) => anime.status))).filter(Boolean).sort(), [feed.items]);
  const results = useMemo(() => {
    const from = Number(yearFrom) || 0;
    const to = Number(yearTo) || 9999;
    let list = feed.items.filter((anime) =>
      (genre === "All" || (anime.genres || [anime.genre]).includes(genre))
      && (season === "All" || anime.season === season)
      && (studio === "All" || (anime.studios || [anime.studio]).includes(studio))
      && (format === "All" || anime.format === format)
      && (airing === "All" || anime.status === airing)
      && (!anime.year || (anime.year >= from && anime.year <= to))
    );
    if (sort === "Popularity") list = [...list].sort((a, b) => (a.popularity || 99999) - (b.popularity || 99999));
    if (sort === "Rating") list = [...list].sort((a, b) => b.rating - a.rating);
    if (sort === "Newest") list = [...list].sort((a, b) => b.year - a.year);
    return list;
  }, [airing, feed.items, format, genre, season, sort, studio, yearFrom, yearTo]);

  function clearFilters() {
    setGenre("All");
    setSeason("All");
    setStudio("All");
    setFormat("All");
    setAiring("All");
    setYearFrom("");
    setYearTo("");
  }

  return (
    <main className="page-shell catalog-page">
      <header className="page-title"><p className="eyebrow">Dados ao vivo da Jikan / MyAnimeList</p><h1>{query ? <>Resultados para<br /><em>“{query}”</em></> : <>Encontre sua próxima<br /><em>obsessão.</em></>}</h1><p>{query ? <>Mostrando as correspondências mais próximas para <b>“{query}”</b>. Refine o termo no campo de pesquisa acima se necessário.</> : <>Sinopses, trailers, personagens e detalhes de produção atualizados pela base de animes.</>}</p></header>
      <div className="catalog-toolbar">
        <button className="filter-mobile" onClick={() => setFiltersOpen(!filtersOpen)}>☷ Filtros</button>
        <p>{feed.loading ? "Atualizando catálogo…" : <>Mostrando <b>{results.length}</b>{feed.total ? <> de <b>{feed.total.toLocaleString("pt-BR")}</b> títulos disponíveis</> : <> títulos carregados</>}</>}</p>
        <label>Ordenar por <select value={sort} onChange={(e) => setSort(e.target.value)}><option value="Relevance">Relevância</option><option value="Popularity">Popularidade</option><option value="Rating">Nota</option><option value="Newest">Mais recentes</option></select></label>
      </div>
      <div className="catalog-layout">
        <aside className={filtersOpen ? "filters open" : "filters"}>
          <FilterGroup title="Ano"><div className="range-pair"><input aria-label="Ano inicial" inputMode="numeric" placeholder="De" value={yearFrom} onChange={(event) => setYearFrom(event.target.value.replace(/\D/g, "").slice(0, 4))} /><span>—</span><input aria-label="Ano final" inputMode="numeric" placeholder="Até" value={yearTo} onChange={(event) => setYearTo(event.target.value.replace(/\D/g, "").slice(0, 4))} /></div></FilterGroup>
          <FilterGroup title="Temporada"><div className="filter-chips">{["All", "Winter", "Spring", "Summer", "Fall"].map((item) => <button className={season === item ? "active" : ""} onClick={() => setSeason(item)} key={item}>{item === "All" ? "Todas" : seasonPt(item)}</button>)}</div></FilterGroup>
          <FilterGroup title="Gêneros"><div className="checkbox-list">{["All", ...availableGenres].map((item) => <label key={item}><input type="radio" name="genre" checked={genre === item} onChange={() => setGenre(item)} /><span>{item === "All" ? "Todos" : genrePt(item)}</span></label>)}</div></FilterGroup>
          <FilterGroup title="Estúdio"><select value={studio} onChange={(event) => setStudio(event.target.value)}><option value="All">Todos os estúdios</option>{availableStudios.map((item) => <option key={item}>{item}</option>)}</select></FilterGroup>
          <FilterGroup title="Formato"><div className="filter-chips">{["All", ...availableFormats].map((item) => <button className={format === item ? "active" : ""} onClick={() => setFormat(item)} key={item}>{item === "All" ? "Todos" : formatPt(item)}</button>)}</div></FilterGroup>
          <FilterGroup title="Status de exibição"><select value={airing} onChange={(event) => setAiring(event.target.value)}><option value="All">Todos os status</option>{availableStatuses.map((item) => <option value={item} key={item}>{statusPt(item)}</option>)}</select></FilterGroup>
          <button className="clear-button" onClick={clearFilters}>Limpar todos os filtros</button>
        </aside>
        <section>
          {feed.loading ? <LoadingCards count={10} grid /> : feed.error && !feed.items.length ? <ApiError message={feed.error} retry={feed.retry} /> : results.length ? <div className="catalog-grid">{results.map((anime) => <AnimeCard anime={anime} key={anime.slug} />)}</div> : <div className="empty-state"><b>Nenhum anime encontrado entre os títulos carregados.</b><span>Limpe os filtros ou carregue mais páginas do catálogo.</span></div>}
          {!feed.loading && feed.error && feed.items.length > 0 && <ApiError message={feed.error} retry={feed.retry} compact />}
          {!feed.loading && feed.hasNextPage && <button className="wide-button" onClick={feed.loadMore} disabled={feed.loadingMore}>{feed.loadingMore ? "Carregando mais animes…" : "Carregar mais animes"} <span>↓</span></button>}
          {!feed.loading && !feed.hasNextPage && feed.items.length > 0 && <p className="catalog-end">Todos os títulos retornados pela pesquisa foram carregados.</p>}
        </section>
      </div>
    </main>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <details open className="filter-group"><summary>{title}<span>−</span></summary>{children}</details>;
}

type Comment = {
  id: string;
  author: string;
  authorAvatar?: string | null;
  body: string;
  createdAt: string;
  likeCount: number;
  parentId?: string | null;
  animeSlug?: string;
  animeTitle?: string;
  animePoster?: string | null;
};

function discussionTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  return formatter.format(Math.round(hours / 24), "day");
}

function AnimeView({ slug, openModal, language, user, library, saveLibrary }: { slug?: string; openModal: (modal: Modal) => void; language: Language; user: SessionUser | null | undefined; library: LibraryEntry[]; saveLibrary: SaveLibrary }) {
  const remoteId = slug?.startsWith("mal-") ? Number(slug.slice(4)) : 0;
  const [remoteAnime, setRemoteAnime] = useState<Anime | null>(null);
  const [detailLoading, setDetailLoading] = useState(Boolean(remoteId));
  const [detailError, setDetailError] = useState("");
  const [tab, setTab] = useState("Visão geral");
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [libraryMessage, setLibraryMessage] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const anime = remoteAnime ?? emptyAnime;
  const libraryEntry = library.find((entry) => entry.slug === anime.slug);
  const watchState = libraryEntry?.status || "to_watch";
  const progress = libraryEntry?.progressEpisodes || 0;
  const translatedSynopsis = useTranslatedSynopsis(anime.synopsis || anime.blurb, language);

  async function updateLibrary(patch: LibraryPatch) {
    if (!user) return openModal("login");
    setLibraryMessage("Salvando…");
    try {
      await saveLibrary(anime, { status: libraryEntry?.status || "to_watch", progressEpisodes: progress, favorite: libraryEntry?.favorite || false, score: libraryEntry?.score ?? null, ...patch });
      setLibraryMessage("Salvo na sua biblioteca.");
    } catch {
      setLibraryMessage("Não foi possível salvar agora.");
    }
  }

  useEffect(() => {
    if (!remoteId) return;
    const controller = new AbortController();
    setDetailLoading(true);
    setDetailError("");
    fetchAnimeDetail(remoteId, controller.signal)
      .then((detail) => {
        setRemoteAnime(detail);
        Promise.allSettled([
          fetchAnimeCharacters(remoteId, controller.signal),
          fetchAnimeStaff(remoteId, controller.signal),
        ]).then(([characters, staff]) => {
          setRemoteAnime((current) => current ? {
            ...current,
            characters: characters.status === "fulfilled" ? characters.value : current.characters,
            staff: staff.status === "fulfilled" ? staff.value : current.staff,
          } : current);
        });
      })
      .catch((reason) => {
        if (reason?.name !== "AbortError") setDetailError(reason instanceof Error ? reason.message : "Não foi possível carregar este anime.");
      })
      .finally(() => { if (!controller.signal.aborted) setDetailLoading(false); });
    return () => controller.abort();
  }, [remoteId]);

  useEffect(() => {
    const animeSlug = slug || anime.slug;
    if (!animeSlug) return;
    const controller = new AbortController();
    fetch(`/api/discussions?anime=${encodeURIComponent(animeSlug)}`, { cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setComments(data?.comments ?? []))
      .catch(() => undefined);
    return () => controller.abort();
  }, [slug, anime.slug]);

  useEffect(() => {
    if (!trailerOpen) return;
    function closeTrailer(event: KeyboardEvent) {
      if (event.key === "Escape") setTrailerOpen(false);
    }
    document.addEventListener("keydown", closeTrailer);
    return () => document.removeEventListener("keydown", closeTrailer);
  }, [trailerOpen]);

  async function publishComment(body: string, parentId?: string | null) {
    setMessage("Publicando…");
    try {
      const response = await fetch("/api/discussions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ animeSlug: slug || anime.slug, animeTitle: anime.title, animePoster: anime.image || null, body, parentId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível publicar");
      setComments((current) => [...current, data.comment]);
      setMessage("Publicado.");
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Entre na sua conta para participar da discussão.");
      return false;
    }
  }

  async function submitComment(event: FormEvent) {
    event.preventDefault();
    if (!comment.trim()) return;
    if (await publishComment(comment.trim())) setComment("");
  }

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tab") === "discussions") setTab("Discussões");
  }, []);

  const tabs = ["Visão geral", "Relações", "Personagens", "Equipe", "Músicas-tema", "Avaliações", "Discussões"];

  if (!remoteId) {
    return <main className="page-shell detail-error-page"><p className="eyebrow">Somente Jikan / MyAnimeList</p><h1>Anime não encontrado na API.</h1><p>Esta página antiga foi removida porque o Yugen agora exibe apenas animes retornados pela Jikan.</p><Link className="primary-button" href="/catalog">Abrir catálogo da API</Link></main>;
  }

  if (detailLoading) {
    return <main className="anime-page anime-detail-loading"><section className="anime-hero"><div className="anime-backdrop" /><div className="anime-backdrop-shade" /></section><section className="anime-summary page-shell"><div className="anime-poster detail-skeleton" /><div className="anime-heading"><p className="eyebrow">Carregando dados do anime</p><div className="title-skeleton" /><div className="copy-skeleton" /><div className="copy-skeleton short" /></div></section></main>;
  }

  if (detailError && remoteId) {
    return <main className="page-shell detail-error-page"><p className="eyebrow">Jikan / MyAnimeList</p><h1>Dados do anime indisponíveis.</h1><p>{detailError}</p><Link className="primary-button" href="/catalog">Voltar ao catálogo</Link></main>;
  }

  return (
    <main className="anime-page">
      <section className="anime-hero">
        <div className="anime-backdrop" style={anime.backdrop ? { backgroundImage: `url(${anime.backdrop})` } : undefined} />
        <div className="anime-backdrop-shade" />
        {anime.trailerUrl && <button className="trailer-button" type="button" onClick={() => setTrailerOpen(true)}>▶ Assistir ao trailer</button>}
      </section>
      <section className="anime-summary page-shell">
        <Poster anime={anime} className="anime-poster" />
        <div className="anime-heading">
          <p className="eyebrow">{formatPt(anime.format)} · {anime.year || "A definir"} · Jikan / MyAnimeList</p>
          <h1>{anime.title}</h1>
          {anime.titleJapanese && <p className="japanese-title">{anime.titleJapanese}</p>}
          <div className="rating"><b>★ {anime.rating ? anime.rating.toFixed(2) : "—"}</b><span>{anime.scoredBy ? `${anime.scoredBy.toLocaleString("pt-BR")} avaliações` : "Aguardando avaliações"}</span></div>
          <p className={translatedSynopsis.loading ? "synopsis-translating" : ""}>{translatedSynopsis.loading ? "Traduzindo sinopse…" : translatedSynopsis.text}</p>
          {translatedSynopsis.error && language !== "en" && <small className="synopsis-note">Não foi possível traduzir a sinopse. Exibindo o texto original.</small>}
          <div className="status-buttons">{([["watching", "Assistindo"], ["to_watch", "Quero assistir"], ["watched", "Assistido"]] as Array<[LibraryStatus, string]>).map(([state, label]) => <button className={watchState === state && libraryEntry ? "selected" : ""} onClick={() => updateLibrary({ status: state, progressEpisodes: state === "watched" && anime.episodes ? anime.episodes : progress })} key={state}>{watchState === state && libraryEntry ? "✓" : "+"} {label}</button>)}</div>
          <div className="episode-tracker">
            <div><span>Progresso dos episódios</span><b>{progress} / {anime.episodes || "?"}</b></div>
            <div className="progress-line"><i style={{ width: `${anime.episodes ? Math.min(100, (progress / anime.episodes) * 100) : 0}%` }} /></div>
            <div className="episode-controls"><button onClick={() => updateLibrary({ status: progress > 1 ? "watching" : watchState, progressEpisodes: Math.max(0, progress - 1) })} disabled={!progress} aria-label="Diminuir episódio">−</button><button onClick={() => updateLibrary({ status: anime.episodes && progress + 1 >= anime.episodes ? "watched" : "watching", progressEpisodes: anime.episodes ? Math.min(anime.episodes, progress + 1) : progress + 1 })} aria-label="Marcar próximo episódio">＋ Marcar próximo episódio</button><label>Sua nota <select value={libraryEntry?.score || ""} onChange={(event) => updateLibrary({ score: event.target.value ? Number(event.target.value) : null })}><option value="">—</option>{Array.from({ length: 10 }, (_, index) => 10 - index).map((score) => <option value={score} key={score}>{score}</option>)}</select></label></div>
            {libraryMessage && <small>{libraryMessage}</small>}
          </div>
        </div>
        <div className="anime-side-actions"><button className={`favorite-button ${libraryEntry?.favorite ? "selected" : ""}`} onClick={() => updateLibrary({ favorite: !libraryEntry?.favorite })}>{libraryEntry?.favorite ? "♥ Favorito" : "♡ Favoritar"}</button><button className="collection-button" onClick={() => openModal("collection")}>＋ Adicionar à coleção</button></div>
      </section>
      <section className="page-shell anime-body">
        <div className="tabs" role="tablist">{tabs.map((item) => <button role="tab" aria-selected={tab === item} className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item}>{item}{item === "Discussões" && comments.length > 0 && <span>{comments.length}</span>}</button>)}</div>
        {tab === "Visão geral" && <Overview anime={anime} synopsis={translatedSynopsis} language={language} />}
        {tab === "Relações" && <RelationsTab anime={anime} />}
        {tab === "Personagens" && <CharactersTab anime={anime} />}
        {tab === "Equipe" && <StaffTab anime={anime} />}
        {tab === "Músicas-tema" && <ThemeMusicTab anime={anime} />}
        {tab === "Avaliações" && <ReviewsTab anime={anime} entry={libraryEntry} updateLibrary={updateLibrary} />}
        {tab === "Discussões" && <DiscussionTab comments={comments} comment={comment} setComment={setComment} submit={submitComment} onReply={publishComment} message={message} />}
      </section>
      {anime.trailerUrl && trailerOpen && <div className="trailer-modal-backdrop" role="dialog" aria-modal="true" aria-label={`Trailer de ${anime.title}`} onMouseDown={() => setTrailerOpen(false)}><div className="trailer-modal" onMouseDown={(event) => event.stopPropagation()}><button className="trailer-close" type="button" onClick={() => setTrailerOpen(false)} aria-label="Fechar trailer">×</button><iframe src={anime.trailerUrl} title={`Trailer de ${anime.title}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div></div>}
    </main>
  );
}

function Overview({ anime, synopsis, language }: { anime: Anime; synopsis: SynopsisTranslation; language: Language }) {
  const openings = anime.themes?.openings || [];
  const endings = anime.themes?.endings || [];
  return (
    <div className="overview-grid">
      <aside className="detail-list"><h3>Detalhes</h3><dl><div><dt>Formato</dt><dd>{formatPt(anime.format)}</dd></div><div><dt>Episódios</dt><dd>{anime.episodes ?? "Desconhecido"}</dd></div><div><dt>Duração</dt><dd>{durationPt(anime.duration)}</dd></div><div><dt>Gêneros</dt><dd>{(anime.genres || [anime.genre]).map(genrePt).join(", ")}</dd></div><div><dt>Estúdio</dt><dd>{(anime.studios || [anime.studio]).join(", ")}</dd></div><div><dt>Exibição</dt><dd>{airedPt(anime.aired || String(anime.year))}</dd></div><div><dt>Status</dt><dd>{statusPt(anime.status)}</dd></div><div><dt>Temporada</dt><dd>{seasonPt(anime.season)} {anime.year || ""}</dd></div><div><dt>Origem</dt><dd>{localize(anime.source, sourceLabels, "Original")}</dd></div><div><dt>Classificação</dt><dd>{ratingLabelPt(anime.ratingLabel)}</dd></div></dl></aside>
      <article className="description"><p className="eyebrow">Sinopse</p><h2>Sobre<br /><em>{anime.title}</em></h2><p className={synopsis.loading ? "synopsis-translating" : ""}>{synopsis.loading ? "Traduzindo sinopse…" : synopsis.text}</p>{synopsis.error && language !== "en" && <small className="synopsis-note">Não foi possível traduzir a sinopse. Exibindo o texto original.</small>}{anime.titleJapanese && <blockquote>{anime.titleJapanese}</blockquote>}{(openings.length > 0 || endings.length > 0) && <div className="theme-preview"><p className="eyebrow">Músicas-tema</p>{openings[0] && <p><b>Abertura</b><span>{openings[0]}</span></p>}{endings[0] && <p><b>Encerramento</b><span>{endings[0]}</span></p>}</div>}</article>
      <aside className="watch-info"><span>Dados da base</span><div><b>{anime.rating ? anime.rating.toFixed(2) : "—"}</b><small>nota no MyAnimeList</small></div><div><b>{anime.popularity ? `#${anime.popularity}` : "—"}</b><small>posição de popularidade</small></div><div><b>{anime.episodes ?? "—"}</b><small>episódios</small></div></aside>
    </div>
  );
}

function RelationsTab({ anime }: { anime: Anime }) {
  const relations = anime.relations || [];
  return <section className="tab-panel"><p className="eyebrow">Obras conectadas</p><h2>Relações</h2>{relations.length ? <div className="relation-list">{relations.map((group) => <article key={group.relation}><span>{localize(group.relation, relationLabels)}</span><div>{group.entries.map((entry) => entry.type === "anime" ? <Link key={`${entry.type}-${entry.id}`} href={`/anime/mal-${entry.id}`}>{entry.name}<small>anime</small><b>↗</b></Link> : <div className="relation-entry" key={`${entry.type}-${entry.id}`}>{entry.name}<small>{entry.type}</small></div>)}</div></article>)}</div> : <EmptyData label="Nenhuma obra relacionada foi listada para este anime." />}</section>;
}

function CharactersTab({ anime }: { anime: Anime }) {
  const characters = anime.characters || [];
  return <section className="tab-panel"><p className="eyebrow">Elenco principal e personagens coadjuvantes</p><h2>Personagens</h2>{characters.length ? <div className="api-people-grid">{characters.map((character) => <Link className="person-card" href={`/character/${character.id}`} key={character.id}><div className="person-photo" style={character.image ? { backgroundImage: `url(${character.image})` } : undefined} /><div><span>{localize(character.role, roleLabels)}</span><h3>{character.name}</h3><p>{character.voiceActor ? `${character.voiceActor} · voz em japonês` : "Dublador não informado"}</p><small>Ver personagem ↗</small></div></Link>)}</div> : <EmptyData label="As informações dos personagens ainda não estão disponíveis." />}</section>;
}

function StaffTab({ anime }: { anime: Anime }) {
  const staff = anime.staff || [];
  return <section className="tab-panel"><p className="eyebrow">As pessoas por trás da produção</p><h2>Equipe</h2>{staff.length ? <div className="api-people-grid">{staff.map((person) => <article key={person.id}><div className="person-photo" style={person.image ? { backgroundImage: `url(${person.image})` } : undefined} /><div><span>{person.positions.map((position) => localize(position, staffPositionLabels)).join(" · ")}</span><h3>{person.name}</h3><p>Equipe de produção</p></div></article>)}</div> : <EmptyData label="As informações da equipe ainda não estão disponíveis." />}</section>;
}

function ThemeMusicTab({ anime }: { anime: Anime }) {
  const openings = anime.themes?.openings || [];
  const endings = anime.themes?.endings || [];
  return <section className="tab-panel"><p className="eyebrow">Aberturas e encerramentos</p><h2>Músicas-tema</h2>{openings.length || endings.length ? <div className="theme-columns"><article><span>TEMAS DE ABERTURA</span><ol>{openings.map((song) => <li key={song}>{song}</li>)}</ol></article><article><span>TEMAS DE ENCERRAMENTO</span><ol>{endings.map((song) => <li key={song}>{song}</li>)}</ol></article></div> : <EmptyData label="Nenhuma música-tema foi listada para este anime." />}</section>;
}

function EmptyData({ label }: { label: string }) {
  return <div className="empty-data"><span>—</span><p>{label}</p></div>;
}

function SimpleTab({ title, copy, items }: { title: string; copy: string; items: Anime[] }) {
  return <section className="tab-panel"><p className="eyebrow">Histórias conectadas</p><h2>{title}</h2><p>{copy}</p><div className="related-row">{items.map((anime) => <AnimeCard anime={anime} key={anime.slug} />)}</div></section>;
}

function PeopleTab({ title, names }: { title: string; names: string[] }) {
  return <section className="tab-panel"><p className="eyebrow">As pessoas por trás da história</p><h2>{title}</h2><div className="people-grid">{names.map((name, index) => <article key={name}><span>0{index + 1}</span><div><b>{name.split(" · ")[0]}</b><small>{name.split(" · ")[1]}</small></div></article>)}</div></section>;
}

function ReviewsTab({ anime, entry, updateLibrary }: { anime: Anime; entry?: LibraryEntry; updateLibrary: (patch: LibraryPatch) => Promise<void> | void }) {
  const [review, setReview] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const [posted, setPosted] = useState(false);
  return <section className="tab-panel"><p className="eyebrow">Análises aprofundadas</p><h2>Avaliações da comunidade</h2><div className="rating-composer"><div><span>Sua nota para {anime.title}</span><div className="score-buttons">{Array.from({ length: 10 }, (_, index) => index + 1).map((score) => <button className={entry?.score === score ? "active" : ""} onClick={() => updateLibrary({ score })} key={score}>{score}</button>)}</div></div><textarea value={review} onChange={(event) => setReview(event.target.value)} placeholder="Escreva uma avaliação sobre história, personagens, animação ou trilha sonora…" /><footer><label><input type="checkbox" checked={spoiler} onChange={(event) => setSpoiler(event.target.checked)} /> Contém spoiler</label><button className="primary-button small" onClick={() => { if (review.trim()) setPosted(true); }}>{posted ? "✓ Avaliação publicada" : "Publicar avaliação"}</button></footer></div><div className="review-grid">{posted && <article className={spoiler ? "spoiler-review" : ""}><span>{"★".repeat(entry?.score || 0)}{"☆".repeat(10 - (entry?.score || 0))}</span><h3>“Minha avaliação de {anime.title}”</h3><p>{spoiler ? "Conteúdo marcado como spoiler — clique para revelar." : review}</p><small>— você · agora</small></article>}<article><span>★★★★★</span><h3>“Uma ficção científica lindamente paciente.”</h3><p>Uma obra que confia mais em uma imagem prolongada do que em explicações excessivas.</p><small>— @mika.wav · útil para 184 pessoas</small></article><article><span>★★★★☆</span><h3>“O mistério recompensa a atenção.”</h3><p>O quarto episódio muda o significado de quase todos os elementos visuais repetidos.</p><small>— @noa.exe · útil para 93 pessoas</small></article></div></section>;
}

function DiscussionTab({ comments, comment, setComment, submit, onReply, message }: { comments: Comment[]; comment: string; setComment: (value: string) => void; submit: (event: FormEvent) => void; onReply: (body: string, parentId?: string | null) => Promise<boolean>; message: string }) {
  const rootComments = comments.filter((item) => !item.parentId);
  return <section className="discussion-panel"><div className="discussion-heading"><div><p className="eyebrow">Conversa vinculada a este anime</p><h2>Discussões</h2><p className="discussion-lede">Somente comentários publicados por usuários do Yugen aparecem aqui.</p></div></div><form className="comment-form" onSubmit={submit}><div className="avatar">YU</div><textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Compartilhe uma teoria, observação ou pergunta…" aria-label="Novo comentário" /><div><span>{message || "Esta publicação ficará visível para toda a comunidade."}</span><button className="primary-button small" type="submit">Publicar comentário</button></div></form><div className="comment-list">{rootComments.length ? rootComments.map((item) => <CommentItem key={item.id} item={item} replies={comments.filter((reply) => reply.parentId === item.id)} onReply={onReply} />) : <div className="social-empty discussion-empty"><span>○</span><h3>Ainda não há discussões</h3><p>Seja a primeira pessoa a comentar sobre este anime.</p></div>}</div></section>;
}

function CommentItem({ item, replies, onReply }: { item: Comment; replies: Comment[]; onReply: (body: string, parentId?: string | null) => Promise<boolean> }) {
  const [likes, setLikes] = useState(item.likeCount);
  const [liked, setLiked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState("");
  const [notice, setNotice] = useState("");
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);
  if (hidden) return null;

  async function choose(action: "copy" | "report" | "hide") {
    setMenuOpen(false);
    if (action === "copy") {
      await navigator.clipboard?.writeText(`${window.location.origin}${window.location.pathname}#comment-${item.id}`).catch(() => undefined);
      setNotice("Link do comentário copiado.");
    }
    if (action === "report") {
      const response = await fetch("/api/discussions", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ commentId: item.id, action: "report" }) });
      const data = await response.json();
      setNotice(response.ok ? "Comentário enviado para análise da moderação." : data.error || "Não foi possível denunciar.");
    }
    if (action === "hide") setHidden(true);
  }

  async function toggleLike() {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/discussions", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ commentId: item.id, action: "like" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível curtir.");
      setLiked(Boolean(data.liked));
      setLikes(Number(data.likeCount) || 0);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível curtir.");
    } finally {
      setBusy(false);
    }
  }

  async function submitReply(event: FormEvent) {
    event.preventDefault();
    if (!reply.trim() || busy) return;
    setBusy(true);
    const published = await onReply(reply.trim(), item.id);
    setBusy(false);
    if (published) {
      setReply("");
      setReplying(false);
    }
  }

  return <article className="comment" id={`comment-${item.id}`}><div className="avatar has-image" style={profileImageStyle(item.authorAvatar)}>{!item.authorAvatar && item.author.slice(0, 2).toUpperCase()}</div><div><header><b>@{item.author}</b><span>{discussionTime(item.createdAt)}</span><div className="comment-menu-wrap"><button onClick={() => setMenuOpen(!menuOpen)} aria-label="Mais opções do comentário" aria-expanded={menuOpen}>•••</button>{menuOpen && <div className="social-menu comment-menu" role="menu"><button onClick={() => choose("copy")} role="menuitem"><span>⧉</span>Copiar link</button><button onClick={() => choose("report")} role="menuitem"><span>⚑</span>Denunciar comentário</button><button onClick={() => choose("hide")} role="menuitem"><span>⊘</span>Ocultar comentário</button></div>}</div></header><p>{item.body}</p><footer><button onClick={toggleLike} className={liked ? "liked" : ""} disabled={busy}>{liked ? "♥" : "♡"} {likes}</button><button onClick={() => setReplying(!replying)}>↩ Responder</button><button onClick={() => choose("report")}>⚑ Denunciar</button></footer>{replying && <form className="quick-reply" onSubmit={submitReply}><input value={reply} onChange={(event) => setReply(event.target.value)} placeholder={`Responder a @${item.author}`} autoFocus /><button type="button" onClick={() => setReplying(false)}>Cancelar</button><button className="primary-button small" type="submit" disabled={busy}>{busy ? "Enviando…" : "Responder"}</button></form>}{notice && <button className="post-notice" onClick={() => setNotice("")}>{notice}<span>×</span></button>}{replies.map((nestedReply) => <div className="nested" key={nestedReply.id}><div className="avatar has-image" style={profileImageStyle(nestedReply.authorAvatar)}>{!nestedReply.authorAvatar && nestedReply.author.slice(0, 2).toUpperCase()}</div><div><header><b>@{nestedReply.author}</b><span>{discussionTime(nestedReply.createdAt)}</span></header><p>{nestedReply.body}</p><footer><span>♡ {nestedReply.likeCount}</span><button onClick={() => setReplying(true)}>↩ Responder</button></footer></div></div>)}</div></article>;
}

type SocialPost = {
  id: string;
  author: string;
  handle: string;
  initials: string;
  authorAvatar?: string | null;
  body: string;
  time: string;
  replies: number;
  reposts: number;
  likes: number;
  anime?: Anime;
  label?: string;
  verified?: boolean;
  following?: boolean;
  spoiler?: boolean;
  imageUrl?: string;
  poll?: { first: string; second: string };
};

type SocialSection = "feed" | "explore";

function SocialPostCard({ post, onHide }: { post: SocialPost; onHide: () => void }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState("");
  const [replyCount, setReplyCount] = useState(post.replies);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [spoilerVisible, setSpoilerVisible] = useState(!post.spoiler);
  const [busy, setBusy] = useState(false);

  async function submitReply(event: FormEvent) {
    event.preventDefault();
    if (!reply.trim() || !post.anime || busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/discussions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ animeSlug: post.anime.slug, animeTitle: post.anime.title, animePoster: post.anime.image || null, body: reply.trim(), parentId: post.id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível responder.");
      setReplyCount((count) => count + 1);
      setReply("");
      setReplying(false);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível responder.");
    } finally {
      setBusy(false);
    }
  }

  function choosePostOption(action: "hide" | "mute" | "report" | "copy") {
    setMenuOpen(false);
    if (action === "hide") return onHide();
    if (action === "mute") setNotice(`@${post.handle} foi ocultado deste feed.`);
    if (action === "report") {
      fetch("/api/discussions", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ commentId: post.id, action: "report" }) })
        .then(async (response) => {
          const data = await response.json();
          setNotice(response.ok ? "Publicação denunciada para análise da moderação." : data.error || "Não foi possível denunciar.");
        })
        .catch(() => setNotice("Não foi possível denunciar."));
    }
    if (action === "copy") {
      navigator.clipboard?.writeText(`${window.location.origin}/discussions#${post.id}`).catch(() => undefined);
      setNotice("Link da publicação copiado.");
    }
  }

  async function togglePostLike() {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/discussions", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ commentId: post.id, action: "like" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível curtir.");
      setLiked(Boolean(data.liked));
      setLikeCount(Number(data.likeCount) || 0);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível curtir.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="social-post" id={post.id}>
      <div className="feed-avatar has-image" style={profileImageStyle(post.authorAvatar)}>{!post.authorAvatar && post.initials}</div>
      <div className="post-content">
        <header><div><b>{post.author}</b>{post.verified && <span className="verified" aria-label="Verificado">✓</span>}<span>@{post.handle} · {post.time}</span></div><div className="post-menu-wrap"><button onClick={() => setMenuOpen(!menuOpen)} aria-label="Mais opções da publicação" aria-expanded={menuOpen}>•••</button>{menuOpen && <div className="social-menu post-menu" role="menu"><button onClick={() => choosePostOption("hide")} role="menuitem"><span>⊘</span>Não tenho interesse</button><button onClick={() => choosePostOption("mute")} role="menuitem"><span>⊖</span>Silenciar @{post.handle}</button><button onClick={() => choosePostOption("report")} role="menuitem"><span>⚑</span>Denunciar publicação</button><button onClick={() => choosePostOption("copy")} role="menuitem"><span>⧉</span>Copiar link</button></div>}</div></header>
        {post.label && <span className="post-label">{post.label}</span>}
        {post.spoiler && !spoilerVisible ? <button className="spoiler-cover" onClick={() => setSpoilerVisible(true)}><span>◉</span><b>Conteúdo com spoiler</b><small>Clique para revelar</small></button> : <p>{post.body}</p>}
        {post.imageUrl && <div className="post-image" style={{ backgroundImage: `url(${post.imageUrl})` }} role="img" aria-label="Imagem anexada à publicação" />}
        {post.anime && <Link href={`/anime/${post.anime.slug}?tab=discussions`} className="post-anime-card"><Poster anime={post.anime} /><div><span>Em discussão</span><h3>{post.anime.title}</h3><p>{post.anime.year} · {genrePt(post.anime.genre)} · ★ {post.anime.rating}</p><small>Abrir discussão do anime ↗</small></div></Link>}
        <div className="post-actions">
          <button onClick={() => setReplying(!replying)} aria-label="Responder"><span>○</span>{replyCount}</button>
          <button className={liked ? "active" : ""} onClick={togglePostLike} aria-label="Curtir" disabled={busy}><span>{liked ? "♥" : "♡"}</span>{likeCount}</button>
          <button onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/discussions#${post.id}`).catch(() => undefined); setNotice("Link da publicação copiado."); }} aria-label="Compartilhar publicação"><span>↗</span></button>
        </div>
        {replying && <form className="quick-reply" onSubmit={submitReply}><input value={reply} onChange={(event) => setReply(event.target.value)} placeholder={`Responder a @${post.handle}`} autoFocus /><button type="button" onClick={() => setReplying(false)}>Cancelar</button><button className="primary-button small" type="submit" disabled={busy}>{busy ? "Enviando…" : "Responder"}</button></form>}
        {notice && <button className="post-notice" onClick={() => setNotice("")}>{notice}<span>×</span></button>}
      </div>
    </article>
  );
}

function DiscussionsView({ user }: { user: SessionUser | null | undefined }) {
  const animeFeed = useAnimeFeed("", 12);
  const [section, setSection] = useState<SocialSection>("feed");
  const [draft, setDraft] = useState("");
  const [animeSlug, setAnimeSlug] = useState("");
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [exploreQuery, setExploreQuery] = useState("");
  const [feedMenu, setFeedMenu] = useState(false);
  const [accountMenu, setAccountMenu] = useState(false);
  const [compactFeed, setCompactFeed] = useState(false);
  const [feedNotice, setFeedNotice] = useState("");

  async function loadDiscussions() {
    setFeedLoading(true);
    try {
      const response = await fetch("/api/discussions", { cache: "no-store" });
      const data = await response.json() as { comments?: Comment[]; error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar as discussões.");
      const rows = data.comments || [];
      const rootRows = rows.filter((item) => !item.parentId);
      setPosts(rootRows.map((item) => ({
        id: item.id,
        author: item.author,
        handle: item.author,
        initials: item.author.slice(0, 2).toUpperCase(),
        authorAvatar: item.authorAvatar,
        body: item.body,
        time: discussionTime(item.createdAt),
        replies: rows.filter((reply) => reply.parentId === item.id).length,
        reposts: 0,
        likes: item.likeCount,
        anime: item.animeSlug ? { ...emptyAnime, slug: item.animeSlug, title: item.animeTitle || item.animeSlug, image: item.animePoster || undefined, format: "Anime", genre: "Anime" } : undefined,
      })));
    } catch (error) {
      setFeedNotice(error instanceof Error ? error.message : "Não foi possível carregar as discussões.");
    } finally {
      setFeedLoading(false);
    }
  }

  useEffect(() => {
    loadDiscussions();
  }, []);

  useEffect(() => {
    if (!animeSlug && animeFeed.items[0]) setAnimeSlug(animeFeed.items[0].slug);
  }, [animeFeed.items, animeSlug]);

  const availablePosts = posts.filter((post) => !hiddenIds.includes(post.id));
  const visiblePosts = availablePosts;
  const explorePosts = availablePosts.filter((post) => {
    const query = exploreQuery.toLowerCase();
    const matchesQuery = !query || `${post.author} ${post.handle} ${post.body} ${post.anime?.title ?? ""}`.toLowerCase().includes(query);
    return matchesQuery;
  });
  const sectionTitle = section === "feed" ? "Discussões" : "Explorar";

  function openComposer() {
    setSection("feed");
    window.setTimeout(() => document.getElementById("social-composer")?.focus(), 0);
  }

  async function publishPost(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    const selectedAnime = animeFeed.items.find((anime) => anime.slug === animeSlug);
    if (!user) return setFeedNotice("Entre na sua conta para publicar.");
    if (!selectedAnime) return setFeedNotice("Escolha um anime para vincular à publicação.");
    try {
      const response = await fetch("/api/discussions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ animeSlug: selectedAnime.slug, animeTitle: selectedAnime.title, animePoster: selectedAnime.image || null, body: draft.trim() }) });
      const data = await response.json() as { comment?: Comment; error?: string };
      if (!response.ok || !data.comment) throw new Error(data.error || "Não foi possível publicar.");
      setDraft("");
      await loadDiscussions();
    } catch (error) {
      setFeedNotice(error instanceof Error ? error.message : "Não foi possível publicar.");
    }
  }

  function chooseFeedOption(action: "refresh" | "compact") {
    setFeedMenu(false);
    if (action === "refresh") {
      loadDiscussions();
      setFeedNotice("Buscando publicações recentes…");
    } else {
      setCompactFeed((current) => !current);
      setFeedNotice(compactFeed ? "Visualização confortável ativada." : "Visualização compacta ativada.");
    }
  }

  const renderPost = (post: SocialPost) => <SocialPostCard post={post} onHide={() => setHiddenIds((current) => [...current, post.id])} key={post.id} />;

  return (
    <main className="social-page page-shell">
      <div className="social-layout">
        <aside className="social-nav" aria-label="Navegação das discussões">
          <p className="eyebrow">Comunidade</p>
          <nav>
            <button className={section === "feed" ? "active" : ""} onClick={() => setSection("feed")}><span>⌂</span>Discussões</button>
            <button className={section === "explore" ? "active" : ""} onClick={() => setSection("explore")}><span>#</span>Explorar</button>
            <Link href="/profile"><span>◎</span>Perfil</Link>
          </nav>
          <button className="primary-button social-post-button" onClick={openComposer}>Nova publicação</button>
          {user ? <div className="account-menu-wrap"><button className="social-account" onClick={() => setAccountMenu(!accountMenu)} aria-expanded={accountMenu} aria-label="Abrir opções da conta"><div className="feed-avatar has-image" style={profileImageStyle(user.avatarUrl)}>{!user.avatarUrl && userInitials(user)}</div><div><b>{userLabel(user)}</b><span>@{user.username || userLabel(user)}</span></div><span>•••</span></button>{accountMenu && <div className="social-menu account-menu" role="menu"><Link href="/profile" role="menuitem"><span>◎</span>Ver perfil</Link><Link href="/settings" role="menuitem"><span>✎</span>Editar perfil</Link><button type="button" role="menuitem" onClick={() => signOut({ redirectTo: "/" })}><span>↪</span>Sair</button></div>}</div> : <Link className="primary-button small social-signin" href="/api/auth/signin?callbackUrl=/discussions">Entrar</Link>}
        </aside>

        <section className={`social-feed ${compactFeed ? "compact" : ""}`}>
          <header className="feed-header"><div><p className="eyebrow">Comunidade Yugen</p><h1>{sectionTitle}</h1></div><div className="feed-menu-wrap"><button onClick={() => setFeedMenu(!feedMenu)} aria-label="Configurações das discussões" aria-expanded={feedMenu}>•••</button>{feedMenu && <div className="social-menu feed-menu" role="menu"><button onClick={() => chooseFeedOption("refresh")} role="menuitem"><span>↻</span>Atualizar feed</button><button onClick={() => chooseFeedOption("compact")} role="menuitem"><span>≡</span>{compactFeed ? "Visualização confortável" : "Visualização compacta"}</button><Link href="/blueprint" role="menuitem"><span>◇</span>Regras da comunidade</Link></div>}</div></header>
          <nav className="mobile-social-nav" aria-label="Navegação móvel das discussões"><button className={section === "feed" ? "active" : ""} onClick={() => setSection("feed")} aria-label="Discussões">⌂</button><button className={section === "explore" ? "active" : ""} onClick={() => setSection("explore")} aria-label="Explorar">#</button></nav>
          {feedNotice && <button className="feed-notice" onClick={() => setFeedNotice("")}>{feedNotice}<span>×</span></button>}

          {section === "feed" && <>
            <div className="feed-tabs single"><button className="active">Publicações recentes</button></div>
            <form className="social-composer" onSubmit={publishPost}>
              <div className="feed-avatar has-image" style={profileImageStyle(user?.avatarUrl)}>{user ? (!user.avatarUrl && userInitials(user)) : "YU"}</div>
              <div><textarea id="social-composer" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={user ? "No que você está pensando?" : "Entre para publicar uma discussão"} aria-label="Criar uma publicação" maxLength={4000} disabled={!user} /><div className="composer-footer"><div><select value={animeSlug} onChange={(event) => setAnimeSlug(event.target.value)} aria-label="Vincular anime" disabled={!animeFeed.items.length || !user}><option value="">{animeFeed.loading ? "Carregando Jikan…" : animeFeed.error ? "API indisponível" : "Escolha um anime"}</option>{animeFeed.items.map((anime) => <option value={anime.slug} key={anime.slug}>{anime.title}</option>)}</select></div><span>{draft.length}/4000</span><button className="primary-button small" type="submit" disabled={!user || !draft.trim() || !animeSlug}>Publicar</button></div></div>
            </form>
            <div className="timeline">{feedLoading ? <div className="social-empty"><span>◌</span><h3>Carregando discussões</h3></div> : visiblePosts.length ? visiblePosts.map(renderPost) : <div className="social-empty"><span>○</span><h3>A comunidade está começando</h3><p>Ainda não há publicações reais. Escolha um anime e inicie a primeira conversa.</p></div>}</div>
          </>}

          {section === "explore" && <section className="section-panel explore-panel"><div className="panel-intro"><p className="eyebrow">Encontre uma conversa real</p><h2>Explore a comunidade.</h2><p>Pesquise nas publicações que já foram registradas no Yugen.</p></div><label className="explore-search"><span>⌕</span><input value={exploreQuery} onChange={(event) => setExploreQuery(event.target.value)} placeholder="Pesquisar autor, anime ou texto" /></label><div className="timeline explore-results">{explorePosts.length ? explorePosts.map(renderPost) : <div className="social-empty"><span>⌕</span><h3>Nenhuma discussão encontrada</h3><p>Tente outra busca.</p></div>}</div></section>}
        </section>

        <aside className="social-rail">
          <form className="social-search" action="/discussions"><span>⌕</span><input placeholder="Pesquisar discussões" aria-label="Pesquisar discussões" /></form>
          <section className="rail-card"><h2>O que está acontecendo</h2>{animeFeed.items.slice(0, 4).map((anime, index) => <div className="trend" key={anime.slug}><small>{index === 0 ? "Em alta no Yugen" : "Ao vivo da Jikan"}</small><b>{anime.title}</b><span>{anime.year || "A definir"} · {genrePt(anime.genre)}</span></div>)}{animeFeed.loading && <div className="trend"><small>Atualizando</small><b>Carregando Jikan…</b><span>Dados de anime ao vivo</span></div>}{animeFeed.error && <button onClick={animeFeed.retry}>Tentar a API novamente</button>}</section>
          <p className="social-rules"><Link href="/blueprint">Regras da comunidade</Link><span>·</span><a href="#">Privacidade</a><span>·</span><a href="#">Termos</a><br />© 2026 Yugen</p>
        </aside>
      </div>
    </main>
  );
}

function CollectionsView({ openModal }: { openModal: (modal: Modal) => void }) {
  const [visible, setVisible] = useState(6);
  const feed = useAnimeFeed("", 18);
  return <main className="page-shell collections-page"><header className="page-title split"><div><p className="eyebrow">Criadas por pessoas, alimentadas pela Jikan</p><h1>Coleções com<br /><em>um ponto de vista.</em></h1></div><button className="primary-button" onClick={() => openModal("create")}>＋ Criar nova</button></header>{feed.loading ? <LoadingCards count={6} grid /> : feed.error ? <ApiError message={feed.error} retry={feed.retry} /> : feed.items.length ? <><div className="collection-list-grid">{[...collections, ...collections].slice(0, visible).map((collection, index) => <article className="large-collection" key={`${collection.title}-${index}`}><div className="collection-cover">{collection.frames.map((frame) => <Poster key={frame} anime={feed.items[frame % feed.items.length]} />)}</div><div><p>Coleção · {collection.count} títulos</p><h2>{collection.title}</h2><span>por @{collection.owner}</span></div><button aria-label="Abrir coleção">↗</button></article>)}</div>{visible < 12 && <button className="wide-button" onClick={() => setVisible(12)}>Mostrar mais <span>↓</span></button>}</> : <EmptyData label="A API não retornou animes para as coleções." />}</main>;
}

function NewsView() {
  const feed = useAnimeFeed("", 12);
  const lead = feed.items[0];
  return <main className="news-page">{lead && <section className="news-hero"><div className="news-hero-art"><Poster anime={lead} /></div><div><p className="eyebrow">Destaque da API · Jikan / MyAnimeList</p><h1>{lead.title}</h1><p>{lead.blurb}</p><Link className="primary-button" href={`/anime/${lead.slug}`}>Abrir anime <span>↗</span></Link></div></section>}<section className="page-shell"><div className="section-heading"><div><p className="eyebrow">Da redação</p><h2>Últimas histórias</h2></div><div className="filter-chips"><button className="active">Tudo</button><button>Notícias</button><button>Produção</button><button>Ensaios</button></div></div>{feed.loading ? <LoadingCards count={6} grid /> : feed.error ? <ApiError message={feed.error} retry={feed.retry} /> : feed.items.length ? <div className="news-grid">{newsItems.map((item, index) => <Link href={`/anime/${feed.items[index % feed.items.length].slug}`} className={index === 0 ? "news-card feature" : "news-card"} key={item.slug}><Poster anime={feed.items[index % feed.items.length]} /><div><p>{item.category} · {item.time}</p><h3>{feed.items[index % feed.items.length].title}</h3><span>Abrir anime ↗</span></div></Link>)}</div> : <EmptyData label="A API não retornou dados de animes para as notícias." />}</section></main>;
}

function ArticleView() {
  const feed = useAnimeFeed("", 12);
  const lead = feed.items[0];
  return <main className="article-page"><header className="article-header page-shell"><p className="eyebrow">Guia do banco de dados ao vivo · Jikan / MyAnimeList</p><h1>{lead?.title || "Carregando guia de animes…"}</h1><p className="dek">Todos os títulos deste guia vêm diretamente da API de animes.</p><div className="byline"><div className="avatar">YU</div><span>Seleção de <b>Yugen</b><br />Edição com API ao vivo</span></div></header>{lead && <div className="article-lead"><div className="hero-image" style={{ backgroundImage: `url(${lead.backdrop || lead.image})` }} /></div>}{feed.loading ? <section className="page-shell"><LoadingCards count={6} grid /></section> : feed.error ? <section className="page-shell"><ApiError message={feed.error} retry={feed.retry} /></section> : <><article className="article-content"><p className="dropcap">Uma seleção gerada a partir do catálogo atual da Jikan, com sinopse e informações de produção fornecidas pela API.</p>{feed.items.slice(0, 3).map((anime, index) => <div key={anime.slug}><h2>0{index + 1}. {anime.title}</h2><p>{anime.blurb}</p>{index === 0 && <blockquote>“Abra a página do anime para ver trailer, personagens, equipe e músicas-tema.”</blockquote>}</div>)}</article><section className="page-shell may-read"><Carousel title="Você também pode gostar" subtitle="Ao vivo da Jikan" items={feed.items.slice(3, 10)} /></section></>}</main>;
}

function ProfileView({ user, library }: { user: SessionUser | null | undefined; library: LibraryEntry[] }) {
  const [tab, setTab] = useState("Assistindo");
  const activeUser: SessionUser = user || { displayName: "Visitante", email: "", username: "visitante" };
  const feed = useAnimeFeed("", 18);
  const banner = library[0] ? animeFromLibrary(library[0]) : feed.items[0];
  const counts = {
    Assistindo: library.filter((entry) => entry.status === "watching").length,
    "Quero assistir": library.filter((entry) => entry.status === "to_watch").length,
    Assistidos: library.filter((entry) => entry.status === "watched").length,
    Favoritos: library.filter((entry) => entry.favorite).length,
  };
  const watchedEpisodes = library.reduce((sum, entry) => sum + entry.progressEpisodes, 0);
  const hours = Math.round((watchedEpisodes * 24) / 60);
  const rated = library.filter((entry) => entry.score).length;
  const averageScore = rated ? (library.reduce((sum, entry) => sum + (entry.score || 0), 0) / rated).toFixed(1) : "—";
  const achievements = [
    { icon: "◉", title: "Primeiro passo", copy: "Adicione seu primeiro anime", unlocked: library.length > 0 },
    { icon: "▶", title: "Maratonista", copy: "Assista a 25 episódios", unlocked: watchedEpisodes >= 25 },
    { icon: "★", title: "Crítico", copy: "Avalie 5 animes", unlocked: rated >= 5 },
    { icon: "♥", title: "Curador", copy: "Favorite 10 animes", unlocked: counts.Favoritos >= 10 },
  ];
  const selectedStatus: LibraryStatus | null = tab === "Assistindo" ? "watching" : tab === "Quero assistir" ? "to_watch" : tab === "Assistidos" ? "watched" : null;
  const selectedEntries = tab === "Favoritos" ? library.filter((entry) => entry.favorite) : selectedStatus ? library.filter((entry) => entry.status === selectedStatus) : [];
  const bannerUrl = activeUser.bannerUrl || banner?.backdrop || banner?.image;
  return <main className="profile-page page-shell"><section className="profile-banner"><div className="hero-image" style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : { backgroundImage: "none" }} /><div className="profile-info"><div className={`profile-avatar ${activeUser.avatarUrl ? "has-image" : ""}`} style={profileImageStyle(activeUser.avatarUrl)}>{!activeUser.avatarUrl && userInitials(activeUser)}</div><div><p className="eyebrow">Perfil Yugen</p><h1>{userLabel(activeUser)}</h1><p>{activeUser.bio || "Sua biblioteca, suas descobertas e suas discussões em um só lugar."}</p></div>{user ? <Link className="primary-button" href="/settings">✎ Editar perfil</Link> : <Link className="primary-button" href="/api/auth/signin?callbackUrl=/profile">Entrar</Link>}</div></section><section className="profile-stats"><article><span>Tempo assistido</span><b>{hours} h</b><small>{watchedEpisodes} episódios</small></article><article><span>Animes concluídos</span><b>{counts.Assistidos}</b><small>na sua biblioteca</small></article><article><span>Nota média</span><b>{averageScore}</b><small>{rated} avaliações</small></article><article><span>Favoritos</span><b>{counts.Favoritos}</b><small>histórias especiais</small></article></section><section className="achievement-section"><div className="section-heading"><div><p className="eyebrow">Sua jornada no Yugen</p><h2>Conquistas</h2></div><span>{achievements.filter((item) => item.unlocked).length} de {achievements.length} desbloqueadas</span></div><div className="achievement-grid">{achievements.map((achievement) => <article className={achievement.unlocked ? "unlocked" : "locked"} key={achievement.title}><span>{achievement.icon}</span><div><b>{achievement.title}</b><small>{achievement.copy}</small></div><i>{achievement.unlocked ? "✓" : "○"}</i></article>)}</div></section><section className="profile-library"><div className="tabs">{Object.entries(counts).map(([name, count]) => <button className={tab === name ? "active" : ""} onClick={() => setTab(name)} key={name}>{name} <span>{count}</span></button>)}<label>Ordenar por <select><option>Atualizados recentemente</option><option>Nota</option><option>Título</option></select></label></div>{!user && <div className="library-signin"><p>Entre com sua conta para salvar progresso, notas e favoritos em todos os dispositivos.</p><Link className="primary-button small" href="/api/auth/signin?callbackUrl=/profile">Entrar na conta</Link></div>}{selectedEntries.length ? <div className="catalog-grid profile-grid">{selectedEntries.map((entry) => <div className="library-card-wrap" key={entry.slug}><AnimeCard anime={animeFromLibrary(entry)} /><div className="library-card-meta"><span>{entry.progressEpisodes}/{entry.episodes || "?"} episódios</span><b>{entry.score ? `★ ${entry.score}` : libraryStatusLabel(entry.status)}</b></div></div>)}</div> : feed.loading ? <LoadingCards count={6} grid /> : <EmptyData label="Nenhum anime nesta lista ainda. Abra um anime e atualize seu progresso." />}</section></main>;
}

function SettingsView({ user, onUserChange }: { user: SessionUser | null | undefined; onUserChange: (user: SessionUser) => void }) {
  const [saved, setSaved] = useState(false);
  const [danger, setDanger] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [uploading, setUploading] = useState<"avatar" | "banner" | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (user) {
      setUsername(userLabel(user));
      setEmail(user.email);
    }
  }, [user]);
  const activeUser: SessionUser = user || { displayName: username || "Visitante", email };

  async function uploadProfileImage(type: "avatar" | "banner", file?: File) {
    if (!file) return;
    if (!user) {
      setUploadStatus("Entre na sua conta para alterar as imagens do perfil.");
      return;
    }
    setUploading(type);
    setUploadStatus(type === "avatar" ? "Enviando avatar…" : "Enviando banner…");
    try {
      const form = new FormData();
      form.set("type", type);
      form.set("file", file);
      const response = await fetch("/api/profile/media", { method: "POST", body: form });
      const data = await response.json() as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error || "Não foi possível enviar a imagem.");
      const nextUser = { ...user, [type === "avatar" ? "avatarUrl" : "bannerUrl"]: data.url };
      onUserChange(nextUser);
      setUploadStatus(type === "avatar" ? "Avatar atualizado." : "Banner atualizado.");
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : "Não foi possível enviar a imagem.");
    } finally {
      setUploading(null);
      if (avatarInput.current) avatarInput.current.value = "";
      if (bannerInput.current) bannerInput.current.value = "";
    }
  }

  return <main className="settings-page page-shell"><header className="page-title"><p className="eyebrow">Seu espaço</p><h1>Configurações<br /><em>da conta.</em></h1></header><div className="settings-layout"><aside><a href="#profile" className="active">Perfil</a><a href="#account">Conta</a><a href="#imports">Importações</a><a href="#danger">Zona de perigo</a></aside><section><div id="profile" className="setting-group"><p className="eyebrow">Identidade pública</p><h2>Perfil</h2>{activeUser.bannerUrl && <div className="settings-banner-preview" style={profileImageStyle(activeUser.bannerUrl)} role="img" aria-label="Banner atual" />}<div className="media-edit"><div className={`profile-avatar ${activeUser.avatarUrl ? "has-image" : ""}`} style={profileImageStyle(activeUser.avatarUrl)}>{!activeUser.avatarUrl && userInitials(activeUser)}</div><input ref={avatarInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => uploadProfileImage("avatar", event.target.files?.[0])} /><button className="ghost-button" type="button" onClick={() => avatarInput.current?.click()} disabled={Boolean(uploading)}>{uploading === "avatar" ? "Enviando…" : "Alterar avatar"}</button><input ref={bannerInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => uploadProfileImage("banner", event.target.files?.[0])} /><button className="ghost-button" type="button" onClick={() => bannerInput.current?.click()} disabled={Boolean(uploading)}>{uploading === "banner" ? "Enviando…" : "Alterar banner"}</button></div>{uploadStatus && <p className="upload-status" role="status">{uploadStatus}</p>}<small className="media-note">JPG, PNG, WebP ou GIF, com até 5 MB.</small><label>Nome de usuário<input value={username} onChange={(event) => setUsername(event.target.value)} /></label><label>Biografia<textarea defaultValue={activeUser.bio || ""} placeholder="Conte um pouco sobre você." /></label></div><div id="account" className="setting-group"><p className="eyebrow">Dados privados</p><h2>Conta</h2><label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" /></label><label>Senha atual<input placeholder="••••••••" type="password" /></label><label>Nova senha<input placeholder="Pelo menos 12 caracteres" type="password" /></label><button className="primary-button" onClick={() => setSaved(true)}>{saved ? "✓ Alterações salvas" : "Salvar alterações"}</button></div><div id="imports" className="setting-group import-row"><div><p className="eyebrow">Traga seu histórico</p><h2>MyAnimeList</h2><p>Importe títulos concluídos, notas e status. Nada será alterado na fonte original.</p></div><button className="glass-button">Importar do MyAnimeList ↗</button></div><div id="danger" className="setting-group danger"><p className="eyebrow">Zona de perigo</p><h2>Excluir conta</h2><p>Isso remove permanentemente seu perfil, listas, coleções, avaliações e comentários após um prazo de recuperação de 14 dias.</p>{danger ? <div className="danger-confirm"><span>Digite EXCLUIR no fluxo final de produção.</span><button onClick={() => setDanger(false)}>Cancelar</button></div> : <button onClick={() => setDanger(true)}>Excluir conta</button>}</div></section></div></main>;
}

function BlueprintView() {
  const phases = [{ n: "01", title: "Núcleo de descoberta", copy: "Início, catálogo, página do anime, pesquisa, filtros e metadados oficiais." }, { n: "02", title: "Biblioteca pessoal", copy: "Identidade, status, coleções, seguidores, perfil e fluxo de importação." }, { n: "03", title: "Camada social", copy: "Avaliações, tópicos, respostas aninhadas, curtidas, denúncias e moderação." }, { n: "04", title: "Editorial e escala", copy: "CMS de notícias, recomendações, histórico, análises, cache e indexação da busca." }];
  const tables = ["users", "animes", "studios", "genres", "anime_genres", "user_anime_statuses", "collections", "collection_items", "reviews", "discussions", "comments", "comment_likes", "follows", "moderation_reports", "anime_revisions"];
  return <main className="blueprint-page page-shell"><header className="page-title"><p className="eyebrow">Plano de produto e engenharia</p><h1>Feito para crescer<br /><em>sem precisar recomeçar.</em></h1><p>Uma arquitetura prática: primeiro o catálogo, depois identidade e comunidade.</p></header><section className="stack-grid"><article><span>Interface</span><h2>Next.js + React</h2><p>App Router, renderização no servidor para descoberta e componentes no cliente para filtros, listas e modais.</p></article><article><span>Aplicação</span><h2>Rotas Node.js</h2><p>Rotas internas para o protótipo; a separação em serviços acontece quando o tráfego ou a equipe exigirem.</p></article><article><span>Banco de dados</span><h2>PostgreSQL</h2><p>Fonte relacional da verdade em produção, com filtros indexados, transações e pesquisa de texto completo.</p></article><article><span>Identidade</span><h2>Auth.js + OAuth</h2><p>Email e senha, Google e Apple, com email verificado e autorização no servidor.</p></article></section><section className="schema-section"><div><p className="eyebrow">Modelo relacional</p><h2>Tabelas principais</h2><p>Mantenha os dados dos animes separados da atividade dos usuários. Tabelas de junção tratam relações muitos-para-muitos; comentários aninhados usam um ID de pai opcional.</p></div><div className="schema-map">{tables.map((table, index) => <span key={table}><i>{String(index + 1).padStart(2, "0")}</i>{table}</span>)}</div></section><section className="relation-table"><div className="relation-head"><span>Relação</span><span>Implementação</span><span>Motivo</span></div><div><b>Usuário → status do anime</b><span>user_anime_statuses (user_id, anime_id)</span><span>Um status e uma nota atuais por usuário e título.</span></div><div><b>Anime ↔ gêneros</b><span>anime_genres (anime_id, genre_id)</span><span>Filtragem rápida do catálogo.</span></div><div><b>Coleção ↔ anime</b><span>collection_items + position</span><span>Listas ordenadas e criadas por usuários.</span></div><div><b>Discussão → comentários</b><span>comments.parent_id → comments.id</span><span>Tópicos aninhados sem tabela separada de respostas.</span></div><div><b>Anime → revisões</b><span>anime_revisions + editor_id</span><span>Histórico da wiki, comparação, reversão e moderação.</span></div></section><section className="roadmap"><p className="eyebrow">Ordem de implementação</p><h2>Quatro fases intencionais</h2>{phases.map((phase) => <article key={phase.n}><span>{phase.n}</span><h3>{phase.title}</h3><p>{phase.copy}</p></article>)}</section><section className="decision-note"><p className="eyebrow">Comece aqui</p><h2>Uma experiência completa vale mais que doze páginas vazias.</h2><p>Entregue primeiro Catálogo → Detalhes do anime → “Quero assistir”. Isso valida metadados, filtros, rotas, identidade e uma ação gravada. As discussões vêm depois das regras de propriedade e moderação.</p><Link className="primary-button" href="/catalog">Explorar o produto <span>↗</span></Link></section></main>;
}

function AuthModal({ type, onClose, switchTo }: { type: Exclude<Modal, "collection" | "create" | null>; onClose: () => void; switchTo: (modal: Modal) => void }) {
  const title = type === "join" ? "Entre no Yugen" : type === "login" ? "Boas-vindas de volta" : "Redefinir senha";
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [oauthProviders, setOauthProviders] = useState<string[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/providers", { signal: controller.signal })
      .then((response) => response.ok ? response.json() : {})
      .then((available) => setOauthProviders(Object.keys(available).filter((provider) => provider === "google" || provider === "apple")))
      .catch((error) => { if (error.name !== "AbortError") setOauthProviders([]); });
    return () => controller.abort();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    if (type === "forgot") {
      setStatus("A recuperação automática por email será ativada quando um provedor de envio for configurado. Por enquanto, entre com Google ou Apple.");
      return;
    }
    setSubmitting(true);
    try {
      if (type === "join") {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, username, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Não foi possível criar a conta.");
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) throw new Error(type === "join" ? "Conta criada, mas não foi possível iniciar a sessão." : "Email ou senha incorretos.");
      window.location.assign("/profile");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Não foi possível continuar.");
      setSubmitting(false);
    }
  }

  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true"><button className="modal-close" onClick={onClose} aria-label="Fechar">×</button><p className="eyebrow">Sua biblioteca espera por você</p><h2>{title}</h2>{type !== "forgot" && oauthProviders.length > 0 && <>{oauthProviders.includes("google") && <button type="button" className="social-button" onClick={() => signIn("google", { redirectTo: "/profile" })}>G Continuar com Google</button>}{oauthProviders.includes("apple") && <button type="button" className="social-button" onClick={() => signIn("apple", { redirectTo: "/profile" })}>● Continuar com Apple</button>}<div className="or"><span />ou continue com email<span /></div></>}<form onSubmit={submit}>{type === "join" && <label>Nome de usuário<input value={username} onChange={(event) => setUsername(event.target.value)} minLength={3} maxLength={24} autoComplete="username" placeholder="Como as pessoas verão você" required /></label>}<label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="voce@exemplo.com" required /></label>{type !== "forgot" && <label>Senha<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={type === "join" ? 12 : undefined} autoComplete={type === "join" ? "new-password" : "current-password"} placeholder="Pelo menos 12 caracteres" required /></label>}<button className="primary-button full" disabled={submitting}>{submitting ? "Aguarde…" : type === "join" ? "Criar conta" : type === "login" ? "Entrar" : "Enviar link de redefinição"}</button>{status && <p className="auth-status" role="status">{status}</p>}</form>{type === "login" && <button className="text-button" onClick={() => switchTo("forgot")}>Esqueceu a senha?</button>}<p className="modal-switch">{type === "join" ? "Já tem uma conta?" : "Novo no Yugen?"} <button onClick={() => switchTo(type === "join" ? "login" : "join")}>{type === "join" ? "Entrar" : "Criar uma"}</button></p></section></div>;
}

function CollectionModal({ type, onClose }: { type: "collection" | "create"; onClose: () => void }) {
  const [created, setCreated] = useState(false);
  const feed = useAnimeFeed("", 6);
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal collection-modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true"><button className="modal-close" onClick={onClose} aria-label="Fechar">×</button><p className="eyebrow">Sua curadoria</p><h2>{type === "create" ? "Criar coleção" : "Escolher coleção"}</h2>{type === "create" ? <><label>Título<input placeholder="Ex.: Ficção científica tranquila para dias de chuva" /></label><label>Descrição<textarea placeholder="O que conecta estas histórias?" /></label><label className="check-row"><input type="checkbox" /> Manter esta coleção privada</label><button className="primary-button full" onClick={() => setCreated(true)}>{created ? "✓ Coleção criada" : "Criar coleção"}</button></> : <><button className="primary-button full" onClick={() => setCreated(true)}>{created ? "✓ Adicionado à coleção" : "＋ Criar uma nova coleção"}</button><div className="collection-options">{feed.items.length ? collections.slice(0, 3).map((collection, index) => <button onClick={() => setCreated(true)} key={collection.title}><Poster anime={feed.items[index % feed.items.length]} /><span><b>{collection.title}</b><small>{collection.count} títulos</small></span><i>＋</i></button>) : <span className="modal-api-note">{feed.error ? "API de animes indisponível." : "Carregando capas…"}</span>}</div></>}</section></div>;
}

function Footer() {
  return <footer className="site-footer"><Link href="/" className="brand">Yugen<span>.</span></Link><p>Animes selecionados com intenção.</p><nav><Link href="/catalog">Catálogo</Link><Link href="/collections">Coleções</Link><Link href="/discussions">Discussões</Link><Link href="/news">Notícias</Link><Link href="/blueprint">Plano de desenvolvimento</Link></nav><span>© 2026 Yugen</span></footer>;
}

export function KurosawApp({ view, slug }: { view: View; slug?: string }) {
  const [theme, setTheme] = useState("dark");
  const [language, setLanguage] = useState<Language>("pt");
  const [modal, setModal] = useState<Modal>(null);
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [library, setLibrary] = useState<LibraryEntry[]>([]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedTheme = window.localStorage.getItem("yugen-theme");
      const savedLanguage = window.localStorage.getItem("yugen-language");
      if (savedTheme) setTheme(savedTheme);
      if (savedLanguage === "en" || savedLanguage === "es") setLanguage(savedLanguage);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => observeDocumentLanguage(language), [language]);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/me", { cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() : { user: null })
      .then((data) => setUser(data.user ?? null))
      .catch((error) => { if (error.name !== "AbortError") setUser(null); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    fetch("/api/library", { cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() : { entries: [] })
      .then((data) => setLibrary(data.entries || []))
      .catch((error) => { if (error.name !== "AbortError") setLibrary([]); });
    return () => controller.abort();
  }, [user]);
  async function saveLibrary(anime: Anime, patch: LibraryPatch) {
    if (!user) throw new Error("authentication_required");
    const previous = library;
    const current = previous.find((entry) => entry.slug === anime.slug);
    const optimistic: LibraryEntry = {
      slug: anime.slug,
      title: anime.title,
      image: anime.image,
      episodes: anime.episodes,
      year: anime.year,
      format: anime.format,
      status: patch.status || current?.status || "to_watch",
      progressEpisodes: patch.progressEpisodes ?? current?.progressEpisodes ?? 0,
      score: patch.score === undefined ? current?.score ?? null : patch.score,
      favorite: patch.favorite ?? current?.favorite ?? false,
      updatedAt: new Date().toISOString(),
    };
    setLibrary((entries) => [optimistic, ...entries.filter((entry) => entry.slug !== anime.slug)]);
    const response = await fetch("/api/library", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ anime: libraryPayload(anime), status: optimistic.status, progressEpisodes: optimistic.progressEpisodes, score: optimistic.score, favorite: optimistic.favorite }) });
    const data = await response.json();
    if (!response.ok || !data.entry) {
      setLibrary(previous);
      throw new Error(data.error || "Não foi possível salvar a biblioteca.");
    }
    setLibrary((entries) => [data.entry, ...entries.filter((entry) => entry.slug !== anime.slug)]);
  }
  function toggleTheme() { const next = theme === "dark" ? "light" : "dark"; setTheme(next); window.localStorage.setItem("yugen-theme", next); }
  function changeLanguage(next: Language) { setLanguage(next); window.localStorage.setItem("yugen-language", next); }
  return <div className={`site ${theme}`}><Header theme={theme} onTheme={toggleTheme} onAuth={setModal} user={user} language={language} onLanguage={changeLanguage} />{view === "home" && <HomeView openAuth={setModal} language={language} user={user} library={library} saveLibrary={saveLibrary} />}{view === "catalog" && <CatalogView />}{view === "anime" && <AnimeView slug={slug} openModal={setModal} language={language} user={user} library={library} saveLibrary={saveLibrary} />}{view === "calendar" && <CalendarView user={user} library={library} saveLibrary={saveLibrary} openAuth={setModal} />}{view === "character" && <CharacterView slug={slug} />}{view === "collections" && <CollectionsView openModal={setModal} />}{view === "discussions" && <DiscussionsView user={user} />}{view === "news" && <NewsView />}{view === "article" && <ArticleView />}{view === "profile" && <ProfileView user={user} library={library} />}{view === "settings" && <SettingsView user={user} onUserChange={setUser} />}{view === "blueprint" && <BlueprintView />}<Footer />{modal && ["join", "login", "forgot"].includes(modal) && <AuthModal type={modal as "join" | "login" | "forgot"} onClose={() => setModal(null)} switchTo={setModal} />}{modal && ["collection", "create"].includes(modal) && <CollectionModal type={modal as "collection" | "create"} onClose={() => setModal(null)} />}</div>;
}
