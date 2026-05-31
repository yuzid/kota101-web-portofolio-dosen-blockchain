import { useParams, useNavigate } from "react-router";
import { MainLayout } from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  FileText,
  CheckCircle,
  AlertCircle,
  Eye,
  Highlighter,
} from "lucide-react";
import { format } from "date-fns";

interface DosenBukti {
  id: string;
  name: string;
  nidn: string;
  isPencatat: boolean;
  isKetua: boolean;
  dokumen: {
    id: string;
    name: string;
    jenis: string;
    tanggalUpload: string;
    hasHighlight: boolean;
  }[];
}

interface ActivityDetail {
  id: string;
  namaKegiatan: string;
  jenisTridharma: string;
  kategori: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  tahunAkademik: string;
  semester: string;
  sumberDana: string;
  biaya: number;
  programStudi: string;
  dosenTerlibat: DosenBukti[];
  statusKelengkapan: "lengkap" | "tidak_lengkap";
}

// Mock data
const mockActivityDetail: ActivityDetail = {
  id: "2",
  namaKegiatan: "Penelitian Blockchain untuk E-Government",
  jenisTridharma: "penelitian",
  kategori: "Penelitian Kelompok",
  tanggalMulai: "2026-02-01",
  tanggalSelesai: "2026-07-31",
  tahunAkademik: "2025/2026",
  semester: "ganjil",
  sumberDana: "Hibah Eksternal",
  biaya: 50000000,
  programStudi: "D4 Teknik Informatika",
  dosenTerlibat: [
    {
      id: "2",
      name: "Dr. Ahmad Fauzi",
      nidn: "0420059102",
      isPencatat: true,
      isKetua: true,
      dokumen: [
        {
          id: "doc1",
          name: "Proposal Penelitian Blockchain.pdf",
          jenis: "Proposal",
          tanggalUpload: "2026-02-01",
          hasHighlight: true,
        },
      ],
    },
    {
      id: "1",
      name: "Dr. John Doe",
      nidn: "0412108901",
      isPencatat: false,
      isKetua: false,
      dokumen: [
        {
          id: "doc2",
          name: "SK Peneliti.pdf",
          jenis: "SK",
          tanggalUpload: "2026-02-05",
          hasHighlight: true,
        },
      ],
    },
    {
      id: "3",
      name: "Dr. Siti Nurhaliza",
      nidn: "0405067801",
      isPencatat: false,
      isKetua: false,
      dokumen: [], // Belum upload
    },
  ],
  statusKelengkapan: "tidak_lengkap",
};

export function AMIActivityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const activity = mockActivityDetail;

  const getJenisBadge = (jenis: string) => {
    switch (jenis) {
      case "pengajaran":
        return <Badge className="bg-blue-500">Pengajaran</Badge>;
      case "penelitian":
        return <Badge className="bg-green-500">Penelitian</Badge>;
      case "pengabdian":
        return <Badge className="bg-purple-500">Pengabdian</Badge>;
      case "tugas_tambahan":
        return <Badge className="bg-orange-500">Tugas Tambahan</Badge>;
      default:
        return <Badge variant="secondary">{jenis}</Badge>;
    }
  };

  const getKelengkapanBadge = (status: string) => {
    if (status === "lengkap") {
      return (
        <Badge className="bg-green-500 text-white">
          <CheckCircle className="w-4 h-4 mr-1" />
          Dokumen Lengkap
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-500 text-white">
        <AlertCircle className="w-4 h-4 mr-1" />
        Dokumen Tidak Lengkap
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <MainLayout
      title="Detail Kegiatan"
      breadcrumbs={[
        { label: "Beranda", path: "/dashboard" },
        { label: "Rekap AMI", path: "/ami-recap" },
        { label: "Detail Kegiatan" },
      ]}
    >
      <div className="space-y-6 max-w-5xl">
        {/* Back Button */}
        <Button variant="outline" onClick={() => navigate("/ami-recap")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Rekap AMI
        </Button>

        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  {getJenisBadge(activity.jenisTridharma)}
                  <Badge variant="secondary">{activity.kategori}</Badge>
                </div>
                <h2 className="text-2xl font-bold">{activity.namaKegiatan}</h2>
                <p className="text-sm text-muted-foreground">
                  {activity.programStudi}
                </p>
              </div>
              <div>{getKelengkapanBadge(activity.statusKelengkapan)}</div>
            </div>
          </CardHeader>
        </Card>

        {/* Informasi Kegiatan */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Kegiatan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Tanggal Mulai
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {format(new Date(activity.tanggalMulai), "dd MMMM yyyy")}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Tanggal Selesai
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {format(new Date(activity.tanggalSelesai), "dd MMMM yyyy")}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Tahun Akademik
                </label>
                <p className="font-medium">{activity.tahunAkademik}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Semester
                </label>
                <p className="font-medium capitalize">{activity.semester}</p>
              </div>

              {activity.sumberDana && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Sumber Dana
                  </label>
                  <p className="font-medium">{activity.sumberDana}</p>
                </div>
              )}

              {activity.biaya > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Biaya Kegiatan
                  </label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">
                      {formatRupiah(activity.biaya)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dosen Terlibat & Bukti Dokumen */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Dosen Terlibat & Bukti Dokumen</CardTitle>
              <Badge variant="outline">
                <Users className="w-4 h-4 mr-1" />
                {activity.dosenTerlibat.length} Dosen
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {activity.dosenTerlibat.map((dosen) => (
              <div key={dosen.id} className="border rounded-lg p-4 space-y-4">
                {/* Dosen Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{getInitials(dosen.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{dosen.name}</p>
                        {dosen.isPencatat && (
                          <Badge className="bg-blue-500">Pencatat</Badge>
                        )}
                        {dosen.isKetua && (
                          <Badge className="bg-purple-500">Ketua</Badge>
                        )}
                        {!dosen.isKetua && (
                          <Badge variant="secondary">Anggota</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">
                        NIDN: {dosen.nidn}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {dosen.dokumen.length > 0 ? (
                      <Badge className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {dosen.dokumen.length} Dokumen
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Belum Upload
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Dokumen List */}
                {dosen.dokumen.length > 0 ? (
                  <div className="space-y-2 pl-12">
                    <label className="text-sm font-medium text-muted-foreground">
                      Dokumen Bukti:
                    </label>
                    {dosen.dokumen.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{doc.name}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {doc.jenis}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Upload:{" "}
                                {format(
                                  new Date(doc.tanggalUpload),
                                  "dd MMM yyyy"
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.hasHighlight && (
                            <Highlighter className="w-4 h-4 text-yellow-500" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate(`/documents/${doc.id}/preview`, {
                                state: {
                                  breadcrumbs: [
                                    { label: "Beranda", path: "/dashboard" },
                                    { label: "Rekap AMI", path: "/ami-recap" },
                                    {
                                      label: activity.namaKegiatan,
                                      path: `/ami-recap/activity/${id}`,
                                    },
                                    { label: doc.name },
                                  ],
                                },
                              })
                            }
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pl-12 text-sm text-muted-foreground italic">
                    Dosen ini belum mengupload dokumen bukti
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Dosen Terlibat
                </p>
                <p className="text-2xl font-bold">
                  {activity.dosenTerlibat.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Dokumen Bukti
                </p>
                <p className="text-2xl font-bold">
                  {activity.dosenTerlibat.reduce(
                    (sum, d) => sum + d.dokumen.length,
                    0
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Dosen Belum Upload
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {
                    activity.dosenTerlibat.filter((d) => d.dokumen.length === 0)
                      .length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
