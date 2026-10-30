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

/** Sterretjes (de ✦ uit het logo) die flonkeren als het resultaat er staat. */
const sparkles = [
  { top: "16%", left: "70%", size: "1.25rem", delay: "1700ms" },
  { top: "44%", left: "18%", size: "0.875rem", delay: "1900ms" },
  { top: "66%", left: "76%", size: "1rem", delay: "2100ms" },
];

/*
 * Voor en na als transformatie. De foto begint bij het voor; zodra hij goed
 * in beeld is, golft het resultaat er van boven naar beneden overheen, veert
 * het zacht op zijn plek en flonkeren er even drie sterretjes (zie
 * .transform-* in globals.css). Tikken of klikken speelt de
 * overgang terug naar het voor, en weer vooruit. Met "minder beweging"
 * ingesteld start niets vanzelf en is het een rustige overgang.
 */
export function BeforeAfter({
  before,
  after,
  alt,
  caption,
  focus,
  sizes,
}: {
  before: Photo;
  after: Photo;
  alt: string;
  caption: string | null;
  focus: PhotoFocus;
  sizes: string;
}) {
  const [phase, setPhase] = useState<Phase>("voor");
  const ref = useRef<HTMLButtonElement>(null);

  // Eén keer vanzelf afspelen als de foto voor het grootste deel in beeld is.
  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        timer = setTimeout(() => setPhase("na"), 450);
      },
      { threshold: 0.6 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  const objectPosition = focusPosition[focus];
  const reveal = { "--reveal": revealFor[phase], "--wave": waveFor[phase] } as React.CSSProperties;

  return (
    <figure>
      <button
        ref={ref}
        type="button"
        data-phase={phase}
        onClick={() => setPhase((current) => (current === "na" ? "voor" : "na"))}
        aria-label={phase === "na" ? `Toon hoe het was: ${alt}` : `Toon het resultaat: ${alt}`}
        className="photo-arch group relative block aspect-[4/5] w-full cursor-pointer overflow-hidden bg-ivory focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bronze-deep"
      >
        <Image
          src={before.url}
          alt=""
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-[2200ms] ease-calm group-data-[phase=na]:scale-[1.04]"
          style={{ objectPosition }}
        />
        <div className="transform-layer transform-after absolute inset-0" style={reveal}>
          <div className="transform-settle absolute inset-0">
            <Image src={after.url} alt="" fill sizes={sizes} className="object-cover" style={{ objectPosition }} />
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

        <span
          aria-hidden="true"
          className="absolute bottom-4 left-4 flex items-baseline gap-3 bg-cream/90 px-3 py-2 text-small font-medium text-ink"
        >
          <span className={`transition-opacity duration-500 ${phase === "voor" ? "opacity-100" : "opacity-40"}`}>Voor</span>
          <span className="relative h-px w-8 self-center bg-line-strong">
            <span
              className={`absolute inset-y-0 left-0 bg-ink transition-[width] duration-[2200ms] ease-calm ${
                phase === "na" ? "w-full" : "w-0"
              }`}
            />
          </span>
          <span className={`transition-opacity duration-500 ${phase === "na" ? "opacity-100" : "opacity-40"}`}>Na</span>
        </span>
      </button>
      <figcaption className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-small">
        <span>{caption}</span>
        <span className="text-ink-soft" aria-live="polite">
          {phase === "na" ? "Tik op de foto om terug te kijken" : "Tik op de foto voor het resultaat"}
        </span>
      </figcaption>
    </figure>
  );
}
