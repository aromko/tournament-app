import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Hoist a shared mock reference so both the mocked module and tests use the same fn
const h = vi.hoisted(() => ({
  findUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    tournament: {
      findUnique: h.findUnique,
    },
  },
}));

describe("API GET /api/tournament/[id]", () => {
  beforeEach(() => {
    h.findUnique.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for invalid id", async () => {
    const { GET } = await import("@/app/api/tournament/[id]/route");

    const req = new Request("http://localhost/api/tournament/abc");
    const res = await GET(req, {
      params: Promise.resolve({ id: "abc" }),
    } as any);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ message: "Invalid id" });
    expect(h.findUnique).not.toHaveBeenCalled();
  });

  it("returns 404 when tournament is not found", async () => {
    h.findUnique.mockResolvedValueOnce(null);
    const { GET } = await import("@/app/api/tournament/[id]/route");

    const req = new Request("http://localhost/api/tournament/123");
    const res = await GET(req, {
      params: Promise.resolve({ id: "123" }),
    } as any);

    expect(h.findUnique).toHaveBeenCalledWith({ where: { id: 123 } });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ message: "Not found" });
  });

  it("returns 200 with tournament data when found", async () => {
    h.findUnique.mockResolvedValueOnce({
      id: 7,
      name: "My Tourney",
      eliminationType: "SINGLE",
      numberOfGroups: 2,
    });
    const { GET } = await import("@/app/api/tournament/[id]/route");

    const req = new Request("http://localhost/api/tournament/7");
    const res = await GET(req, { params: Promise.resolve({ id: "7" }) } as any);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      id: 7,
      name: "My Tourney",
      eliminationType: "SINGLE",
      numberOfGroups: 2,
    });
  });

  it("returns 500 when prisma throws an error", async () => {
    h.findUnique.mockRejectedValueOnce(new Error("DB down"));
    const { GET } = await import("@/app/api/tournament/[id]/route");

    const req = new Request("http://localhost/api/tournament/5");
    const res = await GET(req, { params: Promise.resolve({ id: "5" }) } as any);

    expect(res.status).toBe(500);
    const body = await res.json();
    // Only check the prefix to avoid depending on Error.toString formatting
    expect(body.message).toMatch(/^Error: /);
  });
});
