"use client";

import Link from "next/link";
import { useProgress } from "@/lib/progress";
import { projects } from "@/data/projects";
import { buttonClass } from "@/components/ui/button";

export function ContinuePracticeCard() {
  const progress = useProgress();
  const entry = Object.entries(progress).find(([, v]) => !v.completed);
  const project = entry ? projects.find((p) => p.id === entry[0]) : null;

  if (!project || !entry) {
    return (
      <Link href="/syllabus" className={buttonClass("outline", "lg", "opacity-60")} aria-disabled>
        Continue Practice
      </Link>
    );
  }

  const p = entry[1];
  const title = project.title.length > 28 ? project.title.slice(0, 28) + "..." : project.title;
  return (
    <Link href={"/lab/" + project.slug + "?mode=" + p.lastMode} className={buttonClass("outline", "lg")}>
      Continue: {title} ({p.bestScore}/{p.maxScore})
    </Link>
  );
}
