"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { editUser, type UserWithRole } from "../../actions";

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  role: z.enum(["admin", "member"], { required_error: "Role is required" }),
});

type FormValues = z.infer<typeof formSchema>;

interface EditUserFormProps {
  user: UserWithRole;
}

const EditUserForm = ({ user }: EditUserFormProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.full_name ?? "",
      role: (user.role === "superadmin" ? "admin" : user.role) as FormValues["role"] ?? "member",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    const result = await editUser(user.id, values);
    setLoading(false);

    if (result.error) {
      toast({
        title: "Error updating user",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({ title: "User updated successfully" });
      router.push("/superadmin-portal");
    }
  };

  return (
    <div className="p-5 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Edit User</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Email — read-only for security */}
          <FormItem>
            <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-white">
              Email
            </FormLabel>
            <FormControl>
              <Input
                type="email"
                value={user.email ?? ""}
                disabled
                className="p-6 bg-slate-100 dark:bg-slate-500 dark:text-white opacity-60 cursor-not-allowed"
              />
            </FormControl>
            <FormDescription>Email cannot be changed for security reasons</FormDescription>
          </FormItem>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-white">
                  Full Name
                </FormLabel>
                <FormControl>
                  <Input
                    className="p-6 bg-slate-100 dark:bg-slate-500 dark:text-white"
                    placeholder="Enter full name"
                    {...field}
                  />
                </FormControl>
                <FormDescription>The user&apos;s display name</FormDescription>
                <FormMessage className="text-red-500 dark:text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-white">
                  Role
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="p-6 bg-slate-100 dark:bg-slate-500 dark:text-white">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600">
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>The user&apos;s access level</FormDescription>
                <FormMessage className="text-red-500 dark:text-red-400" />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-700 text-white hover:bg-slate-900 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default EditUserForm;
