export interface PublicDosenDoc {
  id: string;
  name: string;
  jenis: string;
  tanggalUpload: string;
  hashFile: string;
  filePath: string;
  kepemilikanId?: string;
}

export interface PublicDosenTerlibat {
  id: string;
  name: string;
  nidn: string;
  peran: string;
  status: string;
  dokumen: PublicDosenDoc[];
}

export interface PublicDokumenBersama {
  id: string;
  name: string;
  jenis: string;
  tanggalUpload: string;
  hashFile: string;
  filePath: string;
  kepemilikanId?: string;
}

export interface PublicActivity {
  id: string;
  namaKegiatan: string;
  jenisTridharma: string;
  kategori: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  tahunAkademik: string;
  semester: string;
  programStudi: string;
  statusKelengkapan: string;
  jenisBukti: string;
  dosenTerlibat: PublicDosenTerlibat[];
  dokumenBersama: PublicDokumenBersama[];
}

export interface RawDocEntry {
  id: string;
  name: string;
  jenis: string;
  tanggalUpload: string;
}

export function transformPublicActivity(raw: any): {
  activity: PublicActivity;
  docEntries: RawDocEntry[];
} {
  const pencatatDosen = raw.dosen || {};
  const prodiName = pencatatDosen.program_studi?.nama_prodi || "Umum";

  const dosenTerlibat: PublicDosenTerlibat[] = [];

  const pencatat: PublicDosenTerlibat = {
    id: pencatatDosen.id || raw.dosen_id,
    name: pencatatDosen.nama || "Unknown",
    nidn: pencatatDosen.nidn || pencatatDosen.nip || "-",
    peran: "KETUA",
    status: "DITERIMA",
    dokumen: [],
  };
  dosenTerlibat.push(pencatat);

  (raw.partisipasi || []).forEach((p: any) => {
    const dosen = p.dosen || {};
    if (!dosenTerlibat.find((d) => d.id === dosen.id)) {
      dosenTerlibat.push({
        id: dosen.id,
        name: dosen.nama || "Unknown",
        nidn: dosen.nidn || dosen.nip || "-",
        peran: p.peran || "ANGGOTA",
        status: p.status || "MENUNGGU_KONFIRMASI",
        dokumen: [],
      });
    }
  });

  const isBuktiBersama = raw.jenis_bukti === "BERSAMA";
  const dokumenBersama: PublicDokumenBersama[] = [];
  const docEntries: RawDocEntry[] = [];

  (raw.lampiran_bukti || []).forEach((lb: any) => {
    const doc = lb.dokumen || {};
    const entry: RawDocEntry = {
      id: doc.id,
      name: doc.nama || "Tanpa Nama",
      jenis: doc.jenis_dokumen || "-",
      tanggalUpload: doc.tanggal_upload || "",
    };
    docEntries.push(entry);

    if (isBuktiBersama) {
      dokumenBersama.push({
        id: doc.id,
        name: doc.nama || "Tanpa Nama",
        jenis: doc.jenis_dokumen || "-",
        tanggalUpload: doc.tanggal_upload || "",
        hashFile: "",
        filePath: "",
      });
    }
  });

  return {
    activity: {
      id: raw.id,
      namaKegiatan: raw.nama_kegiatan || "",
      jenisTridharma: (raw.kategori_tridharma || "").toLowerCase(),
      kategori: raw.jenis_kegiatan || "",
      tanggalMulai: raw.tanggal_mulai || "",
      tanggalSelesai: raw.tanggal_selesai || "",
      tahunAkademik: raw.periode || "",
      semester: (raw.semester || "").toLowerCase(),
      programStudi: prodiName,
      statusKelengkapan:
        (raw.lampiran_bukti || []).length > 0 ? "lengkap" : "tidak_lengkap",
      jenisBukti: raw.jenis_bukti || "MASING_MASING",
      dosenTerlibat,
      dokumenBersama,
    },
    docEntries,
  };
}

export function getOwnerDosenIds(docDetail: any): string[] {
  const kepemilikan = docDetail?.kepemilikan || [];
  return kepemilikan
    .map((k: any) => k.dosen?.id)
    .filter(Boolean);
}

export function getFileType(filePath: string): "pdf" | "image" | "other" {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext))
    return "image";
  return "other";
}
