"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import UploadZone from "@/components/UploadZone";
import FormatSelector from "@/components/FormatSelector";
import ConversionProgress from "@/components/ConversionProgress";
import DownloadSection from "@/components/DownloadSection";
import TrustSection from "@/components/TrustSection";
import SupportedFormats from "@/components/SupportedFormats";
import UrlImport from "@/components/UrlImport";
import AdPlaceholder from "@/components/AdPlaceholder";
import ErrorState from "@/components/ErrorStates";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useConversion, ConversionStatus } from "@/hooks/use-conversion";

type AppState = "upload" | "converting" | "success" | "error";
type ErrorType = "unsupported" | "too-large" | "failed";

const queryClient = new QueryClient();

export default function Home() {
  const { status, progress, params, convert, reset } = useConversion();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType>("failed");

  // Derive app state from hook status
  const appState: AppState =
    status === "idle" ? "upload" :
      status === "uploading" || status === "converting" ? "converting" :
        status === "success" ? "success" :
          status === "error" ? "error" : "upload";

  // Effect to handle external hook resets if needed, or just sync
  useEffect(() => {
    if (status === "idle" && selectedFile) {
      // if hook reset but we have file, maybe valid?
    }
  }, [status]);

  // Constants
  const SERVER_MAX_SIZE = 4.5 * 1024 * 1024; // 4.5MB Vercel limit
  const CLIENT_MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB (Browser limit approx)

  const isServerConversion = (file: File | null, format: string | null) => {
    if (!file) return false;
    // Images and PDF targets (if we add PDF input later) go to server
    if (file.type.startsWith("image/") || format === "pdf") return true;
    return false;
  };

  const handleFileSelect = (file: File) => {
    // Initial check - we don't know format yet, but we allow upload if it *could* be valid.
    // If it's video/audio (usually large), we likely handle it client side, so allow.
    // If it's image (usually small), we might handle server side.
    // But we don't know target format yet. 
    // However, Image -> Image/PDF is server. Image -> anything else is unlikely.
    // Video -> anything is client.

    // So: If Image > 4.5MB, warn immediately? 
    // Yes, because Image->PDF/Image is server side.
    if (file.type.startsWith("image/") && file.size > SERVER_MAX_SIZE) {
      setErrorType("too-large");
      // We set file to null or keep it to show error?
      // Design choice: Show error state.
      setSelectedFile(null);
      // But we need to switch UI to error, which requires state update.
      // effectiveAppState handles it if we store errorType properly.
      // setAppState("error"); // Use explicit state for error to be safe
      return;
    }

    // If Video/Audio and huge
    if ((file.type.startsWith("video/") || file.type.startsWith("audio/")) && file.size > CLIENT_MAX_SIZE) {
      setErrorType("too-large");
      setSelectedFile(null);
      // setAppState("error");
      return;
    }

    setSelectedFile(file);
    reset();
    setErrorType("failed");
  };

  const effectiveAppState = (selectedFile === null && errorType === "too-large") ? "error" : appState;

  const handleClearFile = () => {
    setSelectedFile(null);
    setSelectedFormat(null);
    reset();
    setErrorType("failed");
  };

  const handleConvert = () => {
    if (!selectedFile || !selectedFormat) return;
    convert(selectedFile, selectedFormat);
  };

  const handleDownload = () => {
    if (params.resultUrl) {
      const a = document.createElement('a');
      a.href = params.resultUrl;
      a.download = params.resultFilename || 'converted';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleConvertAnother = () => {
    setSelectedFile(null);
    setSelectedFormat(null);
    reset();
  };

  const handleRetry = () => {
    reset();
    setErrorType("failed");
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col bg-background">
          <Header />

          <main className="flex-1">
            {/* Hero */}
            <section className="py-16 sm:py-24">
              <div className="container-tight">
                <div className="text-center mb-12">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground mb-4 leading-tight">
                    Convert <span className="text-primary">Your Files</span>
                    <br />with Ease
                  </h1>
                  <p className="text-lg text-muted-foreground max-w-md mx-auto">
                    Free, fast, and private file conversion. No account needed, no hassle.
                  </p>
                </div>

                {/* Converter */}
                <div className="space-y-5">
                  {effectiveAppState === "error" && (
                    <ErrorState
                      type={errorType}
                      onRetry={handleRetry}
                      onSelectDifferent={handleClearFile}
                    />
                  )}

                  {effectiveAppState === "success" && selectedFile && (
                    <DownloadSection
                      fileName={params.resultFilename || `converted.${selectedFormat}`}
                      fileSize="Unknown" // Client-side conversion doesn't always give size easily without blob inspection
                      onDownload={handleDownload}
                      onConvertAnother={handleConvertAnother}
                    />
                  )}

                  {effectiveAppState === "converting" && (
                    <ConversionProgress
                      status="converting"
                      progress={progress}
                      fileName={selectedFile?.name}
                    />
                  )}

                  {effectiveAppState === "upload" && (
                    <>
                      <UploadZone
                        onFileSelect={handleFileSelect}
                        selectedFile={selectedFile}
                        onClear={handleClearFile}
                      />

                      {selectedFile && (
                        <FormatSelector
                          selectedFile={selectedFile}
                          selectedFormat={selectedFormat}
                          onSelectFormat={setSelectedFormat}
                        />
                      )}

                      {selectedFile && selectedFormat && (
                        <Button
                          variant="hero"
                          size="lg"
                          onClick={handleConvert}
                          className="w-full rounded-xl"
                        >
                          Convert to {selectedFormat.toUpperCase()}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>

                <div className="mt-12">
                  <AdPlaceholder size="banner" />
                </div>
              </div>
            </section>

            <SupportedFormats />
            <TrustSection />

            <div className="container-wide pb-12">
              <AdPlaceholder size="rectangle" />
            </div>
          </main>

          <Footer />
          <Toaster />
          <Sonner />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
