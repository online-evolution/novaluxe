import { site } from "@/config/site";
import { formatEuro } from "@/lib/format";
import { formatLongDate, formatMoment, utcToZonedParts } from "@/lib/time";

/*
 * De teksten van alle mails, als HTML in de huisstijl én als platte tekst (voor
 * mailprogramma's die geen HTML tonen). Puur, zodat ze te testen zijn. Geen
 * "bevestigd" vóórdat Jessie heeft bevestigd (docs/besluiten.md, Afspraken).
 *
 * De HTML is ouderwets opgebouwd (tabellen, inline stijlen), zodat hij ook in
 * Outlook en oudere apps heel blijft. De lettertypes van de site laden in mail
 * niet overal; daarom staan er nette vervangers achter.
 */

export type Mail = { subject: string; text: string; html: string };

/** Wat de HTML van buiten nodig heeft: het volledige adres van het logo. */
export type MailBrand = { logoUrl: string | null };

const noBrand: MailBrand = { logoUrl: null };

export type AppointmentDetails = {
  customerName: string;
  treatmentName: string;
  variantLabel: string;
  startAt: Date;
  endAt: Date;
  priceCents: number | null;
  /** Extra's en nail art waarvan de prijs nog in overleg is. */
  openPriceNames: string[];
};

export type RequestDetails = AppointmentDetails & {
  phone: string;
  email: string | null;
  options: string[];
  nailArtDescription: string | null;
  customerNotes: string | null;
  expiresAt: Date | null;
};

type Row = [label: string, value: string];

const colors = {
  page: "#f6e9de",
  card: "#fffdfc",
  panel: "#faf3ec",
  ink: "#332c25",
  soft: "#5e544a",
  bronze: "#7a5c3e",
  gold: "#d0a049",
  goldLine: "#e2c48f",
  line: "#eadfd4",
};

const font = "'Familjen Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const displayFont = "'Bodoni Moda', 'Bodoni 72', Didot, 'Times New Roman', Georgia, serif";
const goldFoil = "linear-gradient(100deg, #c4913c 0%, #e8c477 55%, #c99a4a 100%)";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Geen regeleinden in een onderwerp (en niet te lang). */
const oneLine = (value: string) => value.replace(/\s+/g, " ").trim().slice(0, 150);

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

/** Het telefoonnummer breekt niet over twee regels. */
const phone = site.phone.display.replace(/ /g, " ");

const addressLine = `${site.address.street}, ${site.address.postalCode} ${site.address.city}`;

const treatmentLine = (details: AppointmentDetails) =>
  details.variantLabel && details.variantLabel !== details.treatmentName
    ? `${details.treatmentName}, ${details.variantLabel}`
    : details.treatmentName;

/** "maandag 12 oktober, 09:30–11:00" in Nederlandse tijd. */
export function whenLine(startAt: Date, endAt: Date): string {
  const start = utcToZonedParts(startAt);
  const end = utcToZonedParts(endAt);
  return `${formatLongDate(start.date)}, ${start.time}–${end.time}`;
}

function priceLine(details: AppointmentDetails): string | null {
  const open = [...new Set(details.openPriceNames)].map((name) => name.toLowerCase());
  const extra = open.length > 0 ? ` (exclusief ${open.join(" en ")}, in overleg)` : "";
  if (details.priceCents === null) return open.length > 0 ? `In overleg${extra}` : null;
  if (details.priceCents === 0 && open.length === 0) return "Gratis";
  return `${formatEuro(details.priceCents)}${extra}`;
}

function appointmentRows(details: AppointmentDetails): Row[] {
  const price = priceLine(details);
  return [
    ["Behandeling", treatmentLine(details)],
    ["Wanneer", whenLine(details.startAt, details.endAt)],
    ...(price ? ([["Prijs", price]] as Row[]) : []),
    ["Adres", addressLine],
  ];
}

const contactSentence = `Wil je iets wijzigen of kun je niet komen? Laat het me zo snel mogelijk weten: bel ${phone} of antwoord op deze mail.`;

/* ---------- opbouw ---------- */

type Block =
  | { type: "p"; text: string }
  | { type: "rows"; rows: Row[] }
  | { type: "quote"; text: string }
  | { type: "button"; label: string; href: string };

