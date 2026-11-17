import { redirect } from 'next/navigation';

export default async function LegacyPortfolioRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/album/${encodeURIComponent(slug)}`);
}
