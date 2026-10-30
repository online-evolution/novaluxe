import Image from "next/image";
import { photoShots } from "@/config/photo-shots";
import { getSitePhotos } from "@/server/photos";
import { focusPosition } from "./focus";
import { PhotoPlaceholder } from "./photo-placeholder";

/**
 * Foto op een vaste plek (shotcode uit PHOTO-SHOTLIST.md). Zolang Jessie er in
 * het beheer geen foto voor heeft geplaatst, staat de lege plek er met de code.
 * De plek bepaalt de verhouding (via `className`); de foto vult die en wordt
 * bijgesneden rond het gekozen deel. De vorm volgt de spiegels in de salon: een
 * boog, en een lagere boog voor liggende foto's (.photo-arch in globals.css).
 */
export async function SitePhoto({
  shot,
  subject,
  className = "",
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority,
  quality,
}: {
  shot: string;
  subject: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  quality?: 75 | 90;
}) {
  const photo = (await getSitePhotos())[shot];
  const landscape = photoShots.find((item) => item.code === shot)?.ratio === "3:2";
  const shape = `${landscape ? "photo-arch-wide" : "photo-arch"} ${className}`;
  if (!photo) return <PhotoPlaceholder shot={shot} subject={subject} className={shape} />;

  return (
    <figure className={`relative overflow-hidden bg-ivory ${shape}`}>
      <Image
        src={photo.url}
        alt={photo.alt ?? subject}
        fill
        sizes={sizes}
        priority={priority}
        quality={quality}
        className="object-cover"
        style={{ objectPosition: focusPosition[photo.focus] }}
      />
    </figure>
  );
}
