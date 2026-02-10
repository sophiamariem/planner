function Photo({ q, alt, className = "h-56 md:h-72" }) {
    const safeQuery = q || "travel destination";
    const src = `https://source.unsplash.com/1200x800/?${encodeURIComponent(safeQuery)}`;
    return <img src={src} alt={alt} loading="lazy" className={`w-full object-cover rounded-3xl ${className}`}/>;
}

export default function PhotoCollage({ urls = [], fallbackQuery, className = "h-56 md:h-72" }) {
    const n = urls.length;
    if (n <= 0) return <Photo q={fallbackQuery} alt={fallbackQuery} className={className}/>;
    if (n === 1) {
        return (
            <div className={`w-full ${className} rounded-3xl overflow-hidden`}>
                <img src={urls[0]} alt="" className="w-full h-full object-cover" loading="lazy"/>
            </div>
        );
    }
    if (n === 2) {
        return (
            <div className={`w-full ${className} rounded-3xl overflow-hidden grid grid-cols-2 gap-2`}>
                {urls.slice(0,2).map((u,i)=>(<img key={i} src={u} alt="" className="w-full h-full object-cover rounded-2xl" loading="lazy"/>))}
            </div>
        );
    }
    if (n === 3) {
        return (
            <div className={`w-full ${className} rounded-3xl overflow-hidden grid grid-cols-3 gap-2`}>
                <img src={urls[0]} alt="" className="w-full h-full object-cover rounded-2xl col-span-2 row-span-2" loading="lazy"/>
                <img src={urls[1]} alt="" className="w-full h-full object-cover rounded-2xl" loading="lazy"/>
                <img src={urls[2]} alt="" className="w-full h-full object-cover rounded-2xl" loading="lazy"/>
            </div>
        );
    }
    return (
        <div className={`w-full ${className} rounded-3xl overflow-hidden grid grid-cols-2 grid-rows-2 gap-2`}>
            {urls.slice(0,4).map((u,i)=>(<img key={i} src={u} alt="" className="w-full h-full object-cover rounded-2xl" loading="lazy"/>))}
        </div>
    );
}
