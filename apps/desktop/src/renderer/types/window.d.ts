export {}

declare global {
  interface Window {
    mindforge: {
      db: {
        insert: (table: string, data: Record<string, unknown>) => Promise<{ success: boolean; id?: string; error?: string }>
        update: (table: string, id: string, data: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>
        getOne: (table: string, id: string) => Promise<{ success: boolean; data?: Record<string, unknown> | null; error?: string }>
        getAll: (table: string, workspaceId: string) => Promise<{ success: boolean; data?: Record<string, unknown>[]; error?: string }>
        delete: (table: string, id: string) => Promise<{ success: boolean; error?: string }>
        deleteByWorkspace: (table: string, workspaceId: string) => Promise<{ success: boolean; error?: string }>
      }
      workspace: {
        create: (data: Record<string, unknown>) => Promise<{ success: boolean; id?: string; error?: string }>
        list: () => Promise<{ success: boolean; data?: Record<string, unknown>[]; error?: string }>
        update: (id: string, data: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>
        delete: (id: string) => Promise<{ success: boolean; error?: string }>
      }
      readFile: (path: string) => Promise<string>
      writeFile: (path: string, content: string) => Promise<void>
      readDir: (path: string) => Promise<string[]>
      mkdir: (path: string) => Promise<void>
      getAppVersion: () => Promise<string>
      getPlatform: () => string
      secureStore: {
        get: (key: string) => Promise<string | null>
        set: (key: string, value: string) => Promise<void>
        delete: (key: string) => Promise<void>
      }
    }
  }
}
