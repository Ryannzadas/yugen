import { KurosawApp } from "../../components/KurosawApp";

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <KurosawApp view="article" slug={slug} />;
}
