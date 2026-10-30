/*
 * Foto's in de browser verkleinen vóór het uploaden. Een telefoonfoto is al
 * snel 3–8 MB; verkleind tot 2000 px is dat ±0,5 MB. Dat is sneller op een
 * mobiele verbinding en past binnen de uploadgrens van de server. Tekenen op
 * een canvas laat bovendien de metadata (zoals de GPS-locatie) achter.
 * Lukt het niet (onbekend formaat), dan gaat het origineel mee en beslist de
 * server.
 */

const maxEdge = 2000;

export async function shrinkImage(file: File): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.93));
  return blob ? new File([blob], "foto.jpg", { type: "image/jpeg" }) : file;
}

/** Verkleint de foto's in alle bestandsvelden met `data-shrink` en zet ze in `data`. */
export async function shrinkImagesIn(form: HTMLFormElement, data: FormData): Promise<number> {
  let total = 0;
  for (const input of form.querySelectorAll<HTMLInputElement>("input[type=file][data-shrink]")) {
    const file = input.files?.[0];
    if (!file) continue;
    const small = await shrinkImage(file);
    data.set(input.name, small);
    total += small.size;
  }
  return total;
}
