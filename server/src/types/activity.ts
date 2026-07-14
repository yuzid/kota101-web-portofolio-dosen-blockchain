import { KategoriTridharma, JenisKegiatan, KegiatanTridharma } from '@prisma/client';

export interface KegiatanFilter {
  tanggalAwal?: string; 
  tanggalAkhir?: string;
  jenis?: KategoriTridharma | KategoriTridharma[];
  kategori?: JenisKegiatan | JenisKegiatan[];      
  search?: string;
  prodiId?: string;
  dosenId?: string;
  status?: 'lengkap' | 'tidak_lengkap';
  periode?: string;
  semester?: string;
}

export interface PageRequest {
  page: number;
  size: number;
}

export interface PageResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}
