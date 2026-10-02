import type { ProjectSpec } from "@/types";
import { bulbOnOff } from "./bulb-on-off";
import { forwardReverseJogging } from "./forward-reverse-jogging";
import { starDeltaStarter } from "./star-delta-starter";

/**
 * Project registry - data-driven per PRD.
 * Only syllabus-approved practicals are listed here
 * (ITI Electrician 2nd Year, NIMI Trade Practical - verified).
 */
export const projects: ProjectSpec[] = [bulbOnOff, forwardReverseJogging, starDeltaStarter];

export function getProjectBySlug(slug: string): ProjectSpec | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getProjectSlugs(): string[] {
  return projects.map((p) => p.slug);
}
