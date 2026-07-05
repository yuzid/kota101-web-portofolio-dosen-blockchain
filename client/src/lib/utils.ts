import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

let cachedJenisDokumen: { value: string; label: string }[] = [
  { value: 'SURAT_KEPUTUSAN', label: 'Surat Keputusan (SK)' },
  { value: 'SURAT_TUGAS', label: 'Surat Tugas' },
  { value: 'LEMBAR_PENGESAHAN', label: 'Lembar Pengesahan' },
  { value: 'KONTRAK_PENELITIAN', label: 'Kontrak Penelitian' },
  { value: 'SERTIFIKAT', label: 'Sertifikat' },
  { value: 'FOTO', label: 'Foto' },
  { value: 'LAPORAN', label: 'Laporan' },
  { value: 'BUKTI_PENDUKUNG_LAIN', label: 'Bukti Pendukung Lain' },
];

export function getAllJenisDokumen(): { value: string; label: string }[] {
  return cachedJenisDokumen;
}

export async function fetchAndCacheJenisDokumen() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/jenis-dokumen`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const result = await res.json();
    if (result.status === 'success' && Array.isArray(result.data)) {
      const labelMap: Record<string, string> = {
        SURAT_KEPUTUSAN: 'Surat Keputusan (SK)',
        SURAT_TUGAS: 'Surat Tugas',
        LEMBAR_PENGESAHAN: 'Lembar Pengesahan',
        KONTRAK_PENELITIAN: 'Kontrak Penelitian',
        SERTIFIKAT: 'Sertifikat',
        FOTO: 'Foto',
        LAPORAN: 'Laporan',
        BUKTI_PENDUKUNG_LAIN: 'Bukti Pendukung Lain'
      };
      cachedJenisDokumen = result.data.map((val: string) => ({
        value: val,
        label: labelMap[val] || val.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())
      }));
    }
  } catch (e) {
    console.error('Gagal fetch jenis dokumen:', e);
  }
}
