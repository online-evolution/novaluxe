"use client";

import { useSearchParams } from "next/navigation";
import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from "react";
import { requestAppointment, type BookingState } from "@/app/(site)/reserveren/actions";
import { actionClass } from "@/components/ui/action";
import { SlotPicker } from "./slot-picker";
import { quote } from "@/domain/booking";
import {
  isVariantComplete,
  optionsForVariant,
  type CatalogOption,
  type CatalogTreatment,
  type CatalogVariant,
  type TreatmentCategory,
} from "@/domain/catalog";
import { formatEuro } from "@/lib/format";
import { formatLongDate, utcToZonedParts } from "@/lib/time";

/*
 * Reserveringsflow: categorie → behandeling → opties → datum en tijd →
 * gegevens → controle. Alle keuzes blijven bewaard bij teruggaan. De server
 * berekent de vrije tijden en controleert alles opnieuw bij het versturen.
 */

type Step = "categorie" | "behandeling" | "opties" | "moment" | "gegevens" | "controle";

type Choice = {
  category: TreatmentCategory | null;
  treatmentSlug: string | null;
  variantId: string | null;
  optionIds: string[];
  nailArt: boolean;
  nailArtDescription: string;
  date: string | null;
  start: string | null;
  name: string;
  email: string;
  phone: string;
  notes: string;
};

type AvailabilityResult =
  | { key: string; ok: true; durationMinutes: number; days: { date: string; slots: string[] }[] }
  | { key: string; ok: false; message: string };

/** Wat de stap "datum en tijd" toont; "laden" volgt uit een ontbrekend resultaat. */
type Availability =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; durationMinutes: number; days: { date: string; slots: string[] }[] };

const categories: { key: TreatmentCategory; title: string; text: string }[] = [
  { key: "nails", title: "Nagels", text: "Manicure, gellak, rubber base, BIAB of acryl." },
  { key: "extensions", title: "Extensions", text: "Een gratis consult, een nieuwe plaatsing of omhoogplaatsen." },
];

const kindLabels = { standard: "", new_set: "Nieuwe set", refill: "Opvullen" } as const;

const timeOf = (iso: string) => utcToZonedParts(new Date(iso)).time;

/** "BIAB met French · Nieuwe set", zonder de behandelingsnaam dubbel te noemen. */
function describe(treatment: CatalogTreatment, variant: CatalogVariant | undefined): string {
  if (!variant) return treatment.name;
  const detail = [variant.label, kindLabels[variant.kind]].filter(Boolean).join(" · ");
  if (variant.label === treatment.name) return detail;
  return variant.label.startsWith(treatment.name) ? detail : `${treatment.name} · ${detail}`;
}

function bookableVariants(treatment: CatalogTreatment) {
  return treatment.publiclyBookable ? treatment.variants.filter(isVariantComplete) : [];
}

function selectableOptions(treatment: CatalogTreatment, variant: CatalogVariant | undefined) {
  return variant ? optionsForVariant(treatment, variant) : [];
}

function needsOptionsStep(treatment: CatalogTreatment) {
  const variants = bookableVariants(treatment);
  return variants.length > 1 || variants.some((variant) => selectableOptions(treatment, variant).length > 0);
}

