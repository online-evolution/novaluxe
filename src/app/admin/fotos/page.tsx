import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { ActionForm } from "@/components/admin/action-form";
import { AdminPageHeader, AdminSection, Loading } from "@/components/admin/admin-page";
import { TextField } from "@/components/admin/fields";
import { PhotoInput } from "@/components/admin/photo-input";
import { beforeAfterRatio, formatAdvice, photoShots, workRatio } from "@/config/photo-shots";
import { listGalleryForAdmin, listSitePhotosForAdmin } from "@/server/admin/photos";
import { requireAdmin } from "@/server/auth/session";
import type { PhotoFocus } from "@/server/photos";
import {
  addBeforeAfterAction,
  addPhotoAction,
  clearSitePhotoAction,
  deleteGalleryItemAction,
  moveGalleryItemAction,
  setSitePhotoAction,
  updateGalleryItemAction,
  updateSitePhotoAction,
} from "./actions";

export const metadata: Metadata = { title: "Foto's" };

const focusLabels: Record<PhotoFocus, string> = {
  top: "Bovenkant",
  center: "Midden",
  bottom: "Onderkant",
};

const categoryLabels = { "": "Geen", nails: "Nagels", extensions: "Extensions" } as const;

export default function PhotosPage() {
  return (
    <>
      <AdminPageHeader
        title="Foto's"
        intro="Zet je werk en vaste foto's op de website. Staande foto's werken het best. Je kunt ze direct vanaf je telefoon kiezen; ze worden automatisch verkleind en zonder locatiegegevens opgeslagen."
      />
      <Suspense fallback={<Loading />}>
        <Editors />
      </Suspense>
    </>
  );
}

