import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        // We assume target format is PDF if we hit this route, or we check 'format'
        const format = formData.get("format") as string | null;

        if (!file || format?.toLowerCase() !== 'pdf') {
            return NextResponse.json(
                { error: "Invalid request. File required and format must be PDF." },
                { status: 400 }
            );
        }

        // Validate input file is an image
        if (!file.type.startsWith("image/")) {
            return NextResponse.json(
                { error: "Only image to PDF conversion is currently supported." },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Create PDF
        const pdfDoc = await PDFDocument.create();
        let imageEmbed;

        // Embed image based on type
        // pdf-lib supports PNG, JPG. WebP not natively? 
        // If WebP, we might need to convert to PNG first using Sharp (we can import sharp here too)
        // Let's assume input is JPG/PNG for now. 
        // Actually, let's use sharp to standardise input to PNG first to be safe? 
        // Yes, cleaner.

        // Dynamic import sharp to avoid bundling if not used (though we use it in other route)
        // But we are in serverless, bundle size matters. 
        // Importing sharp is fine.

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
        headers.set("Content-Disposition", `attachment; filename="converted.pdf"`);

        return new NextResponse(pdfBytes as any, {
            status: 200,
            headers,
        });

    } catch (error) {
        console.error("PDF Conversion error:", error);
        return NextResponse.json(
            { error: "Failed to convert to PDF" },
            { status: 500 }
        );
    }
}
