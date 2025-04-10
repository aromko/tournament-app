"use client";

import Player from "@/app/setup/player/[id]/Player";
import React, { useActionState, useState } from "react";
import NotFound from "@/app/not-found";
import { createTournamentPlayers } from "@/app/setup/action";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function PlayerPage() {
  const tournamentId = useParams().id;
  const playersParam = useSearchParams().get("p");

  if (!playersParam) {
    return <NotFound />;
  }

  const [players, setPlayers] = useState(parseInt(playersParam));

  const renderPlayerComponent = Array.from({ length: players });

  const [error, formAction, isPending] = useActionState(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    createTournamentPlayers,
    { tournamentId },
  );
  console.log(players);
  return (
    <div className="mx-80 grid gap-6 grid-cols-8 items-end">
      <h1 className="col-span-full">Please enter player names</h1>
      <form
        id="playerForm"
        action={formAction}
        className="space-y-6 col-span-5"
      >
        <div className="grid gap-6 grid-cols-2">
          {renderPlayerComponent.map((_, index) => (
            <Player index={index.toString()} key={index} />
          ))}
        </div>
      </form>
      <Button
        type="button"
        className="w-full col-end-9 col-span-2"
        aria-disabled={isPending}
        variant="secondary"
        onClick={() => setPlayers(players + 1)}
      >
        Add Player
      </Button>
      <Button
        type="submit"
        className="w-full col-span-full"
        aria-disabled={isPending}
        form="playerForm"
      >
        Continue
      </Button>

      {error?.message && (
        <Alert variant="destructive" className="col-span-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error?.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
