import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { allowedActions, effectiveStatus } from "./appointment";

const now = new Date("2026-11-02T10:00:00Z");
const later = new Date("2026-11-03T10:00:00Z");
const earlier = new Date("2026-11-01T10:00:00Z");

describe("effectiveStatus", () => {
  it("toont een aanvraag na de bedenktijd als verlopen", () => {
    assert.equal(effectiveStatus({ status: "pending", startAt: later, expiresAt: now }, now), "expired");
  });

  it("laat een lopende aanvraag ongemoeid", () => {
    const expiresAt = new Date(now.getTime() + 60_000);
    assert.equal(effectiveStatus({ status: "pending", startAt: later, expiresAt }, now), "pending");
  });
});

describe("allowedActions", () => {
  const pendingUntil = new Date(now.getTime() + 60_000);

  it("een open aanvraag kun je bevestigen of afwijzen", () => {
    assert.deepEqual(
      allowedActions({ status: "pending", startAt: later, expiresAt: pendingUntil }, now),
      ["confirm", "reject"],
    );
  });

  it("een verlopen aanvraag kun je alsnog bevestigen zolang de tijd nog komt", () => {
    assert.deepEqual(allowedActions({ status: "expired", startAt: later, expiresAt: earlier }, now), ["confirm"]);
    assert.deepEqual(allowedActions({ status: "expired", startAt: earlier, expiresAt: earlier }, now), []);
  });

  it("een komende afspraak kun je verplaatsen of annuleren, niet afronden", () => {
    assert.deepEqual(
      allowedActions({ status: "confirmed", startAt: later, expiresAt: null }, now),
      ["reschedule", "cancel"],
    );
  });

  it("na het begin kun je een afspraak afronden of als niet gekomen markeren", () => {
    assert.deepEqual(
      allowedActions({ status: "confirmed", startAt: earlier, expiresAt: null }, now),
      ["complete", "no_show", "cancel"],
    );
  });

  it("afgewezen en geannuleerd zijn eindstatussen", () => {
    assert.deepEqual(allowedActions({ status: "rejected", startAt: later, expiresAt: null }, now), []);
    assert.deepEqual(allowedActions({ status: "cancelled", startAt: later, expiresAt: null }, now), []);
  });
});
