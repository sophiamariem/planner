export default function Action({ href, children }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl border border-zinc-300 text-zinc-900 bg-white/90 hover:bg-white shadow-sm active:scale-[.99] transition"
        >
            {children}
        </a>
    );
}
