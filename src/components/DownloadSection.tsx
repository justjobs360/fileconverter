import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DownloadSectionProps {
  fileName: string;
  fileSize: string;
  onDownload: () => void;
  onConvertAnother: () => void;
}

const DownloadSection = ({ fileName, fileSize, onDownload, onConvertAnother }: DownloadSectionProps) => {
  return (
    <div className="border border-success/40 bg-success/5 p-8 text-center space-y-5">
      <div className="inline-block">
        <p className="text-xs uppercase tracking-widest text-success font-medium mb-2">Ready</p>
        <h3 className="text-2xl font-serif text-foreground">{fileName}</h3>
        <p className="text-sm text-muted-foreground mt-1">{fileSize}</p>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button variant="success" size="lg" onClick={onDownload}>
          <ArrowDown className="h-4 w-4" />
          Download
        </Button>
        <button 
          onClick={onConvertAnother}
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
        >
          Convert another file
        </button>
      </div>
      
      <p className="text-xs text-muted-foreground pt-3 border-t border-border">
        File auto-deletes in 30 minutes • Not stored on our servers
      </p>
    </div>
  );
};

export default DownloadSection;
