import { NextRequest, NextResponse } from "next/server";

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

        const buffer = Buffer.from(await file.arrayBuffer());
        let convertedBuffer: Buffer;
        let contentType: string;

        const targetFormat = format.toLowerCase();

        // PDF to other formats
        if (file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf")) {
            if (targetFormat === "txt") {
                // PDF to TXT - basic text extraction
                // Note: This is a simplified version. For production, use pdf-parse or similar
                convertedBuffer = Buffer.from("PDF to text conversion requires additional libraries.\nPlease use a dedicated PDF text extraction tool.", "utf-8");
                contentType = "text/plain";
            } else if (targetFormat === "rtf") {
                // PDF to RTF - placeholder
                convertedBuffer = Buffer.from("{\\rtf1\\ansi PDF to RTF conversion requires additional libraries.}", "utf-8");
                contentType = "application/rtf";
            } else if (targetFormat === "docx") {
                // PDF to DOCX - requires pdf-parse and docx libraries
                return NextResponse.json(
                    { error: "PDF to DOCX conversion is not yet implemented. This feature requires additional libraries." },
                    { status: 501 }
                );
            } else {
                return NextResponse.json(
                    { error: `Unsupported conversion: PDF to ${format}` },
                    { status: 400 }
                );
            }
        }
        // DOCX to other formats
        else if (file.type.includes("wordprocessingml") || file.name.toLowerCase().endsWith(".docx")) {
            if (targetFormat === "pdf") {
                // DOCX to PDF - requires mammoth or similar
                return NextResponse.json(
                    { error: "DOCX to PDF conversion is not yet implemented. This feature requires additional libraries." },
                    { status: 501 }
                );
            } else if (targetFormat === "txt") {
                // DOCX to TXT - basic extraction
                // Note: This requires mammoth or similar library
                return NextResponse.json(
                    { error: "DOCX to TXT conversion is not yet implemented. This feature requires additional libraries." },
                    { status: 501 }
                );
            } else if (targetFormat === "rtf") {
                return NextResponse.json(
                    { error: "DOCX to RTF conversion is not yet implemented. This feature requires additional libraries." },
                    { status: 501 }
                );
            } else {
                return NextResponse.json(
                    { error: `Unsupported conversion: DOCX to ${format}` },
                    { status: 400 }
                );
            }
        }
        // TXT/RTF conversions
        else if (file.type.includes("text/plain") || file.name.toLowerCase().endsWith(".txt")) {
            if (targetFormat === "pdf") {
                // TXT to PDF
                const { PDFDocument, rgb } = await import("pdf-lib");
                const pdfDoc = await PDFDocument.create();
                const page = pdfDoc.addPage([612, 792]); // Letter size
                const text = buffer.toString("utf-8");
                const lines = text.split("\n");
                
                let y = 750;
                const fontSize = 12;
                for (const line of lines.slice(0, 50)) { // Limit to 50 lines
                    if (y < 50) break;
                    page.drawText(line.substring(0, 80), {
                        x: 50,
                        y: y,
                        size: fontSize,
                        color: rgb(0, 0, 0),
                    });
                    y -= fontSize + 5;
                }
                
                convertedBuffer = Buffer.from(await pdfDoc.save());
                contentType = "application/pdf";
            } else if (targetFormat === "docx") {
                return NextResponse.json(
                    { error: "TXT to DOCX conversion is not yet implemented." },
                    { status: 501 }
                );
            } else if (targetFormat === "rtf") {
                // TXT to RTF - simple conversion
                const text = buffer.toString("utf-8");
                const rtfText = `{\\rtf1\\ansi\\deff0 ${text.replace(/\n/g, "\\par ")}}`;
                convertedBuffer = Buffer.from(rtfText, "utf-8");
                contentType = "application/rtf";
            } else {
                return NextResponse.json(
                    { error: `Unsupported conversion: TXT to ${format}` },
                    { status: 400 }
                );
            }
        }
        // RTF conversions
        else if (file.type.includes("rtf") || file.name.toLowerCase().endsWith(".rtf")) {
            if (targetFormat === "pdf") {
                // RTF to PDF - requires RTF parsing
                return NextResponse.json(
                    { error: "RTF to PDF conversion is not yet implemented." },
                    { status: 501 }
                );
            } else if (targetFormat === "txt") {
                // RTF to TXT - basic extraction (remove RTF codes)
                const rtfText = buffer.toString("utf-8");
                const plainText = rtfText
                    .replace(/\{[^}]*\}/g, "")
                    .replace(/\\[a-z]+\d*\s?/gi, "")
                    .replace(/\s+/g, " ")
                    .trim();
                convertedBuffer = Buffer.from(plainText, "utf-8");
                contentType = "text/plain";
            } else if (targetFormat === "docx") {
                return NextResponse.json(
                    { error: "RTF to DOCX conversion is not yet implemented." },
                    { status: 501 }
                );
            } else {
                return NextResponse.json(
                    { error: `Unsupported conversion: RTF to ${format}` },
                    { status: 400 }
                );
            }
        }
        else {
            return NextResponse.json(
                { error: "Unsupported file type for document conversion" },
                { status: 400 }
            );
        }

        // Return the converted file
        const headers = new Headers();
        headers.set("Content-Type", contentType);
        headers.set("Content-Disposition", `attachment; filename="${outputFilename}"`);

        return new NextResponse(convertedBuffer, {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error("Document conversion error:", error);
        return NextResponse.json(
            { error: "Failed to convert document" },
            { status: 500 }
        );
    }
}
