export type StatusKonfirmasi = 'menunggu' | 'diterima' | 'ditolak';

export interface KonfirmasiKegiatan {
  kegiatanId: string;
  dosenId: string;
  pencatatId: string;
  pencatatNama: string;
  namaKegiatan: string;
  status: StatusKonfirmasi;
  createdAt: string;
  updatedAt?: string;
}

const STORAGE_KEY = 'kegiatan_konfirmasi';

function getAll(): KonfirmasiKegiatan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(data: KonfirmasiKegiatan[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getKonfirmasiByDosen(dosenId: string): KonfirmasiKegiatan[] {
  return getAll().filter((k) => k.dosenId === dosenId);
}

export function getKonfirmasiByKegiatan(kegiatanId: string): KonfirmasiKegiatan[] {
  return getAll().filter((k) => k.kegiatanId === kegiatanId);
}

export function getKonfirmasi(
  kegiatanId: string,
  dosenId: string
): KonfirmasiKegiatan | undefined {
  return getAll().find(
    (k) => k.kegiatanId === kegiatanId && k.dosenId === dosenId
  );
}

export function createKonfirmasi(
  kegiatanId: string,
  dosenIds: string[],
  pencatatId: string,
  pencatatNama: string,
  namaKegiatan: string
): void {
  const all = getAll();
  const now = new Date().toISOString();
  const newRecords: KonfirmasiKegiatan[] = dosenIds
    .filter((id) => id !== pencatatId)
    .map((dosenId) => ({
      kegiatanId,
      dosenId,
      pencatatId,
      pencatatNama,
      namaKegiatan,
      status: 'menunggu',
      createdAt: now,
    }));
  saveAll([...all, ...newRecords]);
}

export function updateKonfirmasi(
  kegiatanId: string,
  dosenId: string,
  status: StatusKonfirmasi
): void {
  const all = getAll();
  const updated = all.map((k) =>
    k.kegiatanId === kegiatanId && k.dosenId === dosenId
      ? { ...k, status, updatedAt: new Date().toISOString() }
      : k
  );
  saveAll(updated);
}

export function deleteKonfirmasiByKegiatan(kegiatanId: string): void {
  const all = getAll();
  saveAll(all.filter((k) => k.kegiatanId !== kegiatanId));
}

export function deleteKonfirmasi(kegiatanId: string, dosenId: string): void {
  const all = getAll();
  saveAll(all.filter((k) => !(k.kegiatanId === kegiatanId && k.dosenId === dosenId)));
}
