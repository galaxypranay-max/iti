import type { ProjectSpec } from "@/types";

/**
 * Deterministic electrical rule engine (BRAIN - Deterministic Layer).
 * Current flows THROUGH components (internal conduction edges) and along wires.
 * AI never overrides anything computed here.
 */

export interface Wire {
  id: string;
  from: string; // terminal id "COMP:term"
  to: string;
}

export interface Fault {
  id: string;
  category:
    | "short-circuit"
    | "missing-wire"
    | "unexpected-wire"
    | "missing-interlock"
    | "coil-not-connected"
    | "expected-state-not-reached";
  message: string;
  /** terminal ids to highlight in the UI */
  highlight: string[];
}

export interface SimResult {
  coils: Record<string, boolean>; // energized contactors
  lamps: Record<string, boolean>; // glowing bulbs
  motor: "forward" | "reverse" | "stopped";
  energized: Set<string>; // terminals at phase potential
  faults: Fault[];
  controlSequence: string[];
  powered: boolean;
}

export function splitTerminal(id: string): [string, string] {
  const i = id.indexOf(":");
  return i === -1 ? [id, ""] : [id.slice(0, i), id.slice(i + 1)];
}

export function wireKey(a: string, b: string): string {
  return [a, b].sort().join("|");
}

function coilReturn(project: ProjectSpec, coilId: string): string {
  const spec = project.requiredComponents.find((c) => c.id === coilId);
  const a2 = spec?.terminals.find((t) => t.label === "A2");
  return a2?.id ?? coilId + ":A2";
}

