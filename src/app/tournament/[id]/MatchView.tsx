"use client";

import type { MatchRow as MatchRowType } from "@/prisma/db/match";
import MatchRow from "./MatchRow";

export default function MatchView({
  numberOfGroups,
  groupMatches,
}: {
  numberOfGroups: number;
  groupMatches: Record<number, MatchRowType[]>;
}) {
  return (
    <>
      {Array.from({ length: numberOfGroups }, (_, i) => i + 1).map(
        (groupNo) => {
          const matches = groupMatches[groupNo] || [];
          return (
            <div key={groupNo} className="space-y-2">
              <h2 className="text-xl font-medium">Group {groupNo}</h2>
              {matches.length === 0 ? (
                <p className="text-muted-foreground">
                  No matches in this group.
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2 text-sm text-muted-foreground px-0">
                    <span>Player 1</span>
                    <span className="text-center">Score</span>
                    <span>Player 2</span>
                    <span></span>
                  </div>
                  {matches.map((match) => (
                    <MatchRow key={match.id} match={match} />
                  ))}
                </div>
              )}
            </div>
          );
        },
      )}
    </>
  );
}
