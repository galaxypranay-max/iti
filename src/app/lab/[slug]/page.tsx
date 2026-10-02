import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/data/projects";
import { LabClient } from "@/components/lab/lab-client";

export default async function LabPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { slug } = await params;
  const { mode } = await searchParams;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const safeMode = mode === "learn" || mode === "practice" || mode === "exam" ? mode : "learn";
  return <LabClient project={project} mode={safeMode} />;
}
