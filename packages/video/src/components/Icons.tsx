import type React from "react";

export const StarIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path
      fill={color}
      d="M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96L12 2.5z"
    />
  </svg>
);

export const CheckIcon: React.FC<{ size: number; bg: string; fg: string }> = ({ size, bg, fg }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="24" fill={bg} />
    <path d="M13 25l7 7 15-16" fill="none" stroke={fg} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ClockIcon: React.FC<{ size: number; color: string; handAngle: number }> = ({ size, color, handAngle }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <circle cx="50" cy="54" r="38" fill="none" stroke={color} strokeWidth="8" />
    <rect x="44" y="4" width="12" height="10" rx="3" fill={color} />
    <line x1="50" y1="54" x2="50" y2="30" stroke={color} strokeWidth="7" strokeLinecap="round" transform={`rotate(${handAngle} 50 54)`} />
    <circle cx="50" cy="54" r="5" fill={color} />
  </svg>
);

/** Generic chat-bubble-with-handset glyph used for the WhatsApp call to action. */
export const ChatPhoneIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <path
      fill={color}
      d="M32 4C16.5 4 4 16 4 30.8c0 5.3 1.6 10.2 4.4 14.3L5 59l14.4-3.7c3.8 2 8.1 3.1 12.6 3.1 15.5 0 28-12 28-26.8S47.5 4 32 4z"
    />
    <path
      fill="#25D366"
      d="M24.6 18.2c-.6-1.3-1.2-1.3-1.8-1.3h-1.5c-.5 0-1.4.2-2.1 1-.7.8-2.8 2.7-2.8 6.6s2.9 7.6 3.3 8.2c.4.5 5.6 8.7 13.8 11.9 6.8 2.6 8.2 2.1 9.7 2 1.5-.1 4.8-1.9 5.4-3.8.7-1.9.7-3.5.5-3.8-.2-.3-.7-.5-1.5-.9-.8-.4-4.8-2.3-5.5-2.6-.7-.3-1.3-.4-1.8.4-.5.8-2.1 2.6-2.5 3.1-.5.5-.9.6-1.7.2-.8-.4-3.4-1.2-6.5-3.9-2.4-2.1-4-4.7-4.5-5.5-.5-.8 0-1.2.4-1.6.4-.4.8-.9 1.2-1.4.4-.5.5-.8.8-1.3.3-.5.1-1-.1-1.4-.2-.4-1.7-4.3-2.4-5.9z"
    />
  </svg>
);
