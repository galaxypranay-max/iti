"use client";

import { useRef, useState } from "react";
import type { ProjectSpec } from "@/types";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  "Explain this circuit",
  "Why is it not working?",
  "Give me a hint",
  "Explain the contactor",
  "Ask me a viva question",
];

export function AiPanel({ project, mode, faults }: { project: ProjectSpec; mode: string; faults?: string[] }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        'Namaste! I am your lab assistant for "' +
        project.title +
        '". Ask me anything about this practical - I can explain, give hints, or ask viva questions. (Hindi/Hinglish mein bhi pooch sakte ho!)',
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const question = text.trim();
    if (!question || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: question }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectSlug: project.slug, mode, question, faults: faults ?? [] }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply ?? "Sorry, technical problem. Try again." },
      ]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Network problem - please try again." }]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => listRef.current?.scrollTo({ top: 999999, behavior: "smooth" }));
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.map((m, i) => (
          <div key={i} className={"flex " + (m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={
                "max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm " +
                (m.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200")
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-sm text-zinc-500">Thinking...</div>}
      </div>

      <div className="flex flex-wrap gap-1.5 border-t border-zinc-200 p-2 dark:border-zinc-800">
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            disabled={loading}
            className="rounded-full border border-zinc-300 px-2.5 py-1 text-xs hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {q}
          </button>
        ))}
      </div>

      <form
        className="flex gap-2 border-t border-zinc-200 p-2 dark:border-zinc-800"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this practical..."
          className="min-h-11 flex-1 rounded-lg border border-zinc-300 bg-transparent px-3 text-sm outline-none focus:border-blue-500 dark:border-zinc-700"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="min-h-11 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
