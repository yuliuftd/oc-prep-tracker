# Project Specification: NSW OC 2027 Study Planner & Progress Tracker

## 1. Project Overview
Build a lightweight, responsive React Single Page Application (SPA) for a Year 3/4 student preparing for the NSW Opportunity Class (OC) Placement Test (Exam Date: May 11, 2027).
This application focuses strictly on **Study Planning, Daily Check-ins, and Performance Analytics**. It does NOT store question banks or vocabulary lists locally:
- **Practice Questions**: Completed on an external Coaching Portal (linked from task cards).
- **OC Vocabulary Review**: Handled by an external self-hosted `SpellingBee` web app (linked via deep URL parameters like `?mode=oc`).
- **Core Goal**: Keep weekly study on track via a 26-week stepped burn-up curve, and lift Reading accuracy from ~60% to 80% through a structured "Blind Retry + Error Categorization" check-in workflow, while maintaining Math and Thinking Skills at 80%+.

## 2. Tech Stack
- **Framework**: React 18+ with Vite and TypeScript (`npm create vite@latest oc-prep-tracker -- --template react-ts`)
- **Styling**: Tailwind CSS + `lucide-react` (icons)
- **Charts**: `recharts` (Burn-up chart, 5-test rolling accuracy line chart, Reading error breakdown chart)
- **Date Utilities**: `date-fns`
- **Data Persistence (Serverless Cross-Device Sync)**:
  - Local-first state using `localStorage`.
  - Optional GitHub REST API sync (reads/writes a single `data/checkins.json` file in the repo via Personal Access Token) + JSON file Export/Import, ensuring seamless sync across MacBook (main study station), iPad (light check-in), and Parent's phone.

