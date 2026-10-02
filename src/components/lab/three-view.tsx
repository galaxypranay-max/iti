"use client";
import { useFrame } from "@react-three/fiber";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
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
  onTerminalClick: (id: string) => void;
  onToggleSwitch: (id: string) => void;
}

type Vec3 = [number, number, number];

/** Local offset of each terminal relative to its component origin. */
function terminalOffset(kind: string, label: string): Vec3 {
  const left = label.startsWith("1") || label === "95" || label.startsWith("13") || label.startsWith("21") || label === "A1";
  switch (kind) {
    case "supply":
      return label.startsWith("L") ? [-0.5, 0.6, 0.55] : [0.5, 0.6, 0.55];
    case "push-button-no":
    case "push-button-nc":
    case "switch":
      return [left ? -0.45 : 0.45, 0.45, 0.35];
    case "overload":
      return [left ? -0.55 : 0.55, 0.5, 0.35];
    case "bulb":
      return [label === "1" ? -0.3 : 0.3, 0.75, 0.35];
    case "contactor":
      if (label === "A1") return [-0.5, 0.6, 0.55];
      if (label === "A2") return [0.5, 0.6, 0.55];
      if (label.startsWith("13")) return [-1.1, 1.0, 0.3];
      if (label.startsWith("14")) return [1.1, 1.0, 0.3];
      if (label.startsWith("21")) return [-1.1, 0.5, 0.3];
      return [1.1, 0.5, 0.3]; // 22
    case "motor":
      return label === "U" ? [-0.35, 1.15, 0] : label === "V" ? [0, 1.15, 0] : [0.35, 1.15, 0];
    default:
      return [0, 0.6, 0.6];
  }
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

/** Clickable terminal sphere with hover tooltip. */
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
  state: "active" | "fault" | "live" | "idle";
  onClick: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const color = state === "active" ? "#2563eb" : state === "fault" ? "#f59e0b" : state === "live" ? "#dc2626" : "#9ca3af";
  return (
    <group position={position}>
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
        <sphereGeometry args={[0.11, 20, 20]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} emissive={state === "live" ? "#7f1d1d" : "#000"} />
      </mesh>
      {hovered && (
        <Html position={[0, 0.35, 0]} center style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded-md bg-zinc-900/90 px-2 py-1 text-xs text-white">
            {specLabel} - {label}
          </div>
        </Html>
      )}
    </group>
  );
}

