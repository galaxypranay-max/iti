export const CANVAS_W = 1200;
export const CANVAS_H = 680;
export const CELL = 60;

/** 2D SVG slots per project (component id -> top-left in canvas units). */
export const SLOTS_BY_PROJECT: Record<string, Record<string, { x: number; y: number }>> = {
  p0: {
    L: { x: 60, y: 80 },
    SW: { x: 340, y: 80 },
    B: { x: 620, y: 60 },
  },
  p1: {
    "3PS": { x: 30, y: 40 },
    MCB: { x: 280, y: 30 },
    L: { x: 540, y: 30 },
    STOP: { x: 710, y: 30 },
    "SB-F": { x: 880, y: 30 },
    "SB-R": { x: 880, y: 140 },
    OL: { x: 30, y: 270 },
    KM1: { x: 320, y: 260 },
    KM2: { x: 660, y: 260 },
    M: { x: 1010, y: 290 },
  },
  p2: {
    "3PS": { x: 30, y: 40 },
    MCB: { x: 280, y: 30 },
    L: { x: 540, y: 30 },
    STOP: { x: 710, y: 30 },
    START: { x: 880, y: 30 },
    T: { x: 710, y: 140 },
    OL: { x: 30, y: 270 },
    KM1: { x: 320, y: 260 },
    KM2: { x: 660, y: 260 },
    KM3: { x: 1000, y: 260 },
    M: { x: 680, y: 500 },
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
    "3PS": [-7.5, 0, -2],
    MCB: [-5.3, 0, -2],
    L: [-3.1, 0, -2],
    STOP: [-4.7, 0, 0.4],
    "SB-F": [-2.7, 0, 0.4],
    "SB-R": [-0.7, 0, 0.4],
    OL: [1.7, 0, 0.4],
    KM1: [-2.6, 0, 2.4],
    KM2: [0.4, 0, 2.4],
    M: [4.6, 0, 1.6],
  },
  p2: {
    "3PS": [-7.5, 0, -2],
    MCB: [-5.3, 0, -2],
    L: [-3.1, 0, -2],
    STOP: [-4.9, 0, 0.4],
    START: [-2.9, 0, 0.4],
    T: [-0.6, 0, 0.4],
    OL: [1.9, 0, 0.4],
    KM1: [-3.6, 0, 2.6],
    KM2: [-0.6, 0, 2.6],
    KM3: [2.4, 0, 2.6],
    M: [5.8, 0, 1.2],
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
    "POWER: L1/L2/L3 to the MCB line side (1,3,5).",
    "POWER: MCB load side (2,4,6) to KM1 line side AND KM2 line side.",
    "POWER: KM1 load side (2,4,6) to OL inputs 1L1,3L2,5L3.",
    "POWER: KM2 load side to the SAME OL inputs but with two phases SWAPPED (2->3L2, 4->1L1, 6->5L3).",
    "POWER: OL load side (2T1,4T2,6T3) to motor U1,V1,W1.",
    "CONTROL: L -> STOP(1), STOP(2) -> OL 95, OL 96 -> both start buttons.",
    "CONTROL: FORWARD out -> KM1 A1, also -> KM1 13; KM1 14 -> A1 (latch).",
    "CONTROL: REVERSE out -> KM2 A1, also -> KM2 13; KM2 14 -> A1 (latch).",
    "CONTROL: Cross interlocks - KM1 NC 22 -> reverse branch, KM2 NC 22 -> forward branch.",
    "CONTROL: Both A2 coils -> Neutral. Run, then hold FORWARD / REVERSE.",
  ],
  p2: [
    "POWER: L1/L2/L3 -> MCB (1,3,5); MCB (2,4,6) -> KM1 (1,3,5).",
    "POWER: KM1 (2,4,6) -> OL (1L1,3L2,5L3); OL (2T1,4T2,6T3) -> motor U1,V1,W1.",
    "POWER: winding ends U2,V2,W2 -> KM3 (1,3,5) for the STAR point.",
    "POWER: winding ends -> KM2 for DELTA: U2->KM2:1 with KM2:2->MCB:4, V2->KM2:3 with KM2:4->MCB:6, W2->KM2:5 with KM2:6->MCB:2.",
    "CONTROL: L -> STOP -> OL 95; OL 96 -> START.",
    "CONTROL: START out -> KM1 A1 + KM1 13 (latch via 14) and -> timer coil A1.",
    "CONTROL: STAR branch: START out -> timer 15 (NC) -> KM2 NC 22 -> KM3 A1.",
    "CONTROL: DELTA branch: timer NO 18 -> KM3 NC 22 -> KM2 A1.",
    "CONTROL: All A2 coils -> Neutral. Run, press START, watch STAR switch to DELTA after the timer delay.",
  ],
};
