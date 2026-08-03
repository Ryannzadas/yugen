import type { Anime, CharacterDetail } from "./data";

const JIKAN_BASE = "https://api.jikan.moe/v4";

type JikanImage = { image_url?: string; large_image_url?: string };
type JikanNamed = { mal_id: number; name: string; type?: string };

type JikanAnime = {
  mal_id: number;
  title: string;
  title_english?: string | null;
  title_japanese?: string | null;
  images?: { jpg?: JikanImage; webp?: JikanImage };
  trailer?: { youtube_id?: string | null; embed_url?: string | null };
  broadcast?: { day?: string | null; time?: string | null; string?: string | null };
  year?: number | null;
  season?: string | null;
  type?: string | null;
  status?: string | null;
  score?: number | null;
  scored_by?: number | null;
  popularity?: number | null;
  episodes?: number | null;
  duration?: string | null;
  synopsis?: string | null;
  rating?: string | null;
  source?: string | null;
  aired?: { string?: string | null; prop?: { from?: { year?: number | null } } };
  genres?: JikanNamed[];
  studios?: JikanNamed[];
  theme?: { openings?: string[]; endings?: string[] };
  relations?: Array<{ relation: string; entry: JikanNamed[] }>;
};

type JikanCharacter = {
  role: string;
  character: { mal_id: number; name: string; images?: { jpg?: JikanImage; webp?: JikanImage } };
  voice_actors?: Array<{ language: string; person: { name: string } }>;
};

type JikanStaff = {
  positions: string[];
  person: { mal_id: number; name: string; images?: { jpg?: JikanImage } };
};

type JikanPagination = {
  current_page?: number;
  has_next_page?: boolean;
  last_visible_page?: number;
  items?: {
    count?: number;
    total?: number;
    per_page?: number;
  };
};

export type AnimePageResult = {
  items: Anime[];
  page: number;
  hasNextPage: boolean;
  total: number | null;
};

async function requestJikan<T>(path: string, signal?: AbortSignal): Promise<T> {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(`${JIKAN_BASE}${path}`, { headers: { accept: "application/json" }, signal });
    if (response.ok) return response.json();
    lastStatus = response.status;
    if (response.status < 500 && response.status !== 429) break;
    await new Promise((resolve) => setTimeout(resolve, 700));
  }
  throw new Error(lastStatus ? `A API Jikan está indisponível (${lastStatus}).` : "A API Jikan está indisponível.");
}

function mapAnime(anime: JikanAnime, index = 0): Anime {
  const genres = (anime.genres ?? []).map((item) => item.name);
  const studios = (anime.studios ?? []).map((item) => item.name);
  const image = anime.images?.webp?.large_image_url
    ?? anime.images?.jpg?.large_image_url
    ?? anime.images?.webp?.image_url
    ?? anime.images?.jpg?.image_url;
  const trailerUrl = anime.trailer?.youtube_id
    ? `https://www.youtube-nocookie.com/embed/${anime.trailer.youtube_id}`
    : anime.trailer?.embed_url?.replace(/([?&])autoplay=1(&|$)/, "$1").replace(/[?&]$/, "") ?? null;

  return {
    malId: anime.mal_id,
    slug: `mal-${anime.mal_id}`,
    title: anime.title_english || anime.title,
    titleJapanese: anime.title_japanese || undefined,
    year: anime.year || anime.aired?.prop?.from?.year || 0,
    genre: genres[0] || "Anime",
    genres,
    season: anime.season ? anime.season[0].toUpperCase() + anime.season.slice(1) : "Unknown",
    studio: studios[0] || "Unknown studio",
    studios,
    format: anime.type || "Unknown",
    status: anime.status || "Unknown",
    rating: anime.score || 0,
    ratingLabel: anime.rating || "Not rated",
    scoredBy: anime.scored_by ?? null,
    popularity: anime.popularity ?? null,
    episodes: anime.episodes ?? null,
    duration: anime.duration || "Unknown",
    aired: anime.aired?.string || "Unknown",
    source: anime.source || "Unknown",
    atlas: 1,
    frame: index % 8,
    image,
    backdrop: image,
    blurb: anime.synopsis || "Sinopse ainda não disponível.",
    synopsis: anime.synopsis || "Sinopse ainda não disponível.",
    trailerUrl,
    broadcastDay: anime.broadcast?.day || undefined,
    broadcastTime: anime.broadcast?.time || undefined,
    themes: { openings: anime.theme?.openings ?? [], endings: anime.theme?.endings ?? [] },
    relations: (anime.relations ?? []).map((relation) => ({
      relation: relation.relation,
      entries: relation.entry.map((entry) => ({ id: entry.mal_id, name: entry.name, type: entry.type || "anime" })),
    })),
  };
}

