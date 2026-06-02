// server/src/domain/types.ts

export enum Semester {
  GENAP = 'GENAP',
  GANJIL = 'GANJIL'
}

export enum KategoriPendidikan {
  PENGAJARAN = 'PENGAJARAN',
  BAHAN_AJAR = 'BAHAN_AJAR',
  BIMBINGAN_MAHASISWA = 'BIMBINGAN_MAHASISWA',
  PEMBINAAN_MAHASISWA = 'PEMBINAAN_MAHASISWA',
  PENGUJIAN_MAHASISWA = 'PENGUJIAN_MAHASISWA'
}

export enum KategoriPenelitian {
  PENELITIAN = 'PENELITIAN',
  PUBLIKASI_KARYA = 'PUBLIKASI_KARYA',
  PATEN = 'PATEN'
}

export enum KategoriPengabdian {
  PENGABDIAN = 'PENGABDIAN',
  PEMBICARA = 'PEMBICARA',
  PENGELOLA_JURNAL = 'PENGELOLA_JURNAL'
}

export enum JenisDokumen {
  SURAT_KEPUTUSAN = 'SURAT_KEPUTUSAN',
  SURAT_TUGAS = 'SURAT_TUGAS',
  LEMBAR_PENGESAHAN = 'LEMBAR_PENGESAHAN',
  KONTRAK_PENELITIAN = 'KONTRAK_PENELITIAN',
  SERTIFIKAT = 'SERTIFIKAT',
  FOTO = 'FOTO',
  LAPORAN = 'LAPORAN',
  BUKTI_PENDUKUNG_LAIN = 'BUKTI_PENDUKUNG_LAIN'
}

export enum SumberDokumen {
  TATA_USAHA = 'TATA_USAHA',
  UPLOAD_PRIBADI = 'UPLOAD_PRIBADI'
}

export enum KategoriKegiatan {
  PENGAJARAN = 'PENGAJARAN',
  BAHAN_AJAR = 'BAHAN_AJAR',
  BIMBINGAN_MAHASISWA = 'BIMBINGAN_MAHASISWA',
  PEMBINAAN_MAHASISWA = 'PEMBINAAN_MAHASISWA',
  PENGUJIAN_MAHASISWA = 'PENGUJIAN_MAHASISWA',
  PENELITIAN = 'PENELITIAN',
  PUBLIKASI_KARYA = 'PUBLIKASI_KARYA',
  PATEN = 'PATEN',
  PENGABDIAN = 'PENGABDIAN',
  PEMBICARA = 'PEMBICARA',
  PENGELOLA_JURNAL = 'PENGELOLA_JURNAL',
  TUGAS_TAMBAHAN = 'TUGAS_TAMBAHAN'
}

export enum JenisTridharma {
  PENGAJARAN = 'PENGAJARAN',
  PENELITIAN = 'PENELITIAN',
  PENGABDIAN = 'PENGABDIAN',
  TUGAS_TAMBAHAN = 'TUGAS_TAMBAHAN'
}

export interface PageResponse<T> {
  data: T[];
  page: number;
  totalPages: number;
  totalElements: number;
}

export interface KegiatanFilter {
  tanggalAwal: number;
  tanggalAkhir: string;
  jenis: JenisTridharma;
  kategori: KategoriKegiatan;
}

export interface PageRequest {
  page: number;
  size: number;
}
