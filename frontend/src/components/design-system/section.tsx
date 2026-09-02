export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xs font-semibold tracking-widest text-text-subtle uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Swatch({ token, step }: { token: string; step: string }) {
  return (
    <div className="space-y-1.5">
      <div className={`h-14 rounded-sm border border-border ${token}`} />
      <p className="text-2xs text-text-subtle">{step}</p>
    </div>
  );
}
