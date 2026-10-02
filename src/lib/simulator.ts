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
  coils: Record<string, boolean>; // energized contactors/timer coils
  lamps: Record<string, boolean>; // glowing bulbs
  motor: "forward" | "reverse" | "stopped";
  powerOk: boolean; // motor power path verified (projects with a power circuit)
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
  timersDone: Set<string> = new Set(),
): SimResult {
  const coilIds = [...new Set(project.controlLogic.coils.map((t) => splitTerminal(t)[0]))];
  const { positive, negative } = project.controlLogic.supply;

  const coils: Record<string, boolean> = {};
  for (const c of coilIds) coils[c] = initialCoils?.[c] ?? false;

  const neighbors = new Map<
    string,
    { node: string; owner: string; conducts: (s: Record<string, boolean>) => boolean; coil?: boolean }[]
  >();
  function addEdge(
    a: string,
    b: string,
    owner: string,
    conducts: (s: Record<string, boolean>) => boolean,
    coil = false,
  ) {
    if (!neighbors.has(a)) neighbors.set(a, []);
    if (!neighbors.has(b)) neighbors.set(b, []);
    neighbors.get(a)!.push({ node: b, owner, conducts, coil });
    neighbors.get(b)!.push({ node: a, owner, conducts, coil });
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
    } else if (c.kind === "overload") {
      const tof = (label: string) => c.terminals.find((x) => x.label === label)?.id;
      // healthy thermal element: power poles 1L1-2T1, 3L2-4T2, 5L3-6T3
      for (const [a, b] of [["1L1", "2T1"], ["3L2", "4T2"], ["5L3", "6T3"]]) {
        const ta = tof(a), tb = tof(b);
        if (ta && tb) addEdge(ta, tb, c.id, () => true);
      }
      // aux NC 95-96
      const a95 = tof("95 (NC)"), a96 = tof("96 (NC)");
      if (a95 && a96) addEdge(a95, a96, c.id, () => true);
      if (c.terminals.length === 2) addEdge(c.terminals[0].id, c.terminals[1].id, c.id, () => true);
    } else if (c.kind === "bulb" && c.terminals.length === 2) {
      const onKey = "__lamp_" + c.id;
      addEdge(c.terminals[0].id, c.terminals[1].id, c.id, (s) => !!s[onKey], true);
    } else if (c.kind === "mcb") {
      // closed protection device: 1-2, 3-4, 5-6
      for (const [a, b] of [["1", "2"], ["3", "4"], ["5", "6"]]) {
        const ta = t(a), tb = t(b);
        if (ta && tb) addEdge(ta, tb, c.id, () => true);
      }
    } else if (c.kind === "timer") {
      const a1 = t("A1"), a2 = t("A2");
      if (a1 && a2) addEdge(a1, a2, c.id, () => !!coils[c.id], true);
      const n15 = t("15"), n16 = t("16 (NC)"), n18 = t("18 (NO)");
      // Timed NC 15-16: closed until the delay elapses (then opens)
      if (n15 && n16) addEdge(n15, n16, c.id, () => !coils[c.id] || !timersDone.has(c.id));
      // Timed NO 15-18: closed only after the delay elapses
      if (n15 && n18) addEdge(n15, n18, c.id, () => !!coils[c.id] && timersDone.has(c.id));
    } else if (c.kind === "contactor") {
      const a1 = t("A1"), a2 = t("A2");
      const n13 = t("13 (NO)"), n14 = t("14 (NO)");
      const n21 = t("21 (NC)"), n22 = t("22 (NC)");
      if (a1 && a2) addEdge(a1, a2, c.id, () => !!coils[c.id], true);
      if (n13 && n14) addEdge(n13, n14, c.id, () => !!coils[c.id]);
      if (n21 && n22) addEdge(n21, n22, c.id, () => !coils[c.id]);
      // MAIN power contacts 1-2, 3-4, 5-6 (line -> load)
      for (const [a, b] of [["1", "2"], ["3", "4"], ["5", "6"]]) {
        const ta = t(a), tb = t(b);
        if (ta && tb) addEdge(ta, tb, c.id, () => !!coils[c.id]);
      }
      // STAR contactor: load side terminals join as the star point when on
      if (c.starPoint) {
        for (const [a, b] of [["2", "4"], ["4", "6"], ["2", "6"]]) {
          const ta = t(a), tb = t(b);
          if (ta && tb) addEdge(ta, tb, c.id, () => !!coils[c.id]);
        }
      }
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
        // Only the element's own COIL edge is excluded (no self-energizing through
        // the coil); its own contact edges (13-14 latch) stay in the path.
        if (n.owner === excludeOwner && n.coil) continue;
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

  // 4. Motor state via POWER circuit (when the project has a motor + 3-phase supply)
  let motor: SimResult["motor"] = "stopped";
  let powerOk = true;
  const motorComp = project.requiredComponents.find((c) => c.kind === "motor");
  const supply3 = project.requiredComponents.find((c) => c.kind === "supply-3ph");
  if (motorComp && supply3) {
    const lineOf = (l: string) => supply3.terminals.find((x) => x.label === l)?.id;
    const termOf = (l: string) => motorComp.terminals.find((x) => x.label === l)?.id;
    const fwd = ["L1", "L2", "L3"].every((l, i) => {
      const a = lineOf(l), b = termOf(["U1", "V1", "W1"][i]);
      return a && b ? reachable(a, b, null) : false;
    });
    const rev = (() => {
      const pairs: [string, string][] = [["L2", "U1"], ["L1", "V1"], ["L3", "W1"]];
      return pairs.every(([l, m]) => {
        const a = lineOf(l), b = termOf(m);
        return a && b ? reachable(a, b, null) : false;
      });
    })();
    // 6-terminal motor (star-delta): winding ends must be connected by KM3 (star) or KM2 (delta)
    const sixTerm = motorComp.terminals.length >= 6;
    const endOk = !sixTerm || !!coils["KM3"] || !!coils["KM2"];
    powerOk = (fwd || rev) && endOk;
    if (fwd && rev) {
      powerOk = false; // both sequences alive = interlock failure; detectFaults flags it
    }
    if (fwd && !rev && endOk) motor = "forward";
    else if (rev && !fwd && endOk) motor = "reverse";
  } else if (coilIds.includes("KM1") && coilIds.includes("KM2")) {
    // control-only fallback (no 3-phase power circuit defined)
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
    powerOk,
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

  // Interlock check: exact wires from the verified project definition
  if (project.controlLogic.interlockWires?.length) {
    const missing = project.controlLogic.interlockWires.filter(([a, b]) => !placed.has(wireKey(a, b)));
    if (missing.length > 0) {
      faults.push({
        id: "f-interlock",
        category: "missing-interlock" as const,
        message: "Electrical interlock is missing or incomplete (" + missing.length + " connection(s)). Each contactor/timer changeover must pass through the OTHER contactor's NC contact (21-22). Without it, both contactors can close together and short the supply.",
        highlight: missing.flat(),
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

  // Open power circuit: motor component exists but phase paths incomplete
  const motorComp = project.requiredComponents.find((c) => c.kind === "motor");
  const supply3 = project.requiredComponents.find((c) => c.kind === "supply-3ph");
  void motorComp;
  void supply3;

  // Danger check only where KM1/KM2 are interlocked against each other (FWD/REV);
  // in star-delta, KM1 (main) + KM2 (delta) run together normally.
  if (
    project.controlLogic.interlocks.some((i) => i.from === "KM1" && i.to === "KM2") &&
    coils["KM1"] && coils["KM2"]
  ) {
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
