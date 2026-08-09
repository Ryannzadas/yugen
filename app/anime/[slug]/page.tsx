import { KurosawApp } from "../../components/KurosawApp";

export default async function AnimePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <KurosawApp view="anime" slug={slug} />;
}
