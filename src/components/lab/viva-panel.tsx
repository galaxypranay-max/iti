"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function VivaPanel({ questions }: { questions: { id: string; question: string; answer: string }[] }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const q = questions[index];

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="text-sm font-medium text-zinc-500">
        Viva Practice - Question {index + 1} of {questions.length}
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="font-medium">{q.question}</p>
        {revealed ? (
          <p className="mt-3 border-t border-zinc-200 pt-3 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
            {q.answer}
          </p>
        ) : (
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setRevealed(true)}>
            Show answer
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={index === 0}
          onClick={() => {
            setIndex((i) => i - 1);
            setRevealed(false);
          }}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={index === questions.length - 1}
          onClick={() => {
            setIndex((i) => i + 1);
            setRevealed(false);
          }}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
