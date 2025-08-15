import { createContext } from "@lit/context";

export interface Themes {
  default_theme: string;
  default_dark_theme?: string;
  darkMode?: boolean;
  themes: Record<string, any>;
}

export const themesContext = createContext<Themes>("themes");
