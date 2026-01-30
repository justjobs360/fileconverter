import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

// Vercel serverless limits
const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB (Vercel request limit)

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        // We assume target format is PDF if we hit this route, or we check 'format'
        const format = formData.get("format") as string | null;

        if (!file || format?.toLowerCase() !== 'pdf') {
            return NextResponse.json(
                { 
                    error: "Invalid request. File required and format must be PDF.",
                    code: "INVALID_REQUEST"
                },
                { status: 400 }
            );
        }

        // File size validation
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { 
                    error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds the maximum allowed size of ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(2)}MB. Please use a smaller file.`,
                    code: "FILE_TOO_LARGE"
                },
                { status: 413 }
            );
        }

        // Generate output filename
        const originalName = file.name;
        const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
        const outputFilename = `${nameWithoutExt}.pdf`;

        // Validate input file is an image
        if (!file.type.startsWith("image/") && !file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i)) {
            return NextResponse.json(
                { 
                    error: "Only image to PDF conversion is currently supported. Please upload an image file.",
                    code: "INVALID_FILE_TYPE"
                },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Create PDF
        const pdfDoc = await PDFDocument.create();
        let imageEmbed;

        try {
            // Use sharp to convert any image format to PNG for PDF embedding
            const sharp = (await import("sharp")).default;
            const pngBuffer = await sharp(buffer).png().toBuffer();

            imageEmbed = await pdfDoc.embedPng(pngBuffer);

            const page = pdfDoc.addPage([imageEmbed.width, imageEmbed.height]);
            page.drawImage(imageEmbed, {
                x: 0,
                y: 0,
                width: imageEmbed.width,
                height: imageEmbed.height,
            });

            const pdfBytes = await pdfDoc.save();

            // Return bytes
            const headers = new Headers();
            headers.set("Content-Type", "application/pdf");
            headers.set("Content-Disposition", `attachment; filename="${outputFilename}"`);

            return new NextResponse(pdfBytes as any, {
                status: 200,
                headers,
            });
        } catch (imageError: any) {
            console.error("Image processing error:", imageError);
            
            if (imageError.message?.includes("Input buffer contains unsupported image format")) {
                return NextResponse.json(
                    { 
                        error: "The uploaded file is not a valid image or uses an unsupported format. Please ensure the file is a valid image.",
                        code: "INVALID_IMAGE_FORMAT"
                    },
                    { status: 400 }
                );
            }
            
            if (imageError.message?.includes("too large") || imageError.message?.includes("memory")) {
                return NextResponse.json(
                    { 
                        error: "Image is too large to convert to PDF. Please resize or compress the image first.",
                        code: "IMAGE_TOO_LARGE"
                    },
                    { status: 413 }
                );
            }
            
            throw imageError;
        }

    } catch (error: any) {
        console.error("PDF Conversion error:", error);
        
        // Provide user-friendly error messages
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
                error: "Failed to convert image to PDF. Please ensure the file is a valid image format and try again.",
                code: "CONVERSION_ERROR",
                details: process.env.NODE_ENV === "development" ? error.message : undefined
            },
            { status: 500 }
        );
    }
}