## 3. Directory Structure
```text
src/
├── components/
│   ├── layout/
│   │   └── Navbar.tsx            # Exam countdown, Streak counter, Sync button, Tab switcher
│   ├── dashboard/
│   │   ├── TodayQuests.tsx       # Daily task cards, external jump links (SpellingBee/Coaching), Pomodoro timer
│   │   ├── CheckInModal.tsx      # Reading 3-step SOP form (1st score, Blind retry, 4-part errors) & Math/TS log
│   │   └── WeeklyCalendar.tsx    # 7-day strip showing Term vs Holiday mode and daily completion status
│   ├── analytics/
│   │   ├── BurnUpChart.tsx       # 26-week Stepped Planned Curve vs Actual cumulative study minutes
│   │   ├── AccuracyTrend.tsx     # 5-test rolling average (Reading 1st, Reading Blind Retry, Math, TS)
│   │   └── ReadingDiagnosis.tsx  # Error distribution across the 4 NSW OC Reading sections
│   └── settings/
│       └── ConfigModal.tsx       # External URLs (SpellingBee URL, Coaching URL), GitHub Sync token, Holiday overrides
├── config/
│   └── scheduleConfig.ts         # Exam date, NSW Holiday ranges, Term/Holiday weekly slot templates
├── services/
│   └── storageService.ts         # LocalStorage + GitHub API sync for checkins.json
├── types/
│   └── index.ts                  # TypeScript interfaces
└── utils/
    └── scheduleEngine.ts         # Stepped planned curve generator & daily task resolver

4. Core Data Models (src/types/index.ts)

export type Subject = 'READING' | 'MATH' | 'THINKING_SKILLS' | 'VOCAB';

export type TaskExternalLinkType = 'SPELLING_BEE_OC_BROWSE' | 'SPELLING_BEE_OC_QUIZ' | 'COACHING_PORTAL' | 'NONE';

export interface TaskTemplate {
  id: string;
  title: string;
  subject: Subject;
  durationMinutes: number;
  externalLinkType: TaskExternalLinkType;
  description: string;
}

export interface ReadingErrorBreakdown {
  long_passage: number;          // Part 1: Long narrative/informational text
  poetry: number;                // Part 2: Poem comprehension & metaphor analysis
  cloze_gap_fill: number;        // Part 3: Sentence/paragraph gap-fill
  multi_extract: number;         // Part 4: Matching statements across Extracts A/B/C/D
}

export interface QuizScoreLog {
  id: string;
  subject: 'READING' | 'MATH' | 'THINKING_SKILLS';
  testName: string;              // e.g., "W3 Reading Test 1"
  firstAttemptScore: number;     // Score under strict time limit
  blindRetryScore?: number;      // (Reading only) Score after re-reading wrong questions before checking answer key
  totalQuestions: number;
  readingBreakdown?: ReadingErrorBreakdown;
}

export interface DailyCheckIn {
  date: string;                  // YYYY-MM-DD
  dayMode: 'TERM' | 'HOLIDAY';
  plannedMinutes: number;
  actualMinutes: number;
  completedTaskIds: string[];
  quizLogs: QuizScoreLog[];
  vocabSyncedToSpellingBee: boolean; // Checkbox confirming new words from today's reading were added to SpellingBee
  notes?: string;
}

export interface AppSettings {
  spellingBeeBaseUrl: string;    // e.g., "[https://yuliuftd.github.io/SpellingBee](https://yuliuftd.github.io/SpellingBee)"
  coachingPortalUrl: string;     // URL to the OC coaching website
  githubToken?: string;
  githubRepo?: string;           // e.g., "yuliuftd/oc-prep-tracker"
}

5. Schedule Rules & Business Logic
5.1 Timeline & Asymmetric Weekly Schedule (src/config/scheduleConfig.ts)
Start Date: 2026-11-09 | Exam Date: 2027-05-11 (26 weeks total).

NSW School Holiday Ranges (Automatically switches dayMode to 'HOLIDAY'):

Summer Holiday: 2026-12-18 to 2027-01-31

Autumn Holiday (Pre-exam Sprint): 2027-04-10 to 2027-04-25

School Term Schedule (TERM mode) — Respects busy slots (Thu evening, Sat all day, Sun morning) and enforces 60% Reading/Vocab : 20% Math : 20% Thinking Skills weighting:

Monday (40 mins):

Reading Targeted Practice (25m, link: COACHING_PORTAL)

OC Vocab 10-Word Quiz (15m, link: SPELLING_BEE_OC_QUIZ -> {spellingBeeBaseUrl}?mode=oc&view=quiz)

Tuesday (35 mins):

Math Timed Drill (20m, link: COACHING_PORTAL)

Reading Error Passage Re-read & Vocab Review (15m, link: SPELLING_BEE_OC_BROWSE -> {spellingBeeBaseUrl}?mode=oc&view=browse)

Wednesday (40 mins):

Reading Poetry / Cloze Practice (25m, link: COACHING_PORTAL)

Thinking Skills Timed Drill (15m, link: COACHING_PORTAL)

Thursday (10 mins - Busy Evening Constraint):

[Streak Saver] iPad OC Vocab Quick Quiz (10m, link: SPELLING_BEE_OC_QUIZ)

Friday (35 mins):

Thinking Skills Practice Set (20m, link: COACHING_PORTAL)

OC Vocab Unfamiliar Words Clear-out (15m, link: SPELLING_BEE_OC_BROWSE)

Saturday (10 mins - Full Day Busy & PM OC Coaching Class):

[Class Day] Log 5 New Coaching Words into SpellingBee (10m, link: SPELLING_BEE_OC_BROWSE)

Sunday (70 mins - AM Busy, PM Prime Deep Block + Weekly Buffer):

Full Timed Reading Mock (MacBook) (40m, link: COACHING_PORTAL)

Reading Blind Retry + Error Categorization + Sync New Words to SpellingBee (30m, link: SPELLING_BEE_OC_BROWSE)

School Holiday Schedule (HOLIDAY mode):

Unlocks Thu/Sun constraints. Monday–Friday & Sunday set to 75 mins/day:

Full Reading Practice + Blind Retry (45m, link: COACHING_PORTAL)

Math / Thinking Skills Rotation (20m, link: COACHING_PORTAL)

OC Vocab Quiz on SpellingBee (10m, link: SPELLING_BEE_OC_QUIZ)

Saturday remains 15 mins light vocab review after coaching class.

5.2 Reading Check-in 3-Step SOP (src/components/dashboard/CheckInModal.tsx)
When the user logs a READING quiz score during check-in:

First Attempt vs. Blind Retry: Input First Attempt Score (timed) and Blind Retry Score (score after re-trying wrong questions without looking at the solution explanation).

4-Part Error Breakdown: Simple - / + steppers to record how many errors occurred in Long Passage, Poetry, Cloze Gap-fill, and Multi-extract Matching.

SpellingBee Sync Confirmation: A toggle checkbox: "I have added today's unfamiliar reading words into the SpellingBee (OC Mode) app" with a direct button to open SpellingBee in a new tab.

5.3 Analytics Charts (src/components/analytics/)
26-Week Stepped Burn-up Chart (BurnUpChart.tsx):

X-axis: Dates from 2026-11-09 to 2027-05-11.

Series 1 (Dashed Line): Cumulative Planned Minutes (shows flat steps on Thu/Sat and steep slope during Dec–Jan & April Holidays).

Series 2 (Solid Area): Cumulative Actual Minutes from checkins.json.

Subject Accuracy & Blind-Retry Gap (AccuracyTrend.tsx):

Plots 5-test rolling average percentage for: Reading (1st Attempt), Reading (Blind Retry), Math, and Thinking Skills, with a horizontal reference line at 80%.

Reading Weakness Diagnosis (ReadingDiagnosis.tsx):

Horizontal stacked bar or radar chart showing total accumulated errors across the 4 Reading sections (long_passage, poetry, cloze_gap_fill, multi_extract), highlighting the highest-loss section in red/amber.