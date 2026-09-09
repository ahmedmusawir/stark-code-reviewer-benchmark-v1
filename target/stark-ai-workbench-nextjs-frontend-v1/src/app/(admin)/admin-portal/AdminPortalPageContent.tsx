import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import PaginationControls from "@/components/common/PaginationControls";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUsers } from "./actions";
import DeleteUserButton from "./DeleteUserButton";

const PAGE_SIZE = 6;

const roleColor: Record<string, string> = {
  superadmin: "text-purple-600 dark:text-purple-400",
  admin: "text-red-600 dark:text-red-400",
  member: "text-green-600 dark:text-green-400",
};

interface Props {
  page: number;
}

const AdminPortalPageContent = async ({ page }: Props) => {
  const { users, total } = await getUsers(page);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Admin Portal</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Manage all users — {total} total
          </p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-500 dark:text-zinc-400">No users found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {users.map((user) => (
              <Card key={user.id} className="flex flex-col justify-between bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold truncate capitalize text-zinc-900 dark:text-zinc-100">
                    {user.full_name ?? "—"}
                  </CardTitle>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                    {user.email ?? "—"}
                  </p>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className={`text-base font-bold ${roleColor[user.role] ?? "text-zinc-500"}`}>
                    Role: {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </p>
                </CardContent>
                <CardFooter className="flex gap-2 pt-2">
                  <Button asChild variant="outline" size="sm" className="border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-600">
                    <Link href={`/admin-portal/edit/${user.id}`}>
                      <Pencil className="mr-1 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  {user.role === "member" && (
                    <DeleteUserButton userId={user.id} userName={user.full_name} userEmail={user.email} />
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <PaginationControls page={page} totalPages={totalPages} baseUrl="/admin-portal" />
          )}
        </>
      )}
    </div>
  );
};

export default AdminPortalPageContent;
