"use client";

export function PageHeader({ eyebrow, title, description, actions, className = "" }) {
  return (
    <div className={`px-4 pt-2 md:px-8 lg:px-13 ${className}`}>
      <div className="flex flex-col gap-3 pb-6">
        <div className="text-orange-400 text-xs font-semibold uppercase tracking-[0.35em]">
          {eyebrow}
        </div>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <h1 className="display-font text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-col gap-3 sm:flex-row sm:items-center">{actions}</div> : null}
        </div>
      </div>
    </div>
  );
}
