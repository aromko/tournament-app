"use client";

import React from "react";
import { usePathname } from "next/navigation";

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  let title = "";
  let description = "";

  if (pathname === "/setup") {
    title = "Create Tournament";
    description = "Fill in the tournament details to get started.";
  } else if (pathname.startsWith("/setup/player/")) {
    title = "Add Players";
    description = "Please enter player names for your tournament.";
  } else if (pathname.startsWith("/setup/teams/")) {
    title = "Assign players to groups";
    description =
      "Drag and drop players into groups. Ensure all players are assigned before continuing.";
  }

  return (
    <>
      {title ? (
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      ) : null}
      {children}
    </>
  );
}
