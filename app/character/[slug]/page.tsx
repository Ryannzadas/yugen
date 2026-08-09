import { KurosawApp } from "../../components/KurosawApp";

export default async function CharacterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <KurosawApp view="character" slug={slug} />;
}
