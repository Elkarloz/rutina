export type CategoryStyle = {
  label: string;
  icon: string;
  gradient: string;
  accent: string;
  image: string;
};

const u = (id: string) => `https://images.unsplash.com/photo-${id}?w=600&q=70&auto=format&fit=crop`;

export const CATEGORIES: Record<string, CategoryStyle> = {
  pecho:    { label: "Pecho",    icon: "fitness_center",      gradient: "from-rose-500/30 via-orange-500/10 to-transparent",  accent: "text-rose-300", image: u("1534438327276-14e5300c3a48") },
  espalda:  { label: "Espalda",  icon: "rowing",              gradient: "from-sky-500/30 via-blue-500/10 to-transparent",     accent: "text-sky-300", image: u("1581009146145-b5ef050c2e1e") },
  hombros:  { label: "Hombros",  icon: "exercise",            gradient: "from-violet-500/30 via-purple-500/10 to-transparent", accent: "text-violet-300", image: u("1532029837206-abbe2b7620e3") },
  biceps:   { label: "Bíceps",   icon: "sports_martial_arts", gradient: "from-amber-500/30 via-yellow-500/10 to-transparent", accent: "text-amber-300", image: u("1581009137042-c552e485697a") },
  triceps:  { label: "Tríceps",  icon: "sports_handball",     gradient: "from-orange-500/30 via-red-500/10 to-transparent",   accent: "text-orange-300", image: u("1517836357463-d25dfeac3438") },
  piernas:  { label: "Piernas",  icon: "directions_walk",     gradient: "from-emerald-500/30 via-green-500/10 to-transparent", accent: "text-emerald-300", image: u("1434608519344-49d77a699e1d") },
  gluteos:  { label: "Glúteos",  icon: "self_improvement",    gradient: "from-pink-500/30 via-fuchsia-500/10 to-transparent", accent: "text-pink-300", image: u("1518611012118-696072aa579a") },
  core:     { label: "Core",     icon: "local_fire_department", gradient: "from-red-500/30 via-rose-500/10 to-transparent",   accent: "text-red-300", image: u("1571019613454-1cb2f99b2d8b") },
  cardio:   { label: "Cardio",   icon: "directions_run",      gradient: "from-cyan-500/30 via-teal-500/10 to-transparent",    accent: "text-cyan-300", image: u("1538805060514-97d9cc17730c") },
  otros:    { label: "Otros",    icon: "fitness_center",      gradient: "from-zinc-500/30 via-zinc-700/10 to-transparent",    accent: "text-zinc-300", image: u("1571019614242-c5c5dee9f50b") },
};

export const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function todayDay(): string {
  return DAYS[new Date().getDay()];
}

export function parseSetCount(s: string | null): number {
  if (!s) return 3;
  const m = s.match(/(\d+)\s*[xX×]/);
  return m ? Math.min(parseInt(m[1], 10), 8) : 3;
}

export function parseTargetReps(s: string | null): number | null {
  if (!s) return null;
  const m = s.match(/[xX×]\s*(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

export function weekBounds(date = new Date()): { start: string; end: string } {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (x: Date) =>
    `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  return { start: fmt(monday), end: fmt(sunday) };
}

export function weekNumber(date = new Date()): number {
  const { start } = weekBounds(date);
  const monday = new Date(start + "T00:00:00");
  const jan1 = new Date(monday.getFullYear(), 0, 1);
  const diff = monday.getTime() - jan1.getTime();
  return Math.ceil((diff / 86400000 + jan1.getDay() + 1) / 7);
}