export function BookingFlow({
  catalog,
  nailArtBufferMinutes,
  phone,
}: {
  catalog: CatalogTreatment[];
  nailArtBufferMinutes: number;
  phone: { display: string; href: string };
}) {
  const params = useSearchParams();
  const [choice, setChoice] = useState<Choice>(() => initialChoice(catalog, params));
  const [step, setStep] = useState<Step>(() => initialStep(catalog, params));
  const [result, setResult] = useState<AvailabilityResult | null>(null);
  const [reload, setReload] = useState(0);
  const [localErrors, setLocalErrors] = useState<BookingState["fieldErrors"]>({});
  const [state, formAction, pending] = useActionState(requestAppointment, {});
  const [handledState, setHandledState] = useState<BookingState>(state);
  const startedAt = useRef(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const treatment = catalog.find((item) => item.slug === choice.treatmentSlug);
  const variant = treatment?.variants.find((item) => item.id === choice.variantId);
  const options = treatment && variant ? selectableOptions(treatment, variant) : [];
  const chosenOptions = options.filter((option) => choice.optionIds.includes(option.id));
  const offersNailArt = options.some((option) => option.kind === "nail_art");
  const currentQuote =
    treatment && variant && isVariantComplete(variant)
      ? quote({ treatment, variant, options: chosenOptions, nailArt: choice.nailArt }, nailArtBufferMinutes)
      : null;
  const availabilityKey = [choice.variantId, [...choice.optionIds].sort().join(","), choice.nailArt, reload].join("|");
  const availability: Availability =
    result?.key !== availabilityKey
      ? { status: "loading" }
      : result.ok
        ? { status: "ready", durationMinutes: result.durationMinutes, days: result.days }
        : { status: "error", message: result.message };

  const steps: Step[] = [
    "categorie",
    "behandeling",
    ...(treatment && needsOptionsStep(treatment) ? (["opties"] as Step[]) : []),
    "moment",
    "gegevens",
    "controle",
  ];
  const stepIndex = steps.indexOf(step);

  // Vrije tijden ophalen zodra datum en tijd aan de beurt zijn, of na een andere keuze.
  // De state wordt pas gezet als het antwoord binnen is.
  useEffect(() => {
    if (step !== "moment" || !choice.variantId) return;
    if (result?.key === availabilityKey) return;
    const controller = new AbortController();
    const query = new URLSearchParams({ variant: choice.variantId, nailart: choice.nailArt ? "1" : "0" });
    if (choice.optionIds.length) query.set("opties", choice.optionIds.join(","));
    fetch(`/api/beschikbaarheid?${query}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Onbekende fout");
        setResult({ key: availabilityKey, ok: true, durationMinutes: body.durationMinutes, days: body.days });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setResult({ key: availabilityKey, ok: false, message: "De beschikbare tijden konden niet worden geladen." });
      });
    return () => controller.abort();
  }, [step, availabilityKey, result?.key, choice.variantId, choice.nailArt, choice.optionIds]);

  // Nieuw serverantwoord: tijdens het renderen de stap bijsturen (geen effect nodig).
  if (state !== handledState) {
    setHandledState(state);
    if (state.slotGone) {
      setChoice((current) => ({ ...current, start: null }));
      setReload((value) => value + 1);
      setStep("moment");
    } else if (state.fieldErrors && Object.keys(state.fieldErrors).length > 0) {
      setStep(state.fieldErrors.nailArtDescription ? "opties" : "gegevens");
    }
  }

  // Nieuwe stap: kop in focus (voor schermlezers en toetsenbord) en in beeld.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const heading = headingRef.current;
    if (!heading) return;
    heading.focus({ preventScroll: true });
    const top = heading.getBoundingClientRect().top;
    // 120: de vaste kopregel bedekt de bovenkant van het scherm.
    if (top < 120 || top > window.innerHeight * 0.6) heading.scrollIntoView({ block: "start" });
  }, [step]);

  const update = (patch: Partial<Choice>) => setChoice((current) => ({ ...current, ...patch }));
  const go = (next: Step) => setStep(next);
  const back = () => stepIndex > 0 && setStep(steps[stepIndex - 1]!);

  function chooseTreatment(next: CatalogTreatment) {
    const variants = bookableVariants(next);
    const single = variants.length === 1 ? variants[0]! : null;
    update({
      treatmentSlug: next.slug,
      variantId: single?.id ?? null,
      optionIds: [],
      nailArt: false,
      date: null,
      start: null,
    });
    go(needsOptionsStep(next) ? "opties" : "moment");
  }

  function validateDetails(): boolean {
    const errors: BookingState["fieldErrors"] = {};
    if (choice.name.trim().length < 2) errors.name = "Vul je naam in.";
    if (!/^\S+@\S+\.\S+$/.test(choice.email.trim())) errors.email = "Vul een geldig e-mailadres in.";
    if (!/^[0-9+()\-\s]{8,20}$/.test(choice.phone.trim())) {
      errors.phone = "Vul een telefoonnummer in, bijvoorbeeld 06 12345678.";
    }
    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function submit() {
    if (!variant || !choice.start) return;
    const data = new FormData();
    data.set("variantId", variant.id);
    choice.optionIds.forEach((id) => data.append("optionId", id));
    data.set("nailArt", choice.nailArt ? "ja" : "nee");
    data.set("nailArtDescription", choice.nailArt ? choice.nailArtDescription : "");
    data.set("startAt", choice.start);
    data.set("name", choice.name);
    data.set("email", choice.email);
    data.set("phone", choice.phone);
    data.set("notes", choice.notes);
    data.set("website", (document.getElementById("website") as HTMLInputElement | null)?.value ?? "");
    data.set("startedAt", String(startedAt.current));
    startTransition(() => formAction(data));
  }

  const fieldErrors = { ...localErrors, ...state.fieldErrors };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Voortgang en samenvatting */}
      <div className="flex items-baseline justify-between gap-6 border-b border-line-strong pb-3 text-small">
        <span className="figures text-ink-soft">
          Stap {stepIndex + 1} van {steps.length}
        </span>
        {stepIndex > 0 && (
          <button type="button" onClick={back} className="font-medium underline underline-offset-4">
            Vorige stap
          </button>
        )}
      </div>

      {treatment && step !== "categorie" && step !== "behandeling" && (
        <Summary
          treatment={treatment}
          variant={variant}
          options={chosenOptions}
          nailArt={choice.nailArt}
          durationMinutes={currentQuote?.durationMinutes ?? null}
          priceCents={currentQuote?.priceCents ?? null}
          openPrices={currentQuote?.openPrices ?? []}
          date={choice.date}
          start={choice.start}
        />
      )}

      <section aria-labelledby="stap-titel" className="pt-8">
        <h2
          id="stap-titel"
          ref={headingRef}
          tabIndex={-1}
          className="scroll-mt-6 text-display-s font-medium outline-none"
        >
          {stepTitles[step]}
        </h2>

        {step === "categorie" && (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {categories.map((category) => (
              <li key={category.key}>
                <button
                  type="button"
                  onClick={() => {
                    if (choice.category !== category.key) {
                      update({ category: category.key, treatmentSlug: null, variantId: null, optionIds: [], nailArt: false, date: null, start: null });
                    }
                    go("behandeling");
                  }}
                  className={choiceClass(choice.category === category.key)}
                >
                  <span className="text-lede font-medium">{category.title}</span>
                  <span className="mt-1 block text-small text-ink-soft">{category.text}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {step === "behandeling" && choice.category && (
          <>
            {choice.category === "extensions" && (
              <p className="mt-3 max-w-measure text-ink-soft">
                Kom je voor het eerst? Kies dan eerst het gratis consult, zodat we je wensen en de
                mogelijkheden kunnen bespreken.
              </p>
            )}
            <ul className="mt-6 grid gap-3">
              {catalog
                .filter((item) => item.category === choice.category)
                .map((item) => {
                  const variants = bookableVariants(item);
                  const prices = variants.map((v) => v.priceCents!).filter((p) => p !== null);
                  const from = prices.length ? Math.min(...prices) : null;
                  if (variants.length === 0) {
                    return (
                      <li key={item.id} className="border border-line px-5 py-4">
                        <p className="font-medium">{item.name}</p>
                        <p className="mt-1 text-small text-ink-soft">
                          {item.publiclyBookable ? (
                            <>
                              Nog niet online aan te vragen. Bel{" "}
                              <a href={phone.href} className="figures underline">
                                {phone.display}
                              </a>
                              .
                            </>
                          ) : (
                            "Na je gratis consult spreken we samen af wanneer de extensions worden geplaatst."
                          )}
                        </p>
                      </li>
                    );
                  }
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => chooseTreatment(item)}
                        className={choiceClass(choice.treatmentSlug === item.slug)}
                      >
                        <span className="flex items-baseline justify-between gap-4">
                          <span className="font-medium">{item.name}</span>
                          <span className="figures shrink-0 text-small text-ink-soft">
                            {from === 0 ? "Gratis" : from !== null ? `${variants.length > 1 ? "vanaf " : ""}${formatEuro(from)}` : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
            </ul>
          </>
        )}

        {step === "opties" && treatment && (
          <OptionsStep
            treatment={treatment}
            choice={choice}
            update={update}
            nailArtBufferMinutes={nailArtBufferMinutes}
            offersNailArt={offersNailArt}
            options={options}
            nailArtError={fieldErrors?.nailArtDescription}
            onNext={() => {
              if (choice.nailArt && choice.nailArtDescription.trim().length < 3) {
                setLocalErrors({ nailArtDescription: "Beschrijf kort welke nail art je wilt." });
                return;
              }
              setLocalErrors({});
              go("moment");
            }}
          />
        )}

        {step === "moment" && (
          <MomentStep
            availability={availability}
            choice={choice}
            update={update}
            phone={phone}
            notice={state.slotGone ? state.error : undefined}
            onRetry={() => setReload((value) => value + 1)}
            onNext={() => go("gegevens")}
          />
        )}

        {step === "gegevens" && (
          <div className="mt-6 grid gap-6">
            <p className="max-w-measure text-ink-soft">
              Vul je naam, e-mailadres en telefoonnummer in. Wil je nog iets vragen of doorgeven? Zet het
              gerust bij de opmerkingen.
            </p>
            <Field id="name" label="Naam" error={fieldErrors?.name}>
              <input id="name" autoComplete="name" value={choice.name} onChange={(e) => update({ name: e.target.value })} aria-invalid={!!fieldErrors?.name} aria-describedby={fieldErrors?.name ? "name-fout" : undefined} className="field-input" />
            </Field>
            <Field id="email" label="E-mailadres" error={fieldErrors?.email}>
              <input id="email" type="email" inputMode="email" autoComplete="email" value={choice.email} onChange={(e) => update({ email: e.target.value })} aria-invalid={!!fieldErrors?.email} aria-describedby={fieldErrors?.email ? "email-fout" : undefined} className="field-input" />
            </Field>
            <Field id="phone" label="Telefoonnummer" error={fieldErrors?.phone}>
              <input id="phone" type="tel" inputMode="tel" autoComplete="tel" value={choice.phone} onChange={(e) => update({ phone: e.target.value })} aria-invalid={!!fieldErrors?.phone} aria-describedby={fieldErrors?.phone ? "phone-fout" : undefined} className="field-input" />
            </Field>
            <Field id="notes" label="Opmerkingen (optioneel)">
              <textarea id="notes" rows={4} maxLength={1000} value={choice.notes} onChange={(e) => update({ notes: e.target.value })} className="field-input" />
            </Field>
            {/* Verborgen voor mensen; alleen bots vullen dit in. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor="website">Website</label>
              <input id="website" name="website" tabIndex={-1} autoComplete="off" />
            </div>
            <div>
              <button type="button" onClick={() => validateDetails() && go("controle")} className={actionClass("primary")}>
                Controleren
              </button>
            </div>
          </div>
        )}

        {step === "controle" && treatment && variant && choice.start && currentQuote && (
          <div className="mt-6">
            <p className="max-w-measure text-ink-soft">
              Controleer je behandeling, datum en tijd en verstuur daarna je afspraakaanvraag. Je afspraak is
              pas definitief als Jessie hem heeft bevestigd.
            </p>
            <dl className="mt-6 border-t border-line-strong">
              <Row label="Behandeling">{describe(treatment, variant)}</Row>
              {chosenOptions.map((option) => (
                <Row key={option.id} label="Extra">
                  {option.name}
                  {option.priceConfirmed && option.priceCents !== null ? ` · ${formatEuro(option.priceCents)}` : " · prijs volgt"}
                </Row>
              ))}
              {choice.nailArt && <Row label="Nail art">{choice.nailArtDescription} · € 1 per nagel</Row>}
              <Row label="Datum">
                <span className="first-letter:uppercase">{formatLongDate(choice.date!)}</span>
              </Row>
              <Row label="Tijd">
                <span className="figures">
                  {timeOf(choice.start)}–{timeOf(new Date(new Date(choice.start).getTime() + currentQuote.durationMinutes * 60000).toISOString())} ({currentQuote.durationMinutes} min)
                </span>
              </Row>
              <Row label="Prijs">
                <span className="figures">
                  {currentQuote.priceCents === 0 ? "Gratis" : formatEuro(currentQuote.priceCents)}
                  {currentQuote.openPrices.length > 0 && ` + ${currentQuote.openPrices.join(" en ").toLowerCase()} (volgt)`}
                </span>
              </Row>
              <Row label="Gegevens">
                {choice.name} · {choice.email} · <span className="figures">{choice.phone}</span>
              </Row>
              {choice.notes.trim() && <Row label="Opmerking">{choice.notes}</Row>}
            </dl>

            {state.error && !state.slotGone && !state.fieldErrors && (
              <p role="alert" className="form-message mt-6 text-alert">
                {state.error}
              </p>
            )}
            <div className="mt-8">
              <button type="button" onClick={submit} disabled={pending} className={`${actionClass("primary")} w-full justify-center sm:w-auto disabled:opacity-60`}>
                {pending ? "Bezig met versturen…" : "Afspraak aanvragen"}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

const stepTitles: Record<Step, string> = {
  categorie: "Waarvoor wil je langskomen?",
  behandeling: "Kies je behandeling",
  opties: "Kies je afwerking",
  moment: "Kies een datum en tijd",
  gegevens: "Vul je gegevens in",
  controle: "Controleer je aanvraag",
};

function choiceClass(selected: boolean) {
  return `block w-full border px-5 py-4 text-left transition-colors duration-(--duration-quick) hover:border-ink ${
    selected ? "border-ink bg-ivory" : "border-line-strong"
  }`;
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-fout`} className="mt-2 text-small text-alert">
          Let op: {error}
        </p>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-4 border-b border-line py-3 sm:grid-cols-[9rem_1fr]">
      <dt className="text-small text-ink-soft">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function Summary(props: {
  treatment: CatalogTreatment;
  variant: CatalogVariant | undefined;
  options: CatalogOption[];
  nailArt: boolean;
  durationMinutes: number | null;
  priceCents: number | null;
  openPrices: string[];
  date: string | null;
  start: string | null;
}) {
  const parts = [
    describe(props.treatment, props.variant),
    props.durationMinutes !== null ? `${props.durationMinutes} min` : null,
    props.priceCents !== null ? (props.priceCents === 0 ? "Gratis" : formatEuro(props.priceCents) + (props.openPrices.length ? " +" : "")) : null,
    props.date ? formatLongDate(props.date) : null,
    props.start ? timeOf(props.start) : null,
  ].filter(Boolean);
  return (
    <p aria-label="Je keuze tot nu toe" className="figures mt-4 bg-ivory px-4 py-3 text-small">
      {parts.join(" · ")}
    </p>
  );
}

function OptionsStep(props: {
  treatment: CatalogTreatment;
  choice: Choice;
  update: (patch: Partial<Choice>) => void;
  nailArtBufferMinutes: number;
  offersNailArt: boolean;
  options: CatalogOption[];
  nailArtError?: string;
  onNext: () => void;
}) {
  const { treatment, choice, update } = props;
  const variants = bookableVariants(treatment);
  const twoLevel = variants.some((variant) => variant.kind !== "standard");
  const labels = [...new Set(variants.map((variant) => variant.label))];
  const selected = variants.find((variant) => variant.id === choice.variantId);
  const [label, setLabel] = useState<string | null>(selected?.label ?? (labels.length === 1 ? labels[0]! : null));
  const kinds = variants.filter((variant) => variant.label === label);
  const removal = props.options.find((option) => option.kind === "removal_before_new_set");

  const pickVariant = (variant: CatalogVariant) =>
    update({ variantId: variant.id, optionIds: [], date: null, start: null });

  return (
    <div className="mt-6 grid gap-8">
      {twoLevel ? (
        <>
          <fieldset>
            <legend className="field-label">Afwerking</legend>
            <div className="mt-3 grid gap-2">
              {labels.map((item) => {
                const prices = variants.filter((variant) => variant.label === item);
                return (
                  <label key={item} className={`${choiceClass(label === item)} flex cursor-pointer items-baseline justify-between gap-4`}>
                    <span className="flex items-center gap-3">
                      <input type="radio" name="afwerking" checked={label === item} onChange={() => { setLabel(item); update({ variantId: null, optionIds: [], date: null, start: null }); }} className="size-5 accent-ink" />
                      {item}
                    </span>
                    <span className="figures text-small text-ink-soft">
                      {prices.map((variant) => `${kindLabels[variant.kind]} ${formatEuro(variant.priceCents!)}`).join(" · ")}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          {label && (
            <fieldset>
              <legend className="field-label">Nieuwe set of opvullen?</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {kinds.map((variant) => (
                  <label key={variant.id} className={`${choiceClass(choice.variantId === variant.id)} flex cursor-pointer items-center gap-3`}>
                    <input type="radio" name="soort" checked={choice.variantId === variant.id} onChange={() => pickVariant(variant)} className="size-5 accent-ink" />
                    <span>
                      {kindLabels[variant.kind]}
                      <span className="figures block text-small text-ink-soft">
                        {formatEuro(variant.priceCents!)} · {variant.durationMinutes} min
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </>
      ) : (
        variants.length > 1 && (
          <fieldset>
            <legend className="field-label">Kies wat je wilt</legend>
            <div className="mt-3 grid gap-2">
              {variants.map((variant) => (
                <label key={variant.id} className={`${choiceClass(choice.variantId === variant.id)} flex cursor-pointer items-baseline justify-between gap-4`}>
                  <span className="flex items-center gap-3">
                    <input type="radio" name="variant" checked={choice.variantId === variant.id} onChange={() => pickVariant(variant)} className="size-5 accent-ink" />
                    {variant.label}
                  </span>
                  <span className="figures text-small text-ink-soft">
                    {formatEuro(variant.priceCents!)} · {variant.durationMinutes} min
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )
      )}

      {removal && (
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={choice.optionIds.includes(removal.id)}
            onChange={(event) =>
              update({
                optionIds: event.target.checked ? [removal.id] : [],
                date: null,
                start: null,
              })
            }
            className="mt-1 size-5 accent-ink"
          />
          <span>
            {removal.name}
            <span className="figures block text-small text-ink-soft">
              {removal.durationMinutes ? `+ ${removal.durationMinutes} min · ` : ""}
              {removal.priceConfirmed && removal.priceCents !== null ? `+ ${formatEuro(removal.priceCents)}` : "prijs bespreek je met Jessie"}
            </span>
          </span>
        </label>
      )}

      {props.offersNailArt && choice.variantId && (
        <fieldset>
          <legend className="field-label">Wil je nail art?</legend>
          <div className="mt-3 flex gap-6">
            {[false, true].map((value) => (
              <label key={String(value)} className="flex items-center gap-2">
                <input type="radio" name="nailart" checked={choice.nailArt === value} onChange={() => update({ nailArt: value, date: null, start: null })} className="size-5 accent-ink" />
                {value ? "Ja" : "Nee"}
              </label>
            ))}
          </div>
          {choice.nailArt && (
            <div className="mt-4">
              <label htmlFor="nailArtDescription" className="field-label">
                Beschrijf wat je wilt
              </label>
              <textarea
                id="nailArtDescription"
                rows={3}
                maxLength={1000}
                placeholder="Bijvoorbeeld: French met twee bloemetjes en gouden details."
                value={choice.nailArtDescription}
                onChange={(event) => update({ nailArtDescription: event.target.value })}
                aria-invalid={!!props.nailArtError}
                aria-describedby="nailart-uitleg"
                className="field-input"
              />
              <p id="nailart-uitleg" className="mt-2 text-small text-ink-soft">
                € 1 per nagel. Ik reserveer {props.nailArtBufferMinutes} minuten extra en bekijk vooraf of je
                ontwerp in die tijd past.
              </p>
              {props.nailArtError && <p className="mt-2 text-small text-alert">Let op: {props.nailArtError}</p>}
            </div>
          )}
        </fieldset>
      )}

      <div>
        <button type="button" disabled={!choice.variantId} onClick={props.onNext} className={`${actionClass("primary")} disabled:opacity-50`}>
          Kies een datum en tijd
        </button>
      </div>
    </div>
  );
}

function MomentStep(props: {
  availability: Availability;
  choice: Choice;
  update: (patch: Partial<Choice>) => void;
  phone: { display: string; href: string };
  notice?: string;
  onRetry: () => void;
  onNext: () => void;
}) {
  const { availability, choice, update } = props;
  const days = useMemo(() => (availability.status === "ready" ? availability.days : []), [availability]);

  if (availability.status === "loading") {
    return <p className="mt-6 text-ink-soft" role="status">Beschikbare tijden laden…</p>;
  }
  if (availability.status === "error") {
    return (
      <div className="mt-6" role="alert">
        <p>{availability.message}</p>
        <p className="mt-2 text-ink-soft">
          Probeer het opnieuw, of bel{" "}
          <a href={props.phone.href} className="figures underline">{props.phone.display}</a>.
        </p>
        <button type="button" onClick={props.onRetry} className={`${actionClass("quiet")} mt-4`}>
          Opnieuw proberen
        </button>
      </div>
    );
  }
  if (days.length === 0) {
    return (
      <p className="mt-6 max-w-measure">
        Er zijn op dit moment geen vrije tijden voor deze behandeling. Bel gerust{" "}
        <a href={props.phone.href} className="figures underline">{props.phone.display}</a>, dan kijken we samen.
      </p>
    );
  }

  return (
    <SlotPicker
      days={days}
      date={choice.date}
      start={choice.start}
      onDate={(date) => update({ date, start: null })}
      onStart={(start) => update({ start })}
      notice={props.notice}
    >
      <button type="button" disabled={!choice.start} onClick={props.onNext} className={`${actionClass("primary")} disabled:opacity-50`}>
        Verder naar je gegevens
      </button>
    </SlotPicker>
  );
}

function initialChoice(catalog: CatalogTreatment[], params: URLSearchParams): Choice {
  const empty: Choice = {
    category: null,
    treatmentSlug: null,
    variantId: null,
    optionIds: [],
    nailArt: false,
    nailArtDescription: "",
    date: null,
    start: null,
    name: "",
    email: "",
    phone: "",
    notes: "",
  };
  const treatment = catalog.find((item) => item.slug === params.get("behandeling"));
  if (treatment && bookableVariants(treatment).length > 0) {
    const variants = bookableVariants(treatment);
    return {
      ...empty,
      category: treatment.category,
      treatmentSlug: treatment.slug,
      variantId: variants.length === 1 ? variants[0]!.id : null,
    };
  }
  const category = params.get("categorie");
  if (category === "nagels") return { ...empty, category: "nails" };
  if (category === "extensions") return { ...empty, category: "extensions" };
  return empty;
}

function initialStep(catalog: CatalogTreatment[], params: URLSearchParams): Step {
  const treatment = catalog.find((item) => item.slug === params.get("behandeling"));
  if (treatment && bookableVariants(treatment).length > 0) {
    return needsOptionsStep(treatment) ? "opties" : "moment";
  }
  const category = params.get("categorie");
  return category === "nagels" || category === "extensions" ? "behandeling" : "categorie";
}
