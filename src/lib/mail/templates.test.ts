import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cancellationMail,
  confirmationMail,
  contactNotificationMail,
  rejectionMail,
  requestNotificationMail,
  whenLine,
  type AppointmentDetails,
} from "./templates";

const details: AppointmentDetails = {
  customerName: "Sanne de Vries",
  treatmentName: "BIAB",
  variantLabel: "Nieuwe set",
  // 20 november 2026, 10:30–11:45 in Nederland (wintertijd, UTC+1).
  startAt: new Date("2026-11-20T09:30:00Z"),
  endAt: new Date("2026-11-20T10:45:00Z"),
  priceCents: 4500,
  openPriceNames: [],
};

test("tijden staan in Nederlandse tijd", () => {
  assert.equal(whenLine(details.startAt, details.endAt), "vrijdag 20 november, 10:30–11:45");
});

test("de bevestiging noemt behandeling, tijd, prijs en adres", () => {
  const mail = confirmationMail(details);
  assert.equal(mail.subject, "Je afspraak bij NovaLuxe is bevestigd");
  assert.match(mail.text, /Hoi Sanne,/);
  assert.match(mail.text, /Behandeling: BIAB, Nieuwe set/);
  assert.match(mail.text, /Wanneer: vrijdag 20 november, 10:30–11:45/);
  assert.match(mail.text, /Prijs: €\s45/);
  assert.match(mail.text, /Wijndaelerduin 25/);
  assert.match(mail.html, /<html lang="nl">/);
});

test("prijzen in overleg worden zo genoemd, niet als vast bedrag", () => {
  const mail = confirmationMail({ ...details, openPriceNames: ["Nail art", "Nail art"] });
  assert.match(mail.text, /€\s45 \(exclusief nail art, in overleg\)/);
  const unknown = confirmationMail({ ...details, priceCents: null });
  assert.doesNotMatch(unknown.text, /Prijs:/);
});

test("vóór de bevestiging zegt geen enkele mail aan de klant dat iets bevestigd is", () => {
  for (const mail of [rejectionMail(details, "https://x/reserveren"), cancellationMail(details, "https://x/reserveren")]) {
    assert.doesNotMatch(mail.text, /bevestigd/i);
  }
});

test("invoer van klanten wordt in HTML ge-escaped en het onderwerp blijft één regel", () => {
  const mail = requestNotificationMail(
    {
      ...details,
      customerName: "Eva <script>\nBcc: x@y.nl",
      phone: "0612345678",
      email: "eva@example.com",
      options: [],
      nailArtDescription: null,
      customerNotes: "<b>hoi</b>",
      expiresAt: null,
    },
    "https://x/admin/afspraken/1",
  );
  assert.doesNotMatch(mail.html, /<script>|<b>hoi/);
  assert.match(mail.html, /&lt;b&gt;hoi&lt;\/b&gt;/);
  assert.doesNotMatch(mail.subject, /\n/);
});

test("een contactbericht zegt alleen dat je direct kunt antwoorden als er een e-mailadres is", () => {
  const withEmail = contactNotificationMail(
    { name: "Eva", email: "eva@example.com", phone: null, message: "Hoi!" },
    "https://x/admin/berichten",
  );
  assert.match(withEmail.text, /Antwoorden kan direct/);
  const withoutEmail = contactNotificationMail(
    { name: "Eva", email: null, phone: "0612345678", message: "Hoi!" },
    "https://x/admin/berichten",
  );
  assert.doesNotMatch(withoutEmail.text, /Antwoorden kan direct/);
});
