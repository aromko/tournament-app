"use client";

import { Suspense, useActionState, useEffect, useState } from "react";
import { createTournament } from "@/app/setup/action";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function SetupPage() {
  return (
    <Suspense fallback={null}>
      <SetupPageInner />
    </Suspense>
  );
}

function SetupPageInner() {
  const [state, formAction, isPending] = useActionState(createTournament, null);
  const searchParams = useSearchParams();
  const editingId = searchParams.get("id");

  const [name, setName] = useState("");
  const [players, setPlayers] = useState<number>(4);
  const [eliminationType, setEliminationType] = useState<string>("SINGLE");
  const [numberOfGroups, setNumberOfGroups] = useState<string>("2");

  useEffect(() => {
    let ignore = false;
    async function loadTournament(id: string) {
      try {
        const res = await fetch(`/api/tournament/${id}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (ignore) return;
        setName(data.name ?? "");
        setEliminationType(data.eliminationType ?? "SINGLE");
        setNumberOfGroups(String(data.numberOfGroups ?? "2"));
        // players count is not stored on tournament; keep the default or allow overriding via query (?p=)
        const qp = searchParams.get("p");
        if (qp) setPlayers(parseInt(qp, 10));
      } catch {
        // ignore errors for now
      }
    }
    if (editingId) {
      void loadTournament(editingId);
    }
    return () => {
      ignore = true;
    };
  }, [editingId, searchParams]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <form action={formAction} className="space-y-6">
        {editingId ? (
          <input type="hidden" name="tournamentId" value={editingId} />
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="name">Tournament Name</Label>
          <Input
            id="name"
            name="name"
            placeholder="Enter tournament name"
            aria-describedby="name-error"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {state?.errors?.name && (
            <p className="text-sm text-destructive" id="name-error">
              {state.errors.name[0]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="players">Number of Players</Label>
          <Input
            id="players"
            name="players"
            type="number"
            min="4"
            max="32"
            placeholder="Enter number of players"
            aria-describedby="playerCount-error"
            value={players}
            onChange={(e) => setPlayers(parseInt(e.target.value || "0", 10))}
          />
          {state?.errors?.players && (
            <p className="text-sm text-destructive" id="playerCount-error">
              {state.errors.players[0]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="eliminationType">Elimination Type</Label>
          <Select name="eliminationType" value={eliminationType} onValueChange={setEliminationType}>
            <SelectTrigger aria-describedby="eliminationType-error">
              <SelectValue placeholder="Select elimination type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SINGLE">Single Elimination</SelectItem>
              <SelectItem value="MULTI">Multi Elimination</SelectItem>
            </SelectContent>
          </Select>
          {state?.errors?.eliminationType && (
            <p className="text-sm text-destructive" id="eliminationType-error">
              {state.errors.eliminationType[0]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="numberOfGroups">Number of Groups</Label>
          <Select name="numberOfGroups" value={numberOfGroups} onValueChange={setNumberOfGroups}>
            <SelectTrigger aria-describedby="numberOfGroups-error">
              <SelectValue placeholder="Select number of groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 Groups</SelectItem>
              <SelectItem value="4">4 Groups</SelectItem>
            </SelectContent>
          </Select>
          {state?.errors?.numberOfGroups && (
            <p className="text-sm text-destructive" id="numberOfGroups-error">
              {state.errors.numberOfGroups[0]}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Button asChild type="button" variant="outline" className="w-full md:col-span-1">
            <Link href="/">Cancel</Link>
          </Button>
          <Button type="submit" className="w-full md:col-span-3" aria-disabled={isPending}>
            Next: Add players
          </Button>
        </div>
      </form>

      {state?.message ? (
        <p className="text-center mt-4 text-sm">{state.message}</p>
      ) : null}
    </div>
  );
}
