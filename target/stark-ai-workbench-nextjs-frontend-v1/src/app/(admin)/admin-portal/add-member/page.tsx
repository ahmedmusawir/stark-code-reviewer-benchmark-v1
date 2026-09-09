import AddMemberForm from "./AddMemberForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const AddMemberPage = () => {
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Button asChild variant="ghost" className="mb-4">
        <Link href="/admin-portal">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>
      <AddMemberForm />
    </div>
  );
};

export default AddMemberPage;
