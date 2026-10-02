const colors = {
  default: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  green: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  red: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
} as const;

export function Badge({
  color = "default",
  children,
}: {
  color?: keyof typeof colors;
  children: React.ReactNode;
}) {
  return (
    <span className={"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium " + colors[color]}>
      {children}
    </span>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const color = difficulty === "beginner" ? "green" : difficulty === "intermediate" ? "amber" : "red";
  return <Badge color={color}>{difficulty}</Badge>;
}
