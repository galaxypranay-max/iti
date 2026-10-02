export const CANVAS_W = 1000;
export const CANVAS_H = 620;
export const CELL = 60;

export const COMPONENT_SLOTS: Record<string, { x: number; y: number }> = {
  L: { x: 30, y: 40 },
  STOP: { x: 210, y: 40 },
  OL: { x: 370, y: 40 },
  "SB-F": { x: 540, y: 40 },
  "SB-R": { x: 700, y: 40 },
  KM1: { x: 240, y: 280 },
  KM2: { x: 480, y: 280 },
  M: { x: 780, y: 280 },
};

export const BUILD_STEPS = [
  "Connect Phase L to the Stop button (terminal 1).",
  "Connect Stop button (terminal 2) to the Overload relay (95).",
  "Feed both start buttons from Overload 96.",
  "Wire the Forward branch: SB-F out to KM1 A1, with KM2's NC (22) in the path.",
  "Latch KM1 with its own NO contact: SB-F out to 13, 14 back to A1.",
  "Wire the Reverse branch the same way around KM2.",
  "Cross the interlocks: KM1 NC (22) to the reverse branch, KM2 NC (22) to the forward branch.",
  "Return both coils A2 to Neutral.",
];
