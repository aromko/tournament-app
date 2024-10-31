"use client";

import Player from "@/app/setup/player/[id]/Player";
import Grid from "@mui/material/Grid2";
import React, { useActionState } from "react";
import { Button, Stack } from "@mui/material";
import NotFound from "@/app/not-found";
import { createTournamentPlayers } from "@/app/setup/action";
import { useParams, useSearchParams } from "next/navigation";

export default function PlayerPage() {
  const tournamentId = useParams().id;
  const playersParam = useSearchParams().get("p");

  if (!playersParam) {
    return <NotFound />;
  }

  const renderPlayerComponent = Array.from({ length: parseInt(playersParam) });

  const [state, formAction, isPending] = useActionState(
    createTournamentPlayers,
    { tournamentId },
  );

  return (
    <div className="mx-96">
      <h1>Please enter player names</h1>
      <form action={formAction}>
        <Stack
          direction={{ xs: "column", sm: "column" }}
          spacing={{ xs: 1, sm: 2, md: 4 }}
        >
          <Grid
            container
            rowSpacing={2}
            columns={{ xs: 4, sm: 8, md: 12 }}
            columnSpacing={1}
          >
            {renderPlayerComponent.map((_, index) => (
              <Grid key={crypto.randomUUID()} size={{ xs: 2, sm: 4, md: 4 }}>
                <Player index={index} />
              </Grid>
            ))}
          </Grid>
          <Stack
            direction={{ xs: "column", sm: "column" }}
            spacing={{ xs: 1, sm: 2, md: 4 }}
            alignItems="flex-end"
          >
            <Button
              type="submit"
              variant="contained"
              color="primary"
              aria-disabled={isPending}
            >
              Continue
            </Button>
          </Stack>
        </Stack>
      </form>
      <p>
        {tournamentId}
        {state?.message}
      </p>
    </div>
  );
}