function sortSearchResults(anime: Anime[], normalizedQuery: string) {
  if (!normalizedQuery) return anime;

  return anime.sort((a, b) => {
    const relevance = (title: string) => {
      const normalizedTitle = title.toLocaleLowerCase();
      if (normalizedTitle === normalizedQuery) return 0;
      if (normalizedTitle.startsWith(normalizedQuery)) return 1;
      if (normalizedTitle.includes(normalizedQuery)) return 2;
      return 3;
    };
    return relevance(a.title) - relevance(b.title) || b.rating - a.rating;
  });
}

export async function fetchAnimePage(query: string, page = 1, limit = 25, signal?: AbortSignal): Promise<AnimePageResult> {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.max(1, Math.min(25, Math.floor(limit)));
  const endpoint = normalizedQuery
    ? `/anime?q=${encodeURIComponent(query.trim())}&order_by=popularity&sort=asc&page=${safePage}&limit=${safeLimit}&sfw=true`
    : `/anime?order_by=popularity&sort=asc&page=${safePage}&limit=${safeLimit}&sfw=true`;
  const response = await requestJikan<{ data?: JikanAnime[]; pagination?: JikanPagination }>(endpoint, signal);
  return {
    items: sortSearchResults((response.data ?? []).map(mapAnime), normalizedQuery),
    page: response.pagination?.current_page ?? safePage,
    hasNextPage: Boolean(response.pagination?.has_next_page),
    total: response.pagination?.items?.total ?? null,
  };
}

export async function fetchAnimeList(query: string, limit: number, signal?: AbortSignal) {
  const result = await fetchAnimePage(query, 1, Math.min(limit, 25), signal);
  return result.items.slice(0, limit);
}

export async function fetchAnimeDetail(id: number, signal?: AbortSignal) {
  const response = await requestJikan<{ data: JikanAnime }>(`/anime/${id}/full`, signal);
  return mapAnime(response.data);
}

export async function fetchAnimeCharacters(id: number, signal?: AbortSignal) {
  const response = await requestJikan<{ data?: JikanCharacter[] }>(`/anime/${id}/characters`, signal);
  return (response.data ?? [])
    .sort((a, b) => Number(b.role === "Main") - Number(a.role === "Main"))
    .slice(0, 12)
    .map((item) => ({
      id: item.character.mal_id,
      name: item.character.name,
      role: item.role,
      image: item.character.images?.webp?.image_url ?? item.character.images?.jpg?.image_url,
      voiceActor: item.voice_actors?.find((actor) => actor.language === "Japanese")?.person.name ?? item.voice_actors?.[0]?.person.name,
    }));
}

export async function fetchAnimeStaff(id: number, signal?: AbortSignal) {
  const response = await requestJikan<{ data?: JikanStaff[] }>(`/anime/${id}/staff`, signal);
  return (response.data ?? []).slice(0, 12).map((item) => ({
    id: item.person.mal_id,
    name: item.person.name,
    positions: item.positions,
    image: item.person.images?.jpg?.image_url,
  }));
}

export async function fetchSeasonNow(limit = 25, signal?: AbortSignal) {
  const response = await requestJikan<{ data?: JikanAnime[] }>(`/seasons/now?limit=${limit}&sfw=true`, signal);
  return (response.data ?? []).map(mapAnime);
}

type JikanCharacterFull = {
  mal_id: number;
  name: string;
  name_kanji?: string | null;
  about?: string | null;
  favorites?: number | null;
  images?: { jpg?: JikanImage; webp?: JikanImage };
  voices?: Array<{ language: string; person: { name: string; images?: { jpg?: JikanImage } } }>;
  anime?: Array<{ role: string; anime: { mal_id: number; title: string; images?: { jpg?: JikanImage; webp?: JikanImage } } }>;
};

export async function fetchCharacterDetail(id: number, signal?: AbortSignal): Promise<CharacterDetail> {
  const response = await requestJikan<{ data: JikanCharacterFull }>(`/characters/${id}/full`, signal);
  const character = response.data;
  return {
    id: character.mal_id,
    name: character.name,
    nameKanji: character.name_kanji || undefined,
    image: character.images?.webp?.image_url ?? character.images?.jpg?.image_url,
    about: character.about || "Biografia ainda não disponível.",
    favorites: character.favorites || 0,
    voices: (character.voices ?? []).slice(0, 8).map((voice) => ({
      name: voice.person.name,
      language: voice.language,
      image: voice.person.images?.jpg?.image_url,
    })),
    anime: (character.anime ?? []).slice(0, 12).map((credit) => ({
      id: credit.anime.mal_id,
      title: credit.anime.title,
      role: credit.role,
      image: credit.anime.images?.webp?.image_url ?? credit.anime.images?.jpg?.image_url,
    })),
  };
}