/** One 3D component model. */
function Component3D({
  spec,
  position,
  coilOn,
  lampOn,
  switchOn,
  pressed,
  motorState,
  running,
  onToggleSwitch,
}: {
  spec: ComponentSpec;
  position: Vec3;
  coilOn: boolean;
  lampOn: boolean;
  switchOn: boolean;
  pressed: boolean;
  motorState: "forward" | "reverse" | "stopped";
  running: boolean;
  onToggleSwitch: (id: string) => void;
}) {
  const shaft = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (shaft.current && running && motorState !== "stopped") {
      shaft.current.rotation.y += motorState === "reverse" ? -0.12 : 0.12;
    }
  });

  const onSelect = spec.kind === "switch"
    ? (e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        onToggleSwitch(spec.id);
      }
    : undefined;

  return (
    <group position={position} onClick={onSelect}>
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
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[1.5, 1.0, 0.8]} />
            <meshStandardMaterial color="#52525b" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.55, 0.41]}>
            <boxGeometry args={[0.8, 0.3, 0.02]} />
            <meshStandardMaterial color="#f59e0b" />
          </mesh>
        </>
      )}

      {spec.kind === "contactor" && (
        <>
          <mesh position={[0, 0.6, 0]} castShadow>
            <boxGeometry args={[2.2, 1.2, 1.1]} />
            <meshStandardMaterial color="#3f3f46" roughness={0.5} />
          </mesh>
          <mesh position={[0, 1.45, 0]} castShadow>
            <boxGeometry args={[2.2, 0.55, 0.95]} />
            <meshStandardMaterial color="#52525b" roughness={0.5} />
          </mesh>
          {/* coil window glows when energized */}
          <mesh position={[0, 0.65, 0.56]}>
            <boxGeometry args={[0.8, 0.55, 0.03]} />
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
            <boxGeometry args={[1.7, 0.3, 1.7]} />
            <meshStandardMaterial color="#3f3f46" />
          </mesh>
          <mesh position={[0, 0.95, 0]} castShadow>
            <cylinderGeometry args={[0.72, 0.72, 1.3, 28]} />
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

      {/* label pill above the component */}
      <Html position={[0, spec.kind === "bulb" ? 2 : spec.kind === "motor" ? 2.5 : 1.9, 0]} center style={{ pointerEvents: "none" }}>
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
}: {
  project: ProjectSpec;
  wire: Wire;
  live: boolean;
  isFault: boolean;
}) {
  const a = terminalWorld(project, wire.from);
  const b = terminalWorld(project, wire.to);
  const geom = useMemo(() => {
    if (!a || !b) return null;
    const va = new THREE.Vector3(...a);
    const vb = new THREE.Vector3(...b);
    const mid = va.clone().add(vb).multiplyScalar(0.5);
    mid.y += 0.9 + va.distanceTo(vb) * 0.12;
    const curve = new THREE.QuadraticBezierCurve3(va, mid, vb);
    return new THREE.TubeGeometry(curve, 32, 0.045, 8, false);
  }, [wire.from, wire.to, project.id]);
  if (!geom) return null;
  const color = isFault ? "#f59e0b" : live ? "#dc2626" : "#0ea5e9";
  return (
    <mesh geometry={geom}>
      <meshStandardMaterial color={color} emissive={live ? "#7f1d1d" : "#000"} roughness={0.4} />
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
    onTerminalClick,
    onToggleSwitch,
  } = props;

  const placedComponents = project.requiredComponents.filter((c) => placed.has(c.id));
  const pos3 = POS3D_BY_PROJECT[project.id] ?? {};

  return (
    <Canvas
      shadows
      camera={{ position: [0, 10, 14], fov: 45 }}
      className="rounded-xl"
      style={{ background: "#f1f3f6" }}
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[6, 10, 5]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
      {/* workbench */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#e8eaee" roughness={0.9} />
      </mesh>
      <gridHelper args={[40, 40, "#c7ccd4", "#dde1e7"]} position={[0, 0.01, 0]} />

      {/* wires */}
      {wires.map((w) => {
        const live = running && energized.has(w.from) && energized.has(w.to);
        const isFault = faultTerminals.has(w.from) && faultTerminals.has(w.to);
        return <Wire3D key={w.id} project={project} wire={w} live={live} isFault={isFault} />;
      })}

      {/* components */}
      {placedComponents.map((spec) => {
        const p = pos3[spec.id] ?? [0, 0, 0];
        return (
          <Component3D
            key={spec.id}
            spec={spec}
            position={p}
            coilOn={!!coils[spec.id]}
            lampOn={!!lamps[spec.id]}
            switchOn={switchesOn.has(spec.id)}
            pressed={pressed.has(spec.id)}
            motorState={motor}
            running={running}
            onToggleSwitch={onToggleSwitch}
          />
        );
      })}

      {/* terminals of placed components */}
      {placedComponents.map((spec) =>
        spec.terminals.map((t) => {
          const wp = terminalWorld(project, t.id);
          if (!wp) return null;
          const state: "active" | "fault" | "live" | "idle" =
            activeTerminal === t.id ? "active" : faultTerminals.has(t.id) ? "fault" : energized.has(t.id) ? "live" : "idle";
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

      <OrbitControls
        target={[0, 0.8, 0]}
        maxPolarAngle={1.45}
        minDistance={4}
        maxDistance={26}
        makeDefault
      />
    </Canvas>
  );
}
