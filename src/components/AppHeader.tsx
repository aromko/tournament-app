"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";

export function AppHeader() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-foreground hover:opacity-90"
        >
          <Trophy className="h-5 w-5 text-primary" />
          <span className="font-semibold">Tournament Manager</span>
        </Link>
      </div>
    </header>
  );
}

export default AppHeader;
