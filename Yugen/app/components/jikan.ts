import type { Anime, CharacterDetail } from "./data";

const JIKAN_BASE = "https://api.jikan.moe/v4";
const SHIKIMORI_BASE = "https://shikimori.io";

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

type ShikimoriImage = { original?: string; preview?: string; x96?: string; x48?: string };
type ShikimoriNamed = { id: number; name: string; image?: string | null };
type ShikimoriAnime = {
  id: number;
  name: string;
  english?: string[];
  japanese?: string[];
  image?: ShikimoriImage;
  kind?: string | null;
  score?: string | null;
  status?: string | null;
  episodes?: number | null;
  aired_on?: string | null;
  released_on?: string | null;
  rating?: string | null;
  duration?: number | null;
  description?: string | null;
  genres?: ShikimoriNamed[];
  studios?: ShikimoriNamed[];
  videos?: Array<{ url?: string; player_url?: string; hosting?: string }>;
  screenshots?: ShikimoriImage[];
};

type ShikimoriRole = {
  roles?: string[];
  character?: { id: number; name: string; image?: ShikimoriImage } | null;
  person?: { id: number; name: string; image?: ShikimoriImage } | null;
};

type ShikimoriCharacter = {
  id: number;
  name: string;
  japanese?: string | null;
  image?: ShikimoriImage;
  description?: string | null;
  favoured?: boolean;
  seyu?: Array<{ id: number; name: string; image?: ShikimoriImage }>;
  animes?: Array<{ id: number; name: string; image?: ShikimoriImage; kind?: string }>;
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

async function requestShikimori<T>(path: string, signal?: AbortSignal): Promise<T> {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(`${SHIKIMORI_BASE}/api${path}`, { headers: { accept: "application/json" }, signal });
    if (response.ok) return response.json();
    lastStatus = response.status;
    if (response.status < 500 && response.status !== 429) break;
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
  throw new Error(lastStatus ? `As APIs de anime estão indisponíveis (${lastStatus}).` : "As APIs de anime estão indisponíveis.");
}

function shikimoriImage(image?: ShikimoriImage) {
  const path = image?.original || image?.preview || image?.x96;
  return path ? `${SHIKIMORI_BASE}${path}` : undefined;
}

function shikimoriSeason(date?: string | null) {
  const month = date ? Number(date.slice(5, 7)) : 0;
  if (month >= 1 && month <= 3) return "Winter";
  if (month >= 4 && month <= 6) return "Spring";
  if (month >= 7 && month <= 9) return "Summer";
  if (month >= 10) return "Fall";
  return "Unknown";
}

function shikimoriFormat(kind?: string | null) {
  const labels: Record<string, string> = { tv: "TV", movie: "Movie", ova: "OVA", ona: "ONA", special: "Special", music: "Music", tv_special: "Special" };
  return kind ? labels[kind] || kind.toUpperCase() : "Unknown";
}

function shikimoriStatus(status?: string | null) {
  if (status === "ongoing") return "Currently Airing";
  if (status === "released") return "Finished Airing";
  if (status === "anons") return "Not yet aired";
  return "Unknown";
}

function shikimoriRating(rating?: string | null) {
  const labels: Record<string, string> = {
    none: "Not rated",
    g: "G - All Ages",
    pg: "PG - Children",
    pg_13: "PG-13 - Teens 13 or older",
    r: "R - 17+",
    r_plus: "R+ - Mild Nudity",
    rx: "Rx - Hentai",
  };

  if (!rating) return "Not rated";
  return labels[rating.toLowerCase()] || rating.toUpperCase().replaceAll("_", "-");
}

function cleanShikimoriText(value?: string | null) {
  return value?.replace(/\[(?:character|anime|manga)=[^\]]+\]/g, "").replace(/\[\/[^\]]+\]/g, "").trim() || "Sinopse ainda não disponível.";
}

