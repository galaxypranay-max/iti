import type { ProjectSpec } from "@/types";

/**
 * Semi-Automatic Star-Delta Starter - ITI Electrician 2nd year (NIMI).
 * Power: 3-ph supply -> MCB -> KM1 mains -> OL -> motor winding starts (U1,V1,W1).
 *        Winding ends (W2,U2,V2) -> KM2 (delta, cross-connected to lines)
 *        and -> KM3 (star, shorts the three ends).
 * Control: start latches KM1 + timer; timer NC 15-16 holds KM3 (star);
 *          after delay timer NO 15-18 pulls KM2 (delta) and KM3 drops.
 *          KM2/KM3 NC aux contacts interlock delta vs star.
 * Terminal markings: contactor mains 1/3/5 - 2/4/6, coil A1-A2, aux NO 13-14,
 * NC 21-22; timer coil A1-A2, timed contacts 15-16 (NC) / 15-18 (NO);
 * OL power 1L1/2T1 etc., aux NC 95-96; motor U1 V1 W1 - W2 U2 V2 (IEC 60034-8).
 */
export const starDeltaStarter: ProjectSpec = {
  id: "p2",
  slug: "star-delta-starter",
  title: "Semi-Automatic Star-Delta Starter",
  section: "Motor Control - Contactors",
  shortDescription:
    "Reduce starting current of a 3-phase motor: start in STAR, then a timer switches to DELTA automatically.",
  objective:
    "Wire the power circuit (supply, MCB, main contactor KM1, overload relay, motor with 6 terminals) and the control circuit (start/stop, on-delay timer, star contactor KM3, delta contactor KM2 with interlocks) so the motor starts in STAR and automatically changes to DELTA after the timer delay.",
  difficulty: "advanced",
  requiredComponents: [
    {
      id: "3PS",
      kind: "supply-3ph",
      name: "3-Phase Supply (415 V)",
      label: "3~ 415 V SUPPLY",
      size: { w: 3, h: 1.5 },
      terminals: [
        { id: "3PS:L1", label: "L1", position: { x: 0.2, y: 0 } },
        { id: "3PS:L2", label: "L2", position: { x: 0.5, y: 0 } },
        { id: "3PS:L3", label: "L3", position: { x: 0.8, y: 0 } },
      ],
    },
    {
      id: "MCB",
      kind: "mcb",
      name: "MCB 3-Pole (Motor Protection)",
      label: "MCB 3P",
      size: { w: 3, h: 2 },
      terminals: [
        { id: "MCB:1", label: "1", position: { x: 0.15, y: 0 } },
        { id: "MCB:3", label: "3", position: { x: 0.5, y: 0 } },
        { id: "MCB:5", label: "5", position: { x: 0.85, y: 0 } },
        { id: "MCB:2", label: "2", position: { x: 0.15, y: 1 } },
        { id: "MCB:4", label: "4", position: { x: 0.5, y: 1 } },
        { id: "MCB:6", label: "6", position: { x: 0.85, y: 1 } },
      ],
      groups: [
        { title: "Line side (in)", terminalIds: ["MCB:1", "MCB:3", "MCB:5"] },
        { title: "Load side (out)", terminalIds: ["MCB:2", "MCB:4", "MCB:6"] },
      ],
    },
    {
      id: "L",
      kind: "supply",
      name: "Control Supply (230 V)",
      label: "L / N (230 V)",
      size: { w: 2, h: 1 },
      terminals: [
        { id: "L:phase", label: "L (Phase)", position: { x: 0.3, y: 1 } },
        { id: "L:neutral", label: "N (Neutral)", position: { x: 0.7, y: 1 } },
      ],
    },
    {
      id: "STOP",
      kind: "push-button-nc",
      name: "Stop Push Button (NC)",
      label: "STOP (NC, red)",
      size: { w: 2, h: 1 },
      terminals: [
        { id: "STOP:1", label: "1", position: { x: 0, y: 0.5 } },
        { id: "STOP:2", label: "2", position: { x: 1, y: 0.5 } },
      ],
    },
    {
      id: "START",
      kind: "push-button-no",
      name: "Start Push Button (NO)",
      label: "START (NO, green)",
      size: { w: 2, h: 1 },
      terminals: [
        { id: "START:1", label: "1", position: { x: 0, y: 0.5 } },
        { id: "START:2", label: "2", position: { x: 1, y: 0.5 } },
      ],
    },
    {
      id: "T",
      kind: "timer",
      name: "On-Delay Timer",
      label: "T (on-delay)",
      size: { w: 3, h: 2 },
      terminals: [
        { id: "T:A1", label: "A1", position: { x: 0.2, y: 1 } },
        { id: "T:A2", label: "A2", position: { x: 0.45, y: 1 } },
        { id: "T:15", label: "15", position: { x: 0.15, y: 0 } },
        { id: "T:16", label: "16 (NC)", position: { x: 0.45, y: 0 } },
        { id: "T:18", label: "18 (NO)", position: { x: 0.8, y: 0 } },
      ],
      groups: [
        { title: "Timer coil", terminalIds: ["T:A1", "T:A2"] },
        { title: "Timed NC (opens after delay)", terminalIds: ["T:15", "T:16"] },
        { title: "Timed NO (closes after delay)", terminalIds: ["T:15", "T:18"] },
      ],
    },
    {
      id: "OL",
      kind: "overload",
      name: "Overload Relay",
      label: "OL (thermal)",
      size: { w: 3.5, h: 2.5 },
      terminals: [
        { id: "OL:1L1", label: "1L1", position: { x: 0.1, y: 0 } },
        { id: "OL:3L2", label: "3L2", position: { x: 0.35, y: 0 } },
        { id: "OL:5L3", label: "5L3", position: { x: 0.6, y: 0 } },
        { id: "OL:2T1", label: "2T1", position: { x: 0.1, y: 1 } },
        { id: "OL:4T2", label: "4T2", position: { x: 0.35, y: 1 } },
        { id: "OL:6T3", label: "6T3", position: { x: 0.6, y: 1 } },
        { id: "OL:95", label: "95 (NC)", position: { x: 0.85, y: 0.3 } },
        { id: "OL:96", label: "96 (NC)", position: { x: 0.85, y: 0.75 } },
      ],
      groups: [
        { title: "Power (3-phase)", terminalIds: ["OL:1L1", "OL:3L2", "OL:5L3", "OL:2T1", "OL:4T2", "OL:6T3"] },
        { title: "Auxiliary NC", terminalIds: ["OL:95", "OL:96"] },
      ],
    },
    {
      id: "KM1",
      kind: "contactor",
      name: "Main Contactor (KM1)",
      label: "KM1 MAIN",
      size: { w: 4, h: 2.5 },
      terminals: [
        { id: "KM1:1", label: "1", position: { x: 0.1, y: 0 } },
        { id: "KM1:3", label: "3", position: { x: 0.3, y: 0 } },
        { id: "KM1:5", label: "5", position: { x: 0.5, y: 0 } },
        { id: "KM1:2", label: "2", position: { x: 0.1, y: 1 } },
        { id: "KM1:4", label: "4", position: { x: 0.3, y: 1 } },
        { id: "KM1:6", label: "6", position: { x: 0.5, y: 1 } },
        { id: "KM1:A1", label: "A1", position: { x: 0.75, y: 1 } },
        { id: "KM1:A2", label: "A2", position: { x: 0.95, y: 1 } },
        { id: "KM1:13", label: "13 (NO)", position: { x: 0.75, y: 0.3 } },
        { id: "KM1:14", label: "14 (NO)", position: { x: 0.95, y: 0.3 } },
        { id: "KM1:21", label: "21 (NC)", position: { x: 0.75, y: 0.65 } },
        { id: "KM1:22", label: "22 (NC)", position: { x: 0.95, y: 0.65 } },
      ],
      groups: [
        { title: "Power mains (1-2, 3-4, 5-6)", terminalIds: ["KM1:1", "KM1:2", "KM1:3", "KM1:4", "KM1:5", "KM1:6"] },
        { title: "Coil", terminalIds: ["KM1:A1", "KM1:A2"] },
        { title: "Auxiliary NO (13-14)", terminalIds: ["KM1:13", "KM1:14"] },
        { title: "Auxiliary NC (21-22)", terminalIds: ["KM1:21", "KM1:22"] },
      ],
    },
    {
      id: "KM2",
      kind: "contactor",
      name: "Delta Contactor (KM2)",
      label: "KM2 DELTA",
      size: { w: 4, h: 2.5 },
      terminals: [
        { id: "KM2:1", label: "1", position: { x: 0.1, y: 0 } },
        { id: "KM2:3", label: "3", position: { x: 0.3, y: 0 } },
        { id: "KM2:5", label: "5", position: { x: 0.5, y: 0 } },
        { id: "KM2:2", label: "2", position: { x: 0.1, y: 1 } },
        { id: "KM2:4", label: "4", position: { x: 0.3, y: 1 } },
        { id: "KM2:6", label: "6", position: { x: 0.5, y: 1 } },
        { id: "KM2:A1", label: "A1", position: { x: 0.75, y: 1 } },
        { id: "KM2:A2", label: "A2", position: { x: 0.95, y: 1 } },
        { id: "KM2:21", label: "21 (NC)", position: { x: 0.75, y: 0.5 } },
        { id: "KM2:22", label: "22 (NC)", position: { x: 0.95, y: 0.5 } },
      ],
      groups: [
        { title: "Power mains (1-2, 3-4, 5-6)", terminalIds: ["KM2:1", "KM2:2", "KM2:3", "KM2:4", "KM2:5", "KM2:6"] },
        { title: "Coil", terminalIds: ["KM2:A1", "KM2:A2"] },
        { title: "Auxiliary NC (21-22)", terminalIds: ["KM2:21", "KM2:22"] },
      ],
    },
    {
      id: "KM3",
      kind: "contactor",
      starPoint: true,
      name: "Star Contactor (KM3) - shorts winding ends",
      label: "KM3 STAR",
      size: { w: 4, h: 2.5 },
      terminals: [
        { id: "KM3:1", label: "1", position: { x: 0.1, y: 0 } },
        { id: "KM3:3", label: "3", position: { x: 0.3, y: 0 } },
        { id: "KM3:5", label: "5", position: { x: 0.5, y: 0 } },
        { id: "KM3:2", label: "2", position: { x: 0.1, y: 1 } },
        { id: "KM3:4", label: "4", position: { x: 0.3, y: 1 } },
        { id: "KM3:6", label: "6", position: { x: 0.5, y: 1 } },
        { id: "KM3:A1", label: "A1", position: { x: 0.75, y: 1 } },
        { id: "KM3:A2", label: "A2", position: { x: 0.95, y: 1 } },
        { id: "KM3:21", label: "21 (NC)", position: { x: 0.75, y: 0.5 } },
        { id: "KM3:22", label: "22 (NC)", position: { x: 0.95, y: 0.5 } },
      ],
      groups: [
        { title: "Power mains (1-2, 3-4, 5-6) - 2/4/6 join as star point", terminalIds: ["KM3:1", "KM3:2", "KM3:3", "KM3:4", "KM3:5", "KM3:6"] },
        { title: "Coil", terminalIds: ["KM3:A1", "KM3:A2"] },
        { title: "Auxiliary NC (21-22)", terminalIds: ["KM3:21", "KM3:22"] },
      ],
    },
    {
      id: "M",
      kind: "motor",
      name: "3-Phase Induction Motor (6 terminals)",
      label: "M 3~ star-delta",
      size: { w: 2.5, h: 2.5 },
      terminals: [
        { id: "M:U1", label: "U1", position: { x: 0.15, y: 0 } },
        { id: "M:V1", label: "V1", position: { x: 0.45, y: 0 } },
        { id: "M:W1", label: "W1", position: { x: 0.75, y: 0 } },
        { id: "M:W2", label: "W2", position: { x: 0.15, y: 1 } },
        { id: "M:U2", label: "U2", position: { x: 0.45, y: 1 } },
        { id: "M:V2", label: "V2", position: { x: 0.75, y: 1 } },
      ],
    },
  ],
  expectedWires: [
    // POWER CIRCUIT
    ["3PS:L1", "MCB:1"],
    ["3PS:L2", "MCB:3"],
    ["3PS:L3", "MCB:5"],
    ["MCB:2", "KM1:1"],
    ["MCB:4", "KM1:3"],
    ["MCB:6", "KM1:5"],
    ["KM1:2", "OL:1L1"],
    ["KM1:4", "OL:3L2"],
    ["KM1:6", "OL:5L3"],
    ["OL:2T1", "M:U1"],
    ["OL:4T2", "M:V1"],
    ["OL:6T3", "M:W1"],
    // Winding ends to DELTA contactor (cross-connected to lines for delta)
    ["M:U2", "KM2:1"],
    ["KM2:2", "MCB:4"],
    ["M:V2", "KM2:3"],
    ["KM2:4", "MCB:6"],
    ["M:W2", "KM2:5"],
    ["KM2:6", "MCB:2"],
    // Winding ends to STAR contactor
    ["M:U2", "KM3:1"],
    ["M:V2", "KM3:3"],
    ["M:W2", "KM3:5"],
    // CONTROL CIRCUIT
    ["L:phase", "STOP:1"],
    ["STOP:2", "OL:95"],
    ["OL:96", "START:1"],
    ["START:2", "KM1:A1"],
    ["OL:96", "KM1:13"],
    ["KM1:14", "START:2"],
    ["START:2", "T:A1"],
    ["START:2", "T:15"],
    ["T:16", "KM2:21"],
    ["KM2:22", "KM3:A1"],
    ["T:18", "KM3:21"],
    ["KM3:22", "KM2:A1"],
    ["KM1:A2", "L:neutral"],
    ["KM2:A2", "L:neutral"],
    ["KM3:A2", "L:neutral"],
    ["T:A2", "L:neutral"],
  ],
  controlLogic: {
    supply: { positive: "L:phase", negative: "L:neutral" },
    coils: ["KM1:A1", "KM2:A1", "KM3:A1", "T:A1"],
    auxContacts: [
      { terminalId: "KM1:13", controlsCoil: "KM1", state: "NO" },
      { terminalId: "KM2:21", controlsCoil: "KM3", state: "NC" },
      { terminalId: "KM3:21", controlsCoil: "KM2", state: "NC" },
    ],
    interlocks: [
      { from: "KM2", to: "KM3" },
      { from: "KM3", to: "KM2" },
    ],
    interlockWires: [
      ["T:16", "KM2:21"],
      ["KM2:22", "KM3:A1"],
      ["T:18", "KM3:21"],
      ["KM3:22", "KM2:A1"],
    ],
    overloadPath: ["L:phase", "STOP", "OL", "START", "KM1"],
  },
  simulation: {
    steps: [
      { pressedButtons: ["START"], expected: { KM1: true, KM3: true, KM2: false, M: "forward-star" } },
      { pressedButtons: [], expected: { KM1: true, KM3: false, KM2: true, M: "forward-delta" } },
      { pressedButtons: [], expected: { KM1: false, KM2: false, KM3: false, M: "stopped" } },
    ],
  },
  explanation:
    "Pressing START energizes the main contactor KM1 (latched by its own NO 13-14) and the on-delay timer coil. While the timer is running, its timed NC contact (15-16) is still closed, so the STAR contactor KM3 is energized through KM2's NC interlock (22) - the motor winding ends U2/V2/W2 are shorted by KM3 and the motor runs in STAR with reduced starting current. When the timer delays out, the timed NC opens (KM3 drops) and the timed NO (15-18) closes, energizing KM2 (delta) through KM3's NC interlock - the windings now get full line voltage in DELTA for normal running.",
  workingPrinciple:
    "In STAR, each winding gets line voltage / root-3 (about 58%), so the starting current and torque drop to about one-third - ideal for starting a motor under light load. After the set delay the timer swaps KM3 out and KM2 in. In DELTA each winding gets the full line voltage. KM2 and KM3 NC auxiliary contacts (21-22) are cross-wired into each other's coil paths so star and delta can never close together - closing both would short the supply. STOP de-energizes everything.",
  safetyNotes: [
    "Simulation only - real 415 V star-delta wiring must be done under instructor supervision.",
    "Verify the star/delta interlock before the first real run - closing KM2 and KM3 together is a dead short.",
    "Set the timer to the motor's recommended star-period (typically 5-10 seconds).",
    "Set the overload relay to the motor's full-load current (nameplate FLA).",
  ],
  vivaQuestions: [
    {
      id: "v1",
      question: "Why do we start a motor in star-delta?",
      answer:
        "In star, the winding voltage is line voltage / root 3 (about 58%), so the starting current drops to about one-third of the direct-delta value. This reduces supply dip, heating and mechanical stress. Once the motor speeds up, delta gives full voltage for normal running.",
    },
    {
      id: "v2",
      question: "What happens if KM2 (delta) and KM3 (star) close together?",
      answer:
        "The supply is short-circuited through the contactor poles - the interlocks (each contactor's NC 21-22 in the other's coil path) must make this impossible. Closing both is one of the most dangerous faults in a star-delta panel.",
    },
    {
      id: "v3",
      question: "What is the difference between an on-delay timer's 15-16 and 15-18 contacts?",
      answer:
        "15-16 is the timed NC contact: closed until the delay elapses, then opens. 15-18 is the timed NO contact: open until the delay elapses, then closes. In this circuit 15-16 holds the star contactor and 15-18 pulls in the delta contactor.",
    },
    {
      id: "v4",
      question: "How are the motor's six terminals connected in star and in delta?",
      answer:
        "The winding starts U1, V1, W1 always receive the lines. In STAR the winding ends W2, U2, V2 are shorted together by KM3. In DELTA, KM2 cross-connects the ends to the other lines: U2 to L2's line, V2 to L3's line, W2 to L1's line.",
    },
    {
      id: "v5",
      question: "Where does the overload relay sit and what does it protect?",
      answer:
        "Its power poles (1L1/2T1 etc.) sit between the main contactor KM1 and the motor, so it carries the motor current in both star and delta. Its NC contact (95-96) sits in the control circuit and trips the starter on overload.",
    },
  ],
  scoring: [
    { name: "3-phase supply to MCB", points: 5, wires: [["3PS:L1", "MCB:1"], ["3PS:L2", "MCB:3"], ["3PS:L3", "MCB:5"]] },
    { name: "MCB to KM1 line side", points: 5, wires: [["MCB:2", "KM1:1"], ["MCB:4", "KM1:3"], ["MCB:6", "KM1:5"]] },
    { name: "KM1 load side to OL power inputs", points: 5, wires: [["KM1:2", "OL:1L1"], ["KM1:4", "OL:3L2"], ["KM1:6", "OL:5L3"]] },
    { name: "OL load side to motor U1/V1/W1", points: 5, wires: [["OL:2T1", "M:U1"], ["OL:4T2", "M:V1"], ["OL:6T3", "M:W1"]] },
    { name: "Winding ends to delta contactor (cross-connected)", points: 10, wires: [["M:U2", "KM2:1"], ["KM2:2", "MCB:4"], ["M:V2", "KM2:3"], ["KM2:4", "MCB:6"], ["M:W2", "KM2:5"], ["KM2:6", "MCB:2"]] },
    { name: "Winding ends to star contactor", points: 5, wires: [["M:U2", "KM3:1"], ["M:V2", "KM3:3"], ["M:W2", "KM3:5"]] },
    { name: "Control: Stop NC + OL NC + Start path", points: 8, wires: [["L:phase", "STOP:1"], ["STOP:2", "OL:95"], ["OL:96", "START:1"]] },
    { name: "KM1 coil with latch (NO 13-14)", points: 8, wires: [["START:2", "KM1:A1"], ["OL:96", "KM1:13"], ["KM1:14", "START:2"]] },
    { name: "Timer coil fed from start", points: 4, wires: [["START:2", "T:A1"]] },
    { name: "Star branch: timer NC 15-16 via KM2 NC interlock", points: 10, wires: [["START:2", "T:15"], ["T:16", "KM2:21"], ["KM2:22", "KM3:A1"]] },
    { name: "Delta branch: timer NO 15-18 via KM3 NC interlock", points: 10, wires: [["T:18", "KM3:21"], ["KM3:22", "KM2:A1"]] },
    { name: "All coil returns to neutral", points: 5, wires: [["KM1:A2", "L:neutral"], ["KM2:A2", "L:neutral"], ["KM3:A2", "L:neutral"], ["T:A2", "L:neutral"]] },
    { name: "No invalid/unsafe connections", points: 20, noExtra: true },
  ],
};
