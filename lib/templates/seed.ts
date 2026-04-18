import type { TemplateIconKey } from "@/components/icons/template-icons";

/**
 * Curated starter templates shown on the landing page. Static — no DB rows.
 *
 * `starterFiles` is optional: if present, picking the template skips the
 * first agent turn and pre-loads the workspace with a working app.
 */
export type TemplateTone = "purple" | "blue" | "emerald" | "amber" | "rose" | "sky";

export type Template = {
  id: string;
  title: string;
  description: string;
  icon: TemplateIconKey;
  tone: TemplateTone;
  prompt: string;
  category: "Game" | "Tool" | "Toy" | "Productivity";
  starterFiles?: Record<string, string>;
};

export const TEMPLATES: Template[] = [
  {
    id: "pomodoro",
    title: "Pomodoro Timer",
    description: "25/5 work-rest cycle with sound + cycle counter.",
    icon: "pomodoro",
    tone: "rose",
    category: "Productivity",
    prompt:
      "A pomodoro timer with a circular progress ring, start/pause/reset controls, a 25-minute work / 5-minute break cycle, a soft chime when each phase ends, and a counter showing how many cycles I've completed today.",
  },
  {
    id: "tic-tac-toe",
    title: "Tic-Tac-Toe",
    description: "Two-player game with score tracking + reset.",
    icon: "tic-tac-toe",
    tone: "blue",
    category: "Game",
    prompt:
      "A two-player tic-tac-toe game. Big tappable squares, X / O turn indicator, win-line animation, score counter for X / O / draws, and a reset button.",
  },
  {
    id: "markdown-notes",
    title: "Markdown Notes",
    description: "Live preview, localStorage save, multiple notes.",
    icon: "notes",
    tone: "emerald",
    category: "Tool",
    prompt:
      "A markdown notes app: a sidebar listing notes (with new / delete buttons), a split-pane editor where the left side is a textarea and the right side is the rendered markdown preview. Save everything in localStorage.",
  },
  {
    id: "habit-tracker",
    title: "Habit Tracker",
    description: "Daily checkboxes, streaks, weekly heatmap.",
    icon: "habit",
    tone: "purple",
    category: "Productivity",
    prompt:
      "A daily habit tracker. Let me add habits, check them off each day, see my current streak per habit, and view a 7-day heatmap of completions per habit. Persist in localStorage.",
  },
  {
    id: "color-palette",
    title: "Color Palette Generator",
    description: "Random / harmonized palettes, copy hex on click.",
    icon: "palette",
    tone: "amber",
    category: "Toy",
    prompt:
      "A color palette generator. Show 5 swatches, with a 'Generate' button that produces a harmonized palette (analogous / complementary / triadic — let me pick the rule). Click any swatch to copy its hex code with a toast.",
  },
  {
    id: "snake",
    title: "Snake",
    description: "Classic snake game with arrow-key controls.",
    icon: "snake",
    tone: "sky",
    category: "Game",
    prompt:
      "Classic snake game on a 20x20 grid. Arrow keys to control, food spawns randomly, snake grows on eating, game-over on wall or self collision, score in the top-right, and a Restart button.",
  },
];

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
