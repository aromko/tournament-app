import { getTournaments } from "@/prisma/db";

export default async function OverviewPage() {
  const tournaments = await getTournaments();

  return (
    <ul>
      {tournaments.map((tournament: { id: number; name: string }) => (
        <li key={tournament.id}>{tournament.name}</li>
      ))}
    </ul>
  );
}