async function Editors() {
  await requireAdmin();
  const [gallery, sitePhotos] = await Promise.all([listGalleryForAdmin(), listSitePhotosForAdmin()]);
  const pairs = gallery.filter(({ item }) => item.kind === "before_after");
  const photos = gallery.filter(({ item }) => item.kind === "photo");
  const byShot = new Map(sitePhotos.map((photo) => [photo.shot, photo]));

  return (
    <>
      <AdminSection
        id="voor-en-na"
        title="Voor en na"
        intro={`Twee foto's van dezelfde klant, het liefst in hetzelfde licht en vanuit dezelfde hoek. Op de homepage schuift de bezoeker tussen voor en na. Formaat: ${formatAdvice(beforeAfterRatio).toLowerCase()}, voor allebei hetzelfde. Plaats alleen foto's waarvoor de klant toestemming heeft gegeven.`}
      >
        <GalleryList items={pairs} empty="Er staat nog geen voor en na op de website." />
        <Fold title="Voor en na toevoegen" open={pairs.length === 0}>
          <ActionForm action={addBeforeAfterAction} submitLabel="Voor en na plaatsen" resetOnSuccess>
            <div className="grid gap-6 sm:grid-cols-2">
              <PhotoInput name="before" label="Voor" ratio={beforeAfterRatio} required />
              <PhotoInput name="after" label="Na" ratio={beforeAfterRatio} required />
              <CommonFields scope="nieuw-paar" />
            </div>
          </ActionForm>
        </Fold>
      </AdminSection>

      <AdminSection
        id="werk"
        title="Werk"
        intro={`Losse foto's van je werk. Op de homepage staan de eerste acht, in de volgorde van deze lijst. Formaat: ${formatAdvice(workRatio).toLowerCase()}.`}
      >
        <GalleryList items={photos} empty="Er staan nog geen foto's van je werk op de website. Tot die tijd staan er lege fotoplekken." />
        <Fold title="Foto toevoegen" open={photos.length === 0}>
          <ActionForm action={addPhotoAction} submitLabel="Foto plaatsen" resetOnSuccess>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <PhotoInput name="photo" label="Foto" ratio={workRatio} required />
              </div>
              <CommonFields scope="nieuwe-foto" />
            </div>
          </ActionForm>
        </Fold>
      </AdminSection>

      <AdminSection
        id="plekken"
        title="Vaste plekken op de website"
        intro="Elke plek heeft een code uit de fotolijst. Zolang er geen foto staat, ziet de bezoeker een lege fotoplek met wat er moet komen."
      >
        <ul className="border-t border-line-strong">
          {photoShots.map((shot) => {
            const current = byShot.get(shot.code);
            return (
              <li key={shot.code} className="grid grid-cols-[4.5rem_1fr] gap-x-4 gap-y-3 border-b border-line py-5">
                <Thumb url={current?.url} />
                <div className="min-w-0">
                  <p className="font-medium">
                    <span className="figures mr-2 text-bronze-deep">{shot.code}</span>
                    {shot.subject}
                  </p>
                  <p className="text-small text-ink-soft">{shot.where}</p>
                  <p className="text-small text-ink-soft">
                    Formaat: {formatAdvice(shot.ratio).toLowerCase()}
                    {current && (
                      <span className="figures">
                        {" · "}nu {current.width} × {current.height} px
                      </span>
                    )}
                  </p>
                  <Fold title={current ? "Foto vervangen" : "Foto plaatsen"} small>
                    <ActionForm action={setSitePhotoAction} submitLabel="Plaatsen" resetOnSuccess>
                      <input type="hidden" name="shot" value={shot.code} />
                      <div className="grid gap-6">
                        <PhotoInput name="photo" label="Foto" ratio={shot.ratio} required />
                        <AltField scope={`plaats-${shot.code}`} value={current?.alt ?? undefined} />
                        <FocusField value={current?.focus} />
                      </div>
                    </ActionForm>
                  </Fold>
                  {current && (
                    <>
                      <Fold title="Beschrijving en uitsnede" small>
                        <ActionForm action={updateSitePhotoAction} submitLabel="Opslaan">
                          <input type="hidden" name="shot" value={shot.code} />
                          <div className="grid gap-6">
                            <AltField scope={`wijzig-${shot.code}`} value={current.alt ?? undefined} />
                            <FocusField value={current.focus} />
                          </div>
                        </ActionForm>
                      </Fold>
                      <div className="mt-3">
                        <ActionForm action={clearSitePhotoAction} submitLabel="Foto weghalen" quiet>
                          <input type="hidden" name="shot" value={shot.code} />
                        </ActionForm>
                      </div>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </AdminSection>
    </>
  );
}

type GalleryRow = Awaited<ReturnType<typeof listGalleryForAdmin>>[number];

function GalleryList({ items, empty }: { items: GalleryRow[]; empty: string }) {
  if (items.length === 0) return <p className="mb-6 text-small text-ink-soft">{empty}</p>;
  return (
    <ol className="mb-8 border-t border-line-strong">
      {items.map(({ item, url, width, height, beforeUrl, beforeWidth, beforeHeight }, index) => (
        <li key={item.id} className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 border-b border-line py-5">
          <div className="flex gap-1">
            {beforeUrl && <Thumb url={beforeUrl} label="Voor" />}
            <Thumb url={url} label={beforeUrl ? "Na" : undefined} />
          </div>
          <div className="min-w-0">
            <p className="font-medium">{item.caption ?? "Zonder onderschrift"}</p>
            <p className="text-small text-ink-soft">
              {item.published ? "Op de website" : "Verborgen"}
              {item.category && ` · ${categoryLabels[item.category]}`}
            </p>
            <p className="figures text-small text-ink-soft">
              {beforeUrl ? `Voor ${beforeWidth} × ${beforeHeight} px · na ${width} × ${height} px` : `${width} × ${height} px`}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              {index > 0 && (
                <ActionForm action={moveGalleryItemAction} submitLabel="Naar voren" quiet>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="direction" value="up" />
                </ActionForm>
              )}
              {index < items.length - 1 && (
                <ActionForm action={moveGalleryItemAction} submitLabel="Naar achteren" quiet>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="direction" value="down" />
                </ActionForm>
              )}
            </div>
            <Fold title="Aanpassen" small>
              <ActionForm action={updateGalleryItemAction} submitLabel="Opslaan">
                <input type="hidden" name="id" value={item.id} />
                <div className="grid gap-6 sm:grid-cols-2">
                  <CommonFields scope={item.id} caption={item.caption} alt={item.alt} focus={item.focus} category={item.category} />
                  <label className="flex items-center gap-3 sm:col-span-2">
                    <input type="checkbox" name="published" defaultChecked={item.published} className="size-5 accent-ink" />
                    Tonen op de website
                  </label>
                </div>
              </ActionForm>
              <div className="mt-6">
                <ActionForm action={deleteGalleryItemAction} submitLabel="Verwijderen" quiet>
                  <input type="hidden" name="id" value={item.id} />
                </ActionForm>
              </div>
            </Fold>
          </div>
        </li>
      ))}
    </ol>
  );
}

function CommonFields(props: {
  scope: string;
  caption?: string | null;
  alt?: string | null;
  focus?: PhotoFocus;
  category?: "nails" | "extensions" | null;
}) {
  return (
    <>
      <TextField
        name="caption"
        label="Onderschrift (optioneel)"
        value={props.caption ?? undefined}
        scope={props.scope}
        maxLength={120}
        hint="Kort, bijvoorbeeld: BIAB met French of 50 cm, 3 banen."
      />
      <div>
        <label htmlFor={`soort-${props.scope}`} className="field-label">
          Soort
        </label>
        <select id={`soort-${props.scope}`} name="category" defaultValue={props.category ?? ""} className="field-input">
          {Object.entries(categoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <AltField scope={props.scope} value={props.alt ?? undefined} />
      <FocusField value={props.focus} />
    </>
  );
}

function AltField({ scope, value }: { scope: string; value?: string }) {
  return (
    <TextField
      name="alt"
      scope={scope}
      label="Wat staat er op de foto? (optioneel)"
      value={value}
      maxLength={300}
      hint="Voor bezoekers die de foto niet kunnen zien, en voor Google. Bijvoorbeeld: lange blonde extensions, van achteren."
    />
  );
}

function FocusField({ value = "center" }: { value?: PhotoFocus }) {
  return (
    <fieldset>
      <legend className="field-label">Welk deel moet altijd zichtbaar blijven?</legend>
      <p className="mt-1 text-small text-ink-soft">Op sommige plekken wordt de foto bijgesneden.</p>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
        {Object.entries(focusLabels).map(([focus, label]) => (
          <label key={focus} className="flex items-center gap-2">
            <input type="radio" name="focus" value={focus} defaultChecked={focus === value} className="size-5 accent-ink" />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Thumb({ url, label }: { url?: string; label?: string }) {
  return (
    <figure className="w-[4.5rem]">
      <div className="relative aspect-[4/5] overflow-hidden border border-line bg-ivory">
        {url && <Image src={url} alt="" fill sizes="72px" className="object-cover" />}
      </div>
      {label && <figcaption className="mt-1 text-label text-ink-soft">{label}</figcaption>}
    </figure>
  );
}

function Fold({
  title,
  open,
  small,
  children,
}: {
  title: string;
  open?: boolean;
  small?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={open} className={small ? "mt-3" : "max-w-2xl border-t border-line pt-4"}>
      <summary className={`cursor-pointer font-medium marker:text-ink-soft ${small ? "text-small" : ""}`}>
        {title}
      </summary>
      <div className="mt-6">{children}</div>
    </details>
  );
}
