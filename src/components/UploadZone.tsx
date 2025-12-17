import { useState, useCallback } from "react";
import { ArrowUp, X } from "lucide-react";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

const UploadZone = ({ onFileSelect, selectedFile, onClear }: UploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileExtension = (name: string) => {
    return name.split('.').pop()?.toUpperCase() || 'FILE';
  };

  if (selectedFile) {
    return (
      <div className="border border-border bg-card p-5 rounded-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary tracking-wide">
              {getFileExtension(selectedFile.name)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{selectedFile.name}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{formatFileSize(selectedFile.size)}</p>
          </div>
          <button
            onClick={onClear}
            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`upload-zone rounded-2xl p-12 sm:p-16 text-center cursor-pointer ${
        isDragging ? "upload-zone-active" : "hover:border-primary/50"
      }`}
    >
      <input
        type="file"
        onChange={handleFileInput}
        className="hidden"
        id="file-upload"
        accept="*/*"
      />
      <label htmlFor="file-upload" className="cursor-pointer block">
        <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all ${
          isDragging ? "bg-primary/20" : "bg-muted"
        }`}>
          <ArrowUp className={`h-7 w-7 transition-colors ${
            isDragging ? "text-primary" : "text-muted-foreground"
          }`} />
        </div>
        <p className="text-lg font-semibold text-foreground mb-2">
          Drop your file here or <span className="text-primary">browse</span>
        </p>
        <p className="text-muted-foreground">
          Max 100MB • Most formats supported
        </p>
      </label>
    </div>
  );
};

export default UploadZone;
