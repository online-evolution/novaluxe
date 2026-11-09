import Image from "next/image";
import { focusPosition } from "@/components/media/focus";
import { getSitePhotos } from "@/server/photos";

/**
 * Achtergrond in brons met een salonfoto (`shot`) die langzaam door de ruimte
 * schuift. Hoort in een ouder met `relative isolate overflow-hidden`. Zonder
 * foto blijft het brons.
 */
export async function BronzeBackdrop({ shot, sizes }: { shot: string; sizes: string }) {
  const photo = (await getSitePhotos())[shot];

  return (
    // Eigen achtergrond: de blend werkt alleen binnen deze laag (z-index).
    <div aria-hidden="true" className="absolute inset-0 -z-10 bg-bronze-deep">
      {photo && (
        <Image
          src={photo.url}
          alt=""
          fill
          sizes={sizes}
          className="cta-foto hero-pan object-cover"
          style={{ objectPosition: focusPosition[photo.focus] }}
        />
      )}
      <div className="hero-licht" />
      <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_58%,rgb(58_40_26/0.7),rgb(58_40_26/0.3)_100%)]" />
    </div>
  );
}
