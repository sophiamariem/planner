import React, { useEffect, useMemo, useState } from 'react';
import { Image, Text, View } from 'react-native';

function coerceImageUri(value) {
  if (typeof value === 'string') return value.trim();
  if (!value || typeof value !== 'object') return '';
  const nestedUrls = value.urls && typeof value.urls === 'object'
    ? [value.urls.raw, value.urls.full, value.urls.regular, value.urls.small, value.urls.thumb]
    : [];
  const candidates = [
    value.url,
    value.uri,
    value.src,
    value.publicUrl,
    value.image,
    value.path,
    value.downloadURL,
    value.downloadUrl,
    ...nestedUrls,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  }
  return '';
}

function normalizeSupabasePublicImageUrl(uri) {
  const clean = coerceImageUri(uri);
  if (!clean) return '';
  if (!clean.includes('/storage/v1/object/')) return clean;
  if (clean.includes('/storage/v1/object/public/')) return clean;

  try {
    const parsed = new URL(clean);
    const path = parsed.pathname || '';
    const signMatch = path.match(/\/storage\/v1\/object\/sign\/([^/]+)\/(.+)$/);
    if (signMatch) {
      parsed.pathname = `/storage/v1/object/public/${signMatch[1]}/${signMatch[2]}`;
      parsed.search = '';
      return parsed.toString();
    }
    const rawMatch = path.match(/\/storage\/v1\/object\/([^/]+)\/(.+)$/);
    if (rawMatch) {
      parsed.pathname = `/storage/v1/object/public/${rawMatch[1]}/${rawMatch[2]}`;
      return parsed.toString();
    }
  } catch {
    return clean;
  }

  return clean;
}

function expandImageCandidates(value) {
  const raw = coerceImageUri(value);
  if (!raw) return [];
  const normalized = normalizeSupabasePublicImageUrl(raw);
  if (!normalized || normalized === raw) return [raw];
  return [raw, normalized];
}

export function fallbackPhotoUri(query, index = 0) {
  const seed = encodeURIComponent(String(query || 'travel').trim() || 'travel');
  return `https://picsum.photos/seed/${seed}-${index}/1200/800`;
}

