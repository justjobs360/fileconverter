import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

// Vercel serverless limits
const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB (Vercel request limit)
const MAX_IMAGE_DIMENSION = 10000; // Maximum dimension to prevent memory issues

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const format = formData.get("format") as string | null;
        const qualityParam = formData.get("quality") as string | null;

        if (!file || !format) {
            return NextResponse.json(
                { error: "File and format are required" },
                { status: 400 }
            );
        }

        // File size validation
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { 
                    error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds the maximum allowed size of ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(2)}MB. Please use a smaller file or compress it first.`,
                    code: "FILE_TOO_LARGE"
                },
                { status: 413 }
            );
        }

        // Generate output filename
        const originalName = file.name;
        const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
        const outputFilename = `${nameWithoutExt}.${format}`;

        // Validate file type
        if (!file.type.startsWith("image/") && !file.name.toLowerCase().endsWith(".svg")) {
            // Check for HEIC/HEIF
            if (file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif")) {
                return NextResponse.json(
                    { 
                        error: "HEIC/HEIF format is not directly supported. Please convert to JPG or PNG first using a compatible tool.",
                        code: "UNSUPPORTED_FORMAT",
                        suggestion: "Try converting to JPG or PNG format first"
                    },
                    { status: 400 }
                );
            }
            return NextResponse.json(
                { error: "Only image files are supported by this endpoint" },
                { status: 400 }
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer) as Buffer;
        let convertedBuffer: Buffer | undefined;

        // Parse quality parameter (default: 90 for JPEG/WebP, 60 for AVIF)
        const defaultQuality = format.toLowerCase() === "avif" ? 60 : 90;
        const quality = qualityParam ? parseInt(qualityParam) : defaultQuality;
        const clampedQuality = Math.max(1, Math.min(100, quality || defaultQuality));

        // Handle SVG input - convert to PNG first if needed
        const isSvgInput = file.type.includes("svg") || file.name.toLowerCase().endsWith(".svg");
        let inputBuffer: Buffer = buffer;
        
        if (isSvgInput && format.toLowerCase() !== "svg") {
            try {
                // Enhanced SVG handling - try to get dimensions from SVG
                const svgText = buffer.toString('utf-8');
                let width = 2000;
                let height = 2000;
                
                // Try to extract dimensions from SVG
                const widthMatch = svgText.match(/width=["']?(\d+)/i);
                const heightMatch = svgText.match(/height=["']?(\d+)/i);
                const viewBoxMatch = svgText.match(/viewBox=["']?\d+\s+\d+\s+(\d+)\s+(\d+)/i);
                
                if (viewBoxMatch) {
                    width = parseInt(viewBoxMatch[1]) || width;
                    height = parseInt(viewBoxMatch[2]) || height;
                } else if (widthMatch && heightMatch) {
                    width = parseInt(widthMatch[1]) || width;
                    height = parseInt(heightMatch[1]) || height;
                }
                
                // Limit dimensions to prevent memory issues
                const maxDim = Math.max(width, height);
                if (maxDim > MAX_IMAGE_DIMENSION) {
                    const scale = MAX_IMAGE_DIMENSION / maxDim;
                    width = Math.round(width * scale);
                    height = Math.round(height * scale);
                }
                
                // Convert SVG to raster format
                inputBuffer = await sharp(buffer as any, { 
                    density: 300,
                    limitInputPixels: false 
                })
                    .resize(width, height, { 
                        fit: 'inside', 
                        withoutEnlargement: true 
                    })
                    .png()
                    .toBuffer();
            } catch (svgError: any) {
                console.error("SVG conversion error:", svgError);
                return NextResponse.json(
                    { 
                        error: "Failed to process SVG file. The SVG may contain unsupported features or be corrupted.",
                        code: "SVG_PROCESSING_ERROR",
                        details: svgError.message
                    },
                    { status: 400 }
                );
            }
        }

        // Convert using sharp with format-specific optimizations
        try {
            switch (format.toLowerCase()) {
                case "jpg":
                case "jpeg":
                    convertedBuffer = await sharp(inputBuffer)
                        .jpeg({ 
                            quality: clampedQuality, 
                            progressive: true,
                            mozjpeg: true
                        })
                        .toBuffer();
                    break;
                case "png":
                    // PNG quality is compression level (0-9), not quality percentage
                    const pngCompression = Math.round((100 - clampedQuality) / 11.11);
                    convertedBuffer = await sharp(inputBuffer)
                        .png({ 
                            compressionLevel: Math.max(0, Math.min(9, pngCompression)),
                            progressive: true
                        })
                        .toBuffer();
                    break;
                case "webp":
                    convertedBuffer = await sharp(inputBuffer)
                        .webp({ 
                            quality: clampedQuality,
                            effort: 4 // Balance between compression and speed
                        })
                        .toBuffer();
                    break;
                case "avif":
                    convertedBuffer = await sharp(inputBuffer)
                        .avif({ 
                            quality: clampedQuality,
                            effort: 4
                        })
                        .toBuffer();
                    break;
                case "tiff":
                    convertedBuffer = await sharp(inputBuffer)
                        .tiff({ 
                            compression: 'lzw',
                            quality: clampedQuality
                        })
                        .toBuffer();
                    break;
                case "gif":
                    // Note: Sharp's GIF support is limited, animations may not be preserved
                    convertedBuffer = await sharp(inputBuffer)
                        .gif({ 
                            effort: 7
                        })
                        .toBuffer();
                    break;
                case "svg":
                    // SVG output - if input is already SVG, return as-is
                    if (isSvgInput) {
                        convertedBuffer = buffer;
                    } else {
                        return NextResponse.json(
                            { 
                                error: "Raster to SVG conversion is not supported. SVG is a vector format that cannot be accurately generated from raster images.",
                                code: "RASTER_TO_SVG_UNSUPPORTED"
                            },
                            { status: 400 }
                        );
                    }
                    break;
                default:
                    return NextResponse.json(
                        { 
                            error: `Unsupported output format: ${format}. Supported formats are: JPG, PNG, WebP, AVIF, TIFF, GIF, SVG`,
                            code: "UNSUPPORTED_FORMAT"
                        },
                        { status: 400 }
                    );
            }
        } catch (conversionError: any) {
            console.error("Format conversion error:", conversionError);
            
            // Provide specific error messages
            if (conversionError.message?.includes("memory") || conversionError.message?.includes("too large")) {
                return NextResponse.json(
                    { 
                        error: "Image is too large to process. Please resize or compress the image before conversion.",
                        code: "IMAGE_TOO_LARGE"
                    },
                    { status: 413 }
                );
            }
            
            if (conversionError.message?.includes("unsupported") || conversionError.message?.includes("format")) {
                return NextResponse.json(
                    { 
                        error: `Failed to convert to ${format.toUpperCase()}. The image format may not be compatible.`,
                        code: "CONVERSION_FAILED",
                        details: conversionError.message
                    },
                    { status: 400 }
                );
            }
            
            throw conversionError; // Re-throw to be caught by outer catch
        }

        if (!convertedBuffer) {
            return NextResponse.json(
                { error: "Conversion failed: No output generated" },
                { status: 500 }
            );
        }

        // Return the converted file
        const headers = new Headers();
        let contentType = `image/${format === "jpg" ? "jpeg" : format}`;
        if (format.toLowerCase() === "svg") {
            contentType = "image/svg+xml";
        }
        headers.set("Content-Type", contentType);
        headers.set(
            "Content-Disposition",
            `attachment; filename="${outputFilename}"`
        );

        return new NextResponse(convertedBuffer as any, {
            status: 200,
            headers,
        });
    } catch (error: any) {
        console.error("Conversion error:", error);
        
        // Provide user-friendly error messages
        if (error.message?.includes("Input buffer contains unsupported image format")) {
            return NextResponse.json(
                { 
                    error: "The uploaded file is not a valid image or uses an unsupported format. Please ensure the file is a valid image.",
                    code: "INVALID_IMAGE_FORMAT"
                },
                { status: 400 }
            );
        }
        
        if (error.message?.includes("timeout") || error.code === "ETIMEDOUT") {
            return NextResponse.json(
                { 
                    error: "Conversion timed out. The image may be too large or complex. Please try a smaller image.",
                    code: "TIMEOUT"
                },
                { status: 504 }
            );
        }
        
        return NextResponse.json(
            { 
                error: "Failed to convert image. Please ensure the file is a valid image format and try again.",
                code: "CONVERSION_ERROR",
                details: process.env.NODE_ENV === "development" ? error.message : undefined
            },
            { status: 500 }
        );
    }
}


