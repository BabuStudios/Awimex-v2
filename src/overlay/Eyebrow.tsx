/** Section label with a leading rule. Its own module so the hero frame stays tiny. */
export function Eyebrow({ children }: { children: string }) {
  return (
    <p aria-hidden="true" className="label flex items-center gap-3 text-amber">
      <span className="h-px w-8 bg-amber" />
      {children}
    </p>
  );
}
