"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { ProjectProvider } from "./ProjectContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ProjectProvider>{children}</ProjectProvider>
    </SessionProvider>
  );
}
