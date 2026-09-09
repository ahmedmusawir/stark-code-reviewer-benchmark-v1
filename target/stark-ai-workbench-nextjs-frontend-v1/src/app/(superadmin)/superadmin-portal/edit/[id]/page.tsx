import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUserById } from "../../actions";
import EditUserForm from "./EditUserForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

const EditUserPage = async ({ params }: PageProps) => {
  const { id } = await params;
  const user = await getUserById(id);

  if (!user) notFound();

  return (
    <section className="p-5">
      <Button asChild variant="ghost" className="mb-4 pl-0">
        <Link href="/superadmin-portal">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>
      <EditUserForm user={user!} />
    </section>
  );
};

export default EditUserPage;
