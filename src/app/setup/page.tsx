"use client";

import { createTournament } from "@/app/setup/action";
import React, { useActionState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function SetupPage() {
  const [state, formAction, isPending] = useActionState(createTournament, null);

  return (
    <div className="flex items-center justify-center py-8">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Create Tournament</CardTitle>
          <CardDescription>
            Fill in the tournament details to get started
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form action={formAction} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Tournament Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter tournament name"
                aria-describedby="name-error"
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
                defaultValue={4}
              />
              {state?.errors?.players && (
                <p className="text-sm text-destructive" id="playerCount-error">
                  {state.errors.players[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="eliminationType">Elimination Type</Label>
              <Select name="eliminationType" defaultValue="SINGLE">
                <SelectTrigger aria-describedby="eliminationType-error">
                  <SelectValue placeholder="Select elimination type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE">Single Elimination</SelectItem>
                  <SelectItem value="MULTI">Multi Elimination</SelectItem>
                </SelectContent>
              </Select>
              {state?.errors?.eliminationType && (
                <p
                  className="text-sm text-destructive"
                  id="eliminationType-error"
                >
                  {state.errors.eliminationType[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="numberOfGroups">Number of Groups</Label>
              <Select name="numberOfGroups" defaultValue="2">
                <SelectTrigger aria-describedby="numberOfGroups-error">
                  <SelectValue placeholder="Select number of groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Groups</SelectItem>
                  <SelectItem value="4">4 Groups</SelectItem>
                </SelectContent>
              </Select>
              {state?.errors?.numberOfGroups && (
                <p
                  className="text-sm text-destructive"
                  id="numberOfGroups-error"
                >
                  {state.errors.numberOfGroups[0]}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" aria-disabled={isPending}>
              Next: Add Players
            </Button>
          </form>
        </CardContent>
      </Card>
      <p>{state?.message}</p>
    </div>
  );
}
