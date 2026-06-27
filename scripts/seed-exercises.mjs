import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function normalizeDay(s) {
  const cleaned = s.replace(/[—\-\s]+$/g, "").trim();
  return DAYS.find(d => cleaned.toLowerCase().startsWith(d.toLowerCase())) ?? null;
}

function categorize(name) {
  const n = name.toLowerCase();
  if (/press banca|press inclin|apertur/.test(n)) return "pecho";
  if (/jal[oó]n|remo|pulldown|dorsal/.test(n)) return "espalda";
  if (/hombro|elevaci[oó]n lateral|elevaci[oó]n frontal|encogimien|trapecio|face pull/.test(n)) return "hombros";
  if (/b[ií]ceps|curl/.test(n) && !/femoral/.test(n)) return "biceps";
  if (/tr[ií]ceps|franc[eé]s/.test(n)) return "triceps";
  if (/glúteo|gluteo|hip thrust|patada|abducci/.test(n)) return "gluteos";
  if (/sentadill|prensa|piern|femoral|talones|peso muerto|zancada|extensi[oó]n/.test(n)) return "piernas";
  if (/crunch|plancha|abdom|elevaci[oó]n de piernas/.test(n)) return "core";
  if (/cardio|caminata|movilidad/.test(n)) return "cardio";
  return "otros";
}

function parseCsv(text) {
  const out = [];
  let field = "", row = [], inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\r") {}
      else if (c === "\n") { row.push(field); out.push(row); row = []; field = ""; }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); out.push(row); }
  const cleaned = out.filter(r => r.some(v => v.trim() !== ""));
  const headers = cleaned[0].map(h => h.trim());
  return cleaned.slice(1).map(r => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? "").trim()])));
}

const csv = await readFile("data/routine.csv", "utf8");
const rows = parseCsv(csv);

const exercises = [];
let currentDay = null;
let order = 0;
for (const r of rows) {
  const d = normalizeDay(r["Día"]);
  if (d) currentDay = d;
  const setsReps = (r["Series x Reps"] ?? "").trim();
  const isSection = !setsReps || /^[—\-]+$/.test(setsReps);
  if (isSection) continue;
  if (!currentDay) continue;
  exercises.push({
    day: currentDay,
    name: r["Ejercicio"],
    sets_reps: setsReps || null,
    weight_template: r["Peso aproximado"] || null,
    category: categorize(r["Ejercicio"]),
    order_index: order++,
  });
}

console.log(`Inserting ${exercises.length} exercises…`);
await supabase.from("exercises").delete().gt("id", 0);
const { data, error } = await supabase.from("exercises").insert(exercises).select();
if (error) { console.error(error); process.exit(1); }
console.log(`Inserted ${data.length} rows`);
