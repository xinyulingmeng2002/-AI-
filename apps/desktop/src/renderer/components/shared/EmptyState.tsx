export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-white/20 text-[11px] text-center py-8 leading-relaxed px-4">
      {children}
    </div>
  )
}
