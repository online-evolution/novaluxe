import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { releaseState } from "./release";

const now = new Date("2026-11-02T10:00:00Z");
const future = new Date("2026-11-20T10:00:00Z");
const past = new Date("2026-11-01T10:00:00Z");

describe("releaseState", () => {
  it("is open zolang er niets is aangevraagd", () => {
    assert.equal(releaseState({ expiresAt: future, revokedAt: null }, [], now), "open");
  });

  it("is weer open na een afgewezen of verlopen aanvraag", () => {
    const linked = [
      { status: "rejected" as const, expiresAt: null },
      { status: "pending" as const, expiresAt: past },
    ];
    assert.equal(releaseState({ expiresAt: future, revokedAt: null }, linked, now), "open");
  });

  it("toont een lopende aanvraag en een ingeplande afspraak", () => {
    const pending = [{ status: "pending" as const, expiresAt: future }];
    assert.equal(releaseState({ expiresAt: future, revokedAt: null }, pending, now), "aangevraagd");
    const confirmed = [{ status: "confirmed" as const, expiresAt: null }];
    assert.equal(releaseState({ expiresAt: past, revokedAt: null }, confirmed, now), "ingepland");
  });

  it("verloopt of wordt ingetrokken", () => {
    assert.equal(releaseState({ expiresAt: past, revokedAt: null }, [], now), "verlopen");
    assert.equal(releaseState({ expiresAt: future, revokedAt: past }, [], now), "ingetrokken");
  });
});
