import SuperadminPortalPageContent from "./SuperadminPortalPageContent";

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

const SuperadminPortal = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  return <SuperadminPortalPageContent page={page} />;
};

export default SuperadminPortal;
