type ConversionStatus = "idle" | "converting" | "success" | "error";

interface ConversionProgressProps {
  status: ConversionStatus;
  progress: number;
  fileName?: string;
  errorMessage?: string;
}

const ConversionProgress = ({ status, progress, fileName }: ConversionProgressProps) => {
  if (status === "idle") return null;

  return (
    <div className="border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Converting{fileName ? `: ${fileName}` : '...'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">This usually takes a few seconds</p>
        </div>
        <span className="text-2xl font-serif text-primary">{Math.round(progress)}%</span>
      </div>
      
      <div className="h-1 bg-muted overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ConversionProgress;
