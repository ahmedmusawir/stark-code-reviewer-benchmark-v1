"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { deleteUser } from "./actions";

interface DeleteUserButtonProps {
  userId: string;
  userName: string | null;
  userEmail: string | null;
}

const DeleteUserButton = ({ userId, userName, userEmail }: DeleteUserButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    const result = await deleteUser(userId);
    setLoading(false);

    if (result.error) {
      toast({
        title: "Error deleting user",
        description: result.error,
        variant: "destructive",
      });
    } else {
      setOpen(false);
      toast({ title: "User deleted successfully" });
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-2 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 dark:border-red-500 dark:text-red-400"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">
              {userName ?? userEmail ?? userId}
            </span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:justify-end">
          <DialogClose asChild>
            <Button variant="outline" disabled={loading} className="border-2">
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="border-2 border-red-700 dark:border-red-400"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Yes, Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteUserButton;
