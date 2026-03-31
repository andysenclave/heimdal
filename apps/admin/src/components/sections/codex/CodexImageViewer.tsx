import type { CodexRegion } from '@api/codex-types';

const C = {
  amber: '#e8a849', green: '#34d399',
  text: 'rgb(245 240 228)', textDim: 'rgb(107 102 96)',
  border: 'rgb(42 42 48)',
};
const F = {
  sans: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
  display: "'Space Grotesk', sans-serif",
};

function UploadDropzone({ onUpload }: { onUpload?: (file: File) => void }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) onUpload(file);
  };
  return (
    <label style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 10, padding: 40, borderRadius: 6, border: `2px dashed ${C.border}`,
      minHeight: 260, cursor: 'pointer',
    }}>
      <span style={{ fontSize: 28, opacity: 0.3 }}>📸</span>
      <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 600, color: 'rgb(176 170 160)' }}>
        Upload a screenshot to begin
      </span>
      <span style={{ fontFamily: F.mono, fontSize: 11, color: C.textDim }}>
        Drop an image here, or click to browse
      </span>
      <span style={{ fontFamily: F.mono, fontSize: 10, color: C.textDim }}>
        PNG, JPG, WebP · Max 10 MB
      </span>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
    </label>
  );
}

export interface CodexImageViewerProps {
  imageUrl: string | null;
  regions: CodexRegion[];
  selectedRegionId: string | null;
  onRegionSelect: (id: string) => void;
  screenType?: string;
  onUpload?: (file: File) => void;
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
}

export function CodexImageViewer({
  imageUrl, regions, selectedRegionId, onRegionSelect, onUpload, onAnalyze, isAnalyzing,
}: CodexImageViewerProps) {
  if (!imageUrl) return <UploadDropzone onUpload={onUpload} />;

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', background: 'rgb(14 14 17)',
      borderRadius: 6, border: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'relative', width: '100%' }}>
        <img src={imageUrl} alt="Screen" style={{ width: '100%', height: 'auto', display: 'block', opacity: 0.85 }} />
        {regions.filter((r) => !r.isIgnored).map((r) => {
          const isSel = selectedRegionId === r.id;
          const bb = r.boundingBox ?? { x: 0, y: 0, width: 10, height: 5 };
          const bc = isSel ? C.amber : r.isConfirmed ? `${C.green}80` : `${C.amber}4d`;
          const bg = isSel ? `${C.amber}24` : r.isConfirmed ? `${C.green}0d` : `${C.amber}0d`;
          return (
            <button
              key={r.id}
              onClick={() => onRegionSelect(r.id)}
              title={`${r.contentKey}: "${r.extractedText ?? ''}"`}
              style={{
                position: 'absolute',
                left: `${bb.x}%`, top: `${bb.y}%`,
                width: `${bb.width}%`, height: `${bb.height}%`,
                border: `${isSel ? 2 : 1}px solid ${bc}`, background: bg,
                borderRadius: 3, cursor: 'pointer',
                outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: isSel ? 5 : 1,
              }}
            >
              {isSel && (
                <span style={{
                  position: 'absolute', top: -15, left: 0, padding: '1px 5px',
                  borderRadius: '3px 3px 0 0', background: C.amber, color: '#0a0a0c',
                  fontFamily: F.mono, fontSize: 8, fontWeight: 700, whiteSpace: 'nowrap', zIndex: 6,
                }}>
                  {r.contentKey}
                </span>
              )}
              <span style={{
                fontFamily: F.sans, fontSize: 11,
                color: isSel ? C.text : `${C.text}99`,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                maxWidth: '100%', padding: '0 2px',
              }}>
                {r.extractedText}
              </span>
            </button>
          );
        })}
      </div>
      <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
        {regions.length > 0 && (
          <div style={{
            padding: '3px 10px', borderRadius: 4, background: 'rgba(0,0,0,0.7)',
            display: 'flex', gap: 6, alignItems: 'center',
          }}>
            <span style={{ fontFamily: F.mono, fontSize: 9, color: C.amber, fontWeight: 700, letterSpacing: '0.08em' }}>
              AI ANALYZED
            </span>
            <span style={{ width: 1, height: 10, background: C.border }} />
            <span style={{ fontFamily: F.mono, fontSize: 9, color: C.green }}>
              {regions.length} regions
            </span>
          </div>
        )}
        {onAnalyze && (
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            style={{
              padding: '4px 10px', borderRadius: 4, border: `1px solid ${C.amber}4d`,
              background: `${C.amber}14`, color: C.amber, fontFamily: F.mono, fontSize: 10,
              cursor: isAnalyzing ? 'wait' : 'pointer', opacity: isAnalyzing ? 0.6 : 1,
            }}
          >
            {isAnalyzing ? 'Analyzing…' : '⟁ Analyze'}
          </button>
        )}
      </div>
    </div>
  );
}
