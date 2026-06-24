import type { Highlight } from "../services/highlightService";

const PUB_KEPEMILIKAN_KEY = "pub_kepemilikan_map";
const PUB_HIGHLIGHTS_KEY = "pub_highlights_data";

export function getPublicKepemilikanId(dokumenId: string): string {
  const map = JSON.parse(
    localStorage.getItem(PUB_KEPEMILIKAN_KEY) || "{}",
  );
  if (!map[dokumenId]) {
    map[dokumenId] = `pub-${dokumenId}-${Date.now()}`;
    localStorage.setItem(PUB_KEPEMILIKAN_KEY, JSON.stringify(map));
  }
  return map[dokumenId];
}

export function getPublicHighlights(dokumenId: string): Highlight[] {
  const kepId = getPublicKepemilikanId(dokumenId);
  const all = JSON.parse(
    localStorage.getItem(PUB_HIGHLIGHTS_KEY) || "{}",
  );
  return all[kepId] || seedPublicMockHighlights(dokumenId, kepId);
}

function seedPublicMockHighlights(
  dokumenId: string,
  kepId: string,
): Highlight[] {
  const mockHighlights: Highlight[] = [
    {
      id: `pub-hl-${dokumenId}-1`,
      kepemilikan_id: kepId,
      page_number: 1,
      highlighted_text:
        "Puji dan syukur kami panjatkan kehadirat Tuhan Yang Maha Esa",
      highlight_rect: [
        {
          x1: 72,
          x2: 400,
          y1: 120,
          y2: 136,
          width: 328,
          height: 16,
          boundary_rect: false,
        },
      ],
    },
    {
      id: `pub-hl-${dokumenId}-2`,
      kepemilikan_id: kepId,
      page_number: 1,
      highlighted_text:
        "Laporan ini disusun sebagai bentuk pertanggungjawaban akademik",
      highlight_rect: [
        {
          x1: 72,
          x2: 450,
          y1: 160,
          y2: 176,
          width: 378,
          height: 16,
          boundary_rect: false,
        },
      ],
    },
    {
      id: `pub-hl-${dokumenId}-3`,
      kepemilikan_id: kepId,
      page_number: 1,
      highlighted_text: "NIDN",
      highlight_rect: [
        {
          x1: 200,
          x2: 260,
          y1: 200,
          y2: 216,
          width: 60,
          height: 16,
          boundary_rect: false,
        },
      ],
    },
    {
      id: `pub-hl-${dokumenId}-4`,
      kepemilikan_id: kepId,
      page_number: 2,
      highlighted_text:
        "Demikian laporan ini dibuat untuk dipergunakan sebagaimana mestinya",
      highlight_rect: [
        {
          x1: 72,
          x2: 420,
          y1: 80,
          y2: 96,
          width: 348,
          height: 16,
          boundary_rect: false,
        },
      ],
    },
  ];

  const all = JSON.parse(
    localStorage.getItem(PUB_HIGHLIGHTS_KEY) || "{}",
  );
  all[kepId] = mockHighlights;
  localStorage.setItem(PUB_HIGHLIGHTS_KEY, JSON.stringify(all));
  return mockHighlights;
}
