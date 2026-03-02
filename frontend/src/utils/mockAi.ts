import type { TimetableSlot, Task } from '../backend';

function formatTime(minutes: bigint): string {
  const total = Number(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function formatDate(ns: bigint): string {
  const ms = Number(ns / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function generateAiResponse(
  userMessage: string,
  slots: TimetableSlot[],
  tasks: Task[]
): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes('schedule') || lower.includes('timetable') || lower.includes('class')) {
    if (slots.length === 0) {
      return "You don't have any timetable slots saved yet. Head over to the Timetable section to add your schedule!";
    }
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todaySlots = slots.filter(
      (s) => s.dayOfWeek.toLowerCase() === today.toLowerCase()
    );
    if (todaySlots.length > 0) {
      const list = todaySlots
        .map((s) => `• **${s.subject}** at ${formatTime(s.startTime)} (${s.location || 'No location'})`)
        .join('\n');
      return `Here's your schedule for today (${today}):\n\n${list}\n\nYou have ${todaySlots.length} class${todaySlots.length > 1 ? 'es' : ''} today. Stay focused! 📚`;
    }
    return `You have no classes scheduled for today (${today}). Enjoy your free time or use it to review your assignments!`;
  }

  if (lower.includes('task') || lower.includes('assignment') || lower.includes('quiz') || lower.includes('due')) {
    if (tasks.length === 0) {
      return "You have no tasks or assignments saved yet. Use the Assignments section to track your upcoming work!";
    }
    const pending = tasks.filter((t) => !t.completed);
    const completed = tasks.filter((t) => t.completed);
    if (pending.length === 0) {
      return `🎉 Amazing! You've completed all ${tasks.length} task${tasks.length > 1 ? 's' : ''}. Keep up the great work!`;
    }
    const upcoming = pending
      .filter((t) => t.dueDate != null)
      .sort((a, b) => Number((a.dueDate ?? 0n) - (b.dueDate ?? 0n)))
      .slice(0, 3);
    const list = upcoming
      .map((t) => `• **${t.title}** — due ${t.dueDate ? formatDate(t.dueDate) : 'No date'}`)
      .join('\n');
    return `You have **${pending.length}** pending task${pending.length > 1 ? 's' : ''} and **${completed.length}** completed.\n\nUpcoming deadlines:\n${list || '• No dated tasks yet'}\n\nStay on top of your work! 💪`;
  }

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return `Hello! 👋 I'm your academic assistant. I can help you with:\n\n• **Your schedule** — ask about today's classes\n• **Assignments** — check upcoming deadlines\n• **Study tips** — get advice on managing your workload\n\nWhat would you like to know?`;
  }

  if (lower.includes('help') || lower.includes('what can you')) {
    return `I'm your AcadMind AI assistant! Here's what I can help with:\n\n📅 **Schedule** — "What's my schedule today?"\n📝 **Assignments** — "What tasks are due soon?"\n💡 **Study tips** — "Give me study advice"\n\nJust ask away!`;
  }

  if (lower.includes('study') || lower.includes('tip') || lower.includes('advice')) {
    const tips = [
      "Use the **Pomodoro Technique**: study for 25 minutes, then take a 5-minute break. After 4 cycles, take a longer break.",
      "Review your notes within **24 hours** of a lecture — this dramatically improves retention.",
      "Break large assignments into smaller tasks and tackle them one at a time.",
      "Use active recall instead of passive re-reading — test yourself on the material.",
    ];
    const tip = tips[Math.floor(Math.random() * tips.length)];
    return `Here's a study tip for you:\n\n💡 ${tip}\n\nYou've got this! 🎓`;
  }

  const responses = [
    `I understand you're asking about "${userMessage}". Based on your current data, you have ${slots.length} timetable slot${slots.length !== 1 ? 's' : ''} and ${tasks.filter(t => !t.completed).length} pending task${tasks.filter(t => !t.completed).length !== 1 ? 's' : ''}. Is there something specific you'd like to know?`,
    `That's a great question! I'm here to help you manage your academic life. You currently have ${slots.length} classes scheduled and ${tasks.length} total tasks. Try asking me about your schedule or upcoming deadlines!`,
    `I'm processing your request about "${userMessage}". As your academic assistant, I recommend checking your timetable and assignment tracker regularly to stay organized. 📖`,
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}
