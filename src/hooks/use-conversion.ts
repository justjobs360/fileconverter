"use client";

import { useState, useRef } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { toast } from "sonner";
import { generateOutputFilename } from "@/lib/conversion-matrix";

export type ConversionStatus = "idle" | "uploading" | "converting" | "success" | "error";

// File size limits
const SERVER_MAX_SIZE = 4 * 1024 * 1024; // 4MB for server-side processing
const CLIENT_MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB (browser limit)

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
                const errorText = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { error: errorText };
                }
                
                // Provide specific error messages
                if (errorData.code === "FILE_TOO_LARGE") {
                    toast.error(errorData.error || "File is too large for conversion");
                } else if (errorData.code === "UNSUPPORTED_FORMAT") {
                    toast.error(errorData.error || "Unsupported image format");
                } else if (errorData.code === "INVALID_IMAGE_FORMAT") {
                    toast.error(errorData.error || "Invalid image file");
                } else {
                    toast.error(errorData.error || "Failed to convert image");
                }
                throw new Error(errorData.error || errorText);
            }

            setStatus("converting");
            setProgress(100);

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setResultUrl(url);
            setResultFilename(generateOutputFilename(file, format));
            setStatus("success");
        } catch (error: any) {
            console.error(error);
            setStatus("error");
            if (!error.message || !error.message.includes("Failed to convert")) {
                toast.error(error.message || "Failed to convert image");
            }
        }
    };

    const convertVideo = async (file: File, format: string) => {
        // Check file size - route to server for small files, client for large
        if (file.size <= SERVER_MAX_SIZE) {
            try {
                setStatus("uploading");
                const formData = new FormData();
                formData.append("file", file);
                formData.append("format", format);

                const response = await fetch("/api/convert/video", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    let errorData: any;
                    try {
                        errorData = await response.json();
                    } catch {
                        const errorText = await response.text();
                        errorData = { error: errorText };
                    }
                    // If server-side unavailable, fall through to client-side
                    if (errorData.code === "SERVER_SIDE_UNAVAILABLE" || errorData.useClientSide) {
                        // Fall through to client-side conversion
                    } else {
                        throw new Error(errorData.error || "Server-side conversion failed");
                    }
                } else {
                    // Server-side conversion succeeded
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    setResultUrl(url);
                    setResultFilename(generateOutputFilename(file, format));
                    setStatus("success");
                    return;
                }
            } catch (error: any) {
                // If server-side fails, fall back to client-side
                console.log("Server-side conversion failed, using client-side:", error.message);
            }
        }

        // Client-side conversion (for large files or server-side unavailable)
        await convertMediaClient(file, format, "video");
    };

    const convertAudio = async (file: File, format: string) => {
        // Check file size - route to server for small files, client for large
        if (file.size <= SERVER_MAX_SIZE) {
            try {
                setStatus("uploading");
                const formData = new FormData();
                formData.append("file", file);
                formData.append("format", format);

                const response = await fetch("/api/convert/audio", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    let errorData: any;
                    try {
                        errorData = await response.json();
                    } catch {
                        const errorText = await response.text();
                        errorData = { error: errorText };
                    }
                    // If server-side unavailable, fall through to client-side
                    if (errorData.code === "SERVER_SIDE_UNAVAILABLE" || errorData.useClientSide) {
                        // Fall through to client-side conversion
                    } else {
                        throw new Error(errorData.error || "Server-side conversion failed");
                    }
                } else {
                    // Server-side conversion succeeded
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    setResultUrl(url);
                    setResultFilename(generateOutputFilename(file, format));
                    setStatus("success");
                    return;
                }
            } catch (error: any) {
                // If server-side fails, fall back to client-side
                console.log("Server-side conversion failed, using client-side:", error.message);
            }
        }

        // Client-side conversion (for large files or server-side unavailable)
        await convertMediaClient(file, format, "audio");
    };

    const convertMediaClient = async (file: File, format: string, mediaType: "video" | "audio") => {
        try {
            // Check file size limit for client-side
            if (file.size > CLIENT_MAX_SIZE) {
                throw new Error(`File size (${(file.size / 1024 / 1024 / 1024).toFixed(2)}GB) exceeds the maximum allowed size of ${(CLIENT_MAX_SIZE / 1024 / 1024 / 1024).toFixed(2)}GB for client-side conversion.`);
            }

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
        } catch (error: any) {
            console.error(error);
            setStatus("error");
            
            // Provide specific error messages
            if (error.message?.includes("File size")) {
                toast.error(error.message);
            } else if (error.message?.includes("timeout") || error.message?.includes("timed out")) {
                toast.error("Conversion timed out. The file may be too large or complex. Please try a smaller file.");
            } else if (error.message?.includes("not supported") || error.message?.includes("unsupported")) {
                toast.error("This conversion is not supported. Please try a different format.");
            } else {
                toast.error(`Failed to convert ${mediaType}. ${error.message || "Please try again."}`);
            }
        }
    };

    // Keep convertMedia for backward compatibility
    const convertMedia = async (file: File, format: string) => {
        const mediaType = file.type.startsWith("video/") ? "video" : "audio";
        await convertMediaClient(file, format, mediaType);
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
        // Video conversions
        else if (file.type.startsWith("video/")) {
            await convertVideo(file, targetFormat);
        }
        // Audio conversions
        else if (file.type.startsWith("audio/")) {
            await convertAudio(file, targetFormat);
        } else {
            toast.error("Unsupported conversion combination. Please select a supported file type and format.");
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
