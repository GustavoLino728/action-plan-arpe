export function PageTitle({
  title,
  description,
  actions,
}: {
  title: string
  description: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance text-primary dark:text-foreground">{title}</h1>
        <p className="max-w-2xl text-sm text-pretty text-muted-foreground">{description}</p>
      </div>
      {actions}
    </div>
  )
}
