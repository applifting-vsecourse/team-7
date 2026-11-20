export function SettingsSectionHeader({
  id,
  title,
  description,
}: {
  id: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex w-full flex-col gap-1">
      <h2 id={id} className="text-xl leading-7 font-semibold tracking-tight">
        {title}
      </h2>
      <p className="text-sm leading-6 text-muted">{description}</p>
    </div>
  );
}
