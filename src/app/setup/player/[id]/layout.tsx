import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import React from "react";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournamentId = Number(id);
  if (Number.isFinite(tournamentId)) {
    const t = await prisma.tournament.findUnique({ where: { id: tournamentId }, select: { started: true } });
    if (t?.started) {
      redirect("/");
    }
  }
  return <>{children}</>;
}
