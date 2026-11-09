import type { Metadata } from "next";
import { Suspense } from "react";
import { ActionForm } from "@/components/admin/action-form";
import { AdminPageHeader, Loading } from "@/components/admin/admin-page";
import { formatMoment } from "@/lib/time";
import { requireAdmin } from "@/server/auth/session";
import { listContactMessages } from "@/server/contact";
import { deleteMessageAction, setMessageReadAction } from "./actions";

export const metadata: Metadata = { title: "Berichten" };

export default function MessagesPage() {
  return (
    <>
      <AdminPageHeader
        title="Berichten"
        intro="Vragen die via het contactformulier op de website zijn gestuurd. Nieuwe berichten staan bovenaan met ‘Nieuw’ erbij."
      />
      <Suspense fallback={<Loading />}>
        <MessageList />
      </Suspense>
    </>
  );
}

async function MessageList() {
  await requireAdmin();
  const messages = await listContactMessages();

  if (messages.length === 0) {
    return <p className="mt-10 text-ink-soft">Er zijn nog geen berichten.</p>;
  }

  return (
    <ul className="mt-10 grid max-w-3xl gap-6">
      {messages.map((message) => {
        const unread = message.readAt === null;
        return (
          <li key={message.id}>
            <article
              aria-labelledby={`bericht-${message.id}`}
              className={`border p-6 ${unread ? "border-bronze bg-ivory" : "border-line-strong"}`}
            >
              <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <h2 id={`bericht-${message.id}`} className="text-lede font-medium">
                  {unread && <span className="mr-2 text-small font-semibold text-bronze-deep">Nieuw</span>}
                  {message.name}
                </h2>
                <p className="figures text-small text-ink-soft">{formatMoment(message.createdAt)}</p>
              </header>
              <p className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-small">
                {message.email && (
                  <a href={`mailto:${message.email}`} className="underline underline-offset-4 hover:text-bronze-deep">
                    {message.email}
                  </a>
                )}
                {message.phone && (
                  <a href={`tel:${message.phone.replace(/[^0-9+]/g, "")}`} className="figures underline underline-offset-4 hover:text-bronze-deep">
                    {message.phone}
                  </a>
                )}
              </p>
              <p className="mt-4 whitespace-pre-line">{message.message}</p>
              <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
                <ActionForm
                  action={setMessageReadAction}
                  submitLabel={unread ? "Markeer als gelezen" : "Markeer als ongelezen"}
                  quiet
                >
                  <input type="hidden" name="id" value={message.id} />
                  <input type="hidden" name="gelezen" value={unread ? "ja" : "nee"} />
                </ActionForm>
                <ActionForm action={deleteMessageAction} submitLabel="Verwijderen" quiet>
                  <input type="hidden" name="id" value={message.id} />
                </ActionForm>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
