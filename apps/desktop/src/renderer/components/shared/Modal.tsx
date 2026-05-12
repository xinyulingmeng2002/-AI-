export function Modal({ children, onClose, width = '480px' }: {
  children: React.ReactNode; onClose?: () => void; width?: string
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface border border-white/10 rounded-xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto"
           style={{ width }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
