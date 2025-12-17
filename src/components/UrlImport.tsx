"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UrlImportProps {
    onFileSelect: (file: File) => void;
    disabled?: boolean;
}

const UrlImport = ({ onFileSelect, disabled }: UrlImportProps) => {
    const [url, setUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleImport = async () => {
        if (!url) return;

        // Basic URL validation
        try {
            new URL(url);
        } catch {
            toast.error("Please enter a valid URL");
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch("/api/proxy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                throw new Error("Failed to fetch file");
            }

            const blob = await response.blob();

            // Try to get filename from Content-Disposition or URL
            const contentDisposition = response.headers.get("Content-Disposition");
            let filename = "imported-file";
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^"]+)"?/);
                if (match && match[1]) filename = match[1];
            } else {
                try {
                    const urlPath = new URL(url).pathname;
                    const name = urlPath.split('/').pop();
                    if (name && name.includes('.')) filename = name;
                } catch { }
            }

            // Default extension if missing
            if (!filename.includes('.')) {
                const type = blob.type; // e.g. image/jpeg
                const ext = type.split('/')[1];
                if (ext) filename += `.${ext}`;
            }

            const file = new File([blob], filename, { type: blob.type });
            onFileSelect(file);
            setUrl("");
            toast.success("File imported successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to import file from URL");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex gap-2 w-full max-w-lg mx-auto mt-4">
            <Input
                placeholder="Or paste file URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={disabled || isLoading}
                className="bg-background/50 border-input"
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleImport();
                }}
            />
            <Button
                variant="secondary"
                onClick={handleImport}
                disabled={!url || disabled || isLoading}
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            </Button>
        </div>
    );
};

export default UrlImport;
