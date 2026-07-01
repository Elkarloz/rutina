import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const IMAGE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Triceps_Press/0.jpg";

const { data, error } = await supabase
  .from("exercises")
  .update({
    name: "Tríceps Press Francés",
    weight_template: "5kg",
    image_url: IMAGE,
  })
  .eq("day", "Lunes")
  .eq("name", "Extensión Tríceps Cuerda")
  .select();

if (error) {
  console.error(error);
  process.exit(1);
}

if (!data?.length) {
  const { data: fallback, error: fbErr } = await supabase
    .from("exercises")
    .update({
      name: "Tríceps Press Francés",
      weight_template: "5kg",
      image_url: IMAGE,
    })
    .eq("day", "Lunes")
    .ilike("name", "%cuerda%")
    .select();
  if (fbErr) {
    console.error(fbErr);
    process.exit(1);
  }
  console.log(`✓ Updated ${fallback?.length ?? 0} row(s) (fallback match)`);
} else {
  console.log(`✓ Updated ${data.length} row(s)`);
  console.log(data);
}
