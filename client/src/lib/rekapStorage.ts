import * as XLSX from 'xlsx';

const STORAGE_KEY = 'rekap_laporan';

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

function getAll(): RekapLaporan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const items: RekapLaporan[] = JSON.parse(raw);
    let migrated = false;
    const migratedItems = items.map((item) => {
      if (!item.riwayat) {
        migrated = true;
        return {
          ...item,
          riwayat: [{
            aktivitas: 'Rekap dibuat',
            dilakukanOleh: item.dibuatOleh.nama,
            waktu: item.createdAt,
          }],
        };
      }
      return item;
    });
    if (migrated) saveAll(migratedItems);
    return migratedItems;
  } catch {
    return [];
  }
}

function saveAll(items: RekapLaporan[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function generateId(): string {
  return `rekap_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function createRekap(data: Omit<RekapLaporan, 'id' | 'createdAt' | 'updatedAt' | 'riwayat'>): RekapLaporan {
  const items = getAll();
  const now = new Date().toISOString();
  const rekap: RekapLaporan = {
    ...data,
    id: generateId(),
    riwayat: [{
      aktivitas: 'Rekap dibuat',
      dilakukanOleh: data.dibuatOleh.nama,
      waktu: now,
    }],
    createdAt: now,
    updatedAt: now,
  };
  items.push(rekap);
  saveAll(items);
  return rekap;
}

export function listRekap(options?: { prodiId?: string; jurusanId?: string }): RekapLaporan[] {
  let items = getAll();
  if (options?.prodiId) {
    items = items.filter(r => r.prodiId === options.prodiId);
  }
  if (options?.jurusanId) {
    items = items.filter(r => r.jurusanId === options.jurusanId);
  }
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getRekap(id: string): RekapLaporan | undefined {
  return getAll().find(r => r.id === id);
}

export function updateRekap(id: string, data: Partial<Omit<RekapLaporan, 'id' | 'createdAt'>>, dilakukanOleh?: string): RekapLaporan | undefined {
  const items = getAll();
  const idx = items.findIndex(r => r.id === id);
  if (idx === -1) return undefined;
  const now = new Date().toISOString();
  const prev = items[idx];
  const changes: string[] = [];
  if (data.nama !== undefined && data.nama !== prev.nama) {
    changes.push(`Nama dari "${prev.nama}" menjadi "${data.nama}"`);
  }
  if (data.tanggalPerekapan !== undefined && data.tanggalPerekapan !== prev.tanggalPerekapan) {
    changes.push('Tanggal perekapan diubah');
  }
  items[idx] = { ...prev, ...data, updatedAt: now };
  items[idx].riwayat.push({
    aktivitas: 'Rekap diperbarui',
    detail: changes.length > 0 ? changes.join('; ') : undefined,
    dilakukanOleh: dilakukanOleh || prev.dibuatOleh.nama,
    waktu: now,
  });
  saveAll(items);
  return items[idx];
}

export function deleteRekap(id: string): boolean {
  const items = getAll();
  const filtered = items.filter(r => r.id !== id);
  if (filtered.length === items.length) return false;
  saveAll(filtered);
  return true;
}

function formatDokumenLinks(k: any): string {
  if (!k.lampiran_bukti || k.lampiran_bukti.length === 0) return '-';
  return k.lampiran_bukti
    .map((lb: any) => lb.file_url || lb.path || '')
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
