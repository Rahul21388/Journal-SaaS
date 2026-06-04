// FILE: components/Skeleton.tsx
interface Props {
  lines?: number
  className?: string
}

export default function Skeleton({ lines = 3, className = '' }: Props) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-slate-800 bg-slate-900 p-5"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="h-4 w-36 rounded bg-slate-800" />
            <div className="h-4 w-16 rounded bg-slate-800" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-slate-800" />
            <div className="h-3 w-5/6 rounded bg-slate-800" />
            <div className="h-3 w-4/6 rounded bg-slate-800" />
          </div>
          <div className="mt-4 h-7 w-16 rounded bg-slate-800" />
        </div>
      ))}
    </div>
  )
}