export function proxyImageUris(uri) {
  const [preferred] = expandImageCandidates(uri);
  if (!preferred) return [];
  const stripped = preferred.replace(/^https?:\/\//i, '');
  const encoded = encodeURIComponent(stripped);
  return [
    `https://images.weserv.nl/?url=${encoded}&w=1600&output=jpg`,
    `https://wsrv.nl/?url=${encoded}&w=1600&output=jpg`,
  ];
}

export function getMapPreviewUrls(pins = []) {
  const valid = (pins || []).filter((p) => Array.isArray(p?.ll) && p.ll.length === 2).slice(0, 8);
  if (!valid.length) return [];
  const lats = valid.map((p) => Number(p.ll[0])).filter(Number.isFinite);
  const lons = valid.map((p) => Number(p.ll[1])).filter(Number.isFinite);
  if (!lats.length || !lons.length) return [];
  const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
  const centerLon = lons.reduce((a, b) => a + b, 0) / lons.length;
  const markerParam = valid
    .map((p) => `${Number(p.ll[0]).toFixed(6)},${Number(p.ll[1]).toFixed(6)},red-pushpin`)
    .join('|');
  const osm = `https://staticmap.openstreetmap.de/staticmap.php?center=${centerLat.toFixed(6)},${centerLon.toFixed(6)}&zoom=11&size=800x360&markers=${encodeURIComponent(markerParam)}`;
  const yandexMarkers = valid
    .map((p) => `${Number(p.ll[1]).toFixed(6)},${Number(p.ll[0]).toFixed(6)},pm2rdm`)
    .join('~');
  const yandex = `https://static-maps.yandex.ru/1.x/?lang=en_US&ll=${centerLon.toFixed(6)},${centerLat.toFixed(6)}&z=11&l=map&size=650,320&pt=${encodeURIComponent(yandexMarkers)}`;
  return [osm, yandex];
}

export function RemoteImage({ uri, fallbackUri, fallbackUris = [], style, resizeMode = 'cover' }) {
  const fallbackList = Array.isArray(fallbackUris) ? fallbackUris : [];
  const candidatesKey = useMemo(
    () =>
      [uri, ...fallbackList, fallbackUri]
        .flatMap((v) => expandImageCandidates(v))
        .filter(Boolean)
        .join('|'),
    [uri, fallbackUri, fallbackList.join('|')],
  );
  const candidates = useMemo(() => {
    const list = [uri, ...fallbackList, fallbackUri]
      .flatMap((v) => expandImageCandidates(v))
      .filter(Boolean);
    return [...new Set(list)];
  }, [candidatesKey]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const sourceUri = candidates[sourceIndex] || '';

  useEffect(() => {
    setSourceIndex(0);
  }, [candidatesKey]);

  useEffect(() => {
    setLoaded(false);
  }, [sourceUri]);

  useEffect(() => {
    if (!sourceUri || loaded) return undefined;
    const timeout = setTimeout(() => {
      setSourceIndex((prev) => Math.min(prev + 1, candidates.length - 1));
    }, 2800);
    return () => clearTimeout(timeout);
  }, [sourceUri, loaded, candidates.length]);

  if (!sourceUri) {
    return <View style={[style, { backgroundColor: '#e5e7eb' }]} />;
  }
  return (
    <Image
      source={{ uri: sourceUri }}
      style={style}
      resizeMode={resizeMode}
      onLoad={() => setLoaded(true)}
      onError={() => {
        setSourceIndex((prev) => Math.min(prev + 1, candidates.length - 1));
      }}
    />
  );
}

export function DayPhotoLayout({ photos = [], query = '' }) {
  const list = (Array.isArray(photos) ? photos : [])
    .map((photo) => coerceImageUri(photo))
    .filter(Boolean)
    .slice(0, 5);
  if (!list.length) return null;

  if (list.length === 1) {
    return (
      <View style={{ width: '100%', height: 280, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8', backgroundColor: '#e5e7eb' }}>
        <RemoteImage uri={list[0]} fallbackUris={proxyImageUris(list[0])} fallbackUri={fallbackPhotoUri(query, 0)} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      </View>
    );
  }

  if (list.length === 2) {
    return (
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {list.map((uri, i) => (
          <View key={`${uri}-${i}`} style={{ flex: 1, height: 220, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8', backgroundColor: '#e5e7eb' }}>
            <RemoteImage uri={uri} fallbackUris={proxyImageUris(uri)} fallbackUri={fallbackPhotoUri(query, i)} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </View>
        ))}
      </View>
    );
  }

  const extra = list.length - 3;
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <View style={{ flex: 1.7, height: 280, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8', backgroundColor: '#e5e7eb' }}>
        <RemoteImage uri={list[0]} fallbackUris={proxyImageUris(list[0])} fallbackUri={fallbackPhotoUri(query, 0)} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      </View>
      <View style={{ flex: 1, gap: 8 }}>
        <View style={{ flex: 1, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8', backgroundColor: '#e5e7eb' }}>
          <RemoteImage uri={list[1]} fallbackUris={proxyImageUris(list[1])} fallbackUri={fallbackPhotoUri(query, 1)} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
        <View style={{ flex: 1, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8', backgroundColor: '#e5e7eb' }}>
          <RemoteImage uri={list[2]} fallbackUris={proxyImageUris(list[2])} fallbackUri={fallbackPhotoUri(query, 2)} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          {extra > 0 ? (
            <View style={{ position: 'absolute', right: 8, bottom: 8, borderRadius: 999, backgroundColor: 'rgba(17,24,39,0.82)', paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>+{extra}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
