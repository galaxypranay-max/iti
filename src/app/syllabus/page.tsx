import Link from "next/link";
import { projects } from "@/data/projects";
import { DifficultyBadge } from "@/components/ui/badge";

export const metadata = { title: "Syllabus - ITI Electrical Lab" };

export default function SyllabusPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <nav className="mb-6 text-sm text-zinc-500">
        <Link href="/" className="hover:underline">Home</Link>
        <span className="mx-2">/</span>
        <span>Electrician</span>
        <span className="mx-2">/</span>
        <span>2nd Year</span>
        <span className="mx-2">/</span>
        <span className="font-medium text-zinc-900 dark:text-zinc-100">Practicals</span>
      </nav>

      <h1 className="text-2xl font-bold sm:text-3xl">Electrician 2nd Year - Practical Projects</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Practicals focused on power contactors and control circuits. Only syllabus-approved projects are listed.
      </p>

      <div className="mt-8 space-y-4">
        {projects.map((p, i) => (
          <Link
            key={p.id}
            href={"/project/" + p.slug}
            className="block rounded-xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-sm font-medium text-zinc-500">Practical {i + 1}</span>
                <h2 className="font-semibold">{p.title}</h2>
              </div>
              <DifficultyBadge difficulty={p.difficulty} />
            </div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{p.shortDescription}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
              <span className="rounded-md bg-zinc-100 px-2 py-1 dark:bg-zinc-800">{p.requiredComponents.length} components</span>
              <span className="rounded-md bg-zinc-100 px-2 py-1 dark:bg-zinc-800">{p.expectedWires.length} connections</span>
              <span className="rounded-md bg-zinc-100 px-2 py-1 dark:bg-zinc-800">{p.vivaQuestions.length} viva questions</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
