"use client";
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  cssVariables: true,
  typography: {
    fontSize: 16,
  },
  palette: {
    primary: {
      main: "#52ffa8",
    },
    secondary: {
      main: "#cee3e9",
    },
    text: {
      primary: "#dfe0e2",
      secondary: "#323a49",
    },
  },
});

export default theme;
