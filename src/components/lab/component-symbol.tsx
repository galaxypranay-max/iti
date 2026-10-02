"use client";

import type { ComponentSpec } from "@/types";
import { CELL } from "./lab-config";

/**
 * SVG symbols for each component kind.
 * Drawn in a local box of w x h cells (CELL px each), origin top-left.
 */

interface Props {
  spec: ComponentSpec;
  x: number;
  y: number;
  energized: boolean;
  coilOn: boolean;
  motorState: "forward" | "reverse" | "stopped";
  onTerminalClick: (terminalId: string) => void;
  activeTerminal: string | null;
  faultTerminals: Set<string>;
  pressed?: boolean;
  switchOn?: boolean;
  lampOn?: boolean;
}

export function ComponentSymbol({
  spec,
  x,
  y,
  energized,
  coilOn,
  motorState,
  onTerminalClick,
  activeTerminal,
  faultTerminals,
  pressed,
  switchOn,
  lampOn,
}: Props) {
  const w = spec.size.w * CELL;
  const h = spec.size.h * CELL;
  const stroke = energized ? "#dc2626" : "#3f3f46";
  const accent = coilOn ? "#dc2626" : "#52525b";

  return (
    <g>
      <g transform={"translate(" + x + ", " + y + ")"}>
        {spec.kind === "supply" && (
          <>
            <rect width={w} height={h} rx={6} fill={energized ? "#fee2e2" : "#f4f4f5"} stroke={stroke} strokeWidth={2} />
            <text x={w / 2} y={h / 2 - 4} textAnchor="middle" fontSize={13} fontWeight={700} fill={stroke}>
              ~ 230 V
            </text>
            <text x={w / 2} y={h / 2 + 12} textAnchor="middle" fontSize={10} fill="#71717a">
              CONTROL SUPPLY
            </text>
          </>
        )}

        {(spec.kind === "push-button-no" || spec.kind === "push-button-nc") && (
          <>
            <rect width={w} height={h} rx={6} fill={pressed ? "#fecaca" : "#fafafa"} stroke={pressed ? "#dc2626" : stroke} strokeWidth={2} />
            <circle cx={w / 2} cy={h / 2 - 4} r={11} fill={pressed ? "#dc2626" : accent} stroke={stroke} />
            <text x={w / 2} y={h - 5} textAnchor="middle" fontSize={9} fontWeight={600} fill="#52525b">
              {spec.label.split("(")[0].trim()}
            </text>
            <text x={w / 2} y={11} textAnchor="middle" fontSize={8} fill="#71717a">
              {spec.kind === "push-button-nc" ? "NC" : "NO"}
            </text>
          </>
        )}

        {spec.kind === "switch" && (
          <>
            <rect width={w} height={h} rx={6} fill="#fafafa" stroke={stroke} strokeWidth={2} />
            <line x1={w * 0.15} y1={h / 2} x2={w * 0.4} y2={h / 2} stroke={stroke} strokeWidth={2} />
            <line x1={w * 0.6} y1={h / 2} x2={w * 0.85} y2={h / 2} stroke={stroke} strokeWidth={2} />
            <line
              x1={w * 0.4}
              y1={h / 2}
              x2={w * 0.6}
              y2={switchOn ? h * 0.22 : h / 2}
              stroke={switchOn ? "#dc2626" : stroke}
              strokeWidth={3}
            />
            <text x={w / 2} y={h - 5} textAnchor="middle" fontSize={9} fontWeight={600} fill="#52525b">
              {spec.label.split("(")[0].trim() + (switchOn ? " ON" : " OFF")}
            </text>
          </>
        )}

        {spec.kind === "overload" && (
          <>
            <rect width={w} height={h} rx={6} fill="#fafafa" stroke={stroke} strokeWidth={2} />
            <path
              d={"M " + w * 0.18 + " " + h * 0.42 + " L " + w * 0.32 + " " + h * 0.42 + " l 5 -8 l 6 16 l 6 -16 l 6 16 l 5 -8 L " + w * 0.82 + " " + h * 0.42}
              fill="none"
              stroke={stroke}
              strokeWidth={2}
            />
            <text x={w / 2} y={h - 5} textAnchor="middle" fontSize={9} fontWeight={600} fill="#52525b">
              OL 95-96
            </text>
          </>
        )}

        {spec.kind === "contactor" && (
          <>
            <rect width={w} height={h} rx={6} fill={coilOn ? "#fee2e2" : "#fafafa"} stroke={coilOn ? "#dc2626" : stroke} strokeWidth={2} />
            <text x={w / 2} y={15} textAnchor="middle" fontSize={9} fontWeight={700} fill={coilOn ? "#dc2626" : "#52525b"}>
              {spec.label}
            </text>
            {/* NO contact 13-14 */}
            <g stroke={coilOn ? "#dc2626" : stroke} strokeWidth={2} fill="none">
              <line x1={w * 0.06} y1={h * 0.22} x2={w * 0.3} y2={h * 0.22} />
              <line x1={w * 0.7} y1={h * 0.22} x2={w * 0.94} y2={h * 0.22} />
              <line x1={w * 0.3} y1={h * 0.22} x2={w * 0.46} y2={h * 0.15} />
              {coilOn && <line x1={w * 0.7} y1={h * 0.15} x2={w * 0.62} y2={h * 0.29} strokeWidth={1.5} />}
            </g>
            <text x={w / 2} y={h * 0.13} textAnchor="middle" fontSize={8} fill="#71717a">13-14 NO</text>
            {/* NC contact 21-22 */}
            <g stroke={stroke} strokeWidth={2} fill="none">
              <line x1={w * 0.06} y1={h * 0.42} x2={w * 0.3} y2={h * 0.42} />
              <line x1={w * 0.7} y1={h * 0.42} x2={w * 0.94} y2={h * 0.42} />
              <line x1={w * 0.3} y1={h * 0.34} x2={w * 0.46} y2={h * 0.5} />
              <line x1={w * 0.3} y1={h * 0.34} x2={w * 0.46} y2={h * 0.34} strokeWidth={1.5} />
            </g>
            <text x={w / 2} y={h * 0.34} textAnchor="middle" fontSize={8} fill="#71717a">21-22 NC</text>
            {/* coil */}
            <rect x={w * 0.3} y={h * 0.6} width={w * 0.4} height={h * 0.3} rx={3} fill={coilOn ? "#dc2626" : "#e4e4e7"} stroke={stroke} />
            <text x={w / 2} y={h * 0.79} textAnchor="middle" fontSize={10} fontWeight={700} fill={coilOn ? "#fff" : "#3f3f46"}>
              {spec.id}
            </text>
          </>
        )}

        {spec.kind === "bulb" && (
          <>
            <rect x={w * 0.3} y={h * 0.6} width={w * 0.4} height={h * 0.35} rx={3} fill="#e4e4e7" stroke={stroke} />
            <circle
              cx={w / 2}
              cy={h * 0.38}
              r={h * 0.24}
              fill={lampOn ? "#fef08a" : "#f4f4f5"}
              stroke={lampOn ? "#eab308" : stroke}
              strokeWidth={2}
            />
            {lampOn && <circle cx={w / 2} cy={h * 0.38} r={h * 0.24} fill="#fde047" opacity={0.35} />}
            <line x1={w * 0.3} y1={h * 0.38} x2={w * 0.44} y2={h * 0.38} stroke={stroke} strokeWidth={1.5} />
            <line x1={w * 0.56} y1={h * 0.38} x2={w * 0.7} y2={h * 0.38} stroke={stroke} strokeWidth={1.5} />
            <text x={w / 2} y={h * 0.36} textAnchor="middle" fontSize={9} fontWeight={600} fill={lampOn ? "#a16207" : "#71717a"}>
              {lampOn ? "ON" : "OFF"}
            </text>
          </>
        )}

        {spec.kind === "motor" && (
          <>
            <circle
              cx={w / 2}
              cy={h / 2 + 6}
              r={Math.min(w, h) / 2 - 12}
              fill={motorState !== "stopped" ? "#fee2e2" : "#fafafa"}
              stroke={motorState !== "stopped" ? "#dc2626" : stroke}
              strokeWidth={2}
            />
            <text x={w / 2} y={h / 2 + 2} textAnchor="middle" fontSize={22} fontWeight={700} fill={stroke}>M</text>
            <text x={w / 2} y={h / 2 + 18} textAnchor="middle" fontSize={10} fill="#71717a">3~</text>
            {motorState !== "stopped" && (
              <text x={w / 2} y={h - 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="#dc2626">
                {motorState === "forward" ? "FWD >>" : "<< REV"}
              </text>
            )}
          </>
        )}
      </g>

      {spec.terminals.map((t) => {
        const cx = x + t.position.x * w;
        const cy = y + t.position.y * h;
        const isActive = activeTerminal === t.id;
        const isFault = faultTerminals.has(t.id);
        const r = 7;
        const anchor = t.position.x === 0 ? "end" : t.position.x === 1 ? "start" : "middle";
        const tx = t.position.x === 0 ? cx - r - 2 : t.position.x === 1 ? cx + r + 2 : cx;
        const ty = t.position.y === 0 ? cy - r - 3 : t.position.y === 1 ? cy + r + 10 : cy + 4;
        return (
          <g key={t.id}>
            {isActive && <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke="#2563eb" strokeWidth={2} />}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={isActive ? "#2563eb" : isFault ? "#f59e0b" : energized ? "#dc2626" : "#a1a1aa"}
              stroke="#27272a"
              strokeWidth={1.5}
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                onTerminalClick(t.id);
              }}
            >
              <title>{spec.label + " - " + t.label}</title>
            </circle>
            <text x={tx} y={ty} textAnchor={anchor} fontSize={9} fontWeight={600} fill="#71717a" style={{ pointerEvents: "none" }}>
              {t.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}
