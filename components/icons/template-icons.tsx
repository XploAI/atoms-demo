import type { SVGProps } from "react";

/** Shared props so each icon can take className / size. */
type IconProps = SVGProps<SVGSVGElement>;

const base: Partial<IconProps> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

/** Pomodoro: clock face with a stem / leaf on top. */
export function PomodoroIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10 3c1 1.4 1 2.4 0 3M12 3c1 1.4 1 2.4 0 3" />
      <circle cx="12" cy="14" r="7.5" />
      <path d="M12 10v4l2.5 2" />
    </svg>
  );
}

/** Tic-tac-toe: # grid with a tiny X + O. */
export function TicTacToeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 4v16M15 4v16M4 9h16M4 15h16" />
      <path d="M5.5 5.5l2 2M7.5 5.5l-2 2" />
      <circle cx="18" cy="18" r="1.6" />
    </svg>
  );
}

/** Notes: document with a dog-eared corner + ruled lines. */
export function NotesIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 3h9l4 4v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" />
      <path d="M15 3v4h4" />
      <path d="M8.5 12h7M8.5 15.5h5.5" />
    </svg>
  );
}

/** Habit: calendar-ish box with a checkmark. */
export function HabitIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M9 5V3M15 5V3" />
      <path d="M8.5 14.5l2.2 2.2 4.3-4.3" />
    </svg>
  );
}

/** Palette: disc with three swatch dots + a drip tail. */
export function PaletteIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3a9 9 0 00-.4 18 2 2 0 001.6-3.2c-.5-.7-.2-1.8.7-1.8h2A4 4 0 0012 3z" />
      <circle cx="8" cy="10" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="10" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Snake: sine curve with a head dot on one end. */
export function SnakeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 8c3 0 3 4 6 4s3-4 6-4 3 4 6 4" opacity={0.4} />
      <path d="M3 14c3 0 3 4 6 4s3-4 6-4" />
      <circle cx="15" cy="14" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Sandpack placeholder: stylised React atom. */
export function AtomIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <ellipse cx="12" cy="12" rx="9" ry="3.5" />
      <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(-60 12 12)" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export const TEMPLATE_ICONS = {
  pomodoro: PomodoroIcon,
  "tic-tac-toe": TicTacToeIcon,
  notes: NotesIcon,
  habit: HabitIcon,
  palette: PaletteIcon,
  snake: SnakeIcon,
} as const;

export type TemplateIconKey = keyof typeof TEMPLATE_ICONS;
