import * as XLSX from 'xlsx';
import { apiFetch } from "./api";

const API_URL = import.meta.env.VITE_API_URL;

export interface RekapFilter {
  tanggalAwal?: string;
  tanggalAkhir?: string;
  kategori?: string[];
  jenisTridharma?: string[];
}

export interface RiwayatAktivitas {
  aktivitas: string;
  detail?: string;
  dilakukanOleh: string;
  waktu: string;
}

export interface RekapLaporan {
  id: string;
  nama: string;
  tanggalPerekapan: string;
  dibuatOleh: { id: string; nama: string; role: string };
  prodiId?: string;
  prodiNama?: string;
  jurusanId?: string;
  jurusanNama?: string;
  filter: RekapFilter;
  kegiatanData: any[];
  riwayat: RiwayatAktivitas[];
  createdAt: string;
  updatedAt: string;
}

// Helper to map backend data to frontend interface
function mapFromBackend(data: any): RekapLaporan {
  return {
    id: data.id,
    nama: data.nama,
    tanggalPerekapan: data.tanggal_perekapan,
    dibuatOleh: {
      id: data.dibuat_oleh_id,
      nama: data.user?.dosen?.nama || data.user?.admin?.nama || data.user?.tata_usaha?.nama || data.user?.email || 'Unknown',
      role: data.jurusan_id ? 'kajur' : 'kaprodi',
    },
    prodiId: data.prodi_id,
    prodiNama: data.program_studi?.nama_prodi,
    jurusanId: data.jurusan_id,
    jurusanNama: data.jurusan?.nama_jurusan,
    filter: data.filter,
    kegiatanData: data.kegiatan_data,
    riwayat: data.riwayat,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function createRekap(data: any, isKajur: boolean): Promise<RekapLaporan> {
  const endpoint = isKajur ? 'jurusan' : 'prodi';
  const response = await apiFetch(`${API_URL}/api/dosen/akademik-role/${endpoint}/rekap`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.error || 'Gagal membuat rekap');
  const mapped = mapFromBackend(result.data);
  // Save to mock_all_rekap agar kajur bisa lihat rekap kaprodi
  try {
    const all = JSON.parse(localStorage.getItem('mock_all_rekap') || '[]');
    all.push(mapped);
    localStorage.setItem('mock_all_rekap', JSON.stringify(all));
  } catch {}
  return mapped;
}

export async function listRekap(isKajur: boolean): Promise<RekapLaporan[]> {
  if (!isKajur) {
    // Kaprodi: fetch sendiri
    const response = await apiFetch(`${API_URL}/api/dosen/akademik-role/prodi/rekap`);
    const result = await response.json();
    if (result.status !== 'success') throw new Error(result.error || 'Gagal mengambil daftar rekap');
    return result.data.map(mapFromBackend);
  }

  // Kajur: fetch jurusan + prodi rekap, merge
  try {
    const [jurusanRes, prodiRes] = await Promise.allSettled([
      apiFetch(`${API_URL}/api/dosen/akademik-role/jurusan/rekap`),
      apiFetch(`${API_URL}/api/dosen/akademik-role/prodi/rekap`),
    ]);

    let allData: RekapLaporan[] = [];

    if (jurusanRes.status === 'fulfilled') {
      const json = await jurusanRes.value.json();
      if (json.status === 'success') {
        allData.push(...json.data.map(mapFromBackend));
      }
    }

    let prodiSuccess = false;
    if (prodiRes.status === 'fulfilled') {
      const json = await prodiRes.value.json();
      if (json.status === 'success') {
        allData.push(...json.data.map(mapFromBackend));
        prodiSuccess = true;
      }
    }

    // Jika prodi endpoint gagal atau tidak sukses, include mock data kaprodi
    if (!prodiSuccess) {
      const mock = JSON.parse(localStorage.getItem('mock_all_rekap') || '[]') as RekapLaporan[];
      allData.push(...mock);
    }

    // Fallback ke mock jika tidak ada data sama sekali dari API
    if (allData.length === 0) {
      const mock = JSON.parse(localStorage.getItem('mock_all_rekap') || '[]') as RekapLaporan[];
      return mock;
    }

    allData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return allData;
  } catch {
    const mock = JSON.parse(localStorage.getItem('mock_all_rekap') || '[]') as RekapLaporan[];
    return mock;
  }
}

export async function getRekap(id: string, isKajur: boolean): Promise<RekapLaporan> {
  const endpoint = isKajur ? 'jurusan' : 'prodi';
  const response = await apiFetch(`${API_URL}/api/dosen/akademik-role/${endpoint}/rekap/${id}`);
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.error || 'Gagal mengambil detail rekap');
  return mapFromBackend(result.data);
}

export async function updateRekap(id: string, data: any, isKajur: boolean): Promise<RekapLaporan> {
  const endpoint = isKajur ? 'jurusan' : 'prodi';
  const response = await apiFetch(`${API_URL}/api/dosen/akademik-role/${endpoint}/rekap/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.error || 'Gagal memperbarui rekap');
  return mapFromBackend(result.data);
}

export async function deleteRekap(id: string, isKajur: boolean): Promise<boolean> {
  const endpoint = isKajur ? 'jurusan' : 'prodi';
  const response = await apiFetch(`${API_URL}/api/dosen/akademik-role/${endpoint}/rekap/${id}`, {
    method: 'DELETE'
  });
  const result = await response.json();
  if (result.status === 'success') {
    // Clean up mock_all_rekap
    try {
      const all = JSON.parse(localStorage.getItem('mock_all_rekap') || '[]');
      const filtered = all.filter((r: any) => r.id !== id);
      localStorage.setItem('mock_all_rekap', JSON.stringify(filtered));
    } catch {}
  }
  return result.status === 'success';
}

function formatDokumenLinks(k: any): string {
  if (!k.lampiran_bukti || k.lampiran_bukti.length === 0) return '-';
  if (k.id) return `${window.location.origin}/public/kegiatan/${k.id}`;
  return k.lampiran_bukti
    .map((lb: any) => lb.file_url || lb.path || (lb.dokumen?.file_path) || '')
    .filter(Boolean)
    .join('; ');
}

export function exportRekapXlsx(rekap: RekapLaporan): void {
  const rows = rekap.kegiatanData.map((k: any, i: number) => ({
    No: i + 1,
    'Nama Kegiatan': k.nama_kegiatan || '-',
    Dosen: k.dosen?.nama || '-',
    NIDN: k.dosen?.nidn || '-',
    'Program Studi': k.dosen?.program_studi?.nama_prodi || '-',
    'Kategori Tridharma': k.kategori_tridharma || '-',
    'Jenis Kegiatan': k.jenis_kegiatan || '-',
    Periode: k.periode || '-',
    Semester: k.semester || '-',
    'Tanggal Mulai': k.tanggal_mulai ? new Date(k.tanggal_mulai).toLocaleDateString('id-ID') : '-',
    'Tanggal Selesai': k.tanggal_selesai ? new Date(k.tanggal_selesai).toLocaleDateString('id-ID') : '-',
    'Jumlah Dokumen': k.lampiran_bukti?.length || 0,
    'Jumlah Anggota': k.partisipasi?.length || 0,
    'Link Dokumen Bukti': formatDokumenLinks(k),
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  const colWidths = [
    { wch: 4 }, { wch: 40 }, { wch: 25 }, { wch: 20 },
    { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 12 },
    { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 50 },
  ];
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Kegiatan');

  const metaRows = [
    { Key: 'Nama Rekap', Value: rekap.nama },
    { Key: 'Tanggal Perekapan', Value: rekap.tanggalPerekapan },
    { Key: 'Dibuat Oleh', Value: rekap.dibuatOleh.nama },
    { Key: 'Peran', Value: rekap.dibuatOleh.role },
    { Key: 'Jumlah Kegiatan', Value: rekap.kegiatanData.length },
    { Key: 'Tanggal Filter Awal', Value: rekap.filter.tanggalAwal || '-' },
    { Key: 'Tanggal Filter Akhir', Value: rekap.filter.tanggalAkhir || '-' },
    { Key: 'Kategori Filter', Value: rekap.filter.kategori?.join(', ') || 'Semua' },
  ];
  const metaWs = XLSX.utils.json_to_sheet(metaRows);
  metaWs['!cols'] = [{ wch: 22 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, metaWs, 'Metadata');

  XLSX.writeFile(wb, `rekap_${rekap.nama.replace(/\s+/g, '_')}_${rekap.id}.xlsx`);
}

export function exportRekapCsv(rekap: RekapLaporan): void {
  const rows = rekap.kegiatanData.map((k: any, i: number) => ({
    No: i + 1,
    Nama_Kegiatan: k.nama_kegiatan || '-',
    Dosen: k.dosen?.nama || '-',
    NIDN: k.dosen?.nidn || '-',
    Program_Studi: k.dosen?.program_studi?.nama_prodi || '-',
    Kategori_Tridharma: k.kategori_tridharma || '-',
    Jenis_Kegiatan: k.jenis_kegiatan || '-',
    Periode: k.periode || '-',
    Semester: k.semester || '-',
    Tanggal_Mulai: k.tanggal_mulai ? new Date(k.tanggal_mulai).toLocaleDateString('id-ID') : '-',
    Tanggal_Selesai: k.tanggal_selesai ? new Date(k.tanggal_selesai).toLocaleDateString('id-ID') : '-',
    Jumlah_Dokumen: k.lampiran_bukti?.length || 0,
    Jumlah_Anggota: k.partisipasi?.length || 0,
    Link_Dokumen_Bukti: formatDokumenLinks(k),
  }));

  const headers = Object.keys(rows[0] || {}).join(',');
  const csvRows = rows.map(r => Object.values(r).map(v => `"${v}"`).join(','));
  const csv = [headers, ...csvRows].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rekap_${rekap.nama.replace(/\s+/g, '_')}_${rekap.id}.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
