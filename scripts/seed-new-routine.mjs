import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const IMG = (p) => `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${p}`;

const ROUTINE = [
  // Lunes — PUSH
  { day: "Lunes", name: "Press Banca Plana",          sets_reps: "4x10", weight: "32kg (barra 12kg + 10kg/lado)", category: "pecho",   image: IMG("Barbell_Bench_Press_-_Medium_Grip/0.jpg") },
  { day: "Lunes", name: "Press Inclinado Mancuerna",  sets_reps: "4x10", weight: "6-8kg por mano (a probar)",     category: "pecho",   image: IMG("Incline_Dumbbell_Press/0.jpg") },
  { day: "Lunes", name: "Press Militar Mancuernas",   sets_reps: "4x10", weight: "5kg",                            category: "hombros", image: IMG("Dumbbell_Shoulder_Press/0.jpg") },
  { day: "Lunes", name: "Elevaciones Laterales",      sets_reps: "4x15", weight: "5kg",                            category: "hombros", image: IMG("Side_Lateral_Raise/0.jpg") },
  { day: "Lunes", name: "Tríceps Polea Agarre V",     sets_reps: "3x12", weight: "50kg",                           category: "triceps", image: IMG("Triceps_Pushdown_-_V-Bar_Attachment/0.jpg") },
  { day: "Lunes", name: "Tríceps Press Francés",      sets_reps: "3x15", weight: "5kg",                            category: "triceps", image: IMG("Lying_Triceps_Press/0.jpg") },

  // Martes — PULL
  { day: "Martes", name: "Jalón al Pecho Abierto",          sets_reps: "4x8",  weight: "30-40kg (a probar)",   category: "espalda", image: IMG("Wide-Grip_Lat_Pulldown/0.jpg") },
  { day: "Martes", name: "Jalón al Pecho Cerrado",          sets_reps: "4x12", weight: "50kg",                 category: "espalda", image: IMG("Close-Grip_Front_Lat_Pulldown/0.jpg") },
  { day: "Martes", name: "Remo Polea Agarre Cerrado (V)",   sets_reps: "4x10", weight: "20-25kg (a probar)",   category: "espalda", image: IMG("Seated_Cable_Rows/0.jpg") },
  { day: "Martes", name: "Remo Sentado (máquina)",          sets_reps: "3x12", weight: "20-25kg (a probar)",   category: "espalda", image: IMG("Seated_Cable_Rows/0.jpg") },
  { day: "Martes", name: "Face Pull",                       sets_reps: "3x12", weight: "30kg",                 category: "hombros", image: IMG("Face_Pull/0.jpg") },
  { day: "Martes", name: "Curl Bíceps Barra",               sets_reps: "4x12", weight: "8-10kg (a probar)",    category: "biceps",  image: IMG("Barbell_Curl/0.jpg") },
  { day: "Martes", name: "Curl Martillo",                   sets_reps: "3x12", weight: "5-6kg por mano (a probar)", category: "biceps",  image: IMG("Hammer_Curls/0.jpg") },

  // Miércoles — PIERNA
  { day: "Miércoles", name: "Sentadilla Libre",        sets_reps: "4x10", weight: "60kg (barra 20kg + 20kg/lado)", category: "piernas", image: IMG("Barbell_Squat/0.jpg") },
  { day: "Miércoles", name: "Hip Thrust en Máquina",   sets_reps: "4x10", weight: "15-20kg (a probar)",            category: "gluteos", image: IMG("Barbell_Hip_Thrust/0.jpg") },
  { day: "Miércoles", name: "Prensa 45°",              sets_reps: "4x12", weight: "30kg/lado",                     category: "piernas", image: IMG("Leg_Press/0.jpg") },
  { day: "Miércoles", name: "Curl Femoral Sentado",    sets_reps: "4x12", weight: "20kg",                          category: "piernas", image: IMG("Seated_Leg_Curl/0.jpg") },
  { day: "Miércoles", name: "Extensión Cuádriceps",    sets_reps: "3x15", weight: "32kg",                          category: "piernas", image: IMG("Leg_Extensions/0.jpg") },
  { day: "Miércoles", name: "Zancadas",                sets_reps: "3x15", weight: "Sin peso o 4-6kg",              category: "piernas", image: IMG("Bodyweight_Walking_Lunge/0.jpg") },
  { day: "Miércoles", name: "Pantorrilla de Pie (máquina)", sets_reps: "4x15", weight: "10kg/lado",                category: "piernas", image: IMG("Standing_Calf_Raises/0.jpg") },

  // Jueves — ABS + CARDIO
  { day: "Jueves", name: "Crunch Polea",       sets_reps: "4x15",   weight: "15-20kg (a probar)", category: "core",   image: IMG("Cable_Crunch/0.jpg") },
  { day: "Jueves", name: "Plancha Normal",     sets_reps: "5x1min", weight: "Peso corporal",      category: "core",   image: IMG("Plank/0.jpg") },
  { day: "Jueves", name: "Plancha Lateral",    sets_reps: "5x40s",  weight: "Peso corporal",      category: "core",   image: IMG("Push_Up_to_Side_Plank/0.jpg") },
  { day: "Jueves", name: "Elevación Piernas",  sets_reps: "5x15",   weight: "Peso corporal",      category: "core",   image: IMG("Hanging_Leg_Raise/0.jpg") },
  { day: "Jueves", name: "Rodillo",            sets_reps: "3x10",   weight: "Peso corporal",      category: "core",   image: IMG("Ab_Roller/0.jpg") },
  { day: "Jueves", name: "Cardio",             sets_reps: "25 min",  weight: null,                 category: "cardio", image: IMG("Running_Treadmill/0.jpg") },

  // Viernes — UPPER
  { day: "Viernes", name: "Press Inclinado Barra",     sets_reps: "4x10", weight: "~32kg",       category: "pecho",   image: IMG("Barbell_Incline_Bench_Press_-_Medium_Grip/0.jpg") },
  { day: "Viernes", name: "Jalón al Pecho Cerrado",    sets_reps: "4x10", weight: "50kg",        category: "espalda", image: IMG("Close-Grip_Front_Lat_Pulldown/0.jpg") },
  { day: "Viernes", name: "Jalón al Pecho Abierto",    sets_reps: "4x10", weight: "30-40kg",     category: "espalda", image: IMG("Wide-Grip_Lat_Pulldown/0.jpg") },
  { day: "Viernes", name: "Press Arnold",              sets_reps: "3x12", weight: "5kg",         category: "hombros", image: IMG("Arnold_Dumbbell_Press/0.jpg") },
  { day: "Viernes", name: "Elevaciones Laterales",     sets_reps: "4x15", weight: "5kg",         category: "hombros", image: IMG("Side_Lateral_Raise/0.jpg") },
  { day: "Viernes", name: "Curl Bíceps Alternado",     sets_reps: "3x15", weight: "4-5kg",       category: "biceps",  image: IMG("Alternate_Hammer_Curl/0.jpg") },
  { day: "Viernes", name: "Press Francés (barra EZ)",  sets_reps: "3x15", weight: "~17-20kg",    category: "triceps", image: IMG("Lying_Triceps_Press/0.jpg") },
];

const exercises = ROUTINE.map((r, i) => ({
  day: r.day,
  name: r.name,
  sets_reps: r.sets_reps,
  weight_template: r.weight,
  category: r.category,
  order_index: i,
  image_url: r.image,
}));

console.log(`Deleting existing exercises…`);
await supabase.from("exercises").delete().gt("id", 0);

console.log(`Inserting ${exercises.length} exercises…`);
const { data, error } = await supabase.from("exercises").insert(exercises).select();
if (error) { console.error(error); process.exit(1); }
console.log(`✓ Inserted ${data.length} rows`);
console.log(`Sábado = Descanso (no se inserta)`);
