// server/src/domain/KegiatanTridharma.ts
import { Dokumen } from './Dokumen';

export abstract class KegiatanTridharma {
  protected namaKegiatan: string;
  protected tanggalMulaiKegiatan: Date;
  protected tanggalSelesaiKegiatan: Date;
  protected periode: string;

  constructor(
    namaKegiatan: string,
    tanggalMulaiKegiatan: Date,
    tanggalSelesaiKegiatan: Date,
    periode: string
  ) {
    this.namaKegiatan = namaKegiatan;
    this.tanggalMulaiKegiatan = tanggalMulaiKegiatan;
    this.tanggalSelesaiKegiatan = tanggalSelesaiKegiatan;
    this.periode = periode;
  }

  public validateDates(): void {
    if (this.tanggalMulaiKegiatan >= this.tanggalSelesaiKegiatan) {
      throw new Error('Tanggal mulai kegiatan harus sebelum tanggal selesai.');
    }
  }

  public tambahDokumen(dokumen: Dokumen): void {
    // Logic: Ensure document is valid and not already attached
    this.catatAuditTrail();
  }
  

  public hapusDokumen(dokumen: Dokumen): void {
    // Logic to remove document
  }

  public catatAuditTrail(): void {
    // Audit trail logic
  }

  public tampilkanAuditTrail(): void {
    // Display audit trail
  }
}
