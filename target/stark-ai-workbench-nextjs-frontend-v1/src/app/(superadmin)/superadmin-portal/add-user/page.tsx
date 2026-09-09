import React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddUserForm from "./AddUserForm";

const AddUserPage = () => {
  return (
    <section className="p-5">
      <Button asChild variant="ghost" className="mb-4 pl-0">
        <Link href="/superadmin-portal">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>
      <AddUserForm />
    </section>
  );
};

export default AddUserPage;
