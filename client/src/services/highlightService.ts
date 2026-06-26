import { apiFetch } from "../lib/api";

const API_URL = import.meta.env.VITE_API_URL;

// ── Mock mode ──
// Set VITE_HIGHLIGHT_MOCK=true di .env untuk menggunakan data mock.
const USE_MOCK = false;

export function isHighlightMockMode(): boolean {
  return USE_MOCK;
}

export function getHighlightStatusByDokumenId(dokumenId: string): boolean {
  if (!USE_MOCK) return false;
  const kepId = readMockKepemilikanId(dokumenId);
  if (!kepId) return false;
  return getMockHighlights(kepId).length > 0;
}

const MOCK_KEPEMILIKAN_KEY = "mock_kepemilikan_map";
const MOCK_HIGHLIGHTS_KEY = "mock_highlights_data";

function getMockKepemilikanId(dokumenId: string): string {
  const map = JSON.parse(localStorage.getItem(MOCK_KEPEMILIKAN_KEY) || "{}");
  if (!map[dokumenId]) {
    map[dokumenId] = crypto.randomUUID();
    localStorage.setItem(MOCK_KEPEMILIKAN_KEY, JSON.stringify(map));
  }
  return map[dokumenId];
}

function readMockKepemilikanId(dokumenId: string): string | null {
  const map = JSON.parse(localStorage.getItem(MOCK_KEPEMILIKAN_KEY) || "{}");
  return map[dokumenId] || null;
}

function getMockHighlights(kepemilikanId: string): any[] {
  const all = JSON.parse(localStorage.getItem(MOCK_HIGHLIGHTS_KEY) || "{}");
  return all[kepemilikanId] || [];
}

function setMockHighlights(kepemilikanId: string, highlights: any[]) {
  const all = JSON.parse(localStorage.getItem(MOCK_HIGHLIGHTS_KEY) || "{}");
  all[kepemilikanId] = highlights;
  localStorage.setItem(MOCK_HIGHLIGHTS_KEY, JSON.stringify(all));
}

export function replaceMockHighlights(kepemilikanId: string, highlights: Highlight[]) {
  if (USE_MOCK) {
    setMockHighlights(kepemilikanId, highlights);
  }
}

function mockId(): string {
  return crypto.randomUUID();
}

export interface HighlightRect {
  id?: string;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  width: number;
  height: number;
  boundary_rect: boolean;
}

export interface Highlight {
  id: string;
  kepemilikan_id: string;
  page_number: number;
  highlighted_text: string;
  highlight_rect: HighlightRect[];
}

interface HighlighResponse {
  highlights: Highlight[];
  kepemilikanId?: string;
}

function generateFakeKepemilikanId(dokumenId: string): string {
  return `mock-${dokumenId}-${Date.now()}`;
}

export async function getHighlightsByDokumenId(
  dokumenId: string,
): Promise<HighlighResponse> {
  if (USE_MOCK) {
    const kepemilikanId = getMockKepemilikanId(dokumenId);
    const highlights: Highlight[] = getMockHighlights(kepemilikanId);
    return { highlights, kepemilikanId };
  }

  const response = await apiFetch(
    `${API_URL}/api/dosen/highlights?dokumenId=${encodeURIComponent(dokumenId)}`,
  );
  const result = await response.json();
  if (!response.ok || result.status !== "success") {
    throw new Error(result.error || "Gagal mengambil highlight");
  }
  const highlights: Highlight[] = result.data || [];
  const kepemilikanId: string | undefined = result.kepemilikanId;

  if (!kepemilikanId) {
    return { highlights, kepemilikanId: undefined };
  }
  return { highlights, kepemilikanId };
}

interface CreateHighlightData {
  page_number: number;
  highlighted_text: string;
  highlight_rect: Omit<HighlightRect, "id">[];
}

export async function addHighlight(
  kepemilikanId: string,
  data: CreateHighlightData,
): Promise<Highlight> {
  if (USE_MOCK) {
    const newHighlight: Highlight = {
      id: mockId(),
      kepemilikan_id: kepemilikanId,
      page_number: data.page_number,
      highlighted_text: data.highlighted_text,
      highlight_rect: data.highlight_rect.map((r) => ({ ...r, id: mockId() })),
    };
    const existing = getMockHighlights(kepemilikanId);
    setMockHighlights(kepemilikanId, [...existing, newHighlight]);
    return newHighlight;
  }

  const response = await apiFetch(
    `${API_URL}/api/dosen/highlights/${kepemilikanId}`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
  const result = await response.json();
  if (!response.ok || result.status !== "success") {
    throw new Error(result.error || "Gagal menambah highlight");
  }
  return result.data;
}

interface UpdateHighlightData {
  page_number?: number;
  highlighted_text?: string;
  highlight_rect?: Omit<HighlightRect, "id">[];
}

export async function updateHighlight(
  id: string,
  data: UpdateHighlightData,
): Promise<Highlight> {
  if (USE_MOCK) {
    const all = JSON.parse(localStorage.getItem(MOCK_HIGHLIGHTS_KEY) || "{}");
    for (const kepId of Object.keys(all)) {
      const idx = all[kepId].findIndex((h: any) => h.id === id);
      if (idx !== -1) {
        const updated = {
          ...all[kepId][idx],
          ...data,
          highlight_rect:
            data.highlight_rect ||
            JSON.parse(all[kepId][idx].highlight_rect || "[]"),
        };
        all[kepId][idx] = updated;
        localStorage.setItem(MOCK_HIGHLIGHTS_KEY, JSON.stringify(all));
        return updated;
      }
    }
    throw new Error("Highlight tidak ditemukan");
  }

  const response = await apiFetch(`${API_URL}/api/dosen/highlights/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || result.status !== "success") {
    throw new Error(result.error || "Gagal mengupdate highlight");
  }
  return result.data;
}

export async function deleteHighlight(id: string): Promise<void> {
  if (USE_MOCK) {
    const all = JSON.parse(localStorage.getItem(MOCK_HIGHLIGHTS_KEY) || "{}");
    for (const kepId of Object.keys(all)) {
      const filtered = all[kepId].filter((h: any) => h.id !== id);
      if (filtered.length !== all[kepId].length) {
        all[kepId] = filtered;
        localStorage.setItem(MOCK_HIGHLIGHTS_KEY, JSON.stringify(all));
        return;
      }
    }
    throw new Error("Highlight tidak ditemukan");
  }

  const response = await apiFetch(`${API_URL}/api/dosen/highlights/${id}`, {
    method: "DELETE",
  });
  const result = await response.json();
  if (!response.ok || result.status !== "success") {
    throw new Error(result.error || "Gagal menghapus highlight");
  }
}

interface SyncData {
  page_number: number;
  highlighted_text: string;
  highlight_rect: Omit<HighlightRect, "id">[];
}

export async function syncHighlights(
  kepemilikanId: string,
  highlights: SyncData[],
): Promise<Highlight[]> {
  if (USE_MOCK) {
    const synced = highlights.map((h) => ({
      id: mockId(),
      kepemilikan_id: kepemilikanId,
      ...h,
      highlight_rect: h.highlight_rect.map((r) => ({ ...r, id: mockId() })),
    }));
    setMockHighlights(kepemilikanId, synced);
    return synced;
  }

  const response = await apiFetch(
    `${API_URL}/api/dosen/highlights/${kepemilikanId}/sync`,
    {
      method: "POST",
      body: JSON.stringify({ highlights }),
    },
  );
  const result = await response.json();
  if (!response.ok || result.status !== "success") {
    throw new Error(result.error || "Gagal sinkronisasi highlight");
  }
  return result.data;
}
