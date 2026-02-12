import Chip from "./Chip";
import Action from "./Action";
import PhotoCollage from "./PhotoCollage";
import DayMap from "./DayMap";
import { IconCar, IconPin } from "./Icons";
import { mapSearch } from "../utils/maps";
import { palette } from "../data/trip";

function normalizeArrowText(value) {
    if (typeof value !== "string") return value;
    return value.replace(/\s*->\s*/g, " → ");
}

export default function DayCard({ d, showMaps = true, imgClass = "h-56 md:h-72" }) {
    return (
        <section id={`day-${d.id}`} className="scroll-mt-28">
            <div className={`rounded-3xl p-4 md:p-5 ${palette.card}`}>
                <div className="grid gap-4 md:grid-cols-[auto,1fr] items-start">
                    <div className="flex flex-col items-center md:items-start">
                        <div className="flex items-center gap-2">
                            <Chip className={`${palette.day}`}>{d.dow}</Chip>
                            <Chip className={`${palette.date}`}>{d.date}</Chip>
                        </div>
                    </div>
                    <div>
                        <h3 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${d.highlight?"bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 bg-clip-text text-transparent":"text-zinc-900"}`}>{normalizeArrowText(d.title)}</h3>
                        <div className="mt-3 grid md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 order-2 md:order-1">
                                {d.hasMap && showMaps ? (
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="col-span-2">
                                            <PhotoCollage urls={d.photos} fallbackQuery={d.photoQ} className={imgClass}/>
                                        </div>
                                        <DayMap pins={d.pins} className={imgClass} />
                                    </div>
                                ) : (
                                    <PhotoCollage urls={d.photos} fallbackQuery={d.photoQ} className={imgClass}/>
                                )}
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {d.hasMap && (<Action href={d.route}><IconCar/> <span>Open driving route</span></Action>)}
                                    {d.pins?.map((p, i) => (
                                        <Action key={i} href={mapSearch(p.q)}><IconPin/> <span>{i+1}. {p.name}</span></Action>
                                    ))}
                                </div>
                            </div>
                            <div className="order-1 md:order-2">
                                <div className="mt-3 rounded-2xl p-3 bg-gradient-to-br from-amber-100 to-pink-100">
                                    <div className="text-xs text-zinc-600">Plan</div>
                                    <ol className="mt-1 space-y-2">
                                        {(d.notes || []).map((note, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="w-6 h-6 rounded-full bg-zinc-900 text-white grid place-content-center text-xs font-bold">{i+1}</span>
                                                <span className="text-sm font-medium text-zinc-800">{normalizeArrowText(note)}</span>
                                            </li>
                                        ))}
                                        {(!d.notes || d.notes.length === 0) && (
                                            <li className="text-sm text-zinc-500">No notes added for this day.</li>
                                        )}
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
