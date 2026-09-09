"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Props {
  user: SupabaseUser;
}

const ProfileForm = ({ user }: Props) => {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const { toast } = useToast();

  const displayName: string =
    user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Member";

  const initials = displayName
    .split(" ")
    .map((word: string) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (password.length < 8) {
      setValidationError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({
        title: "Error updating password",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Password updated successfully" });
      setPassword("");
      setConfirmPassword("");
      setValidationError(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Avatar + identity card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            {/* Placeholder avatar */}
            <div className="flex-shrink-0 w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center border-2 border-green-300 dark:border-green-700">
              {initials ? (
                <span className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {initials}
                </span>
              ) : (
                <User className="w-8 h-8 text-green-600 dark:text-green-400" />
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xl font-bold">{displayName}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                Member
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="uppercase text-xs font-bold text-zinc-500 dark:text-white">
              Full Name
            </Label>
            <Input
              className="p-6 bg-slate-100 dark:bg-slate-500 dark:text-white mt-2 opacity-60 cursor-not-allowed"
              value={displayName}
              disabled
            />
          </div>
          <div>
            <Label className="uppercase text-xs font-bold text-zinc-500 dark:text-white">
              Email
            </Label>
            <Input
              className="p-6 bg-slate-100 dark:bg-slate-500 dark:text-white mt-2 opacity-60 cursor-not-allowed"
              value={user.email ?? "—"}
              disabled
            />
            <p className="text-sm text-muted-foreground mt-1">
              Contact an admin to change your email or name
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Password update */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <Label className="uppercase text-xs font-bold text-zinc-500 dark:text-white">
                New Password
              </Label>
              <Input
                className="p-6 bg-slate-100 dark:bg-slate-500 dark:text-white mt-2"
                type="password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <Label className="uppercase text-xs font-bold text-zinc-500 dark:text-white">
                Confirm New Password
              </Label>
              <Input
                className="p-6 bg-slate-100 dark:bg-slate-500 dark:text-white mt-2"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {validationError && (
                <p className="text-sm text-red-500 dark:text-red-400 mt-1">{validationError}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-700 text-white hover:bg-slate-900 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileForm;
