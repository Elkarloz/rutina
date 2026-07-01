"use client";

import { useState, useTransition } from "react";
import { saveExerciseSession, type SetInput } from "../actions";
import { CATEGORIES, parseSetCount, parseTargetReps } from "../lib/categories";
import type { Exercise } from "../lib/supabase";

export type LastLog = { set_number: number; reps: number | null; weight_kg: number | null };

function parseWeightNumber(s: string | null): number | null {
  if (!s) return null;
  const m = s.match(/(\d+(?:[.,]\d+)?)/);
  return m ? parseFloat(m[1].replace(",", ".")) : null;
}

export function ExerciseCard({
  exercise,
  weekLogs,
  lastLogs,
  day,
}: {
  exercise: Exercise;
  weekLogs: LastLog[];
  lastLogs: LastLog[];
  day: string;
}) {
  const cat = CATEGORIES[exercise.category ?? "otros"] ?? CATEGORIES.otros;
  const setCount = parseSetCount(exercise.sets_reps);
  const targetReps = parseTargetReps(exercise.sets_reps);
  const historyLogs = lastLogs.length > 0 ? lastLogs : weekLogs;
  const lastMaxWeight = historyLogs.length
    ? Math.max(...historyLogs.map(l => l.weight_kg ?? 0))
    : null;
  const allHit = targetReps != null && historyLogs.length > 0 && historyLogs.every(l => (l.reps ?? 0) >= targetReps);
  const suggested = lastMaxWeight != null
    ? (allHit ? lastMaxWeight + 2.5 : lastMaxWeight)
    : null;
  const templateWeight = parseWeightNumber(exercise.weight_template);
  const defaultWeight = suggested ?? templateWeight;

  const [sets, setSets] = useState<SetInput[]>(() => {
    if (weekLogs.length > 0) {
      return Array.from({ length: setCount }, (_, i) => {
        const saved = weekLogs.find(l => l.set_number === i + 1);
        return {
          set_number: i + 1,
          reps: saved?.reps ?? null,
          weight_kg: saved?.weight_kg ?? defaultWeight,
        };
      });
    }
    return Array.from({ length: setCount }, (_, i) => ({
      set_number: i + 1,
      reps: null,
      weight_kg: defaultWeight,
    }));
  });
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function updateSet(idx: number, patch: Partial<SetInput>) {
    setSets(prev => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function save() {
    setError(null);
    start(async () => {
      const res = await saveExerciseSession({ exercise_id: exercise.id, day, sets });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(res.error ?? "Error");
      }
    });
  }

  return (
    <article className="glass-card rounded-2xl overflow-hidden">
      <header className="relative h-40 w-full">
        <img
          src={exercise.image_url ?? cat.image}
          alt={exercise.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full">
          <span className={`material-symbols-outlined ${cat.accent}`} style={{ fontSize: 14 }}>
            {cat.icon}
          </span>
          <span className="text-[10px] uppercase tracking-widest font-bold text-white">{cat.label}</span>
        </div>
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="font-display text-xl text-white uppercase font-bold leading-tight drop-shadow-lg">
            {exercise.name}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {exercise.sets_reps && (
              <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed text-xs font-bold">
                {exercise.sets_reps}
              </span>
            )}
            {suggested != null && (
              <span className="text-xs text-white font-semibold drop-shadow">
                Sugerido <span className="text-primary-fixed">{suggested} kg</span>
                {allHit && <span className="text-primary-fixed ml-1">↑</span>}
              </span>
            )}
            {suggested == null && exercise.weight_template && (
              <span className="text-xs text-white/80 drop-shadow">{exercise.weight_template}</span>
            )}
          </div>
        </div>
      </header>

      <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
        {sets.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="w-10 shrink-0 text-[10px] text-on-surface-variant uppercase tracking-widest font-bold whitespace-nowrap">
              S{s.set_number}
            </span>
            <input
              type="number"
              inputMode="numeric"
              placeholder={targetReps ? `${targetReps}` : "reps"}
              value={s.reps ?? ""}
              onChange={e => updateSet(i, { reps: e.target.value === "" ? null : parseInt(e.target.value) })}
              className="flex-1 min-w-0 bg-surface-container-high rounded-lg px-2 py-2 text-sm text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary-fixed"
            />
            <span className="text-xs text-on-surface-variant">×</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              placeholder={suggested != null ? `${suggested}` : "kg"}
              value={s.weight_kg ?? ""}
              onChange={e => updateSet(i, { weight_kg: e.target.value === "" ? null : parseFloat(e.target.value) })}
              className="flex-1 min-w-0 bg-surface-container-high rounded-lg px-2 py-2 text-sm text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary-fixed"
            />
            <span className="text-xs text-on-surface-variant w-7 shrink-0">kg</span>
          </div>
        ))}

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={save}
            disabled={pending}
            className={
              "flex-1 py-3 rounded-lg font-bold text-sm uppercase tracking-widest transition-all " +
              (saved
                ? "bg-emerald-500 text-white"
                : "bg-primary-fixed text-on-primary-fixed active:scale-95 disabled:opacity-50")
            }
          >
            {pending ? "Guardando…" : saved ? "✓ Guardado" : "Guardar"}
          </button>
          <button
            onClick={() => setOpen(!open)}
            className="px-3 py-3 rounded-lg bg-surface-container-high text-on-surface-variant"
            aria-label="Historial"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              {open ? "expand_less" : "history"}
            </span>
          </button>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {open && (
          <div className="pt-3 border-t border-white/5 mt-2">
            <div className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-2">
              Última sesión
            </div>
            {lastLogs.length === 0 ? (
              <p className="text-xs text-on-surface-variant">Sin registros previos.</p>
            ) : (
              <div className="space-y-1">
                {lastLogs.map((l, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-surface-container-high rounded px-3 py-2">
                    <span className="text-on-surface-variant font-semibold">Set {l.set_number}</span>
                    <span className="text-white">{l.reps ?? "—"} × {l.weight_kg ?? "—"} kg</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
