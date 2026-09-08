
// Minimal cow icon component to act like a Fa... icon (no external deps)
export default function FaCow({ className, title = 'cow' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label={title}
      role="img"
    >
      <path d="M3 11c0-1.1.9-2 2-2h1v-1c0-1.1.9-2 2-2h1c.6 0 1 .4 1 1v1h2V7c0-.6.4-1 1-1h1c1.1 0 2 .9 2 2v1h1c1.1 0 2 .9 2 2v2c0 1.7-1.3 3-3 3h-1v2H6v-2H5c-1.1 0-2-.9-2-2v-2z" />
      <path d="M7 14s1-2 4-2 4 2 4 2" />
      <path d="M9 9v.01" />
      <path d="M15 9v.01" />
    </svg>
  );
}