export function simulate(
  project: ProjectSpec,
  wires: Wire[],
  pressed: Set<string>,
  switchesOn: Set<string> = new Set(),
  initialCoils?: Record<string, boolean>,
): SimResult {
  const coilIds = [...new Set(project.controlLogic.coils.map((t) => splitTerminal(t)[0]))];
  const { positive, negative } = project.controlLogic.supply;

  const coils: Record<string, boolean> = {};
  for (const c of coilIds) coils[c] = initialCoils?.[c] ?? false;

  const neighbors = new Map<
    string,
    { node: string; owner: string; conducts: (s: Record<string, boolean>) => boolean }[]
  >();
  function addEdge(
    a: string,
    b: string,
    owner: string,
    conducts: (s: Record<string, boolean>) => boolean,
  ) {
    if (!neighbors.has(a)) neighbors.set(a, []);
    if (!neighbors.has(b)) neighbors.set(b, []);
    neighbors.get(a)!.push({ node: b, owner, conducts });
    neighbors.get(b)!.push({ node: a, owner, conducts });
  }

  for (const w of wires) addEdge(w.from, w.to, "__wire", () => true);

  for (const c of project.requiredComponents) {
    const t = (label: string) => c.terminals.find((x) => x.label === label)?.id;
    if (c.kind === "push-button-no" && c.terminals.length === 2) {
      addEdge(c.terminals[0].id, c.terminals[1].id, c.id, () => pressed.has(c.id));
    } else if (c.kind === "push-button-nc" && c.terminals.length === 2) {
      addEdge(c.terminals[0].id, c.terminals[1].id, c.id, () => !pressed.has(c.id));
    } else if (c.kind === "switch" && c.terminals.length === 2) {
      addEdge(c.terminals[0].id, c.terminals[1].id, c.id, () => switchesOn.has(c.id));
    } else if (c.kind === "overload" && c.terminals.length === 2) {
      addEdge(c.terminals[0].id, c.terminals[1].id, c.id, () => true); // healthy
    } else if (c.kind === "bulb" && c.terminals.length === 2) {
      const onKey = "__lamp_" + c.id;
      addEdge(c.terminals[0].id, c.terminals[1].id, c.id, (s) => !!s[onKey]);
    } else if (c.kind === "contactor") {
      const a1 = t("A1"), a2 = t("A2");
      const n13 = t("13 (NO)"), n14 = t("14 (NO)");
      const n21 = t("21 (NC)"), n22 = t("22 (NC)");
      if (a1 && a2) addEdge(a1, a2, c.id, () => !!coils[c.id]);
      if (n13 && n14) addEdge(n13, n14, c.id, () => !!coils[c.id]);
      if (n21 && n22) addEdge(n21, n22, c.id, () => !coils[c.id]);
    }
  }

  function reachable(start: string, goal: string, excludeOwner: string | null): boolean {
    const visited = new Set<string>([start]);
    const queue = [start];
    while (queue.length) {
      const cur = queue.shift()!;
      if (cur === goal) return true;
      for (const n of neighbors.get(cur) ?? []) {
        if (visited.has(n.node)) continue;
        if (n.owner === excludeOwner) continue; // element under test cannot shortcut itself
        if (!n.conducts(coils)) continue;
        visited.add(n.node);
        queue.push(n.node);
      }
    }
    return false;
  }

  // 1. Coil fixed point (latch: coil state changes its own NO/NC edges)
  for (let iter = 0; iter < 10; iter++) {
    let changed = false;
    for (const c of coilIds) {
      const a1 = project.controlLogic.coils.find((t) => splitTerminal(t)[0] === c)!;
      const a2 = coilReturn(project, c);
      const on = reachable(positive, a1, c) && reachable(a2, negative, c);
      if (on !== coils[c]) {
        coils[c] = on;
        changed = true;
      }
    }
    if (!changed) break;
  }

  // 2. Lamps: current flows phase -> terminalA and terminalB -> neutral (lamp edge excluded)
  const lamps: Record<string, boolean> = {};
  for (const c of project.requiredComponents) {
    if (c.kind !== "bulb" || c.terminals.length !== 2) continue;
    const ta = c.terminals[0].id;
    const tb = c.terminals[1].id;
    const on = reachable(positive, ta, c.id) && reachable(tb, negative, c.id);
    lamps[c.id] = on;
    coils["__lamp_" + c.id] = on;
  }

  // 3. Energized terminals: BFS from phase; current passes through energized loads/coils
  const energized = new Set<string>();
  {
    const visited = new Set<string>([positive]);
    const queue = [positive];
    while (queue.length) {
      const cur = queue.shift()!;
      energized.add(cur);
      for (const n of neighbors.get(cur) ?? []) {
        if (visited.has(n.node)) continue;
        if (n.owner !== "__wire" && !n.conducts(coils)) continue;
        visited.add(n.node);
        queue.push(n.node);
      }
    }
  }

  // 4. Motor state (only when the project has KM1/KM2)
  let motor: SimResult["motor"] = "stopped";
  if (coilIds.includes("KM1") && coilIds.includes("KM2")) {
    if (coils["KM1"] && !coils["KM2"]) motor = "forward";
    else if (coils["KM2"] && !coils["KM1"]) motor = "reverse";
  }

  const faults = detectFaults(project, wires, coils, motor);

  const sequence: string[] = [];
  if (coils["KM1"]) sequence.push("Phase L -> NC Stop -> NC Overload -> forward branch -> KM1 coil energized");
  if (coils["KM2"]) sequence.push("Phase L -> NC Stop -> NC Overload -> reverse branch -> KM2 coil energized");
  if (coils["KM1"] && !coils["KM2"]) sequence.push("KM1 NO 13-14 closed -> coil latched");
  if (coils["KM2"] && !coils["KM1"]) sequence.push("KM2 NO 13-14 closed -> coil latched");
  for (const c of project.requiredComponents) {
    if (c.kind === "bulb" && lamps[c.id]) {
      sequence.push("Current flows phase -> switch -> bulb -> neutral -> " + c.label + " glows");
    } else if (c.kind === "bulb" && !lamps[c.id] && energized.has(c.terminals[0]?.id ?? "")) {
      sequence.push(c.label + " has supply but no return path -> bulb OFF");
    }
  }
  if (motor === "forward") sequence.push("KM1 main contacts closed -> motor runs FORWARD");
  if (motor === "reverse") sequence.push("KM2 main contacts closed -> motor runs REVERSE");
  if (motor === "stopped" && !coils["KM1"] && !coils["KM2"] && coilIds.length > 0) {
    sequence.push("No contactor energized -> motor stopped");
  }

  return {
    coils,
    lamps,
    motor,
    energized,
    faults,
    controlSequence: sequence,
    powered: wires.some((w) => w.from === positive || w.to === positive),
  };
}

