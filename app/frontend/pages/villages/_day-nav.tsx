import { dayLabel, dayUrl } from "@/lib/links";

type DayNavProps = {
  base: Record<string, string>;
  day: string;
  available_days: string[];
};

export function DayNav({ base, day, available_days }: DayNavProps) {
  const dayIndex = available_days.indexOf(day);
  const prevDay = dayIndex > 0 ? available_days[dayIndex - 1] : null;
  const nextDay =
    dayIndex >= 0 && dayIndex < available_days.length - 1
      ? available_days[dayIndex + 1]
      : null;

  return (
    <>
      <div className="mt-4 flex items-center gap-1 overflow-x-auto">
        {available_days.map((d) => (
          <a
            key={d}
            href={dayUrl({ ...base, day: d })}
            className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              d === day
                ? "bg-stone-800 text-white"
                : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
            }`}
          >
            {dayLabel(d)}
          </a>
        ))}
      </div>

      <div className="mt-4 flex justify-between">
        {prevDay ? (
          <a
            href={dayUrl({ ...base, day: prevDay })}
            className="text-xs font-medium text-stone-500 hover:text-stone-700"
          >
            &larr; {dayLabel(prevDay)}
          </a>
        ) : (
          <span />
        )}
        {nextDay ? (
          <a
            href={dayUrl({ ...base, day: nextDay })}
            className="text-xs font-medium text-stone-500 hover:text-stone-700"
          >
            {dayLabel(nextDay)} &rarr;
          </a>
        ) : (
          <span />
        )}
      </div>
    </>
  );
}
