export function ensureTailwindCDN() {
    if (typeof document === "undefined") return;
    if (!document.getElementById("twcdn")) {
        const s = document.createElement("script");
        s.id = "twcdn";
        s.src = "https://cdn.tailwindcss.com";
        document.head.appendChild(s);
    }
}
