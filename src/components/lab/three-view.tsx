"use client";

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, Canvas } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import type { ComponentSpec, ProjectSpec } from "@/types";
import type { Wire } from "@/lib/simulator";
import { POS3D_BY_PROJECT } from "./lab-config";

interface Props {
  project: ProjectSpec;
  placed: Set<string>;
  wires: Wire[];
  pressed: Set<string>;
  switchesOn: Set<string>;
  running: boolean;
  coils: Record<string, boolean>;
  lamps: Record<string, boolean>;
  motor: "forward" | "reverse" | "stopped";
  energized: Set<string>;
  activeTerminal: string | null;
  faultTerminals: Set<string>;
  suggestedTerminals: Set<string>;
  selectedWire: string | null;
  selectedComponent: string | null;
  onTerminalClick: (id: string) => void;
  onToggleSwitch: (id: string) => void;
  onSelectComponent: (id: string) => void;
  onWireSelect: (id: string) => void;
}

type Vec3 = [number, number, number];

/** Explicit terminal offsets per component kind (world units, relative to component origin). */
const OFFSETS: Record<string, Record<string, Vec3>> = {
  supply: {
    "L (Phase)": [-0.5, 0.6, 0.55],
    "N (Neutral)": [0.5, 0.6, 0.55],
  },
  "supply-3ph": {
    L1: [-0.7, 1.05, 0.25],
    L2: [0, 1.05, 0.25],
    L3: [0.7, 1.05, 0.25],
  },
  mcb: {
    "1": [-0.6, 1.05, 0.25],
    "3": [0, 1.05, 0.25],
    "5": [0.6, 1.05, 0.25],
    "2": [-0.6, 0.3, 0.45],
    "4": [0, 0.3, 0.45],
    "6": [0.6, 0.3, 0.45],
  },
  timer: {
    A1: [-0.4, 0.45, 0.4],
    A2: [0.4, 0.45, 0.4],
    "15": [-0.6, 1.05, 0.2],
    "16 (NC)": [0, 1.05, 0.2],
    "18 (NO)": [0.6, 1.05, 0.2],
  },
  overload: {
    "1L1": [-0.95, 1.05, 0.2],
    "3L2": [-0.32, 1.05, 0.2],
    "5L3": [0.32, 1.05, 0.2],
    "2T1": [-0.95, 0.3, 0.45],
    "4T2": [-0.32, 0.3, 0.45],
    "6T3": [0.32, 0.3, 0.45],
    "95 (NC)": [0.85, 0.75, 0.35],
    "96 (NC)": [0.85, 0.3, 0.35],
  },
  contactor: {
    "1": [-0.95, 1.55, 0.2],
    "3": [-0.32, 1.55, 0.2],
    "5": [0.32, 1.55, 0.2],
    "2": [-0.95, 0.3, 0.5],
    "4": [-0.32, 0.3, 0.5],
    "6": [0.32, 0.3, 0.5],
    A1: [0.7, 0.35, 0.56],
    A2: [1.1, 0.35, 0.56],
    "13 (NO)": [0.7, 1.35, 0.35],
    "14 (NO)": [1.1, 1.35, 0.35],
    "21 (NC)": [0.7, 0.85, 0.35],
    "22 (NC)": [1.1, 0.85, 0.35],
  },
  "push-button-no": { "1": [-0.45, 0.4, 0.35], "2": [0.45, 0.4, 0.35] },
  "push-button-nc": { "1": [-0.45, 0.4, 0.35], "2": [0.45, 0.4, 0.35] },
  switch: { "1": [-0.45, 0.35, 0.35], "2": [0.45, 0.35, 0.35] },
  bulb: { "1": [-0.3, 0.7, 0.3], "2": [0.3, 0.7, 0.3] },
  motor: {
    U1: [-0.35, 1.15, 0],
    V1: [0, 1.15, 0],
    W1: [0.35, 1.15, 0],
    U2: [-0.35, 0.3, 0.72],
    V2: [0, 0.3, 0.72],
    W2: [0.35, 0.3, 0.72],
  },
};

function terminalOffset(kind: string, label: string): Vec3 {
  const map = OFFSETS[kind];
  if (map && map[label]) return map[label];
  return [0, 0.6, 0.6];
}

function terminalWorld(project: ProjectSpec, id: string): Vec3 | null {
  const [compId] = id.split(":");
  const spec = project.requiredComponents.find((c) => c.id === compId);
  const pos3 = POS3D_BY_PROJECT[project.id]?.[compId];
  const t = spec?.terminals.find((x) => x.id === id);
  if (!spec || !pos3 || !t) return null;
  const off = terminalOffset(spec.kind, t.label);
  return [pos3[0] + off[0], pos3[1] + off[1], pos3[2] + off[2]];
}

