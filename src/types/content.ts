export type AppStatus = "live" | "wip" | "retired";
export type AppSize = "featured" | "standard" | "small";

export interface App {
  id: string;
  name: string;
  tagline: string;
  category: string;
  status: AppStatus;
  /** Tile size in the bento grid. Defaults to "standard". */
  size?: AppSize;
  /** Path to a self-contained SVG icon (baked accent color). */
  icon: string;
  /** Accent color as #rrggbb — used for the icon plate tint. */
  accent: string;
  tags?: string[];
  /** Where the app launches (new window). Required when status is "live". */
  launchUrl?: string;
  repoUrl?: string;
  date?: string;
}

export interface ContentData {
  apps: App[];
}
