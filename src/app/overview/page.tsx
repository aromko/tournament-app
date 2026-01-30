export const dynamic = "force-dynamic";

import { getTournaments } from "@/prisma/db";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import RegisterPlayerDialog from "@/app/overview/RegisterPlayerDialog";
import StartTournamentMenuItem from "@/app/overview/StartTournamentMenuItem";

export default async function OverviewPage() {
  const tournaments = await getTournaments();

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60%]">Name</TableHead>
            <TableHead className="w-[20%]">Status</TableHead>
            <TableHead className="w-[20%] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tournaments.map((tournament: { id: number; name: string; started?: boolean }) => (
            <TableRow key={tournament.id}>
              <TableCell className="font-medium">{tournament.name}</TableCell>
              <TableCell>{tournament.started ? "Started" : "Not started"}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={`Actions for ${tournament.name}`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {tournament.started ? (
                      <DropdownMenuItem asChild>
                        <Link href={`/tournament/${tournament.id}`}>View</Link>
                      </DropdownMenuItem>
                    ) : (
                      <>
                        <RegisterPlayerDialog tournamentId={tournament.id} tournamentName={tournament.name} />
                        <DropdownMenuItem asChild>
                          <Link role="menuitem" href={`/setup/teams/${tournament.id}`}>Setup</Link>
                        </DropdownMenuItem>
                        <StartTournamentMenuItem tournamentId={tournament.id} />
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
