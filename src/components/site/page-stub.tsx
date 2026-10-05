/**
 * Tijdelijke inhoud voor pagina's die in een latere fase worden ontworpen.
 * TODO(fase 3–10): vervangen door de echte pagina.
 */
export function PageStub({ title }: { title: string }) {
  return (
    <div className="px-gutter pt-section-tight">
      <h1 className="text-display-l font-medium text-balance">{title}</h1>
      <p className="mt-6 max-w-measure text-ink-soft">
        Deze pagina wordt binnenkort toegevoegd.
      </p>
    </div>
  );
}
