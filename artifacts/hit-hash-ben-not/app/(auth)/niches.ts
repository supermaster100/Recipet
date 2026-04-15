export type NicheId =
  | "travel-nurse"
  | "digital-nomad"
  | "touring-musician"
  | "general";

export interface NicheOption {
  id: NicheId;
  emoji: string;
  title: string;
  desc: string;
}

export const NICHES: NicheOption[] = [
  {
    id: "travel-nurse",
    emoji: "🏥",
    title: "Travel Nurse",
    desc: "Track assignments, per diem & multi-state taxes",
  },
  {
    id: "digital-nomad",
    emoji: "🌍",
    title: "Digital Nomad",
    desc: "Multi-currency, location sessions & tax exports",
  },
  {
    id: "touring-musician",
    emoji: "🎸",
    title: "Touring Musician",
    desc: "Tour P&L, per-show income & expense tracking",
  },
  {
    id: "general",
    emoji: "📊",
    title: "General",
    desc: "Personal & business expense management",
  },
];

export function isValidNiche(
  value: string | string[] | undefined,
): value is NicheId {
  return (
    typeof value === "string" &&
    NICHES.some((n) => n.id === value)
  );
}
