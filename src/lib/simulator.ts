import type { ProjectSpec } from "@/types";

/**
 * Deterministic electrical rule engine (BRAIN - Deterministic Layer).
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
    | "open-circuit"
    | "coil-not-connected"
    | "expected-state-not-reached";
  message: string;
  /** terminal ids / wire ids to highlight in the UI */
  highlight: string[];
}

export interface SimResult {
  coils: Record<string, boolean>;
  motor: "forward" | "reverse" | "stopped";
  energized: Set<string>;
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

/** Internal conduction edges: current flows THROUGH components, not just wires. */
interface Edge {
  a: string;
  b: string;
  /** component id that owns this edge (excluded when testing that coil) */
  owner: string;
  conducts: (states: Record<string, boolean>, pressed: Set<string>) => boolean;
}

function buildEdges(project: ProjectSpec, coilsOn: (id: string) => boolean): Edge[] {
  const edges: Edge[] = [];

  // External wires always conduct
  void project;

  // Internal component edges
  for (const c of project.requiredComponents) {
    const ids = (label: string) => c.terminals.find((t) => t.label === label)?.id;
    if (c.kind === "push-button-no") {
      const a = c.terminals[0]?.id, b = c.terminals[1]?.id;
      if (a && b) edges.push({ a, b, owner: c.id, conducts: (_s, p) => p.has(c.id) });
    } else if (c.kind === "push-button-nc") {
      const a = c.terminals[0]?.id, b = c.terminals[1]?.id;
      if (a && b) edges.push({ a, b, owner: c.id, conducts: (_s, p) => !p.has(c.id) });
    } else if (c.kind === "overload") {
      const a = c.terminals[0]?.id, b = c.terminals[1]?.id;
      if (a && b) edges.push({ a, b, owner: c.id, conducts: () => true }); // healthy
    } else if (c.kind === "contactor") {
      const a1 = ids("A1"), a2 = ids("A2");
      const n13 = ids("13 (NO)"), n14 = ids("14 (NO)");
      const n21 = ids("21 (NC)"), n22 = ids("22 (NC)");
      if (a1 && a2) edges.push({ a: a1, b: a2, owner: c.id, conducts: () => coilsOn(c.id) });
      if (n13 && n14) edges.push({ a: n13, b: n14, owner: c.id, conducts: () => coilsOn(c.id) });
      if (n21 && n22) edges.push({ a: n21, b: n22, owner: c.id, conducts: () => !coilsOn(c.id) });
    }
  }
  return edges;
}

function edgeConducts(
  project: ProjectSpec,
  edges: Edge[],
  from: string,
  to: string,
  states: Record<string, boolean>,
  pressed: Set<string>,
  excludeOwner: string | null,
): boolean {
  void project;
  const e = edges.find(
    (e) => (e.a === from && e.b === to) || (e.a === to && e.b === from),
  );
  if (!e) return true; // external wire
  if (excludeOwner && e.owner === excludeOwner) return false;
  return e.conducts(states, pressed);
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
  initialCoils?: Record<string, boolean>,
): SimResult {
  const coilIds = project.controlLogic.coils.map((t) => splitTerminal(t)[0]);
  const uniqueCoils = [...new Set(coilIds)];
  const { positive, negative } = project.controlLogic.supply;

  // Adjacency over wires + internal edges
  const neighbors = new Map<string, { node: string; owner: string; conducts: (s: Record<string, boolean>, p: Set<string>) => boolean }[]>();
  function addEdge(a: string, b: string, owner: string, conducts: (s: Record<string, boolean>, p: Set<string>) => boolean) {
    if (!neighbors.has(a)) neighbors.set(a, []);
    if (!neighbors.has(b)) neighbors.set(b, []);
    neighbors.get(a)!.push({ node: b, owner, conducts });
    neighbors.get(b)!.push({ node: a, owner, conducts });
  }
  for (const w of wires) addEdge(w.from, w.to, "__wire", () => true);
  for (const e of buildEdges(project, (id) => !!states[id])) {
    addEdge(e.a, e.b, e.owner, e.conducts);
  }

  const coils: Record<string, boolean> = {};
  for (const c of uniqueCoils) coils[c] = initialCoils?.[c] ?? false;
  const states = coils; // closure alias so edge predicates see live state

  function reachable(start: string, goal: string, excludeOwner: string | null): boolean {
    const visited = new Set<string>([start]);
    const queue = [start];
    while (queue.length) {
      const cur = queue.shift()!;
      if (cur === goal) return true;
      for (const n of neighbors.get(cur) ?? []) {
        if (visited.has(n.node)) continue;
        if (n.owner === excludeOwner) continue; // coil under test: bypass its own internal paths
        if (!n.conducts(states, pressed)) continue;
        visited.add(n.node);
        queue.push(n.node);
      }
    }
    return false;
  }

  // Fixed point: coil state changes contact states (latch) until stable
  for (let iter = 0; iter < 10; iter++) {
    let changed = false;
    for (const c of uniqueCoils) {
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

  // Energized terminals: BFS from phase; current may pass through energized coils
  const energized = new Set<string>();
  {
    const visited = new Set<string>([positive]);
    const queue = [positive];
    while (queue.length) {
      const cur = queue.shift()!;
      energized.add(cur);
      for (const n of neighbors.get(cur) ?? []) {
        if (visited.has(n.node)) continue;
        if (!n.conducts(states, pressed)) continue;
        visited.add(n.node);
        queue.push(n.node);
      }
    }
  }

  let motor: SimResult["motor"] = "stopped";
  if (coils["KM1"] && !coils["KM2"]) motor = "forward";
  else if (coils["KM2"] && !coils["KM1"]) motor = "reverse";

  const faults = detectFaults(project, wires, coils, motor);

  const sequence: string[] = [];
  if (coils["KM1"]) sequence.push("Phase L -> NC Stop -> NC Overload -> forward branch -> KM1 coil energized");
  if (coils["KM2"]) sequence.push("Phase L -> NC Stop -> NC Overload -> reverse branch -> KM2 coil energized");
  if (coils["KM1"] && !coils["KM2"]) sequence.push("KM1 NO 13-14 closed -> coil latched");
  if (coils["KM2"] && !coils["KM1"]) sequence.push("KM2 NO 13-14 closed -> coil latched");
  if (motor === "forward") sequence.push("KM1 main contacts closed -> motor runs FORWARD");
  if (motor === "reverse") sequence.push("KM2 main contacts closed -> motor runs REVERSE");
  if (motor === "stopped" && !coils["KM1"] && !coils["KM2"]) sequence.push("No contactor energized -> motor stopped");

  return {
    coils,
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
  const t = spec?.terminals.find((t) => t.id === terminalId);
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

  // 1. Dead short
  if (placed.has(wireKey(positive, negative))) {
    faults.push({
      id: "f-short",
      category: "short-circuit",
      message: "Phase (L) is wired directly to Neutral (N) - a dead short circuit. Remove this wire.",
      highlight: [positive, negative],
    });
  }

  // 2. Missing expected wires
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

  // 3. Unexpected wires
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

  // 4. Missing interlock (emphasised check per BRAIN)
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

  // 5. Coil feeds
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

  // 6. Both coils ON = interlock failure
  if (coils["KM1"] && coils["KM2"]) {
    faults.push({
      id: "f-both-on",
      category: "expected-state-not-reached",
      message: "DANGER: both contactors energized together - the interlock is not effective in your wiring. This would be a phase-to-phase short in a real circuit.",
      highlight: [],
    });
  }

  return faults;
}

export function scoreCircuit(project: ProjectSpec, wires: Wire[]): { name: string; points: number; earned: boolean }[] {
  const placed = new Set(wires.map((w) => wireKey(w.from, w.to)));
  const has = (a: string, b: string) => placed.has(wireKey(a, b));
  const expectedSet = new Set(project.expectedWires.map(([a, b]) => wireKey(a, b)));
  const unexpected = wires.filter((w) => !expectedSet.has(wireKey(w.from, w.to)));

  return [
    { name: "Stop button NC in supply path", points: 15, earned: has("L:phase", "STOP:1") && has("STOP:2", "OL:95") },
    { name: "Overload NC contact in control path", points: 15, earned: has("STOP:2", "OL:95") && has("OL:96", "SB-F:1") && has("OL:96", "SB-R:1") },
    { name: "Forward branch complete with latch (NO 13-14)", points: 15, earned: has("OL:96", "SB-F:1") && has("SB-F:2", "KM1:A1") && has("SB-F:2", "KM1:13") && has("KM1:14", "KM1:A1") },
    { name: "Reverse branch complete with latch (NO 13-14)", points: 15, earned: has("OL:96", "SB-R:1") && has("SB-R:2", "KM2:A1") && has("SB-R:2", "KM2:13") && has("KM2:14", "KM2:A1") },
    { name: "Electrical interlock both directions (NC cross-wiring)", points: 20, earned: has("KM1:22", "SB-R:2") && has("KM2:22", "SB-F:2") },
    { name: "Both coil returns to neutral", points: 10, earned: has("KM1:A2", "L:neutral") && has("KM2:A2", "L:neutral") },
    { name: "No invalid/unsafe connections", points: 10, earned: unexpected.length === 0 },
  ];
}
