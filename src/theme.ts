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
      secondary: "#fff",
    },
    background: {
      default: "#1f2632",
      paper: "#4e5d73",
    },
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "& fieldset": {
            borderColor: "#fff", // Default color
          },
        },
      },
    },
  },
});

export default theme;
