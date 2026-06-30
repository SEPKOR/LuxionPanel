export interface AppSettings {
  theme: "dark" | "light";
  language: "en" | "id";
  animations: boolean;
  autoBackup: boolean;
  compactMode: boolean;
  weatherLocation: string;
  timezone: string;
}

export const defaultSettings: AppSettings = {
  theme: "dark",
  language: "en",
  animations: true,
  autoBackup: false,
  compactMode: false,
  weatherLocation: "Jakarta",
  timezone: "UTC",
};
