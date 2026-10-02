"use client";

import type { ProjectSpec } from "@/types";

interface Props {
  project: ProjectSpec;
  selectedId: string | null;
  coils: Record<string, boolean>;
  lamps: Record<string, boolean>;
  switchesOn: Set<string>;
  running: boolean;
}

/**
 * Terminal Inspector (improvement spec #5/#7):
 * shows the selected component's terminal groups and its live state.
 * Only terminals defined in the project are shown - nothing is invented.
 */
export function TerminalInspector({ project, selectedId, coils, lamps, switchesOn, running }: Props) {
  const spec = project.requiredComponents.find((c) => c.id === selectedId);
  if (!spec) {
    return (
      <p className="p-3 text-xs text-zinc-500">
        Tap a component in the workspace to inspect its terminals and live state.
      </p>
    );
  }

  const coilOn = !!coils[spec.id];
  const lampOn = !!lamps[spec.id];
  const swOn = switchesOn.has(spec.id);

  const stateRows: { k: string; v: string; on: boolean }[] = [];
  if (spec.kind === "contactor") {
    stateRows.push(
      { k: "Coil (A1-A2)", v: coilOn ? "ENERGIZED" : "OFF", on: coilOn },
      { k: "Main contacts (1-2/3-4/5-6)", v: coilOn ? "CLOSED" : "OPEN", on: coilOn },
      { k: "Auxiliary NO (13-14)", v: coilOn ? "CLOSED" : "OPEN", on: coilOn },
      { k: "Auxiliary NC (21-22)", v: coilOn ? "OPEN" : "CLOSED", on: !coilOn },
    );
  } else if (spec.kind === "timer") {
    stateRows.push(
      { k: "Timer coil", v: coilOn ? (running ? "TIMING..." : "ENERGIZED") : "OFF", on: coilOn },
      { k: "Timed NC 15-16", v: coilOn ? "OPENS AFTER DELAY" : "CLOSED", on: !coilOn },
      { k: "Timed NO 15-18", v: coilOn ? "CLOSES AFTER DELAY" : "OPEN", on: false },
    );
  } else if (spec.kind === "mcb") {
    stateRows.push({ k: "MCB poles 1-2/3-4/5-6", v: "CLOSED", on: true });
  } else if (spec.kind === "overload") {
    stateRows.push(
      { k: "Power poles", v: "CLOSED (healthy)", on: true },
      { k: "Aux NC 95-96", v: "CLOSED", on: true },
    );
  } else if (spec.kind === "motor") {
    stateRows.push({ k: "Motor", v: "state shown in status bar", on: false });
  } else if (spec.kind === "bulb") {
    stateRows.push({ k: "Bulb", v: lampOn ? "GLOWING" : "OFF", on: lampOn });
  } else if (spec.kind === "switch") {
    stateRows.push({ k: "Switch", v: swOn ? "CLOSED (ON)" : "OPEN (OFF)", on: swOn });
  } else if (spec.kind === "push-button-no") {
    stateRows.push({ k: "NO contact 1-2", v: "CLOSES while pressed", on: false });
  } else if (spec.kind === "push-button-nc") {
    stateRows.push({ k: "NC contact 1-2", v: "OPENS while pressed", on: true });
  } else if (spec.kind === "supply" || spec.kind === "supply-3ph") {
    stateRows.push({ k: "Supply", v: running ? "ON" : "OFF", on: running });
  }

  const groups = spec.groups ?? [{ title: "Terminals", terminalIds: spec.terminals.map((t) => t.id) }];

  return (
    <div className="p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{spec.name}</h3>
        {spec.kind === "contactor" && (
          <span
            className={
              "rounded-full px-2 py-0.5 text-[10px] font-bold " +
              (coilOn ? "bg-red-600 text-white" : "bg-zinc-300 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300")
            }
          >
            {coilOn ? "PULL-IN" : "DROP"}
          </span>
        )}
      </div>

      <div className="mb-3 space-y-1">
        {stateRows.map((r) => (
          <div key={r.k} className="flex items-center justify-between gap-2 text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">{r.k}</span>
            <span className={"flex items-center gap-1.5 font-medium " + (r.on ? "text-green-600 dark:text-green-400" : "text-zinc-500")}>
              <span className={"inline-block h-2 w-2 rounded-full " + (r.on ? "bg-green-500" : "bg-zinc-400")} />
              {r.v}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{g.title}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {g.terminalIds.map((tid) => {
                const t = spec.terminals.find((x) => x.id === tid);
                const connected = false; // wire indicators handled by canvas highlights
                return (
                  <span
                    key={tid}
                    className={
                      "rounded border px-1.5 py-0.5 font-mono text-[11px] " +
                      (connected
                        ? "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950"
                        : "border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300")
                    }
                  >
                    {t?.label ?? tid}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
