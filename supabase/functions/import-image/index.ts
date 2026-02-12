import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_BUCKET = "trip-media";
const MAX_IMPORTS_PER_USER_PER_DAY = 120;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

const DENYLIST_HOSTS = new Set([
  "localhost",
  "0.0.0.0",
  "127.0.0.1",
  "::1",
  "169.254.169.254",
  "metadata.google.internal",
]);

const DENYLIST_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".lan",
];

function isPrivateOrLocalHost(hostname: string) {
  const host = String(hostname || "").trim().toLowerCase();
  if (!host) return true;
  if (DENYLIST_HOSTS.has(host)) return true;
  for (const suffix of DENYLIST_SUFFIXES) {
    if (host.endsWith(suffix)) return true;
  }

  // Block literal IPv4 private/link-local ranges.
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const a = Number(ipv4[1]);
    const b = Number(ipv4[2]);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }

  // Block obvious IPv6 local ranges when provided as a literal.
  if (host.startsWith("fe80:") || host.startsWith("fc") || host.startsWith("fd")) return true;

  return false;
}

function isBlockedUrl(url: URL) {
  // Only allow http(s).
  if (url.protocol !== "http:" && url.protocol !== "https:") return true;
  // Block credentials in URLs.
  if (url.username || url.password) return true;
  // Block non-standard ports (keep it simple).
  const port = url.port ? Number(url.port) : null;
  if (port !== null && port !== 80 && port !== 443) return true;
  if (isPrivateOrLocalHost(url.hostname)) return true;
  return false;
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

async function fetchWithCheckedRedirects(inputUrl: string, headers: HeadersInit, maxRedirects = 5) {
  let current: URL;
  try {
    current = new URL(inputUrl);
  } catch {
    return null;
  }
  if (isBlockedUrl(current)) return null;

  for (let i = 0; i <= maxRedirects; i += 1) {
    const res = await fetch(current.toString(), {
      headers,
      redirect: "manual",
    });

    // Handle redirects manually so we can re-check host/scheme at each hop.
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) return null;
      const next = new URL(location, current);
      if (isBlockedUrl(next)) return null;
      current = next;
      continue;
    }

    return res;
  }

  return null;
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

  // With `--no-verify-jwt`, Edge Functions skip gateway auth checks.
  // We enforce auth here by validating the caller's user access token.
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const bearer = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (!bearer) {
    return json({ error: "Missing Authorization bearer token." }, 401);
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

  // Production: do not allow arbitrary buckets from client input.
  // Bucket must exist ahead of time (no auto-create).
  const configuredBucket = String(Deno.env.get("MEDIA_BUCKET") || DEFAULT_BUCKET).trim() || DEFAULT_BUCKET;
  const requestedBucket = String(payload.bucket || configuredBucket).trim() || configuredBucket;
  if (requestedBucket !== configuredBucket) {
    return json({ error: "Invalid bucket." }, 400);
  }
  const bucket = configuredBucket;

  try {
    const parsed = new URL(sourceUrl);
    if (isBlockedUrl(parsed)) {
      return json({ error: "Blocked source host." }, 400);
    }
  } catch {
    return json({ error: "Invalid sourceUrl." }, 400);
  }

  let remoteResponse: Response | null = null;
  let contentType = "";
  let blob: Blob | null = null;
  const fetchCandidates = [sourceUrl, ...proxyImageSourceUrls(sourceUrl)];

  for (const candidate of fetchCandidates) {
    try {
      const response = await fetchWithCheckedRedirects(candidate, {
        // Helps with hosts that reject empty/default agents.
        "User-Agent": "plnr-import-image/1.0",
        "Accept": "image/*,*/*;q=0.8",
        "Referer": sourceUrl,
      });
      if (!response) continue;
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

  const { data: authData, error: authError } = await admin.auth.getUser(bearer);
  if (authError || !authData?.user) {
    return json({ error: "Invalid user session." }, 401);
  }

  // Simple per-user daily rate limit (requires DB migration).
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data: nextCount, error: bumpError } = await admin.rpc("bump_import_usage", {
      p_user_id: authData.user.id,
      p_day: today,
      p_inc: 1,
    });
    if (!bumpError && typeof nextCount === "number" && nextCount > MAX_IMPORTS_PER_USER_PER_DAY) {
      return json({ error: "Too many imports today. Please try again tomorrow." }, 429);
    }
  } catch {
    // If limiter fails, continue (fail-open) rather than breaking saves.
  }

  const { error: uploadError } = await admin.storage
    .from(bucket)
    .upload(path, blob, { upsert: true, contentType: contentType || `image/${ext}` });

  if (uploadError) {
    return json({ error: "Storage upload failed.", details: uploadError.message }, 502);
  }

  const { data } = admin.storage.from(bucket).getPublicUrl(path);
  return json({ publicUrl: data.publicUrl, path, bucket });
});
