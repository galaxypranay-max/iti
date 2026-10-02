"use client";

import { useEffect, useState } from "react";

export interface ProjectProgress {
  bestScore: number;
  maxScore: number;
  attempts: number;
  completed: boolean;
  lastMode: "learn" | "practice" | "exam";
  updatedAt: string;
}

export type ProgressMap = Record<string, ProjectProgress>;

const KEY = "iti-lab-progress";

function read(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as ProgressMap;
  } catch {
    return {};
  }
}

function write(map: ProgressMap) {
  localStorage.setItem(KEY, JSON.stringify(map));
  window.dispatchEvent(new Event("iti-progress-updated"));
}

export function saveResult(
  projectId: string,
  score: number,
  maxScore: number,
  mode: "learn" | "practice" | "exam",
) {
  const map = read();
  const prev = map[projectId];
  map[projectId] = {
    bestScore: Math.max(prev?.bestScore ?? 0, score),
    maxScore,
    attempts: (prev?.attempts ?? 0) + 1,
    completed: (prev?.completed ?? false) || score >= maxScore * 0.8,
    lastMode: mode,
    updatedAt: new Date().toISOString(),
  };
  write(map);
}

export function useProgress(): ProgressMap {
  const [map, setMap] = useState<ProgressMap>({});
  useEffect(() => {
    const update = () => setMap(read());
    update();
    window.addEventListener("iti-progress-updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("iti-progress-updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return map;
}
