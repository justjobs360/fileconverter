"use client";

import { useState, useRef } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { toast } from "sonner";
import { generateOutputFilename } from "@/lib/conversion-matrix";

export type ConversionStatus = "idle" | "uploading" | "converting" | "success" | "error";

interface UseConversionReturn {
    status: ConversionStatus;
    progress: number;
    params: {
        resultUrl: string | null;
        resultFilename: string | null;
    };
    convert: (file: File, targetFormat: string) => Promise<void>;
    reset: () => void;
}

export function useConversion(): UseConversionReturn {
    const [status, setStatus] = useState<ConversionStatus>("idle");
    const [progress, setProgress] = useState(0);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [resultFilename, setResultFilename] = useState<string | null>(null);

    // Lazy init FFmpeg
    const ffmpegRef = useRef<FFmpeg | null>(null);

    const getFfmpeg = () => {
        if (!ffmpegRef.current) {
            ffmpegRef.current = new FFmpeg();
        }
        return ffmpegRef.current;
    }

    const reset = () => {
        setStatus("idle");
        setProgress(0);
        setResultUrl(null);
        setResultFilename(null);
    };

    const convertImage = async (file: File, format: string) => {
        try {
            setStatus("uploading");
            const formData = new FormData();
            formData.append("file", file);
            formData.append("format", format);

            const response = await fetch("/api/convert/images", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            setStatus("converting"); // actually it's done mainly
            setProgress(100);

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setResultUrl(url);
            setResultFilename(generateOutputFilename(file, format));
            setStatus("success");
        } catch (error) {
            console.error(error);
            setStatus("error");
            toast.error("Failed to convert image");
        }
    };

    const convertMedia = async (file: File, format: string) => {
        try {
            const ffmpeg = getFfmpeg();

            if (!ffmpeg.loaded) {
                setStatus("converting");
                // Load FFmpeg
                // Use CDN for now - in production better to host these files
                const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
                await ffmpeg.load({
                    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
                    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
                });
            }

            setStatus("converting");
            setProgress(0);

            ffmpeg.on("progress", ({ progress }) => {
                setProgress(Math.round(progress * 100));
            });

            const fileName = "input" + file.name.substring(file.name.lastIndexOf("."));
            await ffmpeg.writeFile(fileName, await fetchFile(file));

            // Build FFmpeg command with appropriate codecs
            const outputFile = `output.${format}`;
            let ffmpegArgs: string[] = ["-i", fileName];
            
            // Audio codecs
            if (format === "mp3") {
              ffmpegArgs.push("-acodec", "libmp3lame", "-q:a", "2");
            } else if (format === "wav") {
              ffmpegArgs.push("-acodec", "pcm_s16le");
            } else if (format === "aac") {
              ffmpegArgs.push("-acodec", "aac", "-b:a", "192k");
            } else if (format === "flac") {
              ffmpegArgs.push("-acodec", "flac");
            } else if (format === "ogg") {
              ffmpegArgs.push("-acodec", "libvorbis");
            }
            // Video codecs
            else if (format === "mp4") {
              ffmpegArgs.push("-c:v", "libx264", "-preset", "medium", "-crf", "23", "-c:a", "aac", "-b:a", "192k");
            } else if (format === "mov") {
              ffmpegArgs.push("-c:v", "libx264", "-preset", "medium", "-crf", "23", "-c:a", "aac", "-b:a", "192k");
            } else if (format === "avi") {
              ffmpegArgs.push("-c:v", "libx264", "-c:a", "mp3");
            } else if (format === "mkv") {
              ffmpegArgs.push("-c:v", "libx264", "-c:a", "aac");
            } else if (format === "webm") {
              ffmpegArgs.push("-c:v", "libvpx-vp9", "-c:a", "libopus");
            }
            
            ffmpegArgs.push(outputFile);
            await ffmpeg.exec(ffmpegArgs);

            const data = await ffmpeg.readFile(`output.${format}`) as Uint8Array;
            
            // Determine MIME type based on format
            let mimeType = `audio/${format}`;
            if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(format)) {
              mimeType = `video/${format}`;
            } else if (['mp3', 'wav', 'aac', 'flac', 'ogg'].includes(format)) {
              mimeType = `audio/${format === 'mp3' ? 'mpeg' : format}`;
            }
            
            const blob = new Blob([data as any], { type: mimeType });
            const url = URL.createObjectURL(blob);

            setResultUrl(url);
            setResultFilename(generateOutputFilename(file, format));
            setStatus("success");
        } catch (error) {
            console.error(error);
            // setStatus("error"); // removed to allow retry or inspection? No, should be error.
            setStatus("error");
            toast.error("Failed to convert media");
        }
    };

    const convertPdf = async (file: File) => {
        try {
            setStatus("uploading");
            const formData = new FormData();
            formData.append("file", file);
            formData.append("format", "pdf");

            const response = await fetch("/api/convert/pdf", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            setStatus("converting");
            setProgress(100);

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setResultUrl(url);
            setResultFilename(generateOutputFilename(file, "pdf"));
            setStatus("success");
        } catch (error) {
            console.error(error);
            setStatus("error");
            toast.error("Failed to convert to PDF");
        }
    }

    const convertDocument = async (file: File, format: string) => {
        try {
            setStatus("uploading");
            const formData = new FormData();
            formData.append("file", file);
            formData.append("format", format);

            const response = await fetch("/api/convert/documents", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText);
            }

            setStatus("converting");
            setProgress(100);

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setResultUrl(url);
            setResultFilename(generateOutputFilename(file, format));
            setStatus("success");
        } catch (error) {
            console.error(error);
            setStatus("error");
            toast.error("Failed to convert document");
        }
    };

    const convert = async (file: File, targetFormat: string) => {
        reset();

        // Document conversions
        if (file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf") ||
            file.type.includes("wordprocessingml") || file.name.toLowerCase().endsWith(".docx") ||
            file.type.includes("text/plain") || file.name.toLowerCase().endsWith(".txt") ||
            file.type.includes("rtf") || file.name.toLowerCase().endsWith(".rtf")) {
            await convertDocument(file, targetFormat);
        }
        // Image to PDF
        else if (targetFormat === 'pdf' && file.type.startsWith("image/")) {
            await convertPdf(file);
        } 
        // Image conversions
        else if (file.type.startsWith("image/") || ["gif", "tiff", "avif", "webp", "jpg", "jpeg", "png", "svg"].includes(targetFormat)) {
            if (file.type.startsWith("image/")) {
                await convertImage(file, targetFormat);
            } else {
                await convertMedia(file, targetFormat);
            }
        } 
        // Video/Audio conversions
        else if (file.type.startsWith("video/") || file.type.startsWith("audio/")) {
            await convertMedia(file, targetFormat);
        } else {
            toast.error("Unsupported conversion combination");
            setStatus("error");
        }
    };

    return {
        status,
        progress,
        params: { resultUrl, resultFilename },
        convert,
        reset,
    };
}