function Terminal({
  id,
  label,
  specLabel,
  position,
  state,
  onClick,
}: {
  id: string;
  label: string;
  specLabel: string;
  position: Vec3;
  state: "active" | "fault" | "live" | "suggested" | "idle";
  onClick: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const color =
    state === "active"
      ? "#2563eb"
      : state === "fault"
        ? "#f59e0b"
        : state === "suggested"
          ? "#22c55e"
          : state === "live"
            ? "#dc2626"
            : "#9ca3af";
  return (
    <group position={position}>
      {state === "suggested" && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
          <ringGeometry args={[0.16, 0.24, 24]} />
          <meshBasicMaterial color="#22c55e" transparent opacity={0.9} />
        </mesh>
      )}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick(id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[0.12, 20, 20]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} emissive={state === "live" ? "#7f1d1d" : "#000"} />
      </mesh>
      {hovered && (
        <Html position={[0, 0.4, 0]} center style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded-md bg-zinc-900/90 px-2 py-1 text-xs text-white">
            {specLabel} - {label}
          </div>
        </Html>
      )}
    </group>
  );
}

function Component3D({
  spec,
  position,
  selected,
  coilOn,
  lampOn,
  switchOn,
  pressed,
  motorState,
  running,
  onToggleSwitch,
  onSelect,
}: {
  spec: ComponentSpec;
  position: Vec3;
  selected: boolean;
  coilOn: boolean;
  lampOn: boolean;
  switchOn: boolean;
  pressed: boolean;
  motorState: "forward" | "reverse" | "stopped";
  running: boolean;
  onToggleSwitch: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const shaft = useRef<THREE.Mesh>(null);
  const speed = useRef(0);
  useFrame(() => {
    const target = running && motorState !== "stopped" ? 0.14 : 0;
    speed.current += (target - speed.current) * 0.04; // smooth spin-up / spin-down
    if (shaft.current) shaft.current.rotation.y += speed.current * (motorState === "reverse" ? -1 : 1);
  });

  function onClick(e: { stopPropagation: () => void }) {
    e.stopPropagation();
    onSelect(spec.id);
    if (spec.kind === "switch") onToggleSwitch(spec.id);
  }

  return (
    <group position={position} onClick={onClick}>
      {selected && (
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[2.9, 2.9, 2.9]} />
          <meshBasicMaterial color="#2563eb" wireframe transparent opacity={0.25} />
        </mesh>
      )}

      {spec.kind === "supply" && (
        <>
          <mesh position={[0, 0.6, 0]} castShadow>
            <boxGeometry args={[1.6, 1.2, 1.1]} />
            <meshStandardMaterial color="#d4d4d8" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.75, 0.56]}>
            <boxGeometry args={[1.1, 0.5, 0.02]} />
            <meshStandardMaterial color={running ? "#fca5a5" : "#a1a1aa"} emissive={running ? "#7f1d1d" : "#000"} />
          </mesh>
        </>
      )}

      {spec.kind === "supply-3ph" && (
        <>
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[2.2, 1.0, 1.2]} />
            <meshStandardMaterial color="#d4d4d8" roughness={0.6} />
          </mesh>
          {(["L1", "L2", "L3"] as const).map((l, i) => (
            <mesh key={l} position={[-0.7 + i * 0.7, 1.1, 0.25]} castShadow>
              <cylinderGeometry args={[0.1, 0.1, 0.35, 14]} />
              <meshStandardMaterial color={["#dc2626", "#eab308", "#2563eb"][i]} />
            </mesh>
          ))}
          <mesh position={[0, 0.55, 0.61]}>
            <boxGeometry args={[1.5, 0.4, 0.02]} />
            <meshStandardMaterial color={running ? "#fca5a5" : "#a1a1aa"} emissive={running ? "#7f1d1d" : "#000"} />
          </mesh>
        </>
      )}

      {spec.kind === "mcb" && (
        <>
          <mesh position={[0, 1.0, 0]} castShadow>
            <boxGeometry args={[1.8, 2.0, 0.9]} />
            <meshStandardMaterial color="#e4e4e7" roughness={0.6} />
          </mesh>
          <mesh position={[0, 1.0, 0.46]} rotation={[running ? 0.5 : -0.5, 0, 0]}>
            <boxGeometry args={[0.25, 0.6, 0.12]} />
            <meshStandardMaterial color="#52525b" />
          </mesh>
        </>
      )}

      {spec.kind === "timer" && (
        <>
          <mesh position={[0, 0.6, 0]} castShadow>
            <boxGeometry args={[1.8, 1.2, 1]} />
            <meshStandardMaterial color="#3f3f46" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.7, 0.51]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.28, 0.28, 0.08, 24]} />
            <meshStandardMaterial color={coilOn ? "#f59e0b" : "#a1a1aa"} emissive={coilOn ? "#92400e" : "#000"} />
          </mesh>
        </>
      )}

      {(spec.kind === "push-button-no" || spec.kind === "push-button-nc") && (
        <>
          <mesh position={[0, 0.35, 0]} castShadow>
            <boxGeometry args={[1.3, 0.7, 0.7]} />
            <meshStandardMaterial color={spec.kind === "push-button-nc" ? "#b91c1c" : "#16a34a"} roughness={0.5} />
          </mesh>
          <mesh position={[0, pressed ? 0.74 : 0.8, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.16, 0.18, 20]} />
            <meshStandardMaterial color="#f4f4f5" />
          </mesh>
        </>
      )}

      {spec.kind === "switch" && (
        <>
          <mesh position={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[1.2, 0.6, 0.8]} />
            <meshStandardMaterial color="#e4e4e7" roughness={0.6} />
          </mesh>
          <group position={[0, 0.6, 0]} rotation={[0, 0, switchOn ? 0.55 : -0.55]}>
            <mesh position={[0, 0.28, 0]} castShadow>
              <boxGeometry args={[0.14, 0.56, 0.14]} />
              <meshStandardMaterial color={switchOn ? "#dc2626" : "#71717a"} />
            </mesh>
          </group>
        </>
      )}

      {spec.kind === "overload" && (
        <>
          <mesh position={[0, 0.65, 0]} castShadow>
            <boxGeometry args={[2.3, 1.3, 0.9]} />
            <meshStandardMaterial color="#52525b" roughness={0.5} />
          </mesh>
          <mesh position={[0.1, 0.7, 0.46]}>
            <boxGeometry args={[1.0, 0.3, 0.02]} />
            <meshStandardMaterial color="#f59e0b" />
          </mesh>
        </>
      )}

      {spec.kind === "contactor" && (
        <>
          <mesh position={[0.05, 0.65, 0]} castShadow>
            <boxGeometry args={[2.5, 1.3, 1.1]} />
            <meshStandardMaterial color="#3f3f46" roughness={0.5} />
          </mesh>
          <mesh position={[0.05, 1.55, 0]} castShadow>
            <boxGeometry args={[2.5, 0.55, 0.95]} />
            <meshStandardMaterial color="#52525b" roughness={0.5} />
          </mesh>
          {/* coil window - pulls in with a quick dip when energized */}
          <mesh position={[0.9, 0.45, coilOn ? 0.54 : 0.56]}>
            <boxGeometry args={[0.8, 0.5, 0.05]} />
            <meshStandardMaterial
              color={coilOn ? "#ef4444" : "#71717a"}
              emissive={coilOn ? "#dc2626" : "#000"}
              emissiveIntensity={coilOn ? 0.9 : 0}
            />
          </mesh>
        </>
      )}

      {spec.kind === "bulb" && (
        <>
          <mesh position={[0, 0.35, 0]} castShadow>
            <cylinderGeometry args={[0.34, 0.4, 0.7, 20]} />
            <meshStandardMaterial color="#71717a" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <sphereGeometry args={[0.45, 28, 28]} />
            <meshStandardMaterial
              color={lampOn ? "#fef9c3" : "#e4e4e7"}
              emissive={lampOn ? "#fde047" : "#000"}
              emissiveIntensity={lampOn ? 1.4 : 0}
              transparent
              opacity={0.92}
            />
          </mesh>
          {lampOn && <pointLight position={[0, 1.2, 0]} intensity={6} distance={6} color="#fde047" />}
        </>
      )}

      {spec.kind === "motor" && (
        <>
          <mesh position={[0, 0.15, 0]} receiveShadow>
            <boxGeometry args={[1.9, 0.3, 1.9]} />
            <meshStandardMaterial color="#3f3f46" />
          </mesh>
          <mesh position={[0, 0.95, 0]} castShadow>
            <cylinderGeometry args={[0.75, 0.75, 1.3, 28]} />
            <meshStandardMaterial color="#27272a" roughness={0.45} metalness={0.3} />
          </mesh>
          <mesh ref={shaft} position={[0, 1.75, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.09, 0.45, 14]} />
            <meshStandardMaterial color={motorState !== "stopped" ? "#dc2626" : "#a1a1aa"} metalness={0.6} />
          </mesh>
          {motorState !== "stopped" && (
            <mesh position={[0, 2.15, 0]}>
              <torusGeometry args={[0.16, 0.04, 10, 24]} />
              <meshStandardMaterial color="#dc2626" emissive="#7f1d1d" />
            </mesh>
          )}
        </>
      )}

      <Html position={[0, spec.kind === "bulb" ? 2.1 : spec.kind === "motor" ? 2.6 : spec.kind === "contactor" ? 2.4 : 1.9, 0]} center style={{ pointerEvents: "none" }}>
        <div className="whitespace-nowrap rounded-full bg-zinc-900/85 px-2.5 py-1 text-[11px] font-semibold text-white">
          {spec.label}
        </div>
      </Html>
    </group>
  );
}

