import { NextResponse } from "next/server";
import { z } from "zod";
import { getProjectBySlug } from "@/data/projects";

export const runtime = "nodejs";

const BodySchema = z.object({
  projectSlug: z.string().min(1).max(100),
  mode: z.enum(["learn", "practice", "exam"]).default("learn"),
  question: z.string().min(1).max(2000),
  // Validator output passed from the client - the AI explains it, never overrides it
  faults: z.array(z.string().max(300)).max(20).default([]),
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

const NL = "\n";

/** Offline/deterministic fallback so the lab still teaches without an API key. */
function fallbackReply(question: string, slug: string, faults: string[] = []): string {
  const q = question.toLowerCase();
  const project = getProjectBySlug(slug);
  if (!project) return "Please open a practical first, then ask me about it.";

  if (
    faults.length > 0 &&
    (q.includes("not working") || q.includes("galat") || q.includes("mistake") || q.includes("hint") || q.includes("problem") || q.includes("nahi"))
  ) {
    return [
      "The circuit validator found these problems:",
      ...faults.slice(0, 4).map((x, i) => i + 1 + ". " + x),
      "",
      "Fix the highlighted terminals/wires one by one, then press Check again.",
    ].join(NL);
  }
  if (q.includes("explain") && (q.includes("circuit") || q.includes("this"))) {
    return project.workingPrinciple + NL + NL + project.explanation;
  }
  if (q.includes("contactor") || q.includes("relay")) {
    return "A power contactor has coil terminals A1-A2, NO auxiliary contacts 13-14 (closed when the coil is energized) and NC auxiliary contacts 21-22 (open when energized). Its main power terminals are 1-2, 3-4 and 5-6. In contactor practicals these contacts create the latch and the electrical interlock.";
  }
  if (q.includes("interlock")) {
    return "Electrical interlocking means each contactor's NC auxiliary contact (21-22) is wired in series with the OTHER contactor's coil. When KM1 is on, its NC is open, so KM2's coil can never get supply - and vice versa. This prevents a phase-to-phase short.";
  }
  if (q.includes("jog") || q.includes("inch")) {
    return "Jogging/inching means the motor runs only while the button is held - the coil circuit bypasses the latching NO contact, so the contactor drops the moment you release the button. Used for precise positioning of machines.";
  }
  if (q.includes("delta") || q.includes("star-delta") || q.includes("star delta")) {
    return "In STAR the winding voltage is line voltage / root 3 (about 58%), so starting current drops to about one-third. After the timer delay, DELTA gives each winding the full line voltage for normal running. KM2 and KM3 NC interlocks make sure star and delta never close together.";
  }
  if (q.includes("viva")) {
    const v = project.vivaQuestions[Math.floor(Math.random() * project.vivaQuestions.length)];
    return "Viva question: " + v.question + NL + NL + "(Think first! Then ask again with 'answer' to reveal.)";
  }
  if (q.includes("safety") || q.includes("safe")) {
    return project.safetyNotes.map((s, i) => i + 1 + ". " + s).join(NL);
  }
  return [
    'I am scoped to "' + project.title + '" only (offline mode - no AI key configured on the server).',
    "Try: explain this circuit / why is it not working / give me a hint / explain the contactor / interlock / jogging / star delta / ask me a viva question.",
  ].join(NL);
}

function buildSystemPrompt(slug: string, mode: string, faults: string[]): string {
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
    faults.length
      ? "Circuit validator output (explain these, do NOT override them): " + faults.join(" | ")
      : "",
  ].join(NL);
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
  const { projectSlug, mode, question, faults } = parsed.data;
  if (!getProjectBySlug(projectSlug)) {
    return NextResponse.json({ error: "Unknown project" }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ reply: fallbackReply(question, projectSlug, faults), offline: true });
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
          { role: "system", content: buildSystemPrompt(projectSlug, mode, faults) },
          { role: "user", content: question },
        ],
      }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) {
      return NextResponse.json({ reply: fallbackReply(question, projectSlug, faults), offline: true });
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const reply = data.choices?.[0]?.message?.content?.trim();
    return NextResponse.json({ reply: reply || fallbackReply(question, projectSlug, faults) });
  } catch {
    return NextResponse.json({ reply: fallbackReply(question, projectSlug, faults), offline: true });
  }
}
