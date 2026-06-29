const MAP_KEY = 'dokumen_kegiatan_map';

interface MapEntry {
  kegiatanId: string;
  kegiatanNama: string;
}

export function getMap(): Record<string, MapEntry> {
  try {
    return JSON.parse(localStorage.getItem(MAP_KEY) || '{}');
  } catch {
    return {};
  }
}

export function linkDokumen(dokumenId: string, kegiatanId: string, kegiatanNama: string) {
  const map = getMap();
  map[dokumenId] = { kegiatanId, kegiatanNama };
  localStorage.setItem(MAP_KEY, JSON.stringify(map));
}

export function unlinkDokumen(dokumenId: string) {
  const map = getMap();
  delete map[dokumenId];
  localStorage.setItem(MAP_KEY, JSON.stringify(map));
}

export function unlinkKegiatan(kegiatanId: string) {
  const map = getMap();
  for (const [docId, val] of Object.entries(map)) {
    if (val.kegiatanId === kegiatanId) delete map[docId];
  }
  localStorage.setItem(MAP_KEY, JSON.stringify(map));
}

export function getDokumenStatus(dokumenId: string, currentKegiatanId?: string): { available: boolean; kegiatanNama?: string } {
  const map = getMap();
  const entry = map[dokumenId];
  if (!entry) return { available: true };
  if (currentKegiatanId && entry.kegiatanId === currentKegiatanId) return { available: true };
  return { available: false, kegiatanNama: entry.kegiatanNama };
}
