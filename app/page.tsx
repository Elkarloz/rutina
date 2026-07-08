import { supabase, type Exercise } from "./lib/supabase";
import { ExerciseCard, type LastLog } from "./components/ExerciseCard";
import { DaySelector } from "./components/DaySelector";
import { DAYS, todayDay, todayDayIndex, weekBounds } from "./lib/categories";

export const dynamic = "force-dynamic";

type SessionInfo = { performed_at: string; day: string; notes?: string | null };

function sessionInfo(raw: unknown): SessionInfo {
  const s = Array.isArray(raw) ? raw[0] : raw;
  return s as SessionInfo;
}

type LogRow = LastLog & { session_id: number; performed_at?: string; day?: string };

async function getWeekLogs(
  exerciseIds: number[],
  day: string,
): Promise<Map<number, LastLog[]>> {
  const map = new Map<number, LogRow[]>();
  if (!exerciseIds.length) return new Map();

  const { start, end } = weekBounds();
  const { data } = await supabase
    .from("exercise_logs")
    .select("exercise_id, set_number, reps, weight_kg, session_id, sessions!inner(performed_at, day)")
    .in("exercise_id", exerciseIds)
    .eq("sessions.day", day)
    .gte("sessions.performed_at", start)
    .lte("sessions.performed_at", end)
    .order("session_id", { ascending: false });

  if (!data) return new Map();

  for (const log of data) {
    const eid = log.exercise_id as number;
    if (!map.has(eid)) map.set(eid, []);
    const list = map.get(eid)!;
    const sameSession = list.length > 0 && list[0].session_id === log.session_id;
    if (list.length === 0 || sameSession) {
      const session = sessionInfo(log.sessions);
      list.push({
        set_number: log.set_number,
        reps: log.reps,
        weight_kg: log.weight_kg,
        session_id: log.session_id,
        performed_at: session.performed_at,
        day: session.day,
      });
    }
  }

  const out = new Map<number, LastLog[]>();
  for (const [k, v] of map) {
    out.set(
      k,
      v
        .sort((a, b) => a.set_number - b.set_number)
        .map(({ session_id, performed_at, day: _d, ...rest }) => rest),
    );
  }
  return out;
}

async function getWeekNotes(
  exerciseIds: number[],
  day: string,
): Promise<Map<number, string | null>> {
  const map = new Map<number, string | null>();
  if (!exerciseIds.length) return map;

  const { start, end } = weekBounds();
  const { data } = await supabase
    .from("exercise_logs")
    .select("exercise_id, session_id, sessions!inner(performed_at, day, notes)")
    .in("exercise_id", exerciseIds)
    .eq("sessions.day", day)
    .gte("sessions.performed_at", start)
    .lte("sessions.performed_at", end)
    .order("session_id", { ascending: false });

  if (!data) return map;

  for (const log of data) {
    const eid = log.exercise_id as number;
    if (!map.has(eid)) {
      map.set(eid, sessionInfo(log.sessions).notes ?? null);
    }
  }
  return map;
}

async function getLastLogs(
  exerciseIds: number[],
  day: string,
  weekStart: string,
  weekEnd: string,
): Promise<Map<number, LastLog[]>> {
  const map = new Map<number, LogRow[]>();
  if (!exerciseIds.length) return new Map();

  const { data } = await supabase
    .from("exercise_logs")
    .select("exercise_id, set_number, reps, weight_kg, session_id, sessions!inner(performed_at, day)")
    .in("exercise_id", exerciseIds)
    .order("session_id", { ascending: false });

  if (!data) return new Map();

  for (const log of data) {
    const eid = log.exercise_id as number;
    const session = sessionInfo(log.sessions);
    const inCurrentWeek =
      session.day === day &&
      session.performed_at >= weekStart &&
      session.performed_at <= weekEnd;

    if (!map.has(eid)) {
      if (inCurrentWeek) continue;
      map.set(eid, []);
    }

    const list = map.get(eid)!;
    const sameSession = list.length > 0 && list[0].session_id === log.session_id;
    if (list.length === 0 || sameSession) {
      list.push({
        set_number: log.set_number,
        reps: log.reps,
        weight_kg: log.weight_kg,
        session_id: log.session_id,
      });
    }
  }

  const out = new Map<number, LastLog[]>();
  for (const [k, v] of map) {
    out.set(k, v.sort((a, b) => a.set_number - b.set_number).map(({ session_id, ...rest }) => rest));
  }
  return out;
}

export default async function Home({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const sp = await searchParams;
  const day = sp.day && DAYS.includes(sp.day) ? sp.day : todayDay();
  const { start, end } = weekBounds();

  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("day", day)
    .order("order_index");

  const list: Exercise[] = exercises ?? [];
  const ids = list.map(e => e.id);
  const [weekLogs, weekNotes, lastLogs] = await Promise.all([
    getWeekLogs(ids, day),
    getWeekNotes(ids, day),
    getLastLogs(ids, day, start, end),
  ]);
  const isToday = day === todayDay();

  const orderedDays = [...Array(7)].map((_, i) => DAYS[(todayDayIndex() + i) % 7]);

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-5 h-16">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-white">menu</span>
          <span className="font-display text-[26px] italic tracking-tighter text-primary-fixed uppercase font-bold leading-none">
            IRON PULSE
          </span>
        </div>
        <span className="material-symbols-outlined text-white">notifications</span>
      </header>

      <main className="pb-28 pt-16">
        <section className="px-5 pt-6 pb-2">
          <div className="inline-block px-3 py-1 bg-primary-fixed text-on-primary-fixed text-[10px] font-bold rounded-full uppercase tracking-widest mb-3">
            {isToday ? "Hoy" : "Programado"}
          </div>
          <h1 className="font-display text-[44px] leading-none uppercase italic tracking-tight font-bold">
            <span className="text-primary-fixed text-glow">{day}</span>
          </h1>
          <p className="text-on-surface-variant mt-3 text-sm">
            {list.length} ejercicios · loguea sets/reps/peso reales
          </p>
        </section>

        <nav className="sticky top-16 z-40 bg-background/90 backdrop-blur-xl border-b border-white/5">
          <DaySelector days={orderedDays} current={day} />
        </nav>

        <section className="px-5 pt-4 space-y-3">
          {list.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-on-surface-variant text-sm">
              Sin ejercicios para {day}. Descanso o cambia de día arriba.
            </div>
          ) : (
            list.map(ex => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                weekLogs={weekLogs.get(ex.id) ?? []}
                weekNotes={weekNotes.get(ex.id) ?? null}
                lastLogs={lastLogs.get(ex.id) ?? []}
                day={day}
              />
            ))
          )}
        </section>
      </main>

      <nav className="fixed bottom-0 w-full z-50 bg-surface-container/90 backdrop-blur-2xl rounded-t-xl border-t border-white/5 flex justify-around items-center h-20 px-4">
        <a href="/" className="flex flex-col items-center text-primary-fixed font-bold bg-primary-fixed/10 rounded-xl px-3 py-1">
          <span className="material-symbols-outlined">fitness_center</span>
          <span className="text-[10px] font-semibold tracking-widest uppercase mt-0.5">Hoy</span>
        </a>
        <a href="/progreso" className="flex flex-col items-center text-on-surface-variant">
          <span className="material-symbols-outlined">monitoring</span>
          <span className="text-[10px] font-semibold tracking-widest uppercase mt-0.5">Progreso</span>
        </a>
      </nav>
    </>
  );
}
