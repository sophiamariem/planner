import Chip from "./Chip";
import { IconPlane } from "./Icons";
import { palette } from "../data/trip";

function normalizeArrowText(value) {
    if (typeof value !== "string") return value;
    return value.replace(/\s*->\s*/g, " → ");
}

export default function FlightCard({ f }) {
    return (
        <div className={`${palette.card} rounded-3xl p-5`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-900 font-semibold"><IconPlane/> <span>{normalizeArrowText(f.title)}</span></div>
                <div className="text-sm text-zinc-500">{normalizeArrowText(f.num)}</div>
            </div>
            <div className="mt-2 text-zinc-800">{normalizeArrowText(f.route)}</div>
            <div className="mt-1 text-sm text-zinc-600">{f.date}</div>
            <div className="mt-3 flex flex-wrap gap-2 items-center text-zinc-900">
                <Chip className="bg-blue-600 text-white">{normalizeArrowText(f.times)}</Chip>
                <Chip className="bg-zinc-900 text-white">{normalizeArrowText(f.codes)}</Chip>
            </div>
        </div>
    );
}
