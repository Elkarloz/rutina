import { supabase } from "../lib/supabase";
import { WeekNavigator } from "../components/WeekNavigator";
import { type WeekDetailData } from "../components/WeekDetail";
import {
  daySortOrder,
  routineDayDate,
  weekBounds,
  weekFromStart,
  weekNumberFromDate,
} from "../lib/categories";

export const dynamic = "force-dynamic";

type LogRow = {
  exercise_id: number;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  session_id: number;
  exercises: { name: string; category: string | null } | null;
  sessions: { performed_at: string; day: string; week_number: number | null; notes: string | null } | null;
};

type ExerciseSession = {
  session_id: number;
  exercise_id: number;
  exercise_name: string;
  category: string | null;
  performed_at: string;
  day: string;
  week_number: number | null;
  notes: string | null;
  sets: { set_number: number; reps: number | null; weight_kg: number | null }[];
};

type SessionMeta = NonNullable<LogRow["sessions"]>;
type ExerciseMeta = NonNullable<LogRow["exercises"]>;

function sessionInfo(raw: unknown): SessionMeta {
  const s = Array.isArray(raw) ? raw[0] : raw;
  return s as SessionMeta;
}

function exerciseInfo(raw: unknown): ExerciseMeta {
  const e = Array.isArray(raw) ? raw[0] : raw;
  return e as ExerciseMeta;
}

function groupSessions(logs: LogRow[]): ExerciseSession[] {
  const map = new Map<number, ExerciseSession>();

  for (const log of logs) {
    const session = sessionInfo(log.sessions);
    const exercise = exerciseInfo(log.exercises);
    if (!session || !exercise) continue;

    if (!map.has(log.session_id)) {
      map.set(log.session_id, {
        session_id: log.session_id,
        exercise_id: log.exercise_id,
        exercise_name: exercise.name,
        category: exercise.category,
        performed_at: session.performed_at,
        day: session.day,
        week_number: session.week_number,
        notes: session.notes,
        sets: [],
      });
    }
    map.get(log.session_id)!.sets.push({
      set_number: log.set_number,
      reps: log.reps,
      weight_kg: log.weight_kg,
    });
  }

  return [...map.values()]
    .map(s => ({
      ...s,
      sets: s.sets.sort((a, b) => a.set_number - b.set_number),
    }))
    .filter(s => s.sets.some(set => set.reps != null || set.weight_kg != null));
}

function normalizeDate(dateStr: string): string {
  return dateStr.includes("T") ? dateStr.slice(0, 10) : dateStr;
}

function groupByWeeks(sessions: ExerciseSession[]): WeekDetailData[] {
  const weekMap = new Map<string, { week_number: number; start: string; end: string; dayMap: Map<string, WeekDetailData["days"][0]> }>();

  for (const session of sessions) {
    const date = new Date(
      session.performed_at.includes("T") ? session.performed_at : `${session.performed_at}T12:00:00`,
    );
    const { start, end } = weekBounds(date);
    const performedDate = normalizeDate(session.performed_at);
    if (performedDate < start || performedDate > end) continue;

    const weekNum = session.week_number ?? weekNumberFromDate(session.performed_at);
    const routineDay = session.day;

    if (!weekMap.has(start)) {
      weekMap.set(start, { week_number: weekNum, start, end, dayMap: new Map() });
    }

    const week = weekMap.get(start)!;
    if (!week.dayMap.has(routineDay)) {
      week.dayMap.set(routineDay, {
        day: routineDay,
        date: routineDayDate(start, routineDay),
        exercises: [],
      });
    }
    week.dayMap.get(routineDay)!.exercises.push({
      session_id: session.session_id,
      exercise_name: session.exercise_name,
      category: session.category,
      notes: session.notes,
      sets: session.sets,
    });
  }

  return [...weekMap.values()]
    .map(w => ({
      week_number: w.week_number,
      start: w.start,
      end: w.end,
      days: [...w.dayMap.values()]
        .sort((a, b) => daySortOrder(a.day) - daySortOrder(b.day))
        .map(d => ({
          ...d,
          exercises: d.exercises.sort((a, b) => a.exercise_name.localeCompare(b.exercise_name)),
        }))
        .filter(d => d.exercises.length > 0),
    }))
    .filter(w => w.days.length > 0)
    .sort((a, b) => b.start.localeCompare(a.start));
}

export default async function Progreso({ searchParams }: { searchParams: Promise<{ semana?: string }> }) {
  const sp = await searchParams;
  const { start: currentStart } = weekBounds();

  const selectedStart =
    sp.semana && /^\d{4}-\d{2}-\d{2}$/.test(sp.semana) && sp.semana <= currentStart
      ? sp.semana
      : currentStart;

  const { data: logs } = await supabase
    .from("exercise_logs")
    .select("exercise_id, set_number, reps, weight_kg, session_id, exercises(name, category), sessions(performed_at, day, week_number, notes)")
    .order("session_id", { ascending: false });

  const weeks = groupByWeeks(groupSessions((logs ?? []) as unknown as LogRow[]));
  const selectedWeek = weeks.find(w => w.start === selectedStart) ?? null;
  const meta = selectedWeek ?? weekFromStart(selectedStart);

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-5 h-16">
        <div className="flex items-center gap-3">
          <a href="/" className="material-symbols-outlined text-white">arrow_back</a>
          <span className="font-display text-[26px] italic tracking-tighter text-primary-fixed uppercase font-bold leading-none">
            PROGRESO
          </span>
        </div>
      </header>

      <main className="pb-28 pt-20 px-5">
        <WeekNavigator
          selectedStart={selectedStart}
          currentStart={currentStart}
          weekNumber={meta.week_number}
          week={selectedWeek}
        />
      </main>

      <nav className="fixed bottom-0 w-full z-50 bg-surface-container/90 backdrop-blur-2xl rounded-t-xl border-t border-white/5 flex justify-around items-center h-20 px-4">
        <a href="/" className="flex flex-col items-center text-on-surface-variant">
          <span className="material-symbols-outlined">fitness_center</span>
          <span className="text-[10px] font-semibold tracking-widest uppercase mt-0.5">Hoy</span>
        </a>
        <a href="/progreso" className="flex flex-col items-center text-primary-fixed font-bold bg-primary-fixed/10 rounded-xl px-3 py-1">
          <span className="material-symbols-outlined">monitoring</span>
          <span className="text-[10px] font-semibold tracking-widest uppercase mt-0.5">Progreso</span>
        </a>
      </nav>
    </>
  );
}
