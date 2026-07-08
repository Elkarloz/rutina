"use client";

import { useState } from "react";
import { formatWeekRange } from "../lib/categories";
import { WeekDetail, type WeekDetailData } from "./WeekDetail";

export function PastWeekRow({ week }: { week: WeekDetailData }) {
  const [open, setOpen] = useState(false);
  const days = week.days.map(d => d.day).join(", ");
  const exercises = week.days.reduce((n, d) => n + d.exercises.length, 0);

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left active:bg-white/5 transition-colors"
      >
        <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 20 }}>
          {open ? "expand_less" : "chevron_right"}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-display text-sm text-white uppercase font-bold leading-tight">
            Semana {week.week_number}
          </p>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mt-0.5">
            {formatWeekRange(week.start, week.end)}
          </p>
          <p className="text-xs text-on-surface-variant mt-1 truncate">
            {days} · {exercises} ejercicios
          </p>
        </div>
      </button>
      {open && <WeekDetail week={week} />}
    </div>
  );
}
