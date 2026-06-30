import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DEFAULT_JENIS_DOKUMEN = [
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
  const tambahan: string[] = JSON.parse(localStorage.getItem('tu_jenis_tambahan') || '[]');
  const tambahanMap = tambahan.map(t => ({ value: t, label: t.replace(/_/g, ' ') }));
  return [...DEFAULT_JENIS_DOKUMEN, ...tambahanMap];
}

export function tambahJenisDokumen(nama: string) {
  const tambahan: string[] = JSON.parse(localStorage.getItem('tu_jenis_tambahan') || '[]');
  if (!tambahan.includes(nama)) {
    tambahan.push(nama);
    localStorage.setItem('tu_jenis_tambahan', JSON.stringify(tambahan));
  }
}
