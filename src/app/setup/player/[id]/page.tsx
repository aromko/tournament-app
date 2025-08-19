"use client";

import Player from "@/app/setup/player/[id]/Player";
import React, { useEffect, useState } from "react";
import NotFound from "@/app/not-found";
import { createTournamentPlayers } from "@/app/setup/action";
import * as NextNavigation from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, UserPlus } from "lucide-react";
import Link from "next/link";

export default function PlayerPage() {
  const tournamentId = NextNavigation.useParams().id as string;
  const playersParam = NextNavigation.useSearchParams().get("p");
  if (!playersParam) {
    return <NotFound />;
  }

  const [players, setPlayers] = useState(parseInt(playersParam));
  const [prefill, setPrefill] = useState<string[]>([]);

  useEffect(() => {
    let ignore = false;
    async function loadPlayers() {
      try {
        const res = await fetch(`/api/tournament/${tournamentId}/players`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { id: number; name: string }[];
        if (ignore) return;
        const names = data.map((p) => p.name ?? "");
        setPrefill(names);
        if (Number.isFinite(data.length) && data.length > 0) {
          setPlayers(data.length);
        }
      } catch {
        // ignore
      }
    }
    if (tournamentId) {
      void loadPlayers();
    }
    return () => {
      ignore = true;
    };
  }, [tournamentId]);

  const renderPlayerComponent = Array.from({ length: players });

  const [error, formAction, isPending] = React.useActionState(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    createTournamentPlayers,
    { tournamentId },
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid gap-6 grid-cols-1 md:grid-cols-8 items-end">
        <div className="w-full md:col-start-6 md:col-span-3 flex md:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPlayers(players + 1)}
            aria-disabled={isPending}
            className="w-full md:w-auto"
          >
            <UserPlus />
            Add Player
          </Button>
        </div>
        <form
          id="playerForm"
          action={formAction}
          className="space-y-6 md:col-span-5"
        >
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
            {renderPlayerComponent.map((_, index) => (
              <Player index={index.toString()} key={index} defaultValue={prefill[index]}
              />
            ))}
          </div>
        </form>
        <div className="w-full md:col-span-full grid grid-cols-1 md:grid-cols-4 gap-3">
          <Button asChild type="button" variant="outline" className="w-full md:col-span-1">
            <Link href={`/setup?id=${tournamentId}&p=${players}`}>Cancel</Link>
          </Button>
          <Button
            type="submit"
            className="w-full md:col-span-3"
            aria-disabled={isPending}
            form="playerForm"
          >
            Next: Player Assignment
          </Button>
        </div>

        {error?.message && (
          <Alert variant="destructive" className="md:col-span-full col-span-1">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error?.message}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
