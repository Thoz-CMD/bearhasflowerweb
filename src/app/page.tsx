import ClientPage from './ClientPage';

export const revalidate = 60;
export const dynamic = 'force-dynamic'; // Don't prerender - avoid Thai character serialization

export default async function HomePage() {
  // Don't pass ANY data with Thai characters - let client fetch everything
  return <ClientPage />;
}
