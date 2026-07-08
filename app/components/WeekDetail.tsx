import { CATEGORIES, formatShortDate } from "../lib/categories";

export type WeekDetailData = {
  week_number: number;
  start: string;
  end: string;
  days: {
    day: string;
    date: string;
    exercises: {
      session_id: number;
      exercise_name: string;
      category: string | null;
      notes: string | null;
      sets: { set_number: number; reps: number | null; weight_kg: number | null }[];
    }[];
  }[];
};

export function WeekDetail({ week }: { week: WeekDetailData }) {
  return (
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
  );
}
