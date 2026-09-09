"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";

const Logout = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await useAuthStore.getState().logout();
      router.refresh();
      router.push("/auth");
    } catch (error) {
      console.error("Failed to log out");
    }
  };

  return <DropdownMenuItem onSelect={handleLogout}>Logout</DropdownMenuItem>;
};

export default Logout;
