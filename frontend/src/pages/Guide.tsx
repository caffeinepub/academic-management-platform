import {
  BookOpen,
  MessageSquare,
  Upload,
  Calendar,
  CheckSquare,
  Clock,
  LayoutDashboard,
  Key,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface GuideSection {
  id: string;
  title: string;
  icon: React.ElementType;
  badge?: string;
  description: string;
  steps: string[];
  tips?: string[];
  extra?: React.ReactNode;
}

const sections: GuideSection[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    badge: 'Home',
    description:
      "The Dashboard is your central hub — it gives you a bird's-eye view of your academic day at a glance.",
    steps: [
      "Open the app — you land on the Dashboard automatically at '/'.",
      "The hero banner shows today's date and a motivational greeting.",
      'The Stats row shows total timetable slots, pending tasks, and completed tasks.',
      "\"Today's Schedule\" card lists every class slot scheduled for the current day of the week.",
      '"Upcoming Tasks" card shows your nearest pending assignments sorted by due date.',
      'Use the four Quick-Action buttons (Add Slot, Add Task, Upload Timetable, View Chat) to jump directly to any feature.',
    ],
    tips: [
      'Bookmark the Dashboard URL for the fastest daily check-in.',
      'Completed tasks are automatically excluded from the Upcoming Tasks list.',
    ],
  },
  {
    id: 'chat',
    title: 'AI Chat (Gemini)',
    icon: MessageSquare,
    badge: 'AI',
    description:
      'The AI Chat page lets you have a conversation with Google Gemini, which is aware of your timetable and tasks so it can give personalised academic advice.',
    steps: [
      'Before using the chat, you need a free Gemini API key from Google AI Studio.',
      'Click the link below (or visit https://aistudio.google.com/api-keys) to open Google AI Studio.',
      'Sign in with your Google account, then click "Create API key" and copy the generated key.',
      'Back in AcadMind, paste the key into the "Gemini API Key" input at the bottom of the sidebar and click Save Key.',
      'Navigate to Chat in the sidebar — the amber warning banner will disappear once a key is saved.',
      'Type your question in the input box at the bottom and press Enter or click the Send button.',
      'The AI has full context of your timetable slots and pending tasks, so you can ask things like "What classes do I have tomorrow?" or "Summarise my pending assignments."',
      'Use the trash icon (top-right of the chat page) to clear the conversation history.',
    ],
    tips: [
      'Your API key is stored only in your browser (localStorage) — it is never sent to any AcadMind server.',
      'The free tier of Google AI Studio is generous enough for daily academic use.',
      'Conversation history is kept in memory for the current session; refreshing the page starts a fresh chat.',
    ],
    extra: (
      <div className="mt-4 space-y-4">
        {/* API Key Link */}
        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <Key className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Get your free Gemini API Key</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Visit Google AI Studio to create a key in under 60 seconds.
            </p>
          </div>
          <a
            href="https://aistudio.google.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors shrink-0"
          >
            Open AI Studio
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Screenshot */}
        <div className="rounded-xl overflow-hidden border border-border shadow-sm">
          <div className="bg-muted/60 px-4 py-2 flex items-center gap-2 border-b border-border">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-400/70" />
              <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
              <span className="h-3 w-3 rounded-full bg-green-400/70" />
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              https://aistudio.google.com/api-keys
            </span>
          </div>
          <img
            src="/assets/image.png"
            alt="Google AI Studio API Keys page showing the API key management interface"
            className="w-full max-w-full object-cover"
            onError={(e) => {
              // Fallback: hide image if not found
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="bg-muted/40 px-4 py-2 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Google AI Studio — API Keys management page
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'timetable-upload',
    title: 'Timetable — OCR Upload',
    icon: Upload,
    badge: 'Coming Soon',
    description:
      'The OCR Upload page will let you photograph or scan a printed timetable and have it automatically extracted into digital slots.',
    steps: [
      'Navigate to Timetable → OCR Upload in the sidebar.',
      'Drag and drop a timetable image onto the upload zone, or click "Browse files" to select one.',
      'A preview of the uploaded image is shown immediately.',
      'Click "Extract Timetable" — a loading spinner appears while processing.',
      'Currently the extraction feature is marked as Coming Soon; the extracted slots editor will be available in a future update.',
      'Once extraction is live, you will be able to review, edit, and save the detected slots directly on this page.',
    ],
    tips: [
      'For best results, use a clear, well-lit photo with the timetable grid fully visible.',
      'Supported formats: JPG, PNG, WebP.',
    ],
  },
  {
    id: 'timetable-manual',
    title: 'Timetable — Manual Slots',
    icon: Calendar,
    badge: 'Full Feature',
    description:
      'The Manual Slots page lets you build your weekly timetable by hand — add, edit, and delete class slots in a visual weekly grid.',
    steps: [
      'Navigate to Timetable → Manual Slots in the sidebar.',
      'The page shows a grid with one column per day of the week (Monday–Sunday).',
      'Click the "+ Add Slot" button (top-right) to open the slot creation dialog.',
      'Fill in Subject, Day of Week, Start Time, Duration (minutes), and Location, then click Save.',
      'The new slot appears as a card in the correct day column, sorted by start time.',
      'Hover over any slot card to reveal the Edit (pencil) and Delete (trash) icon buttons.',
      'Click Edit to open the pre-filled dialog and update any field, then Save.',
      'Click Delete and confirm to permanently remove the slot.',
    ],
    tips: [
      'Slots are stored in the backend canister and persist across sessions.',
      'The Dashboard "Today\'s Schedule" card reads from these same slots.',
    ],
  },
  {
    id: 'assignments',
    title: 'Assignments',
    icon: CheckSquare,
    badge: 'Full Feature',
    description:
      'The Assignments page is your task manager — track pending and completed academic tasks with due dates and descriptions.',
    steps: [
      'Navigate to Assignments in the sidebar.',
      'Use the filter tabs at the top to switch between All, Pending, and Completed views.',
      'Click "+ Add Task" to open the task creation dialog.',
      'Enter a Title, optional Due Date, and optional Description, then click Save.',
      'Each task card shows the title, due date, description, and status badges (Overdue / Due Soon).',
      'Click the circle checkbox on a task card to mark it as completed — it moves to the Completed tab.',
      'Hover over a card to reveal Edit and Delete buttons.',
      'Click Edit to update the task details; click Delete to remove it permanently.',
    ],
    tips: [
      'Tasks marked as overdue (past due date, still pending) are highlighted with a red badge.',
      'Tasks due within 48 hours show an amber "Due Soon" badge.',
      'Completed tasks are excluded from the Dashboard Upcoming Tasks widget.',
    ],
  },
  {
    id: 'day-tracker',
    title: 'Day Tracker',
    icon: Clock,
    badge: 'Full Feature',
    description:
      'The Day Tracker helps you log how you spend your study hours each day and visualise your productivity over the past week.',
    steps: [
      'Navigate to Day Tracker in the sidebar.',
      'The page opens on today\'s date by default.',
      'Click "+ Add Entry" to log a study session — enter the number of hours and a description of what you worked on.',
      'Each entry card shows the hours, description, and timestamp.',
      'Every card has always-visible Edit (pencil) and Delete (trash) buttons.',
      'Click Edit to open the pre-filled modal and update the hours or description, then Save.',
      'Click Delete — a confirmation dialog appears before the entry is removed.',
      'The Daily Summary section at the top recalculates total hours automatically after any change.',
      'The 7-Day Comparison chart at the bottom shows your daily hour totals for the past week.',
    ],
    tips: [
      'Day Tracker data is stored in your browser\'s localStorage — it is private to your device.',
      'Use the description field to note specific topics (e.g., "Chapter 5 revision — Calculus") for better reflection.',
      'Aim for consistent daily entries to make the 7-day chart meaningful.',
    ],
  },
];

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-2 mt-3">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3 text-sm text-foreground/80">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold mt-0.5">
            {i + 1}
          </span>
          <span className="leading-relaxed">{step}</span>
        </li>
      ))}
    </ol>
  );
}

