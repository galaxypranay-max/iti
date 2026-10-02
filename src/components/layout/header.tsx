import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-base text-white">
            &#9889;
          </span>
          <span className="text-sm font-semibold sm:text-base">ITI Electrical Lab</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link href="/" className="rounded-md px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">Home</Link>
          <Link href="/syllabus" className="rounded-md px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">Syllabus</Link>
        </nav>
      </div>
    </header>
  );
}
