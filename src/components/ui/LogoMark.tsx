export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        className="logo-drop"
        d="M12 2C12 2 6 9 6 14a6 6 0 0012 0c0-5-6-12-6-12z"
        fill="#c9a227"
      />
    </svg>
  );
}
