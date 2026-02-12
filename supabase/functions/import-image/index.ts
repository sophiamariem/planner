import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

function getExtFromMime(type: string) {
  const raw = String(type || "").toLowerCase();
  if (raw.includes("png")) return "png";
  if (raw.includes("webp")) return "webp";
  if (raw.includes("gif")) return "gif";
  if (raw.includes("avif")) return "avif";
  return "jpg";
}

function getExtFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const file = (parsed.pathname.split("/").pop() || "").split("?")[0].split("#")[0];
    const ext = file.includes(".") ? file.slice(file.lastIndexOf(".") + 1).toLowerCase() : "";
    if (["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(ext)) return ext;
  } catch {
    // ignore
  }
  return "jpg";
}

function proxyImageSourceUrls(url: string) {
  const clean = String(url || "").trim();
  if (!clean) return [];
  const stripped = clean.replace(/^https?:\/\//i, "");
  const encoded = encodeURIComponent(stripped);
  return [
    `https://images.weserv.nl/?url=${encoded}&w=1800&output=jpg`,
    `https://wsrv.nl/?url=${encoded}&w=1800&output=jpg`,
  ];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Server config missing." }, 500);
  }

  let payload: { sourceUrl?: string; bucket?: string } = {};
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const sourceUrl = String(payload.sourceUrl || "").trim();
  if (!/^https?:\/\//i.test(sourceUrl)) {
    return json({ error: "sourceUrl must be an absolute http(s) URL." }, 400);
  }

  const bucket = String(payload.bucket || "trip-media").trim() || "trip-media";

  let remoteResponse: Response | null = null;
  let contentType = "";
  let blob: Blob | null = null;
  const fetchCandidates = [sourceUrl, ...proxyImageSourceUrls(sourceUrl)];

  for (const candidate of fetchCandidates) {
    try {
      const response = await fetch(candidate, {
        headers: {
          // Helps with hosts that reject empty/default agents.
          "User-Agent": "plnr-import-image/1.0",
          "Accept": "image/*,*/*;q=0.8",
          "Referer": sourceUrl,
        },
        redirect: "follow",
      });
      if (!response.ok) {
        console.log("[import-image] fetch not ok", { candidate, status: response.status });
        continue;
      }
      const nextType = String(response.headers.get("content-type") || "");
      if (!nextType.toLowerCase().startsWith("image/")) {
        console.log("[import-image] non-image response", { candidate, contentType: nextType });
        continue;
      }
      const nextBlob = await response.blob();
      if (!nextBlob || !nextBlob.size) {
        console.log("[import-image] empty body", { candidate });
        continue;
      }
      remoteResponse = response;
      contentType = nextType;
      blob = nextBlob;
      break;
    } catch {
      console.log("[import-image] fetch threw", { candidate });
      // try next candidate
    }
  }

  if (!remoteResponse || !blob) {
    console.log("[import-image] no usable candidate", { sourceUrl });
    return json({ error: "Could not fetch a usable image from source URL." }, 400);
  }

  const maxBytes = 15 * 1024 * 1024;
  if (blob.size > maxBytes) {
    return json({ error: "Image is too large.", maxBytes }, 413);
  }

  const ext = contentType ? getExtFromMime(contentType) : getExtFromUrl(sourceUrl);
  const path = `imports/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: uploadError } = await admin.storage
    .from(bucket)
    .upload(path, blob, { upsert: true, contentType: contentType || `image/${ext}` });

  if (uploadError) {
    return json({ error: "Storage upload failed.", details: uploadError.message }, 502);
  }

  const { data } = admin.storage.from(bucket).getPublicUrl(path);
  return json({ publicUrl: data.publicUrl, path, bucket });
});