function touches(w: Wire, t: string): boolean {
  return w.from === t || w.to === t;
}

export function prettyTerm(project: ProjectSpec, terminalId: string): string {
  const [comp, term] = splitTerminal(terminalId);
  const spec = project.requiredComponents.find((c) => c.id === comp);
  const t = spec?.terminals.find((x) => x.id === terminalId);
  const label = t?.label ?? term;
  return (spec?.label ?? comp) + " - " + label;
}

export function detectFaults(
  project: ProjectSpec,
  wires: Wire[],
  coils: Record<string, boolean>,
  motor: SimResult["motor"],
): Fault[] {
  void motor;
  const faults: Fault[] = [];
  const placed = new Set(wires.map((w) => wireKey(w.from, w.to)));
  const expectedSet = new Set(project.expectedWires.map(([a, b]) => wireKey(a, b)));
  const { positive, negative } = project.controlLogic.supply;

  if (placed.has(wireKey(positive, negative))) {
    faults.push({
      id: "f-short",
      category: "short-circuit",
      message: "Phase (L) is wired directly to Neutral (N) - a dead short circuit. Remove this wire.",
      highlight: [positive, negative],
    });
  }

  for (const [a, b] of project.expectedWires) {
    if (!placed.has(wireKey(a, b))) {
      faults.push({
        id: "f-miss-" + a + "-" + b,
        category: "missing-wire",
        message: "Missing connection: " + prettyTerm(project, a) + " -> " + prettyTerm(project, b) + ".",
        highlight: [a, b],
      });
    }
  }

  for (const w of wires) {
    if (!expectedSet.has(wireKey(w.from, w.to))) {
      faults.push({
        id: "f-extra-" + w.id,
        category: "unexpected-wire",
        message: "Unexpected connection: " + prettyTerm(project, w.from) + " -> " + prettyTerm(project, w.to) + ". This wire does not belong to the correct circuit.",
        highlight: [w.from, w.to],
      });
    }
  }

  // Interlock check: only for projects that require interlocking
  if (project.controlLogic.interlocks.length > 0) {
    const interlockPairs: [string, string][] = [
      ["KM1:22", "SB-R:2"],
      ["KM2:22", "SB-F:2"],
    ];
    const interlockMissing = interlockPairs.filter(([a, b]) => !placed.has(wireKey(a, b)));
    if (interlockMissing.length > 0) {
      faults.push({
        id: "f-interlock",
        category: "missing-interlock",
        message: "Electrical interlock is missing or incomplete. Each contactor's NC contact (21-22) must sit in the OTHER contactor's coil path. Without it, both contactors can close together and short two phases.",
        highlight: interlockMissing.flat(),
      });
    }
  }

  for (const coilTerm of project.controlLogic.coils) {
    const [c] = splitTerminal(coilTerm);
    if (!wires.some((w) => touches(w, coilTerm))) {
      faults.push({
        id: "f-coil-" + c,
        category: "coil-not-connected",
        message: c + " coil (A1) is not connected - the contactor can never energize.",
        highlight: [coilTerm],
      });
    }
  }

  if ("KM1" in coils && "KM2" in coils && coils["KM1"] && coils["KM2"]) {
    faults.push({
      id: "f-both-on",
      category: "expected-state-not-reached",
      message: "DANGER: both contactors energized together - the interlock is not effective in your wiring. This would be a phase-to-phase short in a real circuit.",
      highlight: [],
    });
  }

  return faults;
}

/** Data-driven scoring: a row passes when ALL its wires exist (and/or no unexpected wires). */
export function scoreCircuit(project: ProjectSpec, wires: Wire[]): { name: string; points: number; earned: boolean }[] {
  const placed = new Set(wires.map((w) => wireKey(w.from, w.to)));
  const expectedSet = new Set(project.expectedWires.map(([a, b]) => wireKey(a, b)));
  const unexpected = wires.filter((w) => !expectedSet.has(wireKey(w.from, w.to)));

  return project.scoring.map((row) => {
    let earned = true;
    if (row.noExtra) earned = earned && unexpected.length === 0;
    if (row.wires) earned = earned && row.wires.every(([a, b]) => placed.has(wireKey(a, b)));
    return { name: row.name, points: row.points, earned };
  });
}
