import * as XLSX from 'xlsx';

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

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export async function createRekap(data: any, isKajur: boolean): Promise<RekapLaporan> {
  const endpoint = isKajur ? 'jurusan' : 'prodi';
  const response = await fetch(`${API_URL}/api/dosen/akademik-role/${endpoint}/rekap`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.error || 'Gagal membuat rekap');
  return mapFromBackend(result.data);
}

export async function listRekap(isKajur: boolean): Promise<RekapLaporan[]> {
  const endpoint = isKajur ? 'jurusan' : 'prodi';
  const response = await fetch(`${API_URL}/api/dosen/akademik-role/${endpoint}/rekap`, {
    headers: getHeaders()
  });
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.error || 'Gagal mengambil daftar rekap');
  return result.data.map(mapFromBackend);
}

export async function getRekap(id: string, isKajur: boolean): Promise<RekapLaporan> {
  const endpoint = isKajur ? 'jurusan' : 'prodi';
  const response = await fetch(`${API_URL}/api/dosen/akademik-role/${endpoint}/rekap/${id}`, {
    headers: getHeaders()
  });
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.error || 'Gagal mengambil detail rekap');
  return mapFromBackend(result.data);
}

export async function updateRekap(id: string, data: any, isKajur: boolean): Promise<RekapLaporan> {
  const endpoint = isKajur ? 'jurusan' : 'prodi';
  const response = await fetch(`${API_URL}/api/dosen/akademik-role/${endpoint}/rekap/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.error || 'Gagal memperbarui rekap');
  return mapFromBackend(result.data);
}

export async function deleteRekap(id: string, isKajur: boolean): Promise<boolean> {
  const endpoint = isKajur ? 'jurusan' : 'prodi';
  const response = await fetch(`${API_URL}/api/dosen/akademik-role/${endpoint}/rekap/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  const result = await response.json();
  return result.status === 'success';
}

function formatDokumenLinks(k: any): string {
  if (!k.lampiran_bukti || k.lampiran_bukti.length === 0) return '-';
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
  a.click();
  URL.revokeObjectURL(url);
}
