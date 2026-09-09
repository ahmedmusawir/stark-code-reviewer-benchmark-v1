import AdminPortalPageContent from "./AdminPortalPageContent";

interface Props {
  searchParams: Promise<{ page?: string }>;
}

const AdminPortal = async ({ searchParams }: Props) => {
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam) || 1;
  return <AdminPortalPageContent page={page} />;
};

export default AdminPortal;