function mapShikimoriAnime(anime: ShikimoriAnime, index = 0): Anime {
  const genres = (anime.genres ?? []).map((item) => item.name);
  const studios = (anime.studios ?? []).map((item) => item.name);
  const image = shikimoriImage(anime.image);
  const screenshot = shikimoriImage(anime.screenshots?.[0]);
  const video = anime.videos?.find((item) => item.hosting === "youtube") || anime.videos?.[0];
  const youtubeId = video?.url?.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{6,})/)?.[1]
    || video?.player_url?.match(/embed\/([A-Za-z0-9_-]{6,})/)?.[1];
  const synopsis = cleanShikimoriText(anime.description);
  const year = anime.aired_on ? Number(anime.aired_on.slice(0, 4)) || 0 : 0;
  return {
    malId: anime.id,
    slug: `mal-${anime.id}`,
    title: anime.english?.[0] || anime.name,
    titleJapanese: anime.japanese?.[0] || undefined,
    year,
    genre: genres[0] || "Anime",
    genres,
    season: shikimoriSeason(anime.aired_on),
    studio: studios[0] || "Unknown studio",
    studios,
    format: shikimoriFormat(anime.kind),
    status: shikimoriStatus(anime.status),
    rating: Number(anime.score) || 0,
    ratingLabel: shikimoriRating(anime.rating),
    episodes: anime.episodes ?? null,
    duration: anime.duration ? `${anime.duration} min per ep` : "Unknown",
    aired: [anime.aired_on, anime.released_on].filter(Boolean).join(" to ") || "Unknown",
    source: "MyAnimeList",
    atlas: 1,
    frame: index % 8,
    image,
    backdrop: screenshot || image,
    blurb: synopsis,
    synopsis,
    trailerUrl: youtubeId ? `https://www.youtube-nocookie.com/embed/${youtubeId}` : null,
    themes: { openings: [], endings: [] },
    relations: [],
  };
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
  const params = new URLSearchParams({ order: "popularity", page: String(safePage), limit: String(safeLimit), censored: "true" });
  if (normalizedQuery) params.set("search", query.trim());
  const response = await requestShikimori<ShikimoriAnime[]>(`/animes?${params.toString()}`, signal);
  return {
    items: sortSearchResults(response.map(mapShikimoriAnime), normalizedQuery),
    page: safePage,
    hasNextPage: response.length === safeLimit,
    total: null,
  };
}

export async function fetchAnimeList(query: string, limit: number, signal?: AbortSignal) {
  const result = await fetchAnimePage(query, 1, Math.min(limit, 25), signal);
  return result.items.slice(0, limit);
}

export async function fetchAnimeDetail(id: number, signal?: AbortSignal) {
  try {
    const response = await requestJikan<{ data: JikanAnime }>(`/anime/${id}/full`, signal);
    return mapAnime(response.data);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return mapShikimoriAnime(await requestShikimori<ShikimoriAnime>(`/animes/${id}`, signal));
  }
}

export async function fetchAnimeCharacters(id: number, signal?: AbortSignal) {
  try {
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
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    const roles = await requestShikimori<ShikimoriRole[]>(`/animes/${id}/roles`, signal);
    return roles.filter((item) => item.character).sort((a, b) => Number(b.roles?.includes("Main")) - Number(a.roles?.includes("Main"))).slice(0, 12).map((item) => ({
      id: item.character!.id,
      name: item.character!.name,
      role: item.roles?.[0] || "Supporting",
      image: shikimoriImage(item.character!.image),
      voiceActor: undefined,
    }));
  }
}

export async function fetchAnimeStaff(id: number, signal?: AbortSignal) {
  try {
    const response = await requestJikan<{ data?: JikanStaff[] }>(`/anime/${id}/staff`, signal);
    return (response.data ?? []).slice(0, 12).map((item) => ({
      id: item.person.mal_id,
      name: item.person.name,
      positions: item.positions,
      image: item.person.images?.jpg?.image_url,
    }));
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    const roles = await requestShikimori<ShikimoriRole[]>(`/animes/${id}/roles`, signal);
    return roles.filter((item) => item.person).slice(0, 12).map((item) => ({
      id: item.person!.id,
      name: item.person!.name,
      positions: item.roles || ["Staff"],
      image: shikimoriImage(item.person!.image),
    }));
  }
}

export async function fetchSeasonNow(limit = 25, signal?: AbortSignal) {
  const params = new URLSearchParams({ status: "ongoing", order: "popularity", page: "1", limit: String(Math.min(50, limit)), censored: "true" });
  const response = await requestShikimori<ShikimoriAnime[]>(`/animes?${params.toString()}`, signal);
  return response.map(mapShikimoriAnime);
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
  try {
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
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    const character = await requestShikimori<ShikimoriCharacter>(`/characters/${id}`, signal);
    return {
      id: character.id,
      name: character.name,
      nameKanji: character.japanese || undefined,
      image: shikimoriImage(character.image),
      about: cleanShikimoriText(character.description),
      favorites: character.favoured ? 1 : 0,
      voices: (character.seyu ?? []).slice(0, 8).map((voice) => ({ name: voice.name, language: "Japanese", image: shikimoriImage(voice.image) })),
      anime: (character.animes ?? []).slice(0, 12).map((credit) => ({ id: credit.id, title: credit.name, role: credit.kind || "Anime", image: shikimoriImage(credit.image) })),
    };
  }
}
