"use client";

import {
  Button,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
} from "@mui/material";
import { createTournament } from "@/app/setup/action";
import React, { useActionState } from "react";

export default function SetupPage() {
  const [state, formAction, isPending] = useActionState(createTournament, null);

  return (
    <div>
      <h1>Start setup the tournament.</h1>
      <form action={formAction}>
        <Stack
          direction={{ xs: "column", sm: "column" }}
          spacing={{ xs: 1, sm: 2, md: 4 }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 1, sm: 2, md: 4 }}
          >
            <TextField
              required
              type="text"
              label="Name"
              helperText="Enter the tournament name"
              color="primary"
              name="name"
            />

            <TextField
              required
              type="number"
              label="Players"
              helperText="Number of total players."
              color="primary"
              name="players"
            />
          </Stack>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 1, sm: 2, md: 4 }}
          >
            <RadioGroup
              aria-labelledby="demo-radio-buttons-group-label"
              defaultValue="MULTI"
              name="elimination-type"
            >
              <FormLabel id="demo-radio-buttons-group-label">
                Choose elimination type
              </FormLabel>
              <FormControlLabel
                value="MULTI"
                control={<Radio />}
                label="Multi-Level"
              />
              <FormControlLabel
                value="SINGLE"
                control={<Radio />}
                label="Single"
              />
            </RadioGroup>

            <RadioGroup
              aria-labelledby="demo-radio-buttons-group-label"
              defaultValue={2}
              name="group-number"
            >
              <FormLabel id="demo-radio-buttons-group-label">
                How many groups?
              </FormLabel>
              <FormControlLabel value={2} control={<Radio />} label="2" />
              <FormControlLabel value={4} control={<Radio />} label="4" />
            </RadioGroup>
          </Stack>
          <Stack
            direction={{ xs: "column", sm: "column" }}
            spacing={{ xs: 1, sm: 2, md: 4 }}
            alignItems="flex-end"
          >
            <Button
              type="submit"
              variant="contained"
              color="primary"
              aria-disabled={isPending}
            >
              Continue
            </Button>
          </Stack>
        </Stack>
      </form>
      <p>{state?.message}</p>
    </div>
  );
}
