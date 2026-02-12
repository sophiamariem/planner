import { palette } from "../data/trip";

function parseIsoDate(value) {
  const iso = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function monthKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function listMonthsInclusive(startDate, endDate) {
  const out = [];
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  while (cursor <= end) {
    out.push({ year: cursor.getFullYear(), month: cursor.getMonth() });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return out;
}

export default function CalendarView({
  year = 2025,
  month = 8,
  days = [],
  selectedId,
  onSelect,
  badges = {},
}) {
  const dayByIso = new Map();
  const parsedDates = [];

  for (const d of days || []) {
    const parsed = parseIsoDate(d?.isoDate);
    if (!parsed) continue;
    const iso = d.isoDate;
    dayByIso.set(iso, d);
    parsedDates.push(parsed);
  }

  const monthsToRender = parsedDates.length
    ? listMonthsInclusive(
        new Date(Math.min(...parsedDates.map((d) => d.getTime()))),
        new Date(Math.max(...parsedDates.map((d) => d.getTime())))
      )
    : [{ year, month }];

  return (
    <section className={`rounded-3xl p-5 ${palette.card} space-y-6`}>
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-pink-100 to-amber-100 text-zinc-800 shadow-sm">
          <span className="text-sm font-bold">Calendar</span>
        </div>
        <div className="text-xs text-zinc-600">Tap a highlighted date</div>
      </div>

      {monthsToRender.map(({ year: y, month: m }) => {
        const name = new Date(y, m, 1).toLocaleString(undefined, { month: "long", year: "numeric" });
        const firstDay = new Date(y, m, 1).getDay();
        const firstMon = (firstDay + 6) % 7;
        const daysIn = new Date(y, m + 1, 0).getDate();
        const cells = [];
        for (let i = 0; i < firstMon; i += 1) cells.push(null);
        for (let d = 1; d <= daysIn; d += 1) cells.push(d);
        while (cells.length % 7 !== 0) cells.push(null);

        return (
          <div key={monthKey(y, m)} className="space-y-3">
            <div className="text-sm font-bold text-zinc-800">{name}</div>
            <div className="grid grid-cols-7 text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={`${name}-${d}`} className="px-2 py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {cells.map((dayNum, i) => {
                if (dayNum === null) return <div key={`${monthKey(y, m)}-blank-${i}`} className="h-16 md:h-20 rounded-2xl bg-transparent" />;

                const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                const dayObj = dayByIso.get(iso) || null;
                const isActive = Boolean(dayObj);
                const isSelected = isActive && Number(selectedId) === Number(dayObj.id);

                const base = "h-16 md:h-20 rounded-2xl flex flex-col items-center justify-center text-sm font-semibold transition-all active:scale-95";
                const classes = isActive
                  ? (isSelected
                    ? "bg-gradient-to-b from-fuchsia-500 to-rose-500 text-white ring-2 ring-rose-400 shadow-md"
                    : "bg-gradient-to-b from-pink-100 to-amber-100 text-zinc-800 border border-pink-200/80 hover:shadow hover:-translate-y-[1px] focus-visible:ring-2 focus-visible:ring-rose-300")
                  : "bg-white/70 text-zinc-300 border border-zinc-200";

                const badgeKeyNum = Number(dayObj?.id);
                const dayBadges = dayObj
                  ? (badges[badgeKeyNum] || badges[dayObj.id] || [])
                  : [];

                return (
                  <button
                    key={`${monthKey(y, m)}-${dayNum}`}
                    type="button"
                    disabled={!isActive}
                    className={`${base} ${classes}`}
                    onClick={() => onSelect?.(Number(dayObj.id))}
                  >
                    <div className="leading-none">{dayNum}</div>
                    {dayBadges.length > 0 && (
                      <div className="mt-1 flex gap-1 justify-center">
                        {dayBadges.slice(0, 3).map((b, ix) => (
                          <span key={ix} className="text-base" aria-hidden="true">
                            {b}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}