function render({
  subject,
  title,
  blocks,
  signature,
  brand,
}: {
  subject: string;
  title: string;
  blocks: Block[];
  /** Klantmails: groet van Jessie en de salongegevens. Meldingen voor Jessie: niets. */
  signature: boolean;
  brand: MailBrand;
}): Mail {
  const textParts: string[] = [];
  const htmlParts: string[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case "p":
        textParts.push(block.text);
        htmlParts.push(
          `<p style="margin:0 0 16px">${escapeHtml(block.text).replace(/\n/g, "<br>")}</p>`,
        );
        break;
      case "quote":
        textParts.push(block.text.replace(/^/gm, "> "));
        htmlParts.push(
          `<p style="margin:0 0 16px;padding:0 0 0 16px;border-left:3px solid ${colors.line};white-space:pre-line">${escapeHtml(block.text)}</p>`,
        );
        break;
      case "rows":
        textParts.push(block.rows.map(([label, value]) => `${label}: ${value}`).join("\n"));
        htmlParts.push(
          `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" bgcolor="${colors.panel}" style="margin:4px 0 24px;background:${colors.panel};border-radius:16px"><tr><td style="padding:6px 20px"><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse">${block.rows
            .map(([label, value], index) => {
              const rule = index > 0 ? `border-top:1px solid ${colors.line};` : "";
              return `<tr><td style="padding:10px 16px 10px 0;${rule}color:${colors.soft};font-size:14px;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:10px 0;${rule}vertical-align:top;white-space:pre-line;font-weight:600">${escapeHtml(value)}</td></tr>`;
            })
            .join("")}</table></td></tr></table>`,
        );
        break;
      case "button":
        textParts.push(`${block.label}: ${block.href}`);
        htmlParts.push(
          `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td bgcolor="${colors.gold}" style="border-radius:999px;background-color:${colors.gold};background-image:${goldFoil}"><a href="${escapeHtml(block.href)}" style="display:inline-block;padding:14px 28px;font-family:${font};font-size:16px;font-weight:700;color:${colors.ink};text-decoration:none;border-radius:999px">${escapeHtml(block.label)} &#8599;</a></td></tr></table>`,
        );
        break;
    }
  }

  if (signature) {
    textParts.push(`Groetjes,\n${site.owner}\n${site.name}`);
    textParts.push(`${addressLine}\n${site.phone.display}\nInstagram ${site.instagram.handle}`);
    htmlParts.push(
      `<p style="margin:28px 0 0">Groetjes,<br><span style="font-family:${displayFont};font-size:24px;line-height:1.4">${escapeHtml(site.owner)}</span></p>`,
    );
  }

  const logo = brand.logoUrl
    ? `<tr><td align="center" style="padding:0 0 24px"><img src="${escapeHtml(brand.logoUrl)}" width="150" alt="${escapeHtml(site.name)}" style="display:block;width:150px;max-width:150px;height:auto;border:0"></td></tr>`
    : `<tr><td align="center" style="padding:0 0 24px;font-family:${displayFont};font-size:26px;color:${colors.bronze}">${escapeHtml(site.name)}</td></tr>`;

  const link = `color:${colors.soft};text-decoration:underline`;
  const footer = signature
    ? `<tr><td align="center" style="padding:28px 24px 0;font-family:${font};font-size:13px;line-height:1.7;color:${colors.soft}">
<strong style="color:${colors.ink}">${escapeHtml(site.name)}</strong><br>
${escapeHtml(addressLine)}<br>
<a href="${escapeHtml(site.phone.href)}" style="${link}">${escapeHtml(site.phone.display)}</a> · <a href="${escapeHtml(site.instagram.href)}" style="${link}">Instagram ${escapeHtml(site.instagram.handle)}</a>
</td></tr>`
    : "";

  const html = `<!doctype html>
<html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${colors.page}">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" bgcolor="${colors.page}" style="background:${colors.page}"><tr><td align="center" style="padding:36px 12px 40px">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px">
${logo}
<tr><td bgcolor="${colors.card}" style="background:${colors.card};border:1px solid ${colors.goldLine};border-radius:32px 32px 8px 8px;padding:36px 28px 32px;font-family:${font};font-size:16px;line-height:1.6;color:${colors.ink}">
<h1 style="margin:0 0 20px;font-family:${displayFont};font-size:32px;line-height:1.15;font-weight:500;color:${colors.ink}">${escapeHtml(title)}</h1>
${htmlParts.join("\n")}
</td></tr>
${footer}
</table>
</td></tr></table>
</body></html>`;

  return { subject: oneLine(subject), text: `${title}\n\n${textParts.join("\n\n")}\n`, html };
}

/* ---------- aan de klant ---------- */

export function confirmationMail(details: AppointmentDetails, brand: MailBrand = noBrand): Mail {
  return render({
    subject: `Je afspraak bij ${site.name} is bevestigd`,
    title: "Je afspraak is bevestigd",
    signature: true,
    brand,
    blocks: [
      { type: "p", text: `Hoi ${firstName(details.customerName)},` },
      { type: "p", text: "Je afspraak is bevestigd. Tot dan!" },
      { type: "rows", rows: appointmentRows(details) },
      { type: "p", text: contactSentence },
    ],
  });
}

