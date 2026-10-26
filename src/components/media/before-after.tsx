"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { focusPosition, type PhotoFocus } from "./focus";

type Photo = { url: string };
type Phase = "voor" | "na";

/** Hoe ver de overgang is: boven de foto (alleen voor) of eronder (helemaal na). */
const revealFor: Record<Phase, string> = { voor: "-20%", na: "120%" };

/*
 * Voor en na als transformatie. De foto begint bij het voor; zodra hij goed
 * in beeld is, wordt het resultaat er van boven naar beneden overheen
 * getrokken (zie .transform-* in globals.css). Tikken of klikken speelt de
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
  const reveal = { "--reveal": revealFor[phase] } as React.CSSProperties;

  return (
    <figure>
      <button
        ref={ref}
        type="button"
        data-phase={phase}
        onClick={() => setPhase((current) => (current === "na" ? "voor" : "na"))}
        aria-label={phase === "na" ? `Toon hoe het was: ${alt}` : `Toon het resultaat: ${alt}`}
        className="group relative block aspect-[4/5] w-full cursor-pointer overflow-hidden bg-ivory focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bronze-deep"
      >
        <Image
          src={before.url}
          alt=""
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-[2400ms] ease-calm group-data-[phase=na]:scale-[1.04]"
          style={{ objectPosition }}
        />
        <div className="transform-layer transform-after absolute inset-0" style={reveal}>
          <Image src={after.url} alt="" fill sizes={sizes} className="object-cover" style={{ objectPosition }} />
        </div>
        <span aria-hidden="true" className="transform-layer transform-streak pointer-events-none absolute inset-x-0" style={reveal} />

        <span
          aria-hidden="true"
          className="absolute bottom-4 left-4 flex items-baseline gap-3 bg-cream/90 px-3 py-2 text-small font-medium text-ink"
        >
          <span className={`transition-opacity duration-500 ${phase === "voor" ? "opacity-100" : "opacity-40"}`}>Voor</span>
          <span className="relative h-px w-8 self-center bg-line-strong">
            <span
              className={`absolute inset-y-0 left-0 bg-ink transition-[width] duration-[2400ms] ease-calm ${
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
