-- Laatste vangnet tegen dubbele boekingen: aanvragen (pending) en bevestigde
-- afspraken mogen elkaar nooit overlappen. De applicatie controleert dit ook,
-- maar de database dwingt het af, ook bij gelijktijdige aanvragen.
-- Verlopen aanvragen worden in de boekingstransactie eerst op 'expired' gezet,
-- zodat ze hier niet meer meetellen (zie docs/besluiten.md).
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_no_overlap"
  EXCLUDE USING gist (tstzrange("start_at", "end_at", '[)') WITH &&)
  WHERE ("status" IN ('pending', 'confirmed'));
