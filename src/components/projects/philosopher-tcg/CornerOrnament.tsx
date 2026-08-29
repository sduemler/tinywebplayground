export default function CornerOrnament() {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round">
      <path d="M 2 40 L 2 2 L 40 2" />
      <path d="M 7 7 L 18 7 M 7 7 L 7 18" />
      <path d="M 18 7 C 18 14, 14 18, 7 18" />
      <path d="M 22 4 L 26 4 M 4 22 L 4 26" />
      <circle cx="2" cy="2" r="1.4" fill="currentColor" />
      <circle cx="11" cy="11" r="0.9" fill="currentColor" />
    </svg>
  );
}
