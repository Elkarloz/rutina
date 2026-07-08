import { supabase } from "../lib/supabase";
import { CATEGORIES, formatSessionDate, weekNumberFromDate } from "../lib/categories";

export const dynamic = "force-dynamic";

type LogRow = {
  exercise_id: number;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  session_id: number;
  sessions: { performed_at: string; day: string; week_number: number | null; notes: string | null } | null;
};

type SessionEntry = {
  session_id: number;
  performed_at: string;
  day: string;
  week_number: number | null;
  notes: string | null;
  sets: { set_number: number; reps: number | null; weight_kg: number | null }[];
};

function sessionInfo(raw: unknown): SessionEntry["sessions"] & object {
  const s = Array.isArray(raw) ? raw[0] : raw;
  return s as SessionEntry["sessions"] & object;
}

function groupSessions(logs: LogRow[]): SessionEntry[] {
  const map = new Map<number, SessionEntry>();

  for (const log of logs) {
    const session = sessionInfo(log.sessions);
    if (!session) continue;

    if (!map.has(log.session_id)) {
      map.set(log.session_id, {
        session_id: log.session_id,
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
    .map(s => ({ ...s, sets: s.sets.sort((a, b) => a.set_number - b.set_number) }))
    .sort((a, b) => b.performed_at.localeCompare(a.performed_at));
}

export default async function Progreso() {
  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, name, category, day")
    .order("day")
    .order("order_index");

  const { data: logs } = await supabase
    .from("exercise_logs")
    .select("exercise_id, set_number, reps, weight_kg, session_id, sessions(performed_at, day, week_number, notes)")
    .order("session_id", { ascending: false });

  const logsByExercise = new Map<number, LogRow[]>();
  for (const l of (logs ?? []) as unknown as LogRow[]) {
    if (!logsByExercise.has(l.exercise_id)) logsByExercise.set(l.exercise_id, []);
    logsByExercise.get(l.exercise_id)!.push(l);
  }

  const trained = (exercises ?? []).filter(e => logsByExercise.has(e.id));

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
        {trained.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-on-surface-variant text-sm">
            Sin registros aún. Loguea una sesión en Hoy y vuelve aquí.
          </div>
        ) : (
          <div className="space-y-3">
            {trained.map(ex => {
              const cat = CATEGORIES[ex.category ?? "otros"] ?? CATEGORIES.otros;
              const sessions = groupSessions(logsByExercise.get(ex.id) ?? []);
              const maxWeight = Math.max(...sessions.flatMap(s => s.sets.map(l => l.weight_kg ?? 0)));
              return (
                <article key={ex.id} className="glass-card rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center`}>
                      <span className={`material-symbols-outlined ${cat.accent}`} style={{ fontSize: 22 }}>
                        {cat.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-base text-white uppercase font-bold leading-tight">{ex.name}</h3>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mt-0.5">
                        {cat.label} · {ex.day}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-xl text-primary-fixed font-bold leading-none">
                        {maxWeight}<span className="text-xs">kg</span>
                      </div>
                      <div className="text-[10px] text-on-surface-variant uppercase tracking-widest">Máx</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {sessions.map(session => {
                      const week = session.week_number ?? weekNumberFromDate(session.performed_at);
                      return (
                        <div key={session.session_id} className="bg-surface-container-high rounded-xl px-3 py-2.5">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="min-w-0">
                              <p className="text-xs text-white font-semibold leading-tight">
                                {formatSessionDate(session.performed_at)}
                              </p>
                              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mt-0.5">
                                Semana {week} · {session.day}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {session.sets.map(set => (
                              <span
                                key={set.set_number}
                                className="text-[11px] bg-surface-container rounded px-2 py-0.5 text-on-surface-variant"
                              >
                                S{set.set_number}: {set.reps ?? "—"}×{set.weight_kg ?? "—"}kg
                              </span>
                            ))}
                          </div>
                          {session.notes && (
                            <p className="text-[11px] text-on-surface-variant mt-1.5 italic">{session.notes}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
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
