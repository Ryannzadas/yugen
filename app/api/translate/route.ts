import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { contentTranslations } from "../../../db/schema";

type SourceLanguage = "en" | "ru";
type TargetLanguage = "pt" | "es" | "en";

const translationCache = new Map<string, string>();

function splitText(text: string, maxLength = 420) {
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

function decodeEntities(text: string) {
  return text
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

async function translateWithMyMemory(text: string, source: SourceLanguage, target: TargetLanguage) {
  const params = new URLSearchParams({ q: text, langpair: `${source}|${target}` });
  const response = await fetch(`https://api.mymemory.translated.net/get?${params.toString()}`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`Translation service returned ${response.status}`);
  const data = await response.json() as {
    responseStatus?: number;
    responseDetails?: string;
    responseData?: { translatedText?: string };
  };
  const translated = data.responseData?.translatedText;
  if (data.responseStatus !== 200 || !translated) throw new Error(data.responseDetails || "Translation failed");
  return decodeEntities(translated);
}

async function translateWithGoogle(text: string, source: SourceLanguage, target: TargetLanguage) {
  const params = new URLSearchParams({ client: "gtx", sl: source, tl: target, dt: "t", q: text });
  const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params.toString()}`, {
    headers: { accept: "application/json", "user-agent": "Yugen/1.0" },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`Secondary translation service returned ${response.status}`);
  const data = await response.json() as Array<Array<Array<string | null>>>;
  const translated = data[0]?.map((part) => part?.[0] || "").join("").trim();
  if (!translated) throw new Error("Secondary translation service returned an empty result");
  return translated;
}

async function translateChunk(text: string, source: SourceLanguage, target: TargetLanguage) {
  try {
    return { text: await translateWithGoogle(text, source, target), provider: "google" };
  } catch {
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return { text: await translateWithMyMemory(text, source, target), provider: "mymemory" };
      } catch (error) {
        lastError = error;
        if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
    throw lastError instanceof Error ? lastError : new Error("Translation failed");
  }
}

function translationHash(text: string, source: SourceLanguage) {
  return createHash("sha256").update(`${source}\u0000${text}`, "utf8").digest("hex");
}

async function readStoredTranslation(sourceHash: string, target: TargetLanguage) {
  try {
    const db = await getDb();
    const [stored] = await db.select().from(contentTranslations).where(and(
      eq(contentTranslations.sourceHash, sourceHash),
      eq(contentTranslations.targetLanguage, target),
    )).limit(1);
    return stored;
  } catch {
    return undefined;
  }
}

async function storeTranslation(input: {
  sourceHash: string;
  source: SourceLanguage;
  target: TargetLanguage;
  sourceText: string;
  translatedText: string;
  provider: string;
}) {
  try {
    const now = new Date().toISOString();
    const db = await getDb();
    await db.insert(contentTranslations).values({
      id: `${input.sourceHash}:${input.target}`,
      sourceHash: input.sourceHash,
      sourceLanguage: input.source,
      targetLanguage: input.target,
      sourceText: input.sourceText,
      translatedText: input.translatedText,
      provider: input.provider,
      createdAt: now,
      updatedAt: now,
    }).onConflictDoUpdate({
      target: [contentTranslations.sourceHash, contentTranslations.targetLanguage],
      set: { translatedText: input.translatedText, provider: input.provider, updatedAt: now },
    });
  } catch {
    // Translation remains available even before the database migration is applied.
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { text?: string; source?: string; target?: string };
    const text = payload.text?.trim() || "";
    const source = (payload.source || "en") as SourceLanguage;
    const target = payload.target as TargetLanguage;
    if (!text) return Response.json({ error: "text is required" }, { status: 400 });
    if (!(["en", "ru"] as string[]).includes(source)) return Response.json({ error: "unsupported source language" }, { status: 400 });
    if (!(["pt", "es", "en"] as string[]).includes(target)) return Response.json({ error: "unsupported target language" }, { status: 400 });
    if (text.length > 8000) return Response.json({ error: "text is too long" }, { status: 413 });
    if (source === target) return Response.json({ text, cached: true });

    const sourceHash = translationHash(text, source);
    const cacheKey = `${sourceHash}:${target}`;
    const cached = translationCache.get(cacheKey);
    if (cached) return Response.json({ text: cached, cached: true, cache: "memory" });

    const stored = await readStoredTranslation(sourceHash, target);
    if (stored) {
      translationCache.set(cacheKey, stored.translatedText);
      return Response.json({ text: stored.translatedText, cached: true, cache: "database" });
    }

    const translatedChunks: string[] = [];
    const providers = new Set<string>();
    for (const chunk of splitText(text)) {
      const translatedChunk = await translateChunk(chunk, source, target);
      translatedChunks.push(translatedChunk.text);
      providers.add(translatedChunk.provider);
    }
    const translated = translatedChunks.join(" ");
    translationCache.set(cacheKey, translated);
    await storeTranslation({
      sourceHash,
      source,
      target,
      sourceText: text,
      translatedText: translated,
      provider: [...providers].join("+") || "automatic",
    });
    return Response.json({ text: translated, cached: false, cache: "provider" });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Translation failed" }, { status: 502 });
  }
}
