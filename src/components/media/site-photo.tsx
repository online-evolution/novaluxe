import Image from "next/image";
import { getSitePhotos } from "@/server/photos";
import { focusPosition } from "./focus";

/**
 * Foto op een vaste plek (shotcode uit PHOTO-SHOTLIST.md). Zolang Jessie er in
 * het beheer geen foto voor heeft geplaatst, staat er niets: elke pagina klopt
 * ook zonder deze foto. De plek bepaalt de verhouding (via `className`); de
 * foto vult die en wordt bijgesneden rond het gekozen deel.
 */
export async function SitePhoto({
  shot,
  subject,
  className = "",
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority,
}: {
  shot: string;
  subject: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const photo = (await getSitePhotos())[shot];
  if (!photo) return null;

  return (
    <figure className={`relative overflow-hidden bg-ivory ${className}`}>
      <Image
        src={photo.url}
        alt={photo.alt ?? subject}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
        style={{ objectPosition: focusPosition[photo.focus] }}
      />
    </figure>
  );
}
