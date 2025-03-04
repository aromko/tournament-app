import { getTournaments } from "@/prisma/db";

export default async function OverviewPage() {
  const tournaments = await getTournaments();

  return (
    <ul>
      {tournaments.map((tournament) => (
        <li key={tournament.id}>{tournament.name}</li>
      ))}
    </ul>
  );
}
