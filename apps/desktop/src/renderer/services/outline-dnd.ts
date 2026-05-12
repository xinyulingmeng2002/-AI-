// 大纲拖拽排序工具

export interface DragState {
  type: 'volume' | 'chapter'
  sourceVolumeId: string
  sourceIndex: number
  targetVolumeId: string
  targetIndex: number
}

export function createDragImage(text: string): HTMLDivElement {
  const el = document.createElement('div')
  el.textContent = text
  el.style.cssText = `
    position: fixed; top: -1000px; left: 0;
    padding: 4px 12px; background: #2a2a4a; color: #e2e8f0;
    border-radius: 4px; font-size: 12px; white-space: nowrap;
    pointer-events: none; z-index: 9999;
  `
  return el
}
