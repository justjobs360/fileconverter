import { Button } from "@/components/ui/button";

type ErrorType = "unsupported" | "too-large" | "failed";

interface ErrorStateProps {
  type: ErrorType;
  onRetry?: () => void;
  onSelectDifferent?: () => void;
}

const errorConfig = {
  unsupported: {
    title: "Format not supported",
    description: "Try a different file type.",
  },
  "too-large": {
    title: "File too large",
    description: "Maximum size is 100MB.",
  },
  failed: {
    title: "Something went wrong",
    description: "The conversion failed. Please try again.",
  },
};

const ErrorState = ({ type, onRetry, onSelectDifferent }: ErrorStateProps) => {
  const config = errorConfig[type];

  return (
    <div className="border border-destructive/40 bg-destructive/5 p-8 text-center space-y-4">
      <div>
        <h3 className="text-xl font-serif text-foreground">{config.title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
      </div>
      
      <div className="flex items-center justify-center gap-3">
        {type === "failed" ? (
          <Button variant="outline" size="default" onClick={onRetry}>
            Try again
          </Button>
        ) : (
          <Button variant="outline" size="default" onClick={onSelectDifferent}>
            Choose another file
          </Button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;
