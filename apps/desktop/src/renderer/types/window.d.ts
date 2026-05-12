export {}

declare global {
  interface Window {
    mindforge: {
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
