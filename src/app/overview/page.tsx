import { getTournaments } from "@/prisma/db";
import { Tournament } from "@prisma/client";

export default async function OverviewPage() {
  const tournaments: Tournament[] = await getTournaments();

  return (
    <ul>
      {tournaments.map((tournament: Tournament) => (
        <li key={tournament.id}>{tournament.name}</li>
      ))}
    </ul>
  );
}
