"use client";

import type { StandingRow } from "@/prisma/db/standing";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function GroupView({
  numberOfGroups,
  groupStandings,
}: {
  numberOfGroups: number;
  groupStandings: Record<number, StandingRow[]>;
}) {
  return (
    <>
      {Array.from({ length: numberOfGroups }, (_, i) => i + 1).map(
        (groupNo) => {
          const rows = groupStandings[groupNo] || [];
          return (
            <div key={groupNo} className="space-y-2">
              <h2 className="text-xl font-medium">Group {groupNo}</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[10%]">Rank</TableHead>
                    <TableHead className="w-[40%]">Player</TableHead>
                    <TableHead className="w-[10%]">Games</TableHead>
                    <TableHead className="w-[15%]">Win/Loss</TableHead>
                    <TableHead className="w-[10%]">Diff</TableHead>
                    <TableHead className="w-[15%]">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground"
                      >
                        No players in this group.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map(
                      (
                        { id, rank, player, games, wins, losses, diff, points },
                        idx,
                      ) => (
                        <TableRow key={id}>
                          <TableCell>{rank ?? idx + 1}</TableCell>
                          <TableCell className="font-medium">
                            {player.name}
                          </TableCell>
                          <TableCell>{games}</TableCell>
                          <TableCell>
                            {wins}:{losses}
                          </TableCell>
                          <TableCell>{diff}</TableCell>
                          <TableCell>{points}</TableCell>
                        </TableRow>
                      ),
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          );
        },
      )}
    </>
  );
}
