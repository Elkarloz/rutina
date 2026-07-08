"use server";

import { revalidatePath } from "next/cache";
import { weekBounds, weekNumber, todayDate } from "./lib/categories";
import { supabase } from "./lib/supabase";

export type SetInput = { set_number: number; reps: number | null; weight_kg: number | null };

export async function saveExerciseSession(input: {
  exercise_id: number;
  day: string;
  sets: SetInput[];
  notes?: string;
}) {
  const filled = input.sets.filter(s => s.reps != null || s.weight_kg != null);
  if (!filled.length) return { ok: false, error: "Sin sets" };

  const { start, end } = weekBounds();
  const wn = weekNumber();

  const { data: existing } = await supabase
    .from("exercise_logs")
    .select("session_id, sessions!inner(id, performed_at, day)")
    .eq("exercise_id", input.exercise_id)
    .eq("sessions.day", input.day)
    .gte("sessions.performed_at", start)
    .lte("sessions.performed_at", end)
    .order("session_id", { ascending: false })
    .limit(1);

  let sessionId: number;

  if (existing?.length) {
    sessionId = existing[0].session_id as number;
    const { error: delErr } = await supabase.from("exercise_logs").delete().eq("session_id", sessionId);
    if (delErr) return { ok: false, error: delErr.message };
    await supabase
      .from("sessions")
      .update({ notes: input.notes?.trim() || null, performed_at: todayDate() })
      .eq("id", sessionId);
  } else {
    const { data: session, error: sErr } = await supabase
      .from("sessions")
      .insert({
        day: input.day,
        notes: input.notes?.trim() || null,
        week_number: wn,
        performed_at: todayDate(),
      })
      .select()
      .single();
    if (sErr || !session) return { ok: false, error: sErr?.message ?? "Sin sesión" };
    sessionId = session.id;
  }

  const { error: lErr } = await supabase.from("exercise_logs").insert(
    filled.map(s => ({
      session_id: sessionId,
      exercise_id: input.exercise_id,
      set_number: s.set_number,
      reps: s.reps,
      weight_kg: s.weight_kg,
    })),
  );
  if (lErr) return { ok: false, error: lErr.message };

  revalidatePath("/");
  return { ok: true, session_id: sessionId };
}
