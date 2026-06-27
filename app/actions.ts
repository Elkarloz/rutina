"use server";

import { revalidatePath } from "next/cache";
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

  const { data: session, error: sErr } = await supabase
    .from("sessions")
    .insert({ day: input.day, notes: input.notes ?? null })
    .select()
    .single();
  if (sErr || !session) return { ok: false, error: sErr?.message ?? "Sin sesión" };

  const { error: lErr } = await supabase.from("exercise_logs").insert(
    filled.map(s => ({
      session_id: session.id,
      exercise_id: input.exercise_id,
      set_number: s.set_number,
      reps: s.reps,
      weight_kg: s.weight_kg,
    })),
  );
  if (lErr) return { ok: false, error: lErr.message };

  revalidatePath("/");
  return { ok: true, session_id: session.id };
}
