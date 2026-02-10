export default function Chip({ children, className = "" }) {
    return (
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wide ${className}`}>{children}</span>
    );
}
