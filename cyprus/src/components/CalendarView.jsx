import { palette } from "../data/trip";

export default function CalendarView({
    year = 2025,
    month = 8,                // 0-based; 8 = September
    activeDays = [],
    selectedId,
    onSelect,
    badges = {}
}) {
    const monthName = new Date(year, month, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' });
    const firstDay = new Date(year, month, 1).getDay(); // 0 Sun..6 Sat
    const firstMon = (firstDay + 6) % 7; // convert to Mon=0
    const daysIn = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i=0;i<firstMon;i++) cells.push(null);
    for (let d=1; d<=daysIn; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const active = new Set(activeDays);

    return (
        <section className={`rounded-3xl p-5 ${palette.card}`}>
            <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-pink-100 to-amber-100 text-zinc-800 shadow-sm">
                    <span className="text-sm font-bold">{monthName}</span>
                </div>
                <div className="text-xs text-zinc-600">Tap a highlighted date</div>
            </div>

            <div className="mt-4 grid grid-cols-7 text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (<div key={d} className="px-2 py-1">{d}</div>))}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {cells.map((d,i) => {
                    if (d === null) return <div key={i} className="h-16 md:h-20 rounded-2xl bg-transparent"/>;
                    const isActive = active.has(d);
                    const isSelected = selectedId === d;

                    const base = 'h-16 md:h-20 rounded-2xl flex flex-col items-center justify-center text-sm font-semibold transition-all active:scale-95';
                    const classes = isActive
                        ? (isSelected
                            ? 'bg-gradient-to-b from-fuchsia-500 to-rose-500 text-white ring-2 ring-rose-400 shadow-md'
                            : 'bg-gradient-to-b from-pink-100 to-amber-100 text-zinc-800 border border-pink-200/80 hover:shadow hover:-translate-y-[1px] focus-visible:ring-2 focus-visible:ring-rose-300')
                        : 'bg-white/70 text-zinc-300 border border-zinc-200';

                    const dayBadges = badges[d] || [];

                    return (
                        <button
                            key={i}
                            type="button"
                            disabled={!isActive}
                            className={`${base} ${classes}`}
                            onClick={() => onSelect?.(d)}
                        >
                            <div className="leading-none">{d}</div>
                            {dayBadges.length > 0 && (
                                <div className="mt-1 flex gap-1 justify-center">
                                    {dayBadges.slice(0,3).map((b,ix)=>(<span key={ix} className="text-base" aria-hidden="true">{b}</span>))}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
