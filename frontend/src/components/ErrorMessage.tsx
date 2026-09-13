interface ErrorMessageProps {
  message: string;
  className?: string;
}

/** Consistent error styling shared across forms and data loads (SCRUM-8 polish). */
export function ErrorMessage({ message, className = '' }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 ${className}`}
    >
      <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01M10.29 3.86l-8.18 14.18A1.5 1.5 0 003.41 20h17.18a1.5 1.5 0 001.3-2.24L13.71 3.86a1.5 1.5 0 00-2.42 0z"
        />
      </svg>
      <span>{message}</span>
    </div>
  );
}
