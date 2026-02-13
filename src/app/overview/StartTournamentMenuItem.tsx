"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

type Props = {
  tournamentId: number;
};

export default function StartTournamentMenuItem({ tournamentId }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tournament/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tournamentId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || `Failed to start (HTTP ${res.status})`);
      }
      // Navigate to the tournament page
      router.push(`/tournament/${tournamentId}`);
    } catch (e) {
      // Minimal error surface without introducing a toast dependency
      const msg = e instanceof Error ? e.message : String(e);
       
      alert(`Could not start tournament: ${msg}`);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenuItem
      className="bg-green-50 text-green-700 hover:bg-green-100 focus:bg-green-100"
      onClick={onClick}
      aria-disabled={loading}
      role="menuitem"
    >
      {loading ? "Starting…" : "Start"}
    </DropdownMenuItem>
  );
}
