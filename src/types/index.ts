// Single source of truth for data shapes used across the app.

export type Mode = "learn" | "practice" | "exam";

export type ComponentKind =
  | "supply"
  | "supply-3ph"
  | "contactor"
  | "mcb"
  | "timer"
  | "push-button-no"
  | "push-button-nc"
  | "switch"
  | "bulb"
  | "overload"
  | "motor";

export interface TerminalSpec {
  id: string;
  label: string;
  /** Relative position (0-1) on the 2D component box where the terminal sits. */
  position: { x: number; y: number };
  contact?: "NO" | "NC";
}

export interface ComponentSpec {
  id: string;
  kind: ComponentKind;
  name: string;
  label: string;
  /** 2D size in grid cells (60px per cell). */
  size: { w: number; h: number };
  terminals: TerminalSpec[];
  /** Star contactor: load side terminals join as the star point when energized. */
  starPoint?: boolean;
  /** Terminal groups shown in the Terminal Inspector (never invented - from the project definition). */
  groups?: { title: string; terminalIds: string[] }[];
}

export interface ProjectSpec {
  id: string;
  slug: string;
  title: string;
  /** Syllabus section used to group the project library. */
  section: string;
  shortDescription: string;
  objective: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  requiredComponents: ComponentSpec[];
  expectedWires: [string, string][];
  controlLogic: {
    supply: { positive: string; negative: string };
    coils: string[];
    auxContacts: { terminalId: string; controlsCoil: string; state: "NO" | "NC" }[];
    interlocks: { from: string; to: string }[];
    /** Exact wires that implement the interlock(s) - used by the fault detector. */
    interlockWires?: [string, string][];
    overloadPath: string[];
  };
  simulation: {
    steps: {
      pressedButtons: string[];
      expected: Record<string, unknown>;
    }[];
  };
  explanation: string;
  workingPrinciple: string;
  safetyNotes: string[];
  vivaQuestions: { id: string; question: string; answer: string }[];
  /** Data-driven scoring rows; a row passes when ALL its wires are present (and/or no extra wires). */
  scoring: { name: string; points: number; wires?: [string, string][]; noExtra?: boolean }[];
}