function TipList({ tips }: { tips: string[] }) {
  return (
    <div className="mt-4 rounded-xl bg-accent/30 border border-accent/40 px-4 py-3 space-y-1.5">
      <div className="flex items-center gap-1.5 mb-2">
        <Info className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold text-primary uppercase tracking-wide">Tips</span>
      </div>
      {tips.map((tip, i) => (
        <div key={i} className="flex gap-2 text-xs text-muted-foreground">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary/60 mt-0.5" />
          <span>{tip}</span>
        </div>
      ))}
    </div>
  );
}

export default function Guide() {
  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-b border-border px-6 py-8 md:px-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">App Guide</h1>
              <p className="text-sm text-muted-foreground">Complete walkthrough of every AcadMind feature</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl mt-4 leading-relaxed">
            Welcome to AcadMind! This guide covers every module in the app — from setting up your
            timetable to chatting with the AI assistant. Follow the steps in each section to get
            the most out of your academic platform.
          </p>

          {/* Quick nav pills */}
          <div className="flex flex-wrap gap-2 mt-5">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground/70 hover:text-primary hover:border-primary/40 transition-colors"
              >
                <s.icon className="h-3 w-3" />
                {s.title}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-4xl mx-auto px-6 py-8 md:px-10 space-y-8">
        {sections.map((section) => (
          <Card
            key={section.id}
            id={section.id}
            className="scroll-mt-6 border border-border shadow-card overflow-hidden"
          >
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 shrink-0">
                    <section.icon className="h-4.5 w-4.5 text-primary" style={{ height: '1.125rem', width: '1.125rem' }} />
                  </div>
                  <CardTitle className="text-lg font-display font-bold text-foreground">
                    {section.title}
                  </CardTitle>
                </div>
                {section.badge && (
                  <Badge
                    variant={
                      section.badge === 'Coming Soon'
                        ? 'secondary'
                        : section.badge === 'AI'
                        ? 'default'
                        : 'outline'
                    }
                    className="shrink-0 text-xs"
                  >
                    {section.badge}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed pl-12">
                {section.description}
              </p>
            </CardHeader>

            <CardContent className="pt-5 pb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Step-by-step
              </p>
              <StepList steps={section.steps} />

              {section.extra && <div className="mt-2">{section.extra}</div>}

              {section.tips && <TipList tips={section.tips} />}
            </CardContent>
          </Card>
        ))}

        {/* Bottom CTA */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-6 py-6 text-center">
          <BookOpen className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-display font-bold text-foreground text-lg mb-1">
            You're all set!
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            You now know how to use every feature in AcadMind. Head back to the Dashboard to start
            organising your academic life.
          </p>
          <a
            href="/"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
