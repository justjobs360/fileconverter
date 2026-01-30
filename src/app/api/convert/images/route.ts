import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

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

        // Generate output filename
        const originalName = file.name;
        const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
        const outputFilename = `${nameWithoutExt}.${format}`;

        // Validate file type
        if (!file.type.startsWith("image/") && !file.name.toLowerCase().endsWith(".svg")) {
            return NextResponse.json(
                { error: "Only image files are supported by this endpoint" },
                { status: 400 }
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer) as Buffer;
        let convertedBuffer: Buffer | undefined;

        // Handle SVG input - convert to PNG first if needed
        const isSvgInput = file.type.includes("svg") || file.name.toLowerCase().endsWith(".svg");
        let inputBuffer: Buffer = buffer;
        
        if (isSvgInput && format.toLowerCase() !== "svg") {
            // SVG needs to be converted to a raster format first
            // Sharp can handle SVG, but we need to specify dimensions
            inputBuffer = await sharp(buffer as any, { density: 300 })
                .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
                .png()
                .toBuffer();
        }

        // Convert using sharp
        // Sharp supports jpeg, png, webp, avif, tiff, heif, gif (animations not perfect)
        switch (format.toLowerCase()) {
            case "jpg":
            case "jpeg":
                convertedBuffer = await sharp(inputBuffer).jpeg({ quality: 90 }).toBuffer();
                break;
            case "png":
                convertedBuffer = await sharp(inputBuffer).png({ quality: 90 }).toBuffer();
                break;
            case "webp":
                convertedBuffer = await sharp(inputBuffer).webp({ quality: 90 }).toBuffer();
                break;
            case "avif":
                convertedBuffer = await sharp(inputBuffer).avif({ quality: 60 }).toBuffer();
                break;
            case "tiff":
                convertedBuffer = await sharp(inputBuffer).tiff().toBuffer();
                break;
            case "gif":
                convertedBuffer = await sharp(inputBuffer).gif().toBuffer();
                break;
            case "svg":
                // SVG output - if input is already SVG, return as-is
                if (isSvgInput) {
                    convertedBuffer = buffer;
                } else {
                    // Convert raster to SVG - this is a simplified approach
                    // In production, you might want to use a different library
                    return NextResponse.json(
                        { error: "Raster to SVG conversion is not supported. SVG is a vector format." },
                        { status: 400 }
                    );
                }
                break;
            default:
                return NextResponse.json(
                    { error: `Unsupported output format: ${format}` },
                    { status: 400 }
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
    } catch (error) {
        console.error("Conversion error:", error);
        return NextResponse.json(
            { error: "Failed to convert image" },
            { status: 500 }
        );
    }
}


