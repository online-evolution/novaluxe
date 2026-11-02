"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { focusPosition, type PhotoFocus } from "./focus";

type Photo = { url: string };
type Phase = "voor" | "na";

/** Hoe ver de overgang is: boven de foto (alleen voor) of eronder (helemaal na). */
const revealFor: Record<Phase, string> = { voor: "-20%", na: "120%" };
/** Zijwaartse drift van de golf: twee golflengtes tijdens de overgang. */
const waveFor: Record<Phase, string> = { voor: "0%", na: "200%" };

/** Hoe lang elke fase blijft staan voordat hij vanzelf wisselt (incl. de overgang van 2,2 s). */
const holdFor: Record<Phase, number> = { voor: 3200, na: 6200 };
/** Naast elkaar wisselen de foto's om de beurt, niet tegelijk. */
const staggerMs = 2400;

/** Sterretjes (de ✦ uit het logo) die flonkeren als het resultaat er staat. */
const sparkles = [
  { top: "16%", left: "70%", size: "1.25rem", delay: "1700ms" },
  { top: "44%", left: "18%", size: "0.875rem", delay: "1900ms" },
  { top: "66%", left: "76%", size: "1rem", delay: "2100ms" },
];

/*
 * Voor en na als transformatie. De foto begint bij het voor; zolang hij in
 * beeld is, golft het resultaat er afwisselend overheen en weer af, met een
 * vertraging per `index` zodat foto's naast elkaar om de beurt wisselen (zie
 * .transform-* in globals.css). De schakelaar Voor / Na onderin laat zien wat
 * je ziet; kiezen of op de foto tikken zet het vanzelf wisselen stil. Met
 * "minder beweging" ingesteld wisselt niets vanzelf.
 */
export function BeforeAfter({
  before,
  after,
  alt,
  caption,
  focus,
  sizes,
  index = 0,
}: {
  before: Photo;
  after: Photo;
  alt: string;
  caption: string | null;
  focus: PhotoFocus;
  sizes: string;
  index?: number;
}) {
  const [phase, setPhase] = useState<Phase>("voor");
  const [auto, setAuto] = useState(true);
  const [visible, setVisible] = useState(false);
  const started = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), {
      threshold: 0.6,
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Vanzelf wisselen zolang de foto in beeld is; de eerste keer met de vertraging per foto.
  useEffect(() => {
    if (!auto || !visible) return;
    const delay = started.current ? holdFor[phase] : 600 + index * staggerMs;
    const timer = setTimeout(() => {
      started.current = true;
      setPhase((current) => (current === "na" ? "voor" : "na"));
    }, delay);
    return () => clearTimeout(timer);
  }, [auto, visible, phase, index]);

  function choose(next: Phase) {
    setAuto(false);
    setPhase(next);
  }

  const objectPosition = focusPosition[focus];
  const reveal = { "--reveal": revealFor[phase], "--wave": waveFor[phase] } as React.CSSProperties;

  return (
    <figure>
      {/* Tikken op de foto is een snelkoppeling; de knoppen onderin zijn de echte bediening. */}
      <div
        ref={ref}
        data-phase={phase}
        onClick={() => choose(phase === "na" ? "voor" : "na")}
        className="photo-arch group relative aspect-[4/5] w-full cursor-pointer overflow-hidden bg-ivory"
      >
        <Image
          src={before.url}
          alt={`Voor: ${alt}`}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-[2200ms] ease-calm group-data-[phase=na]:scale-[1.04]"
          style={{ objectPosition }}
        />
        <div className="transform-layer transform-after absolute inset-0" style={reveal}>
          <div className="transform-settle absolute inset-0">
            <Image src={after.url} alt={`Na: ${alt}`} fill sizes={sizes} className="object-cover" style={{ objectPosition }} />
          </div>
        </div>
        <span aria-hidden="true" className="transform-layer transform-streak pointer-events-none absolute inset-x-0" style={reveal} />
        {sparkles.map((sparkle) => (
          <svg
            key={sparkle.top}
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="transform-sparkle pointer-events-none absolute text-cream drop-shadow-[0_0_6px_rgb(255_253_252/0.8)]"
            style={{ top: sparkle.top, left: sparkle.left, width: sparkle.size, height: sparkle.size, "--delay": sparkle.delay } as React.CSSProperties}
          >
            <path d="M12 0C12.8 7.6 16.4 11.2 24 12 16.4 12.8 12.8 16.4 12 24 11.2 16.4 7.6 12.8 0 12 7.6 11.2 11.2 7.6 12 0Z" fill="currentColor" />
          </svg>
        ))}

        <div
          role="group"
          aria-label={`Voor en na: ${alt}`}
          onClick={(event) => event.stopPropagation()}
          className="absolute bottom-4 left-1/2 grid -translate-x-1/2 grid-cols-2 rounded-full bg-cream/90 p-1 text-small font-semibold text-ink shadow-print backdrop-blur-sm"
        >
          <span
            aria-hidden="true"
            className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-gold bg-(image:--gold-foil) transition-transform duration-500 ease-soft ${
              phase === "na" ? "translate-x-full" : ""
            }`}
          />
          {(["voor", "na"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={phase === option}
              onClick={() => choose(option)}
              className="relative min-w-16 rounded-full px-4 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze-deep"
            >
              {option === "voor" ? "Voor" : "Na"}
            </button>
          ))}
        </div>
      </div>
      {caption && <figcaption className="mt-3 text-small">{caption}</figcaption>}
    </figure>
  );
}
