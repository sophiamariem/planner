import { useEffect } from "react";

export default function useFavicon(url){
    useEffect(()=>{
        if(typeof document === 'undefined') return;
        let link = document.querySelector("link[rel~='icon']");
        if(!link){ link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
        link.href = url;
    }, [url]);
}
