import { render, screen } from "@testing-library/react";
import React from "react";
import Index from "@/app/page";

describe("Index page", () => {
  it("renders title and action buttons", () => {
    render(<Index />);

    expect(screen.getByText(/Tournament Manager/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Ongoing Tournaments/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Past Tournaments/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Create Tournament/i }),
    ).toBeInTheDocument();
  });
});
