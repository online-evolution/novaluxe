"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { focusPosition, type PhotoFocus } from "./focus";

type Photo = { url: string };

/*
 * Voor en na in één beeld: links "voor", rechts "na", met een lijn die je
 * verschuift. Muis: klikken of slepen. Touch: horizontaal vegen (verticaal
 * blijft de pagina gewoon scrollen). Toetsenbord en schermlezer: een echte
 * schuifregelaar (pijltjestoetsen).
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
  const [position, setPosition] = useState(50);
  const areaRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; startY: number; active: boolean } | null>(null);

  function moveTo(clientX: number) {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const percent = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.round(Math.min(100, Math.max(0, percent))));
  }

  const objectPosition = focusPosition[focus];

  return (
    <figure>
      <div
        ref={areaRef}
        className="group relative aspect-[4/5] touch-pan-y overflow-hidden bg-ivory select-none"
        onPointerDown={(event) => {
          // Muis: direct verschuiven. Touch: pas als duidelijk is dat het horizontaal is.
          const isMouse = event.pointerType === "mouse";
          drag.current = { startX: event.clientX, startY: event.clientY, active: isMouse };
          if (isMouse) {
            event.currentTarget.setPointerCapture(event.pointerId);
            moveTo(event.clientX);
          }
        }}
        onPointerMove={(event) => {
          const state = drag.current;
          if (!state) return;
          if (!state.active) {
            const dx = Math.abs(event.clientX - state.startX);
            const dy = Math.abs(event.clientY - state.startY);
            if (dx < 8 || dx < dy) return;
            state.active = true;
            event.currentTarget.setPointerCapture(event.pointerId);
          }
          moveTo(event.clientX);
        }}
        // Anders start de browser het slepen van de foto zelf en stopt het verschuiven.
        onDragStart={(event) => event.preventDefault()}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <Image src={after.url} alt={`Na: ${alt}`} draggable={false} fill sizes={sizes} className="object-cover" style={{ objectPosition }} />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
          <Image src={before.url} alt={`Voor: ${alt}`} draggable={false} fill sizes={sizes} className="object-cover" style={{ objectPosition }} />
        </div>

        <span aria-hidden="true" className="label absolute top-3 left-3 bg-cream/85 px-2 py-1 text-ink">
          Voor
        </span>
        <span aria-hidden="true" className="label absolute top-3 right-3 bg-cream/85 px-2 py-1 text-ink">
          Na
        </span>

        <input
          type="range"
          min={0}
          max={100}
          value={position}
          onChange={(event) => setPosition(Number(event.currentTarget.value))}
          aria-label={`Schuif tussen voor en na${caption ? `: ${caption}` : ""}`}
          aria-valuetext={`${position} procent voor`}
          className="peer sr-only"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 w-px bg-cream shadow-[0_0_0_1px_rgb(51_44_37/0.25)] peer-focus-visible:[&>span]:outline-2 peer-focus-visible:[&>span]:outline-offset-2 peer-focus-visible:[&>span]:outline-bronze-deep"
          style={{ left: `${position}%` }}
        >
          <span className="absolute top-1/2 left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-ink/20 bg-cream text-ink shadow-print">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" />
            </svg>
          </span>
        </div>
      </div>
      {caption && <figcaption className="mt-3 text-small text-ink-soft">{caption}</figcaption>}
    </figure>
  );
}
