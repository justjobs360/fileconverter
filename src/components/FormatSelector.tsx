import { allFormats, getSourceFormat, getSupportedTargetFormats } from "@/lib/conversion-matrix";

interface FormatSelectorProps {
  selectedFile: File | null;
  selectedFormat: string | null;
  onSelectFormat: (format: string) => void;
}

const FormatSelector = ({ selectedFile, selectedFormat, onSelectFormat }: FormatSelectorProps) => {
  // Get supported formats for the selected file
  const sourceFormat = selectedFile ? getSourceFormat(selectedFile) : '';
  const supportedFormats = sourceFormat ? getSupportedTargetFormats(sourceFormat) : [];
  
  // Group formats by category for better organization
  const formatsByCategory = {
    document: allFormats.filter(f => f.category === 'document'),
    image: allFormats.filter(f => f.category === 'image'),
    video: allFormats.filter(f => f.category === 'video'),
    audio: allFormats.filter(f => f.category === 'audio'),
  };

  const isFormatSupported = (formatId: string) => {
    if (!sourceFormat) return false;
    return supportedFormats.includes(formatId.toLowerCase());
  };

  const handleFormatClick = (formatId: string) => {
    if (isFormatSupported(formatId)) {
      onSelectFormat(formatId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-foreground">Convert to</span>
      </div>

      {/* Documents */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Documents</p>
        <div className="flex flex-wrap gap-2">
          {formatsByCategory.document.map((format) => {
            const isSelected = selectedFormat === format.id;
            const isSupported = isFormatSupported(format.id);
            const isDisabled = !isSupported;

            return (
              <button
                key={format.id}
                onClick={() => handleFormatClick(format.id)}
                disabled={isDisabled}
                className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-md"
                    : isSupported
                    ? "bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30 hover:bg-green-500/30"
                    : "bg-muted/50 text-muted-foreground/50 cursor-not-allowed opacity-50"
                }`}
                title={isDisabled ? "This conversion is not supported" : `Convert to ${format.label}`}
              >
                {format.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Images */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Images</p>
        <div className="flex flex-wrap gap-2">
          {formatsByCategory.image.map((format) => {
            const isSelected = selectedFormat === format.id;
            const isSupported = isFormatSupported(format.id);
            const isDisabled = !isSupported;

            return (
              <button
                key={format.id}
                onClick={() => handleFormatClick(format.id)}
                disabled={isDisabled}
                className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-md"
                    : isSupported
                    ? "bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30 hover:bg-green-500/30"
                    : "bg-muted/50 text-muted-foreground/50 cursor-not-allowed opacity-50"
                }`}
                title={isDisabled ? "This conversion is not supported" : `Convert to ${format.label}`}
              >
                {format.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Videos */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Videos</p>
        <div className="flex flex-wrap gap-2">
          {formatsByCategory.video.map((format) => {
            const isSelected = selectedFormat === format.id;
            const isSupported = isFormatSupported(format.id);
            const isDisabled = !isSupported;

            return (
              <button
                key={format.id}
                onClick={() => handleFormatClick(format.id)}
                disabled={isDisabled}
                className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-md"
                    : isSupported
                    ? "bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30 hover:bg-green-500/30"
                    : "bg-muted/50 text-muted-foreground/50 cursor-not-allowed opacity-50"
                }`}
                title={isDisabled ? "This conversion is not supported" : `Convert to ${format.label}`}
              >
                {format.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Audio */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Audio</p>
        <div className="flex flex-wrap gap-2">
          {formatsByCategory.audio.map((format) => {
            const isSelected = selectedFormat === format.id;
            const isSupported = isFormatSupported(format.id);
            const isDisabled = !isSupported;

            return (
              <button
                key={format.id}
                onClick={() => handleFormatClick(format.id)}
                disabled={isDisabled}
                className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-md"
                    : isSupported
                    ? "bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30 hover:bg-green-500/30"
                    : "bg-muted/50 text-muted-foreground/50 cursor-not-allowed opacity-50"
                }`}
                title={isDisabled ? "This conversion is not supported" : `Convert to ${format.label}`}
              >
                {format.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FormatSelector;
