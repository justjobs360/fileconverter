"use client";

import { useState, useRef } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { toast } from "sonner";

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
            setResultFilename(`converted.${format}`);
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

            await ffmpeg.exec(["-i", fileName, `output.${format}`]);

            const data = await ffmpeg.readFile(`output.${format}`) as Uint8Array;
            const blob = new Blob([data as any], { type: `audio/${format}` }); // Adjust type dynamically if video
            const url = URL.createObjectURL(blob);

            setResultUrl(url);
            setResultFilename(`converted.${format}`);
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
            setResultFilename(`converted.pdf`);
            setStatus("success");
        } catch (error) {
            console.error(error);
            setStatus("error");
            toast.error("Failed to convert to PDF");
        }
    }

    const convert = async (file: File, targetFormat: string) => {
        reset();

        // Determine strategy
        if (targetFormat === 'pdf' && file.type.startsWith("image/")) {
            await convertPdf(file);
        } else if (file.type.startsWith("image/") || ["gif", "tiff", "avif", "webp", "jpg", "jpeg", "png"].includes(targetFormat)) {
            // Note: Simplification - if input is image OR target is image, we try server.
            // But we only support Image -> Image on server. 
            // If input is video -> image, that's FFmpeg (WASM).

            if (file.type.startsWith("image/")) {
                await convertImage(file, targetFormat);
            } else {
                await convertMedia(file, targetFormat);
            }
        } else if (file.type.startsWith("video/") || file.type.startsWith("audio/")) {
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
