import { NextRequest, NextResponse } from "next/server";

// Vercel serverless limits
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB for server-side processing
const SUPPORTED_AUDIO_FORMATS = ["mp3", "wav", "aac", "flac", "ogg"];

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const format = formData.get("format") as string | null;

        if (!file || !format) {
            return NextResponse.json(
                { error: "File and format are required" },
                { status: 400 }
            );
        }

        // Validate file type
        if (!file.type.startsWith("audio/")) {
            return NextResponse.json(
                { 
                    error: "Only audio files are supported by this endpoint",
                    code: "INVALID_FILE_TYPE"
                },
                { status: 400 }
            );
        }

        // Validate target format
        const targetFormat = format.toLowerCase();
        if (!SUPPORTED_AUDIO_FORMATS.includes(targetFormat)) {
            return NextResponse.json(
                { 
                    error: `Unsupported audio format: ${format}. Supported formats are: ${SUPPORTED_AUDIO_FORMATS.join(", ").toUpperCase()}`,
                    code: "UNSUPPORTED_FORMAT"
                },
                { status: 400 }
            );
        }

        // File size validation
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { 
                    error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds the maximum allowed size of ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(2)}MB for server-side conversion. Large files are automatically processed client-side.`,
                    code: "FILE_TOO_LARGE",
                    useClientSide: true,
                    maxSize: MAX_FILE_SIZE
                },
                { status: 413 }
            );
        }

        // Generate output filename
        const originalName = file.name;
        const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
        const outputFilename = `${nameWithoutExt}.${targetFormat}`;

        // Note: FFmpeg is not available in Vercel serverless by default
        // For now, we validate the request and return an error suggesting client-side conversion
        // In the future, this could be integrated with an external service or FFmpeg binary
        
        return NextResponse.json(
            { 
                error: "Server-side audio conversion is currently not available. Audio conversions are processed client-side using your browser for better performance and to handle larger files.",
                code: "SERVER_SIDE_UNAVAILABLE",
                useClientSide: true,
                message: "Please use client-side conversion for audio files"
            },
            { status: 501 }
        );

        // Future implementation would go here:
        // - Use FFmpeg binary or external service
        // - Process the audio file
        // - Return converted file

    } catch (error: any) {
        console.error("Audio conversion error:", error);
        
        return NextResponse.json(
            { 
                error: "Failed to process audio conversion request. Please try again or use client-side conversion.",
                code: "PROCESSING_ERROR",
                details: process.env.NODE_ENV === "development" ? error.message : undefined
            },
            { status: 500 }
        );
    }
}
