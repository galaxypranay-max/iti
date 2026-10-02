import type { ProjectSpec } from "@/types";

/**
 * Forward-Reverse Jogging/Inching Control - ITI Electrician 2nd year (NIMI).
 * Power circuit: 3-ph supply -> MCB -> KM1/KM2 mains (KM2 swaps two phases)
 *                -> overload relay -> motor.
 * Control circuit: control L -> NC stop -> OL NC 95-96 -> start/jog branches
 *                -> coils (latched via own NO 13-14, cross-interlocked NC 21-22).
 * Terminal markings per standard contactor/OL labelling (A1-A2, 13-14, 21-22,
 * 1/3/5 - 2/4/6 mains, 1L1/2T1 etc., U1/V1/W1).
 */
export const forwardReverseJogging: ProjectSpec = {
  id: "p1",
  slug: "forward-reverse-jogging",
  title: "Forward-Reverse Jogging / Inching Control Circuit",
  section: "Motor Control - Contactors",
  shortDescription:
    "Full power + control circuit: run a 3-phase motor forward and reverse with two interlocked contactors, overload protection and jog (inching) operation.",
  objective:
    "Wire the POWER circuit (3-phase supply, MCB, two contactors, overload relay, motor) and the CONTROL circuit (stop, forward/reverse start buttons, latching and electrical interlocking) so the motor runs forward or reverse, and jogs while a direction button is held.",
  difficulty: "intermediate",
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
      id: "SB-F",
      kind: "push-button-no",
      name: "Forward Start / Jog Push Button (NO)",
      label: "FORWARD (NO, green)",
      size: { w: 2, h: 1 },
      terminals: [
        { id: "SB-F:1", label: "1", position: { x: 0, y: 0.5 } },
        { id: "SB-F:2", label: "2", position: { x: 1, y: 0.5 } },
      ],
    },
    {
      id: "SB-R",
      kind: "push-button-no",
      name: "Reverse Start / Jog Push Button (NO)",
      label: "REVERSE (NO, green)",
      size: { w: 2, h: 1 },
      terminals: [
        { id: "SB-R:1", label: "1", position: { x: 0, y: 0.5 } },
        { id: "SB-R:2", label: "2", position: { x: 1, y: 0.5 } },
      ],
    },
    {
      id: "KM1",
      kind: "contactor",
      name: "Forward Power Contactor",
      label: "KM1 FORWARD",
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
      name: "Reverse Power Contactor",
      label: "KM2 REVERSE",
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
        { id: "KM2:13", label: "13 (NO)", position: { x: 0.75, y: 0.3 } },
        { id: "KM2:14", label: "14 (NO)", position: { x: 0.95, y: 0.3 } },
        { id: "KM2:21", label: "21 (NC)", position: { x: 0.75, y: 0.65 } },
        { id: "KM2:22", label: "22 (NC)", position: { x: 0.95, y: 0.65 } },
      ],
      groups: [
        { title: "Power mains (1-2, 3-4, 5-6)", terminalIds: ["KM2:1", "KM2:2", "KM2:3", "KM2:4", "KM2:5", "KM2:6"] },
        { title: "Coil", terminalIds: ["KM2:A1", "KM2:A2"] },
        { title: "Auxiliary NO (13-14)", terminalIds: ["KM2:13", "KM2:14"] },
        { title: "Auxiliary NC (21-22)", terminalIds: ["KM2:21", "KM2:22"] },
      ],
    },
    {
      id: "M",
      kind: "motor",
      name: "3-Phase Induction Motor",
      label: "M 3~",
      size: { w: 2, h: 2 },
      terminals: [
        { id: "M:U1", label: "U1", position: { x: 0.2, y: 0 } },
        { id: "M:V1", label: "V1", position: { x: 0.5, y: 0 } },
        { id: "M:W1", label: "W1", position: { x: 0.8, y: 0 } },
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
    ["MCB:2", "KM2:1"],
    ["MCB:4", "KM2:3"],
    ["MCB:6", "KM2:5"],
    ["KM1:2", "OL:1L1"],
    ["KM1:4", "OL:3L2"],
    ["KM1:6", "OL:5L3"],
    ["KM2:2", "OL:3L2"],
    ["KM2:4", "OL:1L1"],
    ["KM2:6", "OL:5L3"],
    ["OL:2T1", "M:U1"],
    ["OL:4T2", "M:V1"],
    ["OL:6T3", "M:W1"],
    // CONTROL CIRCUIT (latch fed from OL:96; interlock NC before each button)
    ["L:phase", "STOP:1"],
    ["STOP:2", "OL:95"],
    ["OL:96", "KM2:21"],
    ["KM2:22", "SB-F:1"],
    ["SB-F:2", "KM1:A1"],
    ["KM2:22", "KM1:13"],
    ["KM1:14", "KM1:A1"],
    ["OL:96", "KM1:21"],
    ["KM1:22", "SB-R:1"],
    ["SB-R:2", "KM2:A1"],
    ["KM1:22", "KM2:13"],
    ["KM2:14", "KM2:A1"],
    ["KM1:A2", "L:neutral"],
    ["KM2:A2", "L:neutral"],
  ],
  controlLogic: {
    supply: { positive: "L:phase", negative: "L:neutral" },
    coils: ["KM1:A1", "KM2:A1"],
    auxContacts: [
      { terminalId: "KM1:13", controlsCoil: "KM1", state: "NO" },
      { terminalId: "KM2:13", controlsCoil: "KM2", state: "NO" },
      { terminalId: "KM1:21", controlsCoil: "KM2", state: "NC" },
      { terminalId: "KM2:21", controlsCoil: "KM1", state: "NC" },
    ],
    interlocks: [
      { from: "KM1", to: "KM2" },
      { from: "KM2", to: "KM1" },
    ],
    interlockWires: [
      ["OL:96", "KM2:21"],
      ["KM2:22", "SB-F:1"],
      ["KM2:22", "KM1:13"],
      ["OL:96", "KM1:21"],
      ["KM1:22", "SB-R:1"],
      ["KM1:22", "KM2:13"],
    ],
    overloadPath: ["L:phase", "STOP", "OL", "SB-F", "KM1"],
  },
  simulation: {
    steps: [
      { pressedButtons: ["SB-F"], expected: { KM1: true, KM2: false, M: "forward" } },
      { pressedButtons: ["SB-R"], expected: { KM1: false, KM2: true, M: "reverse" } },
      { pressedButtons: [], expected: { KM1: false, KM2: false, M: "stopped" } },
    ],
  },
  explanation:
    "The POWER circuit: L1/L2/L3 flow through the 3-pole MCB to the line side (1,3,5) of both contactors. KM1's load side (2,4,6) feeds the overload relay power terminals (1L1,3L2,5L3) in normal phase order; KM2's load side feeds the same OL inputs with TWO PHASES SWAPPED (2->3L2, 4->1L1) - this swap is what reverses the motor. OL load side (2T1,4T2,6T3) goes to motor U1,V1,W1. The CONTROL circuit: control L flows through the NC stop button and the OL NC contact (95-96). Pressing FORWARD energizes KM1's coil (A1) through KM2's NC interlock (22); KM1's own NO 13-14 then latches it. Pressing REVERSE works symmetrically through KM1's NC 22. Jogging/inching: holding a direction button without the latch keeps the motor running only while it is held.",
  workingPrinciple:
    "Control current flows from control L through the NC stop button, through the OL NC contact (95-96) into the selected branch. The forward branch passes KM2's NC interlock and the forward button to KM1 coil A1; A2 returns to neutral; KM1 pulls in, its NO 13-14 latches the coil and its MAIN contacts (1-2,3-4,5-6) close the power path so the motor runs forward. STOP breaks the control path and both contactors drop. Reversing is symmetric with two phases swapped through KM2. Both contactors can never energize together because each coil path contains the other contactor's NC auxiliary contact - the electrical interlock.",
  safetyNotes: [
    "Simulation only - real 415 V power wiring must be done under instructor supervision.",
    "Always switch OFF and isolate the supply before changing any real wire.",
    "Verify BOTH the electrical interlock and (where fitted) the mechanical interlock before the first real run.",
    "Set the overload relay to the motor's full-load current (nameplate FLA).",
    "The motor frame must be earthed in the real lab.",
  ],
  vivaQuestions: [
    {
      id: "v1",
      question: "Why is electrical interlocking necessary in a forward-reverse starter?",
      answer:
        "If KM1 and KM2 close together, two supply phases are connected to each other through the contactor poles, causing a phase-to-phase short circuit. Each contactor's NC auxiliary contact in the other's coil path makes simultaneous energization impossible.",
    },
    {
      id: "v2",
      question: "How does the motor reverse in this circuit?",
      answer:
        "By swapping any two of the three phases. Here KM2's load side (2,4,6) feeds the overload relay inputs with L1 and L2 interchanged, so the phase sequence at the motor reverses and it spins the other way.",
    },
    {
      id: "v3",
      question: "Which terminals on the contactor are the coil and which are the auxiliary contacts?",
      answer:
        "A1 and A2 are the coil terminals. 13-14 is the NO auxiliary contact and 21-22 is the NC auxiliary contact. The main power terminals are 1-2, 3-4 and 5-6.",
    },
    {
      id: "v4",
      question: "What is the difference between the power circuit and the control circuit?",
      answer:
        "The power circuit carries the motor current: supply, MCB, contactor main contacts, overload relay and motor. The control circuit carries only the small coil current: control supply, stop/start buttons, auxiliary contacts and the coils. The control circuit decides; the power circuit delivers.",
    },
    {
      id: "v5",
      question: "What happens if the overload relay trips?",
      answer:
        "The OL NC contact (95-96) opens, breaking the control supply to both coils, so both contactors drop out and the motor stops. The relay must be reset before restarting.",
    },
    {
      id: "v6",
      question: "Why must the STOP button be NC and not NO?",
      answer:
        "With an NC stop button, a broken or loose wire in the stop path fails safe - the circuit opens and the motor stops. A NO stop button would fail dangerously: a broken wire would make stopping impossible.",
    },
  ],
  scoring: [
    { name: "3-phase supply to MCB", points: 8, wires: [["3PS:L1", "MCB:1"], ["3PS:L2", "MCB:3"], ["3PS:L3", "MCB:5"]] },
    { name: "MCB to both contactor line sides (1,3,5)", points: 8, wires: [["MCB:2", "KM1:1"], ["MCB:4", "KM1:3"], ["MCB:6", "KM1:5"], ["MCB:2", "KM2:1"], ["MCB:4", "KM2:3"], ["MCB:6", "KM2:5"]] },
    { name: "KM1 load side to OL power inputs", points: 5, wires: [["KM1:2", "OL:1L1"], ["KM1:4", "OL:3L2"], ["KM1:6", "OL:5L3"]] },
    { name: "KM2 load side to OL with two phases swapped (reverse)", points: 8, wires: [["KM2:2", "OL:3L2"], ["KM2:4", "OL:1L1"], ["KM2:6", "OL:5L3"]] },
    { name: "OL load side to motor U1/V1/W1", points: 5, wires: [["OL:2T1", "M:U1"], ["OL:4T2", "M:V1"], ["OL:6T3", "M:W1"]] },
    { name: "Control supply wired", points: 4, wires: [["L:phase", "STOP:1"]] },
    { name: "Stop NC + Overload NC in control path", points: 6, wires: [["STOP:2", "OL:95"]] },
    { name: "Forward branch with interlock + latch", points: 12, wires: [["OL:96", "KM2:21"], ["KM2:22", "SB-F:1"], ["SB-F:2", "KM1:A1"], ["KM2:22", "KM1:13"], ["KM1:14", "KM1:A1"]] },
    { name: "Reverse branch with interlock + latch", points: 12, wires: [["OL:96", "KM1:21"], ["KM1:22", "SB-R:1"], ["SB-R:2", "KM2:A1"], ["KM1:22", "KM2:13"], ["KM2:14", "KM2:A1"]] },
    { name: "Electrical interlock both directions (NC cross-wiring)", points: 6, wires: [["KM2:22", "KM1:13"], ["KM1:22", "KM2:13"]] },
    { name: "Both coil returns to neutral", points: 4, wires: [["KM1:A2", "L:neutral"], ["KM2:A2", "L:neutral"]] },
    { name: "No invalid/unsafe connections", points: 12, noExtra: true },
  ],
};
