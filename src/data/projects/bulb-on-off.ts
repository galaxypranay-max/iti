import type { ProjectSpec } from "@/types";

export const bulbOnOff: ProjectSpec = {
  id: "p0",
  slug: "bulb-on-off",
  title: "Bulb On/Off Control Circuit",
  section: "Basic Wiring Skills",
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
};
