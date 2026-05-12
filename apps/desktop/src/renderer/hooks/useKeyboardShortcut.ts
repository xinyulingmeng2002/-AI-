import { useEffect } from 'react'

export function useKeyboardShortcut(
  key: string,
  handler: (e: KeyboardEvent) => void,
  deps: unknown[] = []
) {
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === key && e.ctrlKey) {
        e.preventDefault()
        handler(e)
      }
    }
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [key, handler, ...deps])
}
