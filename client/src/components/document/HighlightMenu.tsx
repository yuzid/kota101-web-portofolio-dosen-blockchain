import { useState } from "react";
import type { Highlight } from "../../services/highlightService";

interface HighlightMenuProps {
  highlight: Highlight;
  position: { x: number; y: number };
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function HighlightMenu({
  highlight,
  position,
  onEdit,
  onDelete,
  onClose,
}: HighlightMenuProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(highlight.highlighted_text);

  const handleSave = () => {
    onEdit(highlight.id, text);
    setEditing(false);
    onClose();
  };

  const handleDelete = () => {
    onDelete(highlight.id);
    onClose();
  };

  const handleBackdrop = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
      }}
      onMouseDown={handleBackdrop}
    >
      <div
        style={{
          position: "fixed",
          left: position.x,
          top: position.y,
          zIndex: 10000,
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          minWidth: 220,
          padding: 8,
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {editing ? (
          <div className="space-y-2">
            <textarea
              className="w-full min-h-[60px] rounded border border-gray-300 p-2 text-sm"
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                className="rounded bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
                onClick={() => setEditing(false)}
              >
                Batal
              </button>
              <button
                className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                onClick={handleSave}
              >
                Simpan
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {highlight.highlighted_text && (
              <p className="px-2 py-1 text-sm text-gray-600 break-words max-w-[240px]">
                {highlight.highlighted_text}
              </p>
            )}
            <button
              className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-gray-100"
              onClick={() => setEditing(true)}
            >
              Edit Teks
            </button>
            <button
              className="w-full rounded px-2 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
              onClick={handleDelete}
            >
              Hapus Highlight
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
