import { supabase } from "../lib/supabase";
import {
  CATEGORIES,
  daySortOrder,
  formatShortDate,
  formatWeekRange,
  routineDayDate,
  weekBounds,
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

type DayEntry = {
  day: string;
  date: string;
  exercises: ExerciseSession[];
};

type WeekEntry = {
  week_number: number;
  start: string;
  end: string;
  days: DayEntry[];
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

function groupByWeeks(sessions: ExerciseSession[]): WeekEntry[] {
  const weekMap = new Map<string, { week_number: number; start: string; end: string; dayMap: Map<string, DayEntry> }>();

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
    week.dayMap.get(routineDay)!.exercises.push(session);
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

export default async function Progreso() {
  const { data: logs } = await supabase
    .from("exercise_logs")
    .select("exercise_id, set_number, reps, weight_kg, session_id, exercises(name, category), sessions(performed_at, day, week_number, notes)")
    .order("session_id", { ascending: false });

  const sessions = groupSessions((logs ?? []) as unknown as LogRow[]);
  const weeks = groupByWeeks(sessions);

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
        {weeks.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-on-surface-variant text-sm">
            Sin registros aún. Loguea una sesión en Hoy y vuelve aquí.
          </div>
        ) : (
          <div className="space-y-4">
            {weeks.map(week => (
              <section key={week.start} className="glass-card rounded-2xl overflow-hidden">
                <header className="px-4 py-3 border-b border-white/5 bg-surface-container/50">
                  <h2 className="font-display text-lg text-white uppercase font-bold leading-tight">
                    Semana {week.week_number}
                  </h2>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mt-0.5">
                    {formatWeekRange(week.start, week.end)}
                  </p>
                </header>

                <div className="divide-y divide-white/5">
                  {week.days.map(dayEntry => (
                    <div key={`${week.start}-${dayEntry.day}`} className="px-4 py-3">
                      <h3 className="text-sm text-primary-fixed font-bold uppercase tracking-wide mb-2">
                        {dayEntry.day}
                        <span className="text-on-surface-variant font-semibold normal-case tracking-normal ml-2">
                          · {formatShortDate(dayEntry.date)}
                        </span>
                      </h3>

                      <div className="space-y-2">
                        {dayEntry.exercises.map(ex => {
                          const cat = CATEGORIES[ex.category ?? "otros"] ?? CATEGORIES.otros;
                          const maxWeight = Math.max(...ex.sets.map(s => s.weight_kg ?? 0));
                          return (
                            <div key={ex.session_id} className="bg-surface-container-high rounded-xl px-3 py-2.5">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className={`material-symbols-outlined ${cat.accent}`} style={{ fontSize: 16 }}>
                                  {cat.icon}
                                </span>
                                <span className="text-xs text-white font-semibold flex-1">{ex.exercise_name}</span>
                                {maxWeight > 0 && (
                                  <span className="text-[10px] text-primary-fixed font-bold">{maxWeight} kg máx</span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {ex.sets.map(set => (
                                  <span
                                    key={set.set_number}
                                    className="text-[11px] bg-surface-container rounded px-2 py-0.5 text-on-surface-variant"
                                  >
                                    S{set.set_number}: {set.reps ?? "—"}×{set.weight_kg ?? "—"}kg
                                  </span>
                                ))}
                              </div>
                              {ex.notes && (
                                <p className="text-[11px] text-on-surface-variant mt-1.5 italic">{ex.notes}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
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
