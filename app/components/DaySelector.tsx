"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function DaySelector({ days, current }: { days: string[]; current: string }) {
  const router = useRouter();
  const sp = useSearchParams();

  function pick(d: string) {
    const params = new URLSearchParams(sp.toString());
    params.set("day", d);
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="flex gap-2 overflow-x-auto px-5 py-3 no-scrollbar">
      {days.map(d => (
        <button
          key={d}
          onClick={() => pick(d)}
          className={
            "shrink-0 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all " +
            (current === d
              ? "bg-primary-fixed text-on-primary-fixed"
              : "bg-surface-container text-on-surface-variant active:scale-95")
          }
        >
          {d.slice(0, 3)}
        </button>
      ))}
    </div>
  );
}
