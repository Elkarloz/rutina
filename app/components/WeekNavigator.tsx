"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { formatWeekRange, shiftWeekStart } from "../lib/categories";
import { WeekDetail, type WeekDetailData } from "./WeekDetail";

export function WeekNavigator({
  selectedStart,
  currentStart,
  weekNumber,
  week,
}: {
  selectedStart: string;
  currentStart: string;
  weekNumber: number;
  week: WeekDetailData | null;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const isCurrent = selectedStart === currentStart;
  const canGoNext = selectedStart < currentStart;

  function go(start: string) {
    const params = new URLSearchParams(sp.toString());
    if (start === currentStart) params.delete("semana");
    else params.set("semana", start);
    const q = params.toString();
    router.push(q ? `/progreso?${q}` : "/progreso");
  }

  return (
    <section className="glass-card rounded-2xl overflow-hidden">
      <header className="px-3 py-3 border-b border-white/5 bg-surface-container/50">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => go(shiftWeekStart(selectedStart, -1))}
            className="shrink-0 w-10 h-10 rounded-xl bg-surface-container-high text-white flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Semana anterior"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>

          <div className="flex-1 text-center min-w-0 px-1">
            {isCurrent && (
              <div className="inline-block px-2 py-0.5 bg-primary-fixed text-on-primary-fixed text-[10px] font-bold rounded-full uppercase tracking-widest mb-1">
                Esta semana
              </div>
            )}
            <h2 className="font-display text-lg text-white uppercase font-bold leading-tight">
              Semana {weekNumber}
            </h2>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mt-0.5 truncate">
              {formatWeekRange(selectedStart, shiftWeekStart(selectedStart, 6))}
            </p>
          </div>

          <button
            type="button"
            onClick={() => canGoNext && go(shiftWeekStart(selectedStart, 1))}
            disabled={!canGoNext}
            className={
              "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-transform " +
              (canGoNext
                ? "bg-surface-container-high text-white active:scale-95"
                : "bg-surface-container-high/40 text-on-surface-variant/30")
            }
            aria-label="Semana siguiente"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </header>

      {week ? (
        <WeekDetail week={week} />
      ) : (
        <div className="px-4 py-6 text-on-surface-variant text-sm text-center">
          Sin registros esta semana.
        </div>
      )}
    </section>
  );
}
