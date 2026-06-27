import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anon);

export type Exercise = {
  id: number;
  day: string;
  name: string;
  sets_reps: string | null;
  weight_template: string | null;
  category: string | null;
  order_index: number | null;
  image_url: string | null;
};

export type Session = {
  id: number;
  performed_at: string;
  week_number: number | null;
  day: string;
  notes: string | null;
};

export type ExerciseLog = {
  id: number;
  session_id: number;
  exercise_id: number | null;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  notes: string | null;
};
