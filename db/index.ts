import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export async function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL não está configurada. Conecte um banco Neon ao projeto no Vercel e disponibilize essa variável."
    );
  }

  return drizzle(neon(databaseUrl), { schema });
}
