import { notFound } from "next/navigation";
import EditUserForm from "./EditUserForm";
import { getUserById } from "../../actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

const EditUserPage = async ({ params }: Props) => {
  const { id } = await params;
  const user = await getUserById(id);

  if (!user) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Button asChild variant="ghost" className="mb-4">
        <Link href="/admin-portal">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>
      <EditUserForm user={user} />
    </div>
  );
};

export default EditUserPage;
