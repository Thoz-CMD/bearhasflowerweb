import ClientPage from './ClientPage';

export const revalidate = 60;

export default async function HomePage() {
  // Don't pass ANY data with Thai characters - let client fetch everything
  return <ClientPage />;
}
