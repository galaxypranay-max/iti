import type { ProjectSpec } from "@/types";

/**
 * Project registry - data-driven per PRD.
 * Only syllabus-approved practicals are listed here.
 */
export const projects: ProjectSpec[] = [

  {
    id: "p0",
    slug: "bulb-on-off",
    title: "Bulb On/Off Control Circuit",
    shortDescription:
      "The simplest control circuit: wire a bulb with a switch so you can turn it ON and OFF from the supply.",
    objective:
      "Connect the control supply to a bulb through a single switch. Turning the switch ON completes the circuit and the bulb glows; turning it OFF breaks the circuit and the bulb goes dark. Learn how a switch makes and breaks a circuit.",
    difficulty: "beginner",
    requiredComponents: [
      {
        id: "L",
        kind: "supply",
        name: "Control Supply",
        label: "L / N (230 V)",
        size: { w: 2, h: 1 },
        terminals: [
          { id: "L:phase", label: "L (Phase)", position: { x: 0.3, y: 1 } },
          { id: "L:neutral", label: "N (Neutral)", position: { x: 0.7, y: 1 } },
        ],
      },
      {
        id: "SW",
        kind: "switch",
        name: "Single-Pole Switch",
        label: "SW (SPST)",
        size: { w: 2, h: 1 },
        terminals: [
          { id: "SW:1", label: "1", position: { x: 0, y: 0.5 } },
          { id: "SW:2", label: "2", position: { x: 1, y: 0.5 } },
        ],
      },
      {
        id: "B",
        kind: "bulb",
        name: "Indicator Bulb with Holder",
        label: "BULB (230 V)",
        size: { w: 2, h: 2 },
        terminals: [
          { id: "B:1", label: "1", position: { x: 0.3, y: 0 } },
          { id: "B:2", label: "2", position: { x: 0.7, y: 0 } },
        ],
      },
    ],
    expectedWires: [
      ["L:phase", "SW:1"],
      ["SW:2", "B:1"],
      ["B:2", "L:neutral"],
    ],
    controlLogic: {
      supply: { positive: "L:phase", negative: "L:neutral" },
      coils: [],
      auxContacts: [],
      interlocks: [],
      overloadPath: [],
    },
    simulation: {
      steps: [
        { pressedButtons: [], expected: { SW: "off", B: "dark" } },
        { pressedButtons: [], expected: { SW: "on", B: "glowing" } },
      ],
    },
    explanation:
      "This is the first circuit every electrician learns. Phase (L) goes to the switch; the other side of the switch goes to the bulb; the bulb returns to Neutral (N). The switch simply makes and breaks the phase path. With the switch closed, current flows through the bulb filament and it glows. With the switch open, the path is broken and no current flows. The switch is always placed on the PHASE wire, never on neutral - that way the bulb holder is dead when the switch is off.",
    workingPrinciple:
      "A bulb glows when current passes through its filament. Current needs a complete (closed) path from Phase to Neutral. The switch is connected in SERIES on the phase wire. Closed switch = complete path = bulb ON. Open switch = broken path = bulb OFF. If any wire of the three is missing, the path is incomplete and the bulb stays dark.",
    safetyNotes: [
      "Simulation only - real 230 V wiring must be done under instructor supervision.",
      "Always switch OFF and isolate the supply before changing any real wire.",
      "The switch must always be on the PHASE wire so the bulb holder is safe when off.",
      "Use a fuse or MCB in the phase wire for protection.",
    ],
    vivaQuestions: [
      {
        id: "v1",
        question: "Why is the switch connected on the phase wire and not on the neutral?",
        answer:
          "If the switch were on the neutral, the bulb would be OFF but the bulb holder would still be connected to phase - touching it could give a shock. With the switch on the phase wire, turning it off makes the holder dead and safe.",
      },
      {
        id: "v2",
        question: "What is a series circuit?",
        answer:
          "Components connected one after another so the same current flows through all of them. In this practical, supply, switch and bulb are in series: if any one breaks, current stops everywhere.",
      },
      {
        id: "v3",
        question: "The bulb does not glow even though the switch is ON. What could be wrong?",
        answer:
          "Any break in the path: a missing or loose wire (L to switch, switch to bulb, or bulb to neutral), a broken filament, or a fault in the supply. Check the connections one by one - exactly what the Check button helps you do here.",
      },
      {
        id: "v4",
        question: "What happens if we connect Phase directly to Neutral without a load?",
        answer:
          "It is a dead short circuit - very high current flows, which can burn wires and cause fire. Protection (fuse/MCB) must trip immediately. Never do this in the lab.",
      },
    ],
    scoring: [
      { name: "Phase to switch connection", points: 25, wires: [["L:phase", "SW:1"]] },
      { name: "Switch to bulb connection", points: 25, wires: [["SW:2", "B:1"]] },
      { name: "Bulb return to neutral", points: 25, wires: [["B:2", "L:neutral"]] },
      { name: "No invalid/unsafe connections", points: 25, noExtra: true },
    ],
  },

  {
    id: "p1",
    slug: "forward-reverse-jogging",
    title: "Forward-Reverse Jogging / Inching Control Circuit",
    shortDescription:
      "Run a 3-phase motor forward and reverse with two interlocked contactors, plus jog (inching) operation in both directions.",
    objective:
      "Wire a control circuit with two power contactors so the motor runs forward or reverse (latched), and can be jogged (inched) in either direction. The circuit must include electrical interlocking between the two contactors and overload protection in the control path.",
    difficulty: "intermediate",
    requiredComponents: [
      {
        id: "L",
        kind: "supply",
        name: "Control Supply",
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
        name: "Overload Relay (NC contact)",
        label: "OL 95-96 (NC)",
        size: { w: 2, h: 1 },
        terminals: [
          { id: "OL:95", label: "95", position: { x: 0, y: 0.5 } },
          { id: "OL:96", label: "96", position: { x: 1, y: 0.5 } },
        ],
      },
      {
        id: "SB-F",
        kind: "push-button-no",
        name: "Forward Start Push Button (NO)",
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
        name: "Reverse Start Push Button (NO)",
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
        size: { w: 3, h: 2 },
        terminals: [
          { id: "KM1:A1", label: "A1", position: { x: 0.25, y: 1 } },
          { id: "KM1:A2", label: "A2", position: { x: 0.75, y: 1 } },
          { id: "KM1:13", label: "13 (NO)", position: { x: 0, y: 0.25 }, contact: "NO" },
          { id: "KM1:14", label: "14 (NO)", position: { x: 1, y: 0.25 }, contact: "NO" },
          { id: "KM1:21", label: "21 (NC)", position: { x: 0, y: 0.75 }, contact: "NC" },
          { id: "KM1:22", label: "22 (NC)", position: { x: 1, y: 0.75 }, contact: "NC" },
        ],
      },
      {
        id: "KM2",
        kind: "contactor",
        name: "Reverse Power Contactor",
        label: "KM2 REVERSE",
        size: { w: 3, h: 2 },
        terminals: [
          { id: "KM2:A1", label: "A1", position: { x: 0.25, y: 1 } },
          { id: "KM2:A2", label: "A2", position: { x: 0.75, y: 1 } },
          { id: "KM2:13", label: "13 (NO)", position: { x: 0, y: 0.25 }, contact: "NO" },
          { id: "KM2:14", label: "14 (NO)", position: { x: 1, y: 0.25 }, contact: "NO" },
          { id: "KM2:21", label: "21 (NC)", position: { x: 0, y: 0.75 }, contact: "NC" },
          { id: "KM2:22", label: "22 (NC)", position: { x: 1, y: 0.75 }, contact: "NC" },
        ],
      },
      {
        id: "M",
        kind: "motor",
        name: "3-Phase Induction Motor",
        label: "M 3~",
        size: { w: 2, h: 2 },
        terminals: [
          { id: "M:U", label: "U", position: { x: 0.2, y: 0 } },
          { id: "M:V", label: "V", position: { x: 0.5, y: 0 } },
          { id: "M:W", label: "W", position: { x: 0.8, y: 0 } },
        ],
      },
    ],
    expectedWires: [
      ["L:phase", "STOP:1"],
      ["STOP:2", "OL:95"],
      ["OL:96", "SB-F:1"],
      ["OL:96", "SB-R:1"],
      ["SB-F:2", "KM1:A1"],
      ["SB-F:2", "KM1:13"],
      ["KM1:14", "KM1:A1"],
      ["SB-R:2", "KM2:A1"],
      ["SB-R:2", "KM2:13"],
      ["KM2:14", "KM2:A1"],
      ["KM1:22", "SB-R:2"],
      ["KM2:22", "SB-F:2"],
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
      "Pressing FORWARD energizes KM1 through the NC stop button and NC overload contact. KM1's NO auxiliary contact (13-14) closes and latches the coil after the button is released. The NC contact of KM2 (21-22) sits in KM1's coil path (and vice versa) so both contactors can never pull in together - this is the electrical interlock that prevents a phase-to-phase short at the motor. Jogging/inching is done by holding the start button only momentarily without the latch path: the motor runs only as long as the button is held.",
    workingPrinciple:
      "Control current flows from phase L through the NC stop button, through the NC overload contact (95-96), and then into the selected branch. In the forward branch, current passes KM2's interlock NC (closed while KM2 is off) and the forward start button to reach coil A1; A2 returns to neutral. Once KM1 pulls in, its own NO 13-14 contact parallels the start button and holds the coil energized - the latch. Pressing STOP breaks the supply path and both contactors drop out. Reversing works symmetrically through KM2 with KM1's interlock NC in its path. Jog/inching removes or bypasses the latch so the contactor follows the button exactly.",
    safetyNotes: [
      "Simulation only - real 230/415 V wiring must be done under instructor supervision.",
      "Always switch OFF and isolate the supply before changing any real wire.",
      "Verify the electrical interlock with a continuity test before the first real run.",
      "Where specified, mechanical interlocking must also be fitted between the two contactors.",
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
        question: "What is the difference between jogging and inching?",
        answer:
          "Both make the motor run only while the button is held. Jogging typically uses a jogging relay/selector to bypass the latch for quick starts; inching uses reduced voltage or short button taps for very small movements. In practice the terms are often used interchangeably.",
      },
      {
        id: "v3",
        question: "Which terminals on the contactor are the coil and which are the auxiliary contacts?",
        answer:
          "A1 and A2 are the coil terminals. 13-14 is the NO auxiliary contact and 21-22 is the NC auxiliary contact (standard contactor marking).",
      },
      {
        id: "v4",
        question: "What happens if the overload relay trips?",
        answer:
          "The OL NC contact (95-96) opens, breaking the control supply to both coils, so both contactors drop out and the motor stops. The relay must be reset before restarting.",
      },
      {
        id: "v5",
        question: "Why must the STOP button be NC and not NO?",
        answer:
          "With an NC stop button, a broken/loose wire in the stop path fails safe - the circuit opens and the motor stops. A NO stop button would fail dangerously: a broken wire would make stopping impossible.",
      },
    ],
    scoring: [
      { name: "Stop button NC in supply path", points: 15, wires: [["L:phase", "STOP:1"], ["STOP:2", "OL:95"]] },
      { name: "Overload NC contact in control path", points: 15, wires: [["OL:96", "SB-F:1"], ["OL:96", "SB-R:1"]] },
      { name: "Forward branch complete with latch (NO 13-14)", points: 15, wires: [["SB-F:2", "KM1:A1"], ["SB-F:2", "KM1:13"], ["KM1:14", "KM1:A1"]] },
      { name: "Reverse branch complete with latch (NO 13-14)", points: 15, wires: [["SB-R:2", "KM2:A1"], ["SB-R:2", "KM2:13"], ["KM2:14", "KM2:A1"]] },
      { name: "Electrical interlock both directions (NC cross-wiring)", points: 20, wires: [["KM1:22", "SB-R:2"], ["KM2:22", "SB-F:2"]] },
      { name: "Both coil returns to neutral", points: 10, wires: [["KM1:A2", "L:neutral"], ["KM2:A2", "L:neutral"]] },
      { name: "No invalid/unsafe connections", points: 10, noExtra: true },
    ],
  },
];

export function getProjectBySlug(slug: string): ProjectSpec | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getProjectSlugs(): string[] {
  return projects.map((p) => p.slug);
}
