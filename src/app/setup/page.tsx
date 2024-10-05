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
import { FormEvent } from "react";

interface SetupProps {
  name: string | undefined;
  players: number | null;
  eliminationType: string | undefined;
  groupNumber: number;
}

export default function SetupPage() {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const formValues: SetupProps = {
      name: formData.get("name")?.toString(),
      players: parseInt(formData.get("players") as string),
      eliminationType: formData.get("elimination-type")?.toString(),
      groupNumber: parseInt(formData.get("group-number") as string),
    };
  };
  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-5">
      <h1>Start setup the tournament.</h1>
      <form onSubmit={handleSubmit}>
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
            <Button type="submit" variant="contained" color="primary">
              Continue
            </Button>
          </Stack>
        </Stack>
      </form>
    </div>
  );
}
