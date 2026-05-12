// 平台检测工具

export type Platform = 'electron' | 'capacitor' | 'web'

export function detectPlatform(): Platform {
  // Capacitor 注入 capacitor 全局变量
  if (typeof window !== 'undefined' && (window as Record<string, unknown>).Capacitor) {
    return 'capacitor'
  }
  // Electron 注入 process.versions.electron (通过 preload)
  if (typeof window !== 'undefined' && 'mindforge' in window) {
    return 'electron'
  }
  return 'web'
}

export function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return /Android|HarmonyOS|iPhone|iPad/i.test(navigator.userAgent)
}

export function isCapacitor(): boolean {
  return detectPlatform() === 'capacitor'
}

export function isElectron(): boolean {
  return detectPlatform() === 'electron'
}
