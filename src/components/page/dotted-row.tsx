/** Regel met puntlijntje, zoals op een prijskaart. Hoort binnen een <dl>. */
export function DottedRow({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2 py-2">
      <dt className="flex flex-1 items-baseline gap-2 font-medium">
        <span>{label}</span>
        <span aria-hidden="true" className="min-w-6 flex-1 -translate-y-1 border-b-2 border-dotted border-sand" />
      </dt>
      <dd className="figures text-right font-semibold">{value}</dd>
    </div>
  );
}
