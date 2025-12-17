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

        // Validate file type
        if (!file.type.startsWith("image/")) {
            return NextResponse.json(
                { error: "Only image files are supported by this endpoint" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let convertedBuffer: Buffer | undefined;

        // Convert using sharp
        // Sharp supports jpeg, png, webp, avif, tiff, heif, git (animations not perfect)
        switch (format.toLowerCase()) {
            case "jpg":
            case "jpeg":
                convertedBuffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();
                break;
            case "png":
                convertedBuffer = await sharp(buffer).png({ quality: 90 }).toBuffer();
                break;
            case "webp":
                convertedBuffer = await sharp(buffer).webp({ quality: 90 }).toBuffer();
                break;
            case "avif":
                convertedBuffer = await sharp(buffer).avif({ quality: 60 }).toBuffer();
                break;
            case "tiff":
                convertedBuffer = await sharp(buffer).tiff().toBuffer();
                break;
            case "gif":
                convertedBuffer = await sharp(buffer).gif().toBuffer();
                break;
            default:
                return NextResponse.json(
                    { error: `Unsupported output format: ${format}` },
                    { status: 400 }
                );
        }

        // Return the converted file
        const headers = new Headers();
        headers.set("Content-Type", `image/${format === "jpg" ? "jpeg" : format}`);
        headers.set(
            "Content-Disposition",
            `attachment; filename="converted.${format}"`
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


