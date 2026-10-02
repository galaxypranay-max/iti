export const CANVAS_W = 1000;
export const CANVAS_H = 620;
export const CELL = 60;

/** 2D SVG slots per project (component id -> top-left in canvas units). */
export const SLOTS_BY_PROJECT: Record<string, Record<string, { x: number; y: number }>> = {
  p0: {
    L: { x: 60, y: 60 },
    SW: { x: 320, y: 60 },
    B: { x: 580, y: 40 },
  },
  p1: {
    L: { x: 30, y: 40 },
    STOP: { x: 210, y: 40 },
    OL: { x: 370, y: 40 },
    "SB-F": { x: 540, y: 40 },
    "SB-R": { x: 700, y: 40 },
    KM1: { x: 240, y: 280 },
    KM2: { x: 480, y: 280 },
    M: { x: 780, y: 280 },
  },
};

/** 3D workbench positions per project (component id -> [x, y, z] on the bench). */
export const POS3D_BY_PROJECT: Record<string, Record<string, [number, number, number]>> = {
  p0: {
    L: [-4.2, 0, 0],
    SW: [-1.2, 0, 0],
    B: [2.4, 0, 0],
  },
  p1: {
    L: [-6.2, 0, 0],
    STOP: [-3.6, 0, -1.8],
    OL: [-3.6, 0, 1.8],
    "SB-F": [-0.9, 0, -1.8],
    "SB-R": [-0.9, 0, 1.8],
    KM1: [2.1, 0, -1.8],
    KM2: [2.1, 0, 1.8],
    M: [5.4, 0, 0],
  },
};

export const BUILD_STEPS_BY_PROJECT: Record<string, string[]> = {
  p0: [
    "Connect Phase L to the switch (terminal 1).",
    "Connect the switch (terminal 2) to the bulb (terminal 1).",
    "Return the bulb (terminal 2) to Neutral.",
    "Press Run, then tap the switch to turn the bulb ON and OFF.",
  ],
  p1: [
    "Connect Phase L to the Stop button (terminal 1).",
    "Connect Stop button (terminal 2) to the Overload relay (95).",
    "Feed both start buttons from Overload 96.",
    "Wire the Forward branch: SB-F out to KM1 A1, with KM2's NC (22) in the path.",
    "Latch KM1 with its own NO contact: SB-F out to 13, 14 back to A1.",
    "Wire the Reverse branch the same way around KM2.",
    "Cross the interlocks: KM1 NC (22) to the reverse branch, KM2 NC (22) to the forward branch.",
    "Return both coils A2 to Neutral.",
  ],
};
