import { ReactNode } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
import theme from "@/theme";
import { CssBaseline } from "@mui/material";
import "./../../index.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tournament App",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div id="__next">
          <AppRouterCacheProvider options={{ enableCssLayer: true }}>
            <StyledEngineProvider injectFirst>
              <ThemeProvider theme={theme}>
                {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
                <CssBaseline />
                <main>{children}</main>
              </ThemeProvider>
            </StyledEngineProvider>
          </AppRouterCacheProvider>
        </div>
      </body>
    </html>
  );
}
