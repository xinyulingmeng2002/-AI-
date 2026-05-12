export function generateId(prefix = 'id'): string {
  const counter = generateId.counter++ || 0
  generateId.counter = counter + 1
  return `${prefix}_${Date.now()}_${counter}`
}
generateId.counter = 0

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '')
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

export function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN')
}
