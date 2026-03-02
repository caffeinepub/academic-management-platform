export interface ExtractedSlot {
  subject: string;
  dayOfWeek: string;
  startTime: string; // "HH:MM" format
  durationMinutes: number;
  location: string;
}

const MOCK_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Computer Science',
  'English Literature',
  'Chemistry',
  'Biology',
  'History',
  'Economics',
];

const MOCK_LOCATIONS = [
  'Room 101',
  'Lab A',
  'Lecture Hall B',
  'Room 204',
  'Science Block',
  'Library',
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIMES = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function mockExtractTimetable(_file: File): Promise<ExtractedSlot[]> {
  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1800));

  const count = 5 + Math.floor(Math.random() * 4); // 5–8 slots
  const slots: ExtractedSlot[] = [];

  for (let i = 0; i < count; i++) {
    slots.push({
      subject: randomFrom(MOCK_SUBJECTS),
      dayOfWeek: randomFrom(DAYS),
      startTime: randomFrom(TIMES),
      durationMinutes: [60, 90, 120][Math.floor(Math.random() * 3)],
      location: randomFrom(MOCK_LOCATIONS),
    });
  }

  return slots;
}

/** Convert "HH:MM" string to minutes since midnight as a plain number */
export function timeStringToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}
