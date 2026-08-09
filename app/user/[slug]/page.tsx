import { KurosawApp } from "../../components/KurosawApp";

export default async function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <KurosawApp view="public-profile" slug={decodeURIComponent(slug)} />;
}
