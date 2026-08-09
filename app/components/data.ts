export type Anime = {
  malId?: number;
  slug: string;
  title: string;
  year: number;
  genre: string;
  season: string;
  studio: string;
  format: string;
  status: string;
  rating: number;
  atlas: 1 | 2;
  frame: number;
  blurb: string;
  image?: string;
  imageSources?: string[];
  backdrop?: string;
  episodes?: number | null;
  duration?: string;
  synopsis?: string;
  titleJapanese?: string;
  genres?: string[];
  studios?: string[];
  aired?: string;
  ratingLabel?: string;
  scoredBy?: number | null;
  popularity?: number | null;
  source?: string;
  trailerUrl?: string | null;
  broadcastDay?: string;
  broadcastTime?: string;
  themes?: { openings: string[]; endings: string[] };
  characters?: Array<{ id: number; name: string; role: string; image?: string; voiceActor?: string }>;
  staff?: Array<{ id: number; name: string; positions: string[]; image?: string }>;
  relations?: Array<{ relation: string; entries: Array<{ id: number; name: string; type: string }> }>;
};

export type CharacterDetail = {
  id: number;
  name: string;
  nameKanji?: string;
  image?: string;
  about?: string;
  favorites: number;
  voices: Array<{ name: string; language: string; image?: string }>;
  anime: Array<{ id: number; title: string; role: string; image?: string }>;
};

export const collections = [
  { title: "Mundos tranquilos, sentimentos intensos", owner: "mika.wav", count: 18, frames: [5, 2, 15] },
  { title: "Cyberpunk depois da meia-noite", owner: "noa.exe", count: 24, frames: [1, 6, 10] },
  { title: "Animes para conquistar os céticos", owner: "haru", count: 12, frames: [4, 8, 12] },
  { title: "Histórias com cheiro de chuva", owner: "allowardj", count: 31, frames: [0, 3, 15] },
  { title: "Um fim de semana perfeito", owner: "mei", count: 9, frames: [2, 11, 13] },
  { title: "Notas 8 que mereciam mais atenção", owner: "eliot", count: 20, frames: [7, 9, 14] },
];

export const newsItems = [
  { slug: "summer-2026-guide", title: "As 12 estreias que definem a temporada de verão de 2026", category: "Guia da temporada", time: "há 18 min", anime: 0 },
  { slug: "animation-in-the-rain", title: "Como animadores transformam a chuva em personagem", category: "Produção", time: "há 2 horas", anime: 8 },
  { slug: "studio-astral-interview", title: "Por dentro do processo visual do Studio Astral", category: "Entrevista", time: "há 5 horas", anime: 14 },
  { slug: "soundtracks-to-notice", title: "Sete trilhas sonoras para ouvir com fones", category: "Música", time: "ontem", anime: 11 },
  { slug: "quiet-protagonists", title: "Por que protagonistas silenciosos estão em alta", category: "Ensaio", time: "ontem", anime: 15 },
];
