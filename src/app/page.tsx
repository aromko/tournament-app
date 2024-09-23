// `app/page.tsx` is the UI for the `/` URL

import { Button, Stack } from "@mui/material";

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-dark-blue space-y-5">
      <h1>Welcome to the Reservix league!</h1>
      <Stack spacing={2}>
        <Button variant="contained">Ongoing tournaments</Button>
        <Button variant="outlined">Past tournaments</Button>
        <Button variant="outlined">Create a tournament</Button>
      </Stack>
    </div>
  );
}
