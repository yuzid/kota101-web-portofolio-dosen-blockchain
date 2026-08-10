export function sanitizeError(message: string): string {
  if (message.includes("AWS Access Key") || message.includes("credential"))
    return "Gagal mengakses file dari server penyimpanan.";
  if (message.includes("does not exist") || message.includes("NoSuchKey"))
    return "File dokumen tidak ditemukan di server penyimpanan.";
  if (message.includes("Access Denied") || message.includes("access denied"))
    return "Akses ke file dokumen ditolak oleh server.";
  if (message.includes("ECONNREFUSED") || message.includes("ENOTFOUND"))
    return "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
  if (message.includes("timeout") || message.includes("Timeout"))
    return "Permintaan ke server habis waktu. Silakan coba lagi.";
  if (message.includes("blockchain") || message.includes("MULTICHAIN") || message.includes("RPC"))
    return "Layanan verifikasi blockchain sedang tidak tersedia.";
  if (message.includes("Prisma") || message.includes("database") || message.includes("Argument `"))
    return "Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.";
  if (message.includes("Cannot read properties") || message.includes("TypeError"))
    return "Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.";
  if (message.length > 100)
    return "Terjadi kesalahan. Silakan coba lagi.";
  return message;
}
