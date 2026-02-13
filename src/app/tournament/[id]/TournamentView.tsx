"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { StandingRow } from "@/prisma/db/standing";
import type { MatchRow } from "@/prisma/db/match";
import GroupView from "./GroupView";
import MatchView from "./MatchView";

export default function TournamentView({
  tournamentName,
  numberOfGroups,
  groupStandings,
  groupMatches,
}: {
  tournamentName: string;
  tournamentId: number;
  numberOfGroups: number;
  groupStandings: Record<number, StandingRow[]>;
  groupMatches: Record<number, MatchRow[]>;
}) {
  const [activeView, setActiveView] = useState<"groups" | "matches">("groups");

  return (
    <div className="space-y-8 p-4">
      <h1 className="text-2xl font-semibold">{tournamentName}</h1>

      <div className="flex gap-2">
        <Button
          variant={activeView === "groups" ? "default" : "outline"}
          onClick={() => setActiveView("groups")}
        >
          Groups
        </Button>
        <Button
          variant={activeView === "matches" ? "default" : "outline"}
          onClick={() => setActiveView("matches")}
        >
          Matches
        </Button>
      </div>

      {activeView === "groups" ? (
        <GroupView
          numberOfGroups={numberOfGroups}
          groupStandings={groupStandings}
        />
      ) : (
        <MatchView
          numberOfGroups={numberOfGroups}
          groupMatches={groupMatches}
        />
      )}
    </div>
  );
}
