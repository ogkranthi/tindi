// Tindi's modules. Health is live; the rest are the family-OS roadmap.
// Nav + the home launcher render from this registry so new modules drop in cheaply.

export interface ModuleLink {
  href: string;
  label: string;
}

export interface AppModule {
  id: string;
  name: string;
  icon: string;
  status: "active" | "soon";
  blurb: string;
  /** Landing route for the module. */
  href: string;
  /** Sub-pages shown in the header nav when the module is active. */
  links?: ModuleLink[];
}

export const MODULES: AppModule[] = [
  {
    id: "health",
    name: "Health & Food",
    icon: "🌿",
    status: "active",
    blurb: "Meal plans, grocery, daily tracking, and personalized health insights.",
    href: "/health",
    links: [
      { href: "/health", label: "Insights" },
      { href: "/track", label: "Track" },
      { href: "/meal-plan", label: "Meal Plan" },
      { href: "/grocery", label: "Grocery" },
      { href: "/family", label: "Family" },
    ],
  },
  {
    id: "toddler",
    name: "Toddler Time",
    icon: "🧸",
    status: "active",
    blurb: "Age-appropriate games, learning & weekend adventures for your little one.",
    href: "/toddler",
    links: [
      { href: "/toddler", label: "This Week" },
      { href: "/toddler/favorites", label: "Favorites" },
      { href: "/toddler/journal", label: "Journal" },
    ],
  },
  {
    id: "notes",
    name: "Notes",
    icon: "📝",
    status: "active",
    blurb: "Shared family notes, reminders, and lists — pin what matters.",
    href: "/notes",
  },
  {
    id: "subscriptions",
    name: "Subscriptions",
    icon: "🔁",
    status: "soon",
    blurb: "Track recurring services, renewal dates, and what they cost.",
    href: "/subscriptions",
  },
  {
    id: "finances",
    name: "Finances",
    icon: "💰",
    status: "active",
    blurb: "Track household expenses and income with AI budget insights.",
    href: "/finances",
  },
];

export const HEALTH_MODULE = MODULES.find((m) => m.id === "health")!;