export function rescheduleMail(details: AppointmentDetails, brand: MailBrand = noBrand): Mail {
  return render({
    subject: `Je afspraak bij ${site.name} is verplaatst`,
    title: "Je afspraak is verplaatst",
    signature: true,
    brand,
    blocks: [
      { type: "p", text: `Hoi ${firstName(details.customerName)},` },
      { type: "p", text: "Je afspraak staat nu op dit moment:" },
      { type: "rows", rows: appointmentRows(details) },
      { type: "p", text: contactSentence },
    ],
  });
}

export function rejectionMail(details: AppointmentDetails, bookingUrl: string, brand: MailBrand = noBrand): Mail {
  return render({
    subject: `Je aanvraag bij ${site.name}`,
    title: "Je aanvraag gaat helaas niet door",
    signature: true,
    brand,
    blocks: [
      { type: "p", text: `Hoi ${firstName(details.customerName)},` },
      {
        type: "p",
        text: `Helaas kan ik je aanvraag voor ${treatmentLine(details).toLowerCase()} op ${whenLine(details.startAt, details.endAt)} niet bevestigen.`,
      },
      {
        type: "p",
        text: `Kies gerust een ander moment, of bel me op ${phone}, dan zoeken we samen een tijd.`,
      },
      { type: "button", label: "Kies een ander moment", href: bookingUrl },
    ],
  });
}

export function cancellationMail(details: AppointmentDetails, bookingUrl: string, brand: MailBrand = noBrand): Mail {
  return render({
    subject: `Je afspraak bij ${site.name} is geannuleerd`,
    title: "Je afspraak is geannuleerd",
    signature: true,
    brand,
    blocks: [
      { type: "p", text: `Hoi ${firstName(details.customerName)},` },
      {
        type: "p",
        text: `Je afspraak voor ${treatmentLine(details).toLowerCase()} op ${whenLine(details.startAt, details.endAt)} is geannuleerd.`,
      },
      {
        type: "p",
        text: `Wil je een nieuwe afspraak maken? Dat kan online, of bel me op ${phone}.`,
      },
      { type: "button", label: "Maak een nieuwe afspraak", href: bookingUrl },
    ],
  });
}

/* ---------- aan Jessie ---------- */

export function requestNotificationMail(details: RequestDetails, adminUrl: string, brand: MailBrand = noBrand): Mail {
  const rows: Row[] = [
    ["Behandeling", treatmentLine(details)],
    ["Wanneer", whenLine(details.startAt, details.endAt)],
  ];
  const price = priceLine(details);
  if (price) rows.push(["Prijs", price]);
  if (details.options.length > 0) rows.push(["Extra", details.options.join("\n")]);
  if (details.nailArtDescription) rows.push(["Nail art", details.nailArtDescription]);
  if (details.customerNotes) rows.push(["Opmerking", details.customerNotes]);
  rows.push(["Naam", details.customerName], ["Telefoon", details.phone]);
  if (details.email) rows.push(["E-mail", details.email]);

  return render({
    subject: `Nieuwe aanvraag: ${details.treatmentName}, ${formatMoment(details.startAt)} (${details.customerName})`,
    title: "Nieuwe afspraakaanvraag",
    signature: false,
    brand,
    blocks: [
      { type: "p", text: `${details.customerName} heeft online een afspraak aangevraagd.` },
      { type: "rows", rows },
      {
        type: "p",
        text: details.expiresAt
          ? `Bevestig of wijs af vóór ${formatMoment(details.expiresAt)}. Daarna komt de tijd weer vrij.`
          : "Bevestig of wijs de aanvraag af in het beheer.",
      },
      { type: "button", label: "Open de aanvraag", href: adminUrl },
    ],
  });
}

export function contactNotificationMail(
  message: { name: string; email: string | null; phone: string | null; message: string },
  adminUrl: string,
  brand: MailBrand = noBrand,
): Mail {
  const rows: Row[] = [["Naam", message.name]];
  if (message.email) rows.push(["E-mail", message.email]);
  if (message.phone) rows.push(["Telefoon", message.phone]);
  return render({
    subject: `Nieuw bericht van ${message.name}`,
    title: "Nieuw bericht via de website",
    signature: false,
    brand,
    blocks: [
      { type: "quote", text: message.message },
      { type: "rows", rows },
      ...(message.email
        ? ([{ type: "p", text: "Antwoorden kan direct vanuit deze mail." }] as Block[])
        : []),
      { type: "button", label: "Alle berichten", href: adminUrl },
    ],
  });
}

export function testMail(address: string, brand: MailBrand = noBrand): Mail {
  return render({
    subject: "Testmail van je website",
    title: "Het werkt!",
    signature: false,
    brand,
    blocks: [
      {
        type: "p",
        text: `Je website kan nu mailen vanaf ${address}. Klanten krijgen hun bevestiging van dit adres, en als ze antwoorden, komt dat gewoon hier binnen.`,
      },
    ],
  });
}
