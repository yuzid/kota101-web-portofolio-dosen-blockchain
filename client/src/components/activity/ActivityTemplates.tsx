import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { LayoutTemplate, Plus, Trash2, BookOpen, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface ActivityTemplate {
  id: string;
  name: string;
  description: string;
  jenisTridharma: string;
  kategori: string;
  defaultDuration: number; // in months
  requiredDocuments: string[];
  usageCount: number;
}

const defaultTemplates: ActivityTemplate[] = [
  {
    id: 'template-1',
    name: 'Mata Kuliah Reguler',
    description: 'Template untuk kegiatan mengajar mata kuliah reguler',
    jenisTridharma: 'pengajaran',
    kategori: 'Mata Kuliah',
    defaultDuration: 4,
    requiredDocuments: ['SK Mengajar', 'Jadwal Kuliah', 'RPS', 'Absensi'],
    usageCount: 45,
  },
  {
    id: 'template-2',
    name: 'Penelitian Mandiri',
    description: 'Template untuk penelitian yang dilakukan secara mandiri',
    jenisTridharma: 'penelitian',
    kategori: 'Penelitian Mandiri',
    defaultDuration: 6,
    requiredDocuments: ['Proposal Penelitian', 'Laporan Penelitian', 'Artikel/Publikasi'],
    usageCount: 23,
  },
  {
    id: 'template-3',
    name: 'Penelitian Kelompok',
    description: 'Template untuk penelitian yang dilakukan dalam kelompok',
    jenisTridharma: 'penelitian',
    kategori: 'Penelitian Kelompok',
    defaultDuration: 12,
    requiredDocuments: [
      'Proposal Penelitian',
      'SK Tim Peneliti',
      'Laporan Kemajuan',
      'Laporan Akhir',
      'Publikasi',
    ],
    usageCount: 18,
  },
  {
    id: 'template-4',
    name: 'Pengabdian Masyarakat',
    description: 'Template untuk kegiatan pengabdian kepada masyarakat',
    jenisTridharma: 'pengabdian',
    kategori: 'Pengabdian Masyarakat',
    defaultDuration: 3,
    requiredDocuments: [
      'Proposal Pengabdian',
      'Surat Tugas',
      'Dokumentasi Kegiatan',
      'Laporan Pengabdian',
      'Sertifikat/Penghargaan',
    ],
    usageCount: 31,
  },
  {
    id: 'template-5',
    name: 'Tugas Tambahan Struktural',
    description: 'Template untuk tugas tambahan sebagai pejabat struktural',
    jenisTridharma: 'tugas_tambahan',
    kategori: 'Jabatan Struktural',
    defaultDuration: 12,
    requiredDocuments: ['SK Penugasan', 'Laporan Kinerja'],
    usageCount: 12,
  },
];

interface ActivityTemplatesProps {
  onSelectTemplate: (template: ActivityTemplate) => void;
}

export function ActivityTemplates({ onSelectTemplate }: ActivityTemplatesProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [templates, setTemplates] = useState<ActivityTemplate[]>(defaultTemplates);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    jenisTridharma: 'pengajaran',
    kategori: '',
  });

  const filteredTemplates = templates.filter(
    (t) => selectedCategory === 'all' || t.jenisTridharma === selectedCategory
  );

  const handleUseTemplate = (template: ActivityTemplate) => {
    onSelectTemplate(template);
    setShowDialog(false);
    toast.success(`Template "${template.name}" diterapkan`, {
      description: 'Form telah diisi dengan data template',
    });
  };

  const getJenisBadge = (jenis: string) => {
    switch (jenis) {
      case 'pengajaran':
        return <Badge className="bg-blue-500">Pendidikan</Badge>;
      case 'penelitian':
        return <Badge className="bg-green-500">Penelitian</Badge>;
      case 'pengabdian':
        return <Badge className="bg-purple-500">Pengabdian</Badge>;
      case 'tugas_tambahan':
        return <Badge className="bg-orange-500">Tugas Tambahan</Badge>;
      default:
        return <Badge variant="secondary">{jenis}</Badge>;
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setShowDialog(true)}>
        <LayoutTemplate className="w-4 h-4 mr-2" />
        Gunakan Template
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Template Kegiatan
            </DialogTitle>
            <DialogDescription>
              Pilih template untuk mempercepat pengisian form kegiatan
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                Semua ({templates.length})
              </Button>
              <Button
                variant={selectedCategory === 'pengajaran' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('pengajaran')}
              >
                Pendidikan ({templates.filter((t) => t.jenisTridharma === 'pengajaran').length})
              </Button>
              <Button
                variant={selectedCategory === 'penelitian' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('penelitian')}
              >
                Penelitian ({templates.filter((t) => t.jenisTridharma === 'penelitian').length})
              </Button>
              <Button
                variant={selectedCategory === 'pengabdian' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('pengabdian')}
              >
                Pengabdian ({templates.filter((t) => t.jenisTridharma === 'pengabdian').length})
              </Button>
              <Button
                variant={selectedCategory === 'tugas_tambahan' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('tugas_tambahan')}
              >
                Tugas Tambahan (
                {templates.filter((t) => t.jenisTridharma === 'tugas_tambahan').length})
              </Button>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleUseTemplate(template)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription className="mt-1">{template.description}</CardDescription>
                      </div>
                      {getJenisBadge(template.jenisTridharma)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Kategori: {template.kategori}</span>
                      <span>•</span>
                      <span>Durasi: {template.defaultDuration} bulan</span>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Dokumen yang diperlukan:</Label>
                      <div className="flex flex-wrap gap-1">
                        {template.requiredDocuments.map((doc, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {doc}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <BookOpen className="w-3 h-3" />
                        <span>Digunakan {template.usageCount}x</span>
                      </div>
                      <Button size="sm" variant="ghost">
                        Gunakan Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <LayoutTemplate className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Tidak ada template untuk kategori ini</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
