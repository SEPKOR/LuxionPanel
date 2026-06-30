export interface ApiResponse<T> {
  ok: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface HomelabSnapshot {
  cpu: number;
  ram: number;
  disk: number;
  network: {
    interfaces: number;
    addresses: number;
  };
  uptimeSeconds: number;
  docker: Array<{
    id: string;
    name: string;
    image: string;
    status: string;
  }>;
  pings: Array<{
    target: string;
    latencyMs: number | null;
    online: boolean;
  }>;
  updatedAt: string;
}

export interface AnalyticsSnapshot {
  storageBytes: number;
  totalNotes: number;
  totalFiles: number;
  totalTasks: number;
  activeModules: number;
  uptimeSeconds: number;
}

export interface StoredFile {
  id: string;
  name: string;
  path: string;
  thumbnailPath?: string;
  type: string;
  size: number;
  folder: string;
  createdAt: string;
}
