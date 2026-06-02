// server/src/domain/Dokumen.ts
import { JenisDokumen, SumberDokumen } from './types';

export class Dokumen {
  private nama: string;
  private jenis: JenisDokumen;
  private filePath: string;
  private hashFile: string;
  private sumber: SumberDokumen;
  private tanggalUpload: Date;

  constructor(
    nama: string,
    jenis: JenisDokumen,
    filePath: string,
    hashFile: string,
    sumber: SumberDokumen,
    tanggalUpload: Date
  ) {
    this.nama = nama;
    this.jenis = jenis;
    this.filePath = filePath;
    this.hashFile = hashFile;
    this.sumber = sumber;
    this.tanggalUpload = tanggalUpload;
  }
}
