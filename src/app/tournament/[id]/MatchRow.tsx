"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveMatchScore } from "./actions";
import type { MatchRow as MatchRowType } from "@/prisma/db/match";

export default function MatchRow({ match }: { match: MatchRowType }) {
  const [state, formAction, isPending] = useActionState(saveMatchScore, {});

  return (
    <form action={formAction} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
      <input type="hidden" name="matchId" value={match.id} />
      <span className="font-medium">{match.player1.name}</span>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          name="score1"
          min={0}
          defaultValue={match.played ? (match.score1 ?? "") : ""}
          className="w-16 text-center"
          required
        />
        <span>:</span>
        <Input
          type="number"
          name="score2"
          min={0}
          defaultValue={match.played ? (match.score2 ?? "") : ""}
          className="w-16 text-center"
          required
        />
      </div>
      <span className="font-medium">{match.player2.name}</span>
      <div className="flex items-center gap-1">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving..." : "Save"}
        </Button>
        {state.error && (
          <span className="text-sm text-destructive">{state.error}</span>
        )}
      </div>
    </form>
  );
}
