import Link from "next/link";
import { projects } from "@/data/projects";
import { ButtonLink } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/ui/badge";
import { ContinuePracticeCard } from "@/components/home/continue-card";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-16">
      <section className="flex flex-col items-center gap-5 text-center">
        <span className="rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-sm font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
          ITI Electrician - 2nd Year
        </span>
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
          Your ITI electrical workshop, <span className="text-blue-600 dark:text-blue-400">at home</span>
        </h1>
        <p className="max-w-xl text-base text-zinc-600 dark:text-zinc-400 sm:text-lg">
          Real contactors, push buttons and motors stay in the ITI lab. Practice
          the same syllabus practicals virtually - build the circuit, run it,
          find your mistakes, and prepare for the viva.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/syllabus" size="lg">Start Practicing</ButtonLink>
          <ContinuePracticeCard />
        </div>
      </section>

      <section className="mt-14 grid gap-4 sm:grid-cols-4">
        {[
          ["1. Select", "Pick a practical from your 2nd-year syllabus."],
          ["2. Build", "Place components and connect wires between terminals."],
          ["3. Simulate", "Run the control logic and watch contactors energize."],
          ["4. Learn", "Fix faults, understand the working, practice viva."],
        ].map(([title, desc]) => (
          <div key={title} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{desc}</p>
          </div>
        ))}
      </section>

      <section className="mt-14">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-bold sm:text-2xl">Syllabus Practicals</h2>
          <Link href="/syllabus" className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
            View all &rarr;
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={"/project/" + p.slug}
              className="group rounded-xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400">{p.title}</h3>
                <DifficultyBadge difficulty={p.difficulty} />
              </div>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{p.shortDescription}</p>
            </Link>
          ))}
        </div>
      </section>

      <footer className="mt-16 border-t border-zinc-200 pt-6 text-center text-sm text-zinc-500 dark:border-zinc-800">
        For learning and practice only - real electrical work must be done under qualified instructor supervision.
      </footer>
    </div>
  );
}
