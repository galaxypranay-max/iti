import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectBySlug, projects } from "@/data/projects";
import { ButtonLink } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/ui/badge";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <nav className="mb-6 text-sm text-zinc-500">
        <Link href="/syllabus" className="hover:underline">Syllabus</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{project.title}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">{project.title}</h1>
        <DifficultyBadge difficulty={project.difficulty} />
      </div>

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-semibold">Objective</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{project.objective}</p>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 font-semibold">Required Components</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {project.requiredComponents.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950">
                {c.kind === "supply" ? "S" : c.kind === "motor" ? "M" : c.kind === "contactor" ? "K" : "B"}
              </span>
              <span className="text-sm">{c.name}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href={"/lab/" + project.slug + "?mode=learn"} variant="primary" size="lg" className="flex-1">
          Learn
        </ButtonLink>
        <ButtonLink href={"/lab/" + project.slug + "?mode=practice"} variant="outline" size="lg" className="flex-1">
          Practice
        </ButtonLink>
        <ButtonLink href={"/lab/" + project.slug + "?mode=exam"} variant="outline" size="lg" className="flex-1">
          Exam
        </ButtonLink>
      </section>

      <p className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
        This is a virtual simulator for practice. Real wiring must only be done in the ITI lab under instructor supervision.
      </p>
    </div>
  );
}
