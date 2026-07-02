import { JenisDokumen } from '@prisma/client';

export function mapJenisToEnum(jenis: string): JenisDokumen {
  const upperInput = jenis.toUpperCase().trim();
  if (Object.values(JenisDokumen).includes(upperInput as JenisDokumen)) {
    return upperInput as JenisDokumen;
  }
  switch (jenis) {
    case 'SK': return JenisDokumen.SURAT_KEPUTUSAN;
    case 'Surat Tugas': return JenisDokumen.SURAT_TUGAS;
    case 'Laporan Kegiatan': return JenisDokumen.LAPORAN;
    case 'Sertifikat': return JenisDokumen.SERTIFIKAT;
    case 'KONTRAK_PENELITIAN': return JenisDokumen.KONTRAK_PENELITIAN;
    default: return JenisDokumen.BUKTI_PENDUKUNG_LAIN;
  }
}
