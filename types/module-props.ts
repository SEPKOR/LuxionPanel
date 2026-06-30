import type { Dispatch, SetStateAction } from "react";
import type { ModuleId } from "@/types/module";
import type { AppSettings } from "@/types/settings";

export interface ModuleProps {
  openModule: (moduleId: ModuleId) => void;
  settings: AppSettings;
  setSettings: Dispatch<SetStateAction<AppSettings>>;
  userId?: string;
  userRole?: string;
}
