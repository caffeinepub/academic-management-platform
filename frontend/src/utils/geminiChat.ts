import type { TimetableSlot, Task } from '../backend';

function formatSlotTime(startTime: bigint): string {
  const total = Number(startTime);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function formatTaskDate(ns: bigint): string {
  const ms = Number(ns / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function buildSystemPrompt(slots: TimetableSlot[], tasks: Task[]): string {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  let prompt = `You are AcadMind AI, a helpful academic assistant for a student. Today is ${today}.\n\n`;

  if (slots.length > 0) {
    prompt += `## Student's Timetable\n`;
    const byDay: Record<string, TimetableSlot[]> = {};
    for (const slot of slots) {
      if (!byDay[slot.dayOfWeek]) byDay[slot.dayOfWeek] = [];
      byDay[slot.dayOfWeek].push(slot);
    }
    for (const [day, daySlots] of Object.entries(byDay)) {
      prompt += `**${day}:**\n`;
      for (const s of daySlots) {
        prompt += `  - ${s.subject} at ${formatSlotTime(s.startTime)}, duration ${s.durationMinutes} min${s.location ? `, location: ${s.location}` : ''}\n`;
      }
    }
    prompt += '\n';
  } else {
    prompt += `## Student's Timetable\nNo timetable slots saved yet.\n\n`;
  }

  if (tasks.length > 0) {
    const pending = tasks.filter((t) => !t.completed);
    const completed = tasks.filter((t) => t.completed);
    prompt += `## Student's Assignments & Tasks\n`;
    prompt += `Total: ${tasks.length} (${pending.length} pending, ${completed.length} completed)\n`;
    if (pending.length > 0) {
      prompt += `\n**Pending tasks:**\n`;
      for (const t of pending) {
        const due = t.dueDate ? ` — due ${formatTaskDate(t.dueDate)}` : '';
        prompt += `  - ${t.title}${due}${t.description ? `: ${t.description}` : ''}\n`;
      }
    }
    prompt += '\n';
  } else {
    prompt += `## Student's Assignments & Tasks\nNo tasks saved yet.\n\n`;
  }

  prompt += `Answer the student's questions helpfully and concisely. Use the context above to give personalized answers about their schedule and tasks. Format responses with markdown-style bold (**text**) for emphasis where appropriate.`;

  return prompt;
}

export interface ConversationTurn {
  role: 'user' | 'model';
  text: string;
}

export async function callGeminiApi(
  apiKey: string,
  userMessage: string,
  history: ConversationTurn[],
  slots: TimetableSlot[],
  tasks: Task[]
): Promise<string> {
  const systemPrompt = buildSystemPrompt(slots, tasks);

  const contents = [
    ...history.map((turn) => ({
      role: turn.role,
      parts: [{ text: turn.text }],
    })),
    {
      role: 'user',
      parts: [{ text: userMessage }],
    },
  ];

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = (errData as { error?: { message?: string } })?.error?.message || `HTTP ${response.status}`;
    throw new Error(errMsg);
  }

  const data = await response.json() as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No response from Gemini API');
  return text;
}