function Wire3D({
  project,
  wire,
  live,
  isFault,
  selected,
  onSelect,
}: {
  project: ProjectSpec;
  wire: Wire;
  live: boolean;
  isFault: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const geom = useMemo(() => {
    const a = terminalWorld(project, wire.from);
    const b = terminalWorld(project, wire.to);
    if (!a || !b) return null;
    const va = new THREE.Vector3(...a);
    const vb = new THREE.Vector3(...b);
    const mid = va.clone().add(vb).multiplyScalar(0.5);
    mid.y += 0.9 + va.distanceTo(vb) * 0.12;
    const curve = new THREE.QuadraticBezierCurve3(va, mid, vb);
    return new THREE.TubeGeometry(curve, 32, 0.045, 8, false);
  }, [wire.from, wire.to, project.id]);
  if (!geom) return null;
  const color = selected ? "#f97316" : isFault ? "#f59e0b" : live ? "#dc2626" : "#0ea5e9";
  return (
    <mesh
      geometry={geom}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(wire.id);
      }}
    >
      <meshStandardMaterial
        color={color}
        emissive={live ? "#7f1d1d" : selected ? "#7c2d12" : "#000"}
        roughness={0.4}
      />
    </mesh>
  );
}

export function LabThreeView(props: Props) {
  const {
    project,
    placed,
    wires,
    pressed,
    switchesOn,
    running,
    coils,
    lamps,
    motor,
    energized,
    activeTerminal,
    faultTerminals,
    suggestedTerminals,
    selectedWire,
    selectedComponent,
    onTerminalClick,
    onToggleSwitch,
    onSelectComponent,
    onWireSelect,
  } = props;

  const placedComponents = project.requiredComponents.filter((c) => placed.has(c.id));
  const pos3 = POS3D_BY_PROJECT[project.id] ?? {};

  return (
    <Canvas
      shadows
      camera={{ position: [0, 11, 16], fov: 45 }}
      className="rounded-xl"
      style={{ background: "#f1f3f6" }}
      onPointerMissed={() => onWireSelect("")}
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[6, 10, 5]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#e8eaee" roughness={0.9} />
      </mesh>
      <gridHelper args={[40, 40, "#c7ccd4", "#dde1e7"]} position={[0, 0.01, 0]} />

      {wires.map((w) => {
        const live = running && energized.has(w.from) && energized.has(w.to);
        const isFault = faultTerminals.has(w.from) && faultTerminals.has(w.to);
        return (
          <Wire3D
            key={w.id}
            project={project}
            wire={w}
            live={live}
            isFault={isFault}
            selected={selectedWire === w.id}
            onSelect={onWireSelect}
          />
        );
      })}

      {placedComponents.map((spec) => {
        const p = pos3[spec.id] ?? [0, 0, 0];
        return (
          <Component3D
            key={spec.id}
            spec={spec}
            position={p}
            selected={selectedComponent === spec.id}
            coilOn={!!coils[spec.id]}
            lampOn={!!lamps[spec.id]}
            switchOn={switchesOn.has(spec.id)}
            pressed={pressed.has(spec.id)}
            motorState={motor}
            running={running}
            onToggleSwitch={onToggleSwitch}
            onSelect={onSelectComponent}
          />
        );
      })}

      {placedComponents.map((spec) =>
        spec.terminals.map((t) => {
          const wp = terminalWorld(project, t.id);
          if (!wp) return null;
          const state: "active" | "fault" | "live" | "suggested" | "idle" =
            activeTerminal === t.id
              ? "active"
              : faultTerminals.has(t.id)
                ? "fault"
                : suggestedTerminals.has(t.id)
                  ? "suggested"
                  : energized.has(t.id)
                    ? "live"
                    : "idle";
          return (
            <Terminal
              key={t.id}
              id={t.id}
              label={t.label}
              specLabel={spec.label}
              position={wp}
              state={state}
              onClick={onTerminalClick}
            />
          );
        }),
      )}

      <OrbitControls target={[0, 0.8, 0]} maxPolarAngle={1.45} minDistance={4} maxDistance={28} makeDefault />
    </Canvas>
  );
}
