"use client";

import { PollList } from "@/components/PollList";
import { FhevmStatus } from "@/components/FhevmStatus";

export default function Home() {
  return (
    <main className="min-h-screen">
      <FhevmStatus />
      <PollList />
    </main>
  );
}




