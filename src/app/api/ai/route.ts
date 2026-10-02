import { NextResponse } from "next/server";
import { z } from "zod";
import { getProjectBySlug } from "@/data/projects";

export const runtime = "nodejs";

const BodySchema = z.object({
  projectSlug: z.string().min(1).max(100),
  mode: z.enum(["learn", "practice", "exam"]).default("learn"),
  question: z.string().min(1).max(2000),
});

// Naive in-memory rate limit (per serverless instance).
const hits = new Map<string, { count: number; reset: number }>();
const WINDOW_MS = 60_000;
const MAX_REQ = 20;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.reset < now) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_REQ;
}

/** Offline/deterministic fallback so the lab still teaches without an API key. */
function fallbackReply(question: string, slug: string): string {
  const q = question.toLowerCase();
  const project = getProjectBySlug(slug);
  if (!project) return "Please open a practical first, then ask me about it.";

  if (q.includes("not working") || q.includes("hint") || q.includes("galat") || q.includes("mistake")) {
    return [
      "Troubleshooting checklist for this practical:",
      "1. Stop button must be NC and in series from Phase L.",
      "2. Overload NC (95-96) must sit after the Stop button.",
      "3. Each coil needs: feed through the OTHER contactor's NC 21-22 (interlock) plus its own start button, and A2 back to Neutral.",
      "4. Latch: the start-button output also feeds the contactor's own NO 13; NO 14 returns to A1.",
      "5. No wire should go directly from L to N (dead short).",
      "",
      "Press Check - faulty terminals get highlighted, then fix them one by one.",
    ].join("\n");
  }
  if (q.includes("explain") && (q.includes("circuit") || q.includes("this"))) {
    return project.workingPrinciple + "\n\n" + project.explanation;
  }
  if (q.includes("contactor") || q.includes("relay")) {
    return "A power contactor has coil terminals A1-A2, NO auxiliary contacts 13-14 (closed when the coil is energized) and NC auxiliary contacts 21-22 (open when energized). In this practical KM1/KM2 switch the motor and their auxiliary contacts create the latch and the electrical interlock.";
  }
  if (q.includes("interlock")) {
    return "Electrical interlocking means each contactor's NC auxiliary contact (21-22) is wired in series with the OTHER contactor's coil. When KM1 is on, its NC is open, so KM2's coil can never get supply - and vice versa. This prevents a phase-to-phase short.";
  }
  if (q.includes("jog") || q.includes("inch")) {
    return "Jogging/inching means the motor runs only while the button is held - the coil circuit bypasses the latching NO contact, so the contactor drops the moment you release the button. Used for precise positioning of machines.";
  }
  if (q.includes("viva")) {
    const v = project.vivaQuestions[Math.floor(Math.random() * project.vivaQuestions.length)];
    return "Viva question: " + v.question + "\n\n(Think first! Then ask again with 'answer' to reveal.)";
  }
  if (q.includes("safety") || q.includes("safe")) {
    return project.safetyNotes.map((s, i) => (i + 1) + ". " + s).join("\n");
  }
  return [
    'I am scoped to "' + project.title + '" only (offline mode - no AI key configured on the server).',
    "Try: explain this circuit / why is it not working / give me a hint / explain the contactor / interlock / jogging / ask me a viva question.",
  ].join("\n");
}

function buildSystemPrompt(slug: string, mode: string): string {
  const p = getProjectBySlug(slug);
  if (!p) return "You are an ITI electrical lab assistant. No project selected.";
  return [
    "You are a patient ITI Electrician instructor inside a virtual lab. Answer ONLY about the selected practical; if asked something unrelated, politely redirect.",
    "Keep answers short, simple, beginner-friendly. Use Hinglish if the student writes in Hindi/Hinglish.",
    "Selected practical: " + p.title + ". Objective: " + p.objective,
    "Working principle: " + p.workingPrinciple,
    "Correct wiring pairs: " + p.expectedWires.map(([a, b]) => a + " to " + b).join("; "),
    mode === "practice"
      ? "Mode: PRACTICE - give hints and guide discovery, never dump the full solution at once."
      : mode === "exam"
        ? "Mode: EXAM - do NOT help solve the circuit. Answer only conceptual/safety questions."
        : "Mode: LEARN - explain openly and thoroughly.",
    "Never invent terminal numbers or wiring not in the pairs above. Distinguish simulation from real wiring and remind about safety.",
  ].join("\n");
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { reply: "Too many requests - please wait a minute and try again." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { projectSlug, mode, question } = parsed.data;
  if (!getProjectBySlug(projectSlug)) {
    return NextResponse.json({ error: "Unknown project" }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ reply: fallbackReply(question, projectSlug), offline: true });
  }

  const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        messages: [
          { role: "system", content: buildSystemPrompt(projectSlug, mode) },
          { role: "user", content: question },
        ],
      }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) {
      return NextResponse.json({ reply: fallbackReply(question, projectSlug), offline: true });
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const reply = data.choices?.[0]?.message?.content?.trim();
    return NextResponse.json({ reply: reply || fallbackReply(question, projectSlug) });
  } catch {
    return NextResponse.json({ reply: fallbackReply(question, projectSlug), offline: true });
  }
}
