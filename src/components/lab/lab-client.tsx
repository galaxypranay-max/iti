"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { ProjectSpec } from "@/types";
import { simulate, wireKey, scoreCircuit, type Wire, type Fault } from "@/lib/simulator";
import { saveResult } from "@/lib/progress";
import { CANVAS_W, CANVAS_H, COMPONENT_SLOTS, BUILD_STEPS, CELL } from "./lab-config";
import { ComponentSymbol } from "./component-symbol";
import { AiPanel } from "./ai-panel";
import { VivaPanel } from "./viva-panel";
import { Button } from "@/components/ui/button";

type Mode = "learn" | "practice" | "exam";
type Tab = "circuit" | "components" | "ai" | "info";

interface Props {
  project: ProjectSpec;
  mode: Mode;
}

interface ScoreRows {
  total: number;
  max: number;
  rows: { name: string; points: number; earned: boolean }[];
}

function wiresFromPairs(pairs: [string, string][]): Wire[] {
  return pairs.map(([from, to], i) => ({ id: "w" + i, from, to }));
}

export function LabClient({ project, mode }: Props) {
  const allIds = useMemo(() => project.requiredComponents.map((c) => c.id), [project]);
  const [placed, setPlaced] = useState<Set<string>>(() => new Set(mode === "learn" ? allIds : []));
  const [wires, setWires] = useState<Wire[]>(() =>
    mode === "learn" ? wiresFromPairs(project.expectedWires) : [],
  );
  const [pendingTerminal, setPendingTerminal] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [pressed, setPressed] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState<{ faults: Fault[]; score?: ScoreRows } | null>(null);
  const [tab, setTab] = useState<Tab>("circuit");
  const [showRef, setShowRef] = useState(false);
  const lastCoils = useRef<Record<string, boolean>>({});

  const placedComponents = project.requiredComponents.filter((c) => placed.has(c.id));

  const sim = useMemo(() => {
    if (!running) { lastCoils.current = {}; return null; }
    const s = simulate(project, wires, pressed, lastCoils.current);
    lastCoils.current = s.coils;
    return s;
  }, [project, wires, pressed, running]);

  const faultTerminals = useMemo(() => {
    const s = new Set<string>();
    if (checked) for (const f of checked.faults) for (const h of f.highlight) s.add(h);
    return s;
  }, [checked]);

  const faultWires = useMemo(() => {
    const s = new Set<string>();
    if (checked) {
      for (const w of wires) {
        if (
          checked.faults.some(
            (f) =>
              f.category === "unexpected-wire" &&
              f.highlight.includes(w.from) &&
              f.highlight.includes(w.to),
          )
        )
          s.add(w.id);
      }
    }
    return s;
  }, [checked, wires]);

  function placeComponent(id: string) {
    setPlaced((p) => new Set(p).add(id));
  }

  function onTerminalClick(terminalId: string) {
    if (running) return;
    if (!pendingTerminal) {
      setPendingTerminal(terminalId);
    } else if (pendingTerminal === terminalId) {
      setPendingTerminal(null);
    } else {
      const k = wireKey(pendingTerminal, terminalId);
      setWires((ws) =>
        ws.some((w) => wireKey(w.from, w.to) === k)
          ? ws.filter((w) => wireKey(w.from, w.to) !== k)
          : [...ws, { id: "w" + Date.now(), from: pendingTerminal, to: terminalId }],
      );
      setPendingTerminal(null);
    }
  }

  function pressStart(id: string) {
    setPressed((p) => new Set(p).add(id));
  }
  function pressEnd(id: string) {
    setPressed((p) => {
      const n = new Set(p);
      n.delete(id);
      return n;
    });
  }

  function runCheck() {
    const faults = simulate(project, wires, pressed).faults;
    const rows = scoreCircuit(project, wires);
    const total = rows.reduce((s, r) => s + (r.earned ? r.points : 0), 0);
    const max = rows.reduce((s, r) => s + r.points, 0);
    setChecked({ faults, score: { total, max, rows } });
    saveResult(project.id, total, max, mode);
  }

  function reset() {
    setWires(mode === "learn" ? wiresFromPairs(project.expectedWires) : []);
    setPlaced(new Set(mode === "learn" ? allIds : []));
    setPendingTerminal(null);
    setRunning(false);
    setPressed(new Set());
    setChecked(null);
  }

  const coilOn = (id: string) => !!sim?.coils[id];
  const motorState = sim?.motor ?? "stopped";
  const energized = sim?.energized ?? new Set<string>();

  function terminalXY(terminalId: string): { x: number; y: number } | null {
    const [compId] = terminalId.split(":");
    const spec = project.requiredComponents.find((c) => c.id === compId);
    const slot = COMPONENT_SLOTS[compId];
    const t = spec?.terminals.find((t) => t.id === terminalId);
    if (!spec || !slot || !t) return null;
    return {
      x: slot.x + t.position.x * spec.size.w * CELL,
      y: slot.y + t.position.y * spec.size.h * CELL,
    };
  }

  const circuitCanvas = (
    <div className="relative h-full w-full overflow-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <svg
        viewBox={"0 0 " + CANVAS_W + " " + CANVAS_H}
        className="h-auto w-full min-w-[720px]"
        role="img"
        aria-label="Circuit workspace"
      >
        {/* grid dots */}
        {Array.from({ length: Math.ceil(CANVAS_W / 40) }).map((_, i) =>
          Array.from({ length: Math.ceil(CANVAS_H / 40) }).map((_, j) => (
            <circle key={i + "-" + j} cx={i * 40 + 20} cy={j * 40 + 20} r={1} className="fill-zinc-200 dark:fill-zinc-800" />
          )),
        )}

        {/* status strip */}
        <g>
          <rect
            x={CANVAS_W - 210}
            y={12}
            width={190}
            height={30}
            rx={6}
            fill={motorState === "forward" ? "#dcfce7" : motorState === "reverse" ? "#fef9c3" : "#f4f4f5"}
          />
          <text
            x={CANVAS_W - 115}
            y={32}
            textAnchor="middle"
            fontSize={13}
            fontWeight={700}
            fill={motorState === "stopped" ? "#71717a" : "#166534"}
          >
            {running ? "MOTOR: " + motorState.toUpperCase() : "CIRCUIT OFF"}
          </text>
        </g>

        {/* wires */}
        {wires.map((w) => {
          const a = terminalXY(w.from);
          const b = terminalXY(w.to);
          if (!a || !b) return null;
          const live = running && energized.has(w.from) && energized.has(w.to);
          const isFault = faultWires.has(w.id);
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2 - Math.abs(b.x - a.x) * 0.15 - 14;
          return (
            <path
              key={w.id}
              d={"M " + a.x + " " + a.y + " Q " + mx + " " + my + " " + b.x + " " + b.y}
              fill="none"
              stroke={isFault ? "#f59e0b" : live ? "#dc2626" : "#0ea5e9"}
              strokeWidth={isFault || live ? 3.5 : 2.5}
              strokeDasharray={isFault ? "6 4" : undefined}
            />
          );
        })}

        {/* components */}
        {placedComponents.map((spec) => (
          <ComponentSymbol
            key={spec.id}
            spec={spec}
            x={COMPONENT_SLOTS[spec.id].x}
            y={COMPONENT_SLOTS[spec.id].y}
            energized={spec.kind === "supply" ? running : energized.has(spec.terminals[0]?.id ?? "")}
            coilOn={coilOn(spec.id)}
            motorState={motorState}
            onTerminalClick={onTerminalClick}
            activeTerminal={pendingTerminal}
            faultTerminals={faultTerminals}
            pressed={pressed.has(spec.id)}
          />
        ))}
      </svg>

      {/* press-and-hold start buttons for Run mode */}
      {running && (
        <div className="absolute bottom-3 left-3 flex gap-2">
          {["SB-F", "SB-R"].map((id) => {
            const spec = project.requiredComponents.find((c) => c.id === id);
            if (!spec || !placed.has(id)) return null;
            return (
              <button
                key={id}
                onPointerDown={() => pressStart(id)}
                onPointerUp={() => pressEnd(id)}
                onPointerLeave={() => pressEnd(id)}
                className={
                  "min-h-11 rounded-lg px-4 text-sm font-semibold text-white transition-colors " +
                  (id === "SB-F" ? "bg-green-600 hover:bg-green-700" : "bg-amber-500 hover:bg-amber-600")
                }
              >
                {pressed.has(id) ? "RUNNING: " + spec.label.split("(")[0] : spec.label.split("(")[0]}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  const infoPanel = (
    <div className="space-y-4 p-4 text-sm">
      {mode === "learn" ? (
        <>
          <section>
            <h3 className="font-semibold">Working Principle</h3>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">{project.workingPrinciple}</p>
          </section>
          <section>
            <h3 className="font-semibold">Explanation</h3>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">{project.explanation}</p>
          </section>
        </>
      ) : (
        <section>
          <h3 className="font-semibold">Your Task</h3>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">{project.objective}</p>
          <h3 className="mt-4 font-semibold">Build Steps (hints)</h3>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-zinc-600 dark:text-zinc-400">
            {BUILD_STEPS.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          {mode === "exam" && (
            <p className="mt-3 rounded-lg bg-red-50 p-3 text-red-700 dark:bg-red-950/40 dark:text-red-300">
              Exam mode: build without help, then press Submit. Your mistakes are shown only after submission.
            </p>
          )}
        </section>
      )}
      <section>
        <h3 className="font-semibold">Safety Notes</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-zinc-600 dark:text-zinc-400">
          {project.safetyNotes.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </section>
      {showRef && (
        <section>
          <h3 className="font-semibold">Reference Connections</h3>
          <ul className="mt-1 space-y-0.5 font-mono text-xs text-zinc-600 dark:text-zinc-400">
            {project.expectedWires.map(([a, b], i) => (
              <li key={i}>{a.replace(":", " ")} - {b.replace(":", " ")}</li>
            ))}
          </ul>
        </section>
      )}
      {(mode === "learn" || mode === "practice") && (
        <Button variant="outline" size="sm" onClick={() => setShowRef((v) => !v)}>
          {showRef ? "Hide" : "Show"} reference wiring
        </Button>
      )}
    </div>
  );

  const toolbox = (
    <div className="space-y-2 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Component Toolbox</p>
      {project.requiredComponents.map((c) => {
        const isPlaced = placed.has(c.id);
        return (
          <button
            key={c.id}
            disabled={isPlaced}
            onClick={() => placeComponent(c.id)}
            className={
              "flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors " +
              (isPlaced
                ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300"
                : "border-zinc-300 hover:border-blue-400 hover:bg-blue-50 dark:border-zinc-700 dark:hover:bg-zinc-800")
            }
          >
            <span className="flex-1">{c.name}</span>
            {isPlaced && <span className="text-xs">placed</span>}
          </button>
        );
      })}
      <p className="pt-2 text-xs text-zinc-500">
        Tap a terminal, then another terminal, to connect a wire. Tap the same terminal twice to cancel.
        Repeat the same two terminals to remove a wire.
      </p>
    </div>
  );

  const checkPanel =
    checked && (
      <div className="space-y-2 p-3 text-sm">
        <p className="font-semibold">
          {checked.faults.length === 0
            ? "Circuit OK - no faults found!"
            : checked.faults.length + " issue(s) found:"}
        </p>
        <ul className="space-y-1.5">
          {checked.faults.map((f) => (
            <li key={f.id} className="rounded-lg bg-amber-50 p-2.5 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <span className="text-xs font-medium uppercase">{f.category.replace(/-/g, " ")}</span>
              <br />
              {f.message}
            </li>
          ))}
        </ul>
        {checked.score && (
          <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
            <p className="font-semibold">
              Score: {checked.score.total} / {checked.score.max}
            </p>
            <ul className="mt-2 space-y-1">
              {checked.score.rows.map((r) => (
                <li key={r.name} className="flex justify-between gap-2">
                  <span>{r.earned ? "[OK]" : "[X]"} {r.name}</span>
                  <span className="tabular-nums text-zinc-500">{r.earned ? r.points : 0}/{r.points}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );

  const sidePanel = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        {(["ai", "info"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={"flex-1 px-4 py-2.5 text-sm font-medium " + (tab === t ? "border-b-2 border-blue-600 text-blue-600" : "text-zinc-500")}
          >
            {t === "ai" ? "AI Assistant" : "Info & Viva"}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "ai" ? <AiPanel project={project} mode={mode} /> : infoPanel}
        {tab === "info" && (
          <div className="border-t border-zinc-200 dark:border-zinc-800">
            <VivaPanel questions={project.vivaQuestions} />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
        <Link href={"/project/" + project.slug} className="max-w-[50%] truncate text-sm text-zinc-500 hover:underline">
          {project.title}
        </Link>
        <span className="ml-auto flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium uppercase dark:bg-zinc-800">{mode}</span>
          <Button size="sm" variant={running ? "success" : "primary"} onClick={() => setRunning((r) => !r)}>
            {running ? "Stop" : "Run"}
          </Button>
          {mode !== "exam" ? (
            <Button size="sm" variant="outline" onClick={runCheck}>
              Check
            </Button>
          ) : (
            <Button size="sm" variant="danger" onClick={runCheck}>
              Submit
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={reset}>
            Reset
          </Button>
        </span>
      </div>

      {/* Desktop layout */}
      <div className="flex min-h-0 flex-1 max-lg:hidden">
        <aside className="w-64 shrink-0 overflow-y-auto border-r border-zinc-200 dark:border-zinc-800">{toolbox}</aside>
        <div className="min-w-0 flex-1 p-3">{circuitCanvas}</div>
        <aside className="flex w-96 shrink-0 flex-col border-l border-zinc-200 dark:border-zinc-800">
          {sidePanel}
        </aside>
      </div>

      {/* Mobile layout */}
      <div className="flex min-h-0 flex-1 flex-col lg:hidden">
        <div className="min-h-0 flex-1 overflow-y-auto">
          {tab === "circuit" && (
            <>
              <div className="h-[58vh] p-2">{circuitCanvas}</div>
              {checkPanel}
            </>
          )}
          {tab === "components" && toolbox}
          {tab === "ai" && <div className="h-[75vh]"><AiPanel project={project} mode={mode} /></div>}
          {tab === "info" && (
            <>
              {infoPanel}
              <div className="border-t border-zinc-200 dark:border-zinc-800">
                <VivaPanel questions={project.vivaQuestions} />
              </div>
            </>
          )}
        </div>
        <nav className="grid grid-cols-4 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {(
            [
              ["components", "Components"],
              ["circuit", "Circuit"],
              ["ai", "AI"],
              ["info", "Info"],
            ] as [Tab, string][]
          ).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={"min-h-14 text-sm font-medium " + (tab === t ? "text-blue-600" : "text-zinc-500")}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
