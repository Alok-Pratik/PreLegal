interface SpinnerProps {
  label?: string;
  className?: string;
}

/** Consistent loading indicator shared across the app (SCRUM-8 polish). */
export function Spinner({ label, className = '' }: SpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-10 ${className}`}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple" aria-hidden="true" />
      {label && <p className="text-sm text-brand-gray">{label}</p>}
    </div>
  );
}
