"use client";
import { Button, Stack } from "@mui/material";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-5">
      <h1>Welcome to the Reservix league!</h1>
      <Stack spacing={2}>
        <Button variant="contained">Ongoing tournaments</Button>
        <Button variant="outlined">Past tournaments</Button>
        <Link
          href={{
            pathname: "/setup",
          }}
          passHref
        >
          <Button variant="outlined">Create a tournament</Button>
        </Link>
      </Stack>
    </div>
  );
}
