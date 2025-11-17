"use client";

import { Navbar } from "@/components/Navbar";

export function NavbarWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}




