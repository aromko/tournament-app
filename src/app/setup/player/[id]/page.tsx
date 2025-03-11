"use client";

import Player from "@/app/setup/player/[id]/Player";
import React, { useActionState } from "react";
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

  const renderPlayerComponent = Array.from({ length: parseInt(playersParam) });

  const [state, formAction, isPending] = useActionState(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    createTournamentPlayers,
    { tournamentId },
  );

  return (
    <div className="mx-96 grid gap-6">
      <h1>Please enter player names</h1>
      <form action={formAction} className="space-y-6">
        <div className="grid gap-6">
          {renderPlayerComponent.map((_, index) => (
            <Player index={index} key={index} />
          ))}
          <Button type="submit" className="w-full" aria-disabled={isPending}>
            Continue
          </Button>
        </div>
      </form>
      {state?.message && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state?.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
