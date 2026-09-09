import { ThemeToggle } from "@/components/global/ThemeToggle";
import React from "react";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 transition-colors">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
