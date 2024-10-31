import Player from "@/app/setup/player/[id]/Player";
import Grid from "@mui/material/Grid2";
import React from "react";
import { Button, Stack } from "@mui/material";

export default async function PlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string }>;
}) {
  const tournamentId = (await params).id;
  const playersParam = (await searchParams).p;

  const renderPlayerComponent = Array.from({ length: parseInt(playersParam) });

  return (
    <div className="mx-96">
      <h1>Please enter player names</h1>
      <form>
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
            <Button type="submit" variant="contained" color="primary">
              Continue
            </Button>
          </Stack>
        </Stack>
      </form>
    </div>
  );
}
