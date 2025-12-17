interface FormatSelectorProps {
  selectedFormat: string | null;
  onSelectFormat: (format: string) => void;
}

const formats = [
  { id: "pdf", label: "PDF" },
  { id: "jpg", label: "JPG" },
  { id: "png", label: "PNG" },
  { id: "webp", label: "WebP" },
  { id: "tiff", label: "TIFF" },
  { id: "avif", label: "AVIF" },
  { id: "gif", label: "GIF" },
  { id: "mp4", label: "MP4" },
  { id: "mov", label: "MOV" },
  { id: "avi", label: "AVI" },
  { id: "mkv", label: "MKV" },
  { id: "mp3", label: "MP3" },
  { id: "ogg", label: "OGG" },
  { id: "aac", label: "AAC" },
  { id: "wav", label: "WAV" },
  { id: "flac", label: "FLAC" },
];

const FormatSelector = ({ selectedFormat, onSelectFormat }: FormatSelectorProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-foreground">Convert to</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {formats.map((format) => {
          const isSelected = selectedFormat === format.id;

          return (
            <button
              key={format.id}
              onClick={() => onSelectFormat(format.id)}
              className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all ${isSelected
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
            >
              {format.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FormatSelector;
