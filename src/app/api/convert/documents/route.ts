import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

// Vercel serverless limits
const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB (Vercel request limit)

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const format = formData.get("format") as string | null;

        if (!file || !format) {
            return NextResponse.json(
                { 
                    error: "File and format are required",
                    code: "MISSING_PARAMETERS"
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
        const outputFilename = `${nameWithoutExt}.${format}`;

        const buffer = Buffer.from(await file.arrayBuffer());
        let convertedBuffer: Buffer;
        let contentType: string;

        const targetFormat = format.toLowerCase();

        // PDF to other formats
        if (file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf")) {
            if (targetFormat === "txt") {
                // PDF to TXT - extract text from PDF
                try {
                    const pdfData = await pdfParse(buffer);
                    const text = pdfData.text || "No text content found in PDF.";
                    convertedBuffer = Buffer.from(text, "utf-8");
                    contentType = "text/plain";
                } catch (error: any) {
                    console.error("PDF parse error:", error);
                    return NextResponse.json(
                        { 
                            error: "Failed to extract text from PDF. The PDF might be image-based, password-protected, or corrupted.",
                            code: "PDF_EXTRACTION_FAILED",
                            details: process.env.NODE_ENV === "development" ? error.message : undefined
                        },
                        { status: 500 }
                    );
                }
            } else if (targetFormat === "rtf") {
                // PDF to RTF - extract text and convert to RTF
                try {
                    const pdfData = await pdfParse(buffer);
                    const text = pdfData.text || "No text content found in PDF.";
                    // Convert text to RTF format
                    const rtfText = `{\\rtf1\\ansi\\deff0 {\\fonttbl{\\f0 Times New Roman;}}\\f0\\fs24 ${text
                        .replace(/\\/g, "\\\\")
                        .replace(/\{/g, "\\{")
                        .replace(/\}/g, "\\}")
                        .replace(/\n/g, "\\par ")}}`;
                    convertedBuffer = Buffer.from(rtfText, "utf-8");
                    contentType = "application/rtf";
                } catch (error: any) {
                    console.error("PDF to RTF error:", error);
                    return NextResponse.json(
                        { 
                            error: "Failed to convert PDF to RTF. The PDF might be image-based or corrupted.",
                            code: "PDF_TO_RTF_FAILED",
                            details: process.env.NODE_ENV === "development" ? error.message : undefined
                        },
                        { status: 500 }
                    );
                }
            } else if (targetFormat === "docx") {
                // PDF to DOCX - extract text and create DOCX
                try {
                    const pdfData = await pdfParse(buffer);
                    const text = pdfData.text || "No text content found in PDF.";
                    
                    // Split text into paragraphs
                    const paragraphs = text
                        .split(/\n\s*\n/)
                        .filter(p => p.trim().length > 0)
                        .map(text => new Paragraph({
                            children: [new TextRun(text.trim())],
                            spacing: { after: 200 },
                        }));

                    if (paragraphs.length === 0) {
                        paragraphs.push(new Paragraph({
                            children: [new TextRun("No text content found in PDF.")],
                        }));
                    }

                    const doc = new Document({
                        sections: [{
                            properties: {},
                            children: paragraphs,
                        }],
                    });

                    const docxBuffer = await Packer.toBuffer(doc);
                    convertedBuffer = Buffer.from(docxBuffer);
                    contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                } catch (error: any) {
                    console.error("PDF to DOCX error:", error);
                    return NextResponse.json(
                        { 
                            error: "Failed to convert PDF to DOCX. The PDF might be image-based or corrupted.",
                            code: "PDF_TO_DOCX_FAILED",
                            details: process.env.NODE_ENV === "development" ? error.message : undefined
                        },
                        { status: 500 }
                    );
                }
            } else {
                return NextResponse.json(
                    { 
                        error: `Unsupported conversion: PDF to ${format}. Supported formats are: TXT, RTF, DOCX`,
                        code: "UNSUPPORTED_CONVERSION"
                    },
                    { status: 400 }
                );
            }
        }
        // DOCX to other formats
        else if (file.type.includes("wordprocessingml") || file.name.toLowerCase().endsWith(".docx")) {
            if (targetFormat === "pdf") {
                // DOCX to PDF - convert DOCX to HTML/text, then to PDF
                try {
                    // Convert DOCX to HTML first
                    const result = await mammoth.convertToHtml({ buffer });
                    const html = result.value;
                    
                    // Extract text from HTML (simple approach)
                    const text = html
                        .replace(/<[^>]*>/g, '') // Remove HTML tags
                        .replace(/&nbsp;/g, ' ')
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&quot;/g, '"')
                        .replace(/&#39;/g, "'")
                        .trim();

                    // Create PDF from text
                    const pdfDoc = await PDFDocument.create();
                    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
                    const page = pdfDoc.addPage([612, 792]); // Letter size
                    
                    const lines = text.split('\n').filter(line => line.trim().length > 0);
                    let currentPage = page;
                    let y = 750;
                    const fontSize = 12;
                    const lineHeight = fontSize + 4;
                    const margin = 50;
                    const maxWidth = 512;
                    
                    for (const line of lines) {
                        if (y < margin) {
                            // Add new page if needed
                            currentPage = pdfDoc.addPage([612, 792]);
                            y = 750;
                        }
                        
                        const words = line.split(' ');
                        let currentLine = '';
                        for (const word of words) {
                            const testLine = currentLine ? `${currentLine} ${word}` : word;
                            const textWidth = helveticaFont.widthOfTextAtSize(testLine, fontSize);
                            
                            if (textWidth > maxWidth && currentLine) {
                                // Draw current line and start new one
                                currentPage.drawText(currentLine, {
                                    x: margin,
                                    y: y,
                                    size: fontSize,
                                    font: helveticaFont,
                                    color: rgb(0, 0, 0),
                                });
                                y -= lineHeight;
                                if (y < margin) {
                                    currentPage = pdfDoc.addPage([612, 792]);
                                    y = 750;
                                }
                                currentLine = word;
                            } else {
                                currentLine = testLine;
                            }
                        }
                        
                        if (currentLine) {
                            currentPage.drawText(currentLine, {
                                x: margin,
                                y: y,
                                size: fontSize,
                                font: helveticaFont,
                                color: rgb(0, 0, 0),
                            });
                            y -= lineHeight;
                        }
                    }
                    
                    convertedBuffer = Buffer.from(await pdfDoc.save());
                    contentType = "application/pdf";
                } catch (error: any) {
                    console.error("DOCX to PDF error:", error);
                    return NextResponse.json(
                        { 
                            error: "Failed to convert DOCX to PDF. The document might be corrupted or contain unsupported elements.",
                            code: "DOCX_TO_PDF_FAILED",
                            details: process.env.NODE_ENV === "development" ? error.message : undefined
                        },
                        { status: 500 }
                    );
                }
            } else if (targetFormat === "txt") {
                // DOCX to TXT - convert to HTML then extract text
                try {
                    const result = await mammoth.extractRawText({ buffer });
                    const text = result.value || "No text content found in DOCX.";
                    convertedBuffer = Buffer.from(text, "utf-8");
                    contentType = "text/plain";
                } catch (error: any) {
                    console.error("DOCX to TXT error:", error);
                    return NextResponse.json(
                        { 
                            error: "Failed to convert DOCX to TXT. The document might be corrupted.",
                            code: "DOCX_TO_TXT_FAILED",
                            details: process.env.NODE_ENV === "development" ? error.message : undefined
                        },
                        { status: 500 }
                    );
                }
            } else if (targetFormat === "rtf") {
                // DOCX to RTF - convert to text then to RTF
                try {
                    const result = await mammoth.extractRawText({ buffer });
                    const text = result.value || "No text content found in DOCX.";
                    
                    // Convert text to RTF format
                    const rtfText = `{\\rtf1\\ansi\\deff0 {\\fonttbl{\\f0 Times New Roman;}}\\f0\\fs24 ${text
                        .replace(/\\/g, "\\\\")
                        .replace(/\{/g, "\\{")
                        .replace(/\}/g, "\\}")
                        .replace(/\n/g, "\\par ")}}`;
                    convertedBuffer = Buffer.from(rtfText, "utf-8");
                    contentType = "application/rtf";
                } catch (error: any) {
                    console.error("DOCX to RTF error:", error);
                    return NextResponse.json(
                        { 
                            error: "Failed to convert DOCX to RTF. The document might be corrupted.",
                            code: "DOCX_TO_RTF_FAILED",
                            details: process.env.NODE_ENV === "development" ? error.message : undefined
                        },
                        { status: 500 }
                    );
                }
            } else {
                return NextResponse.json(
                    { 
                        error: `Unsupported conversion: DOCX to ${format}. Supported formats are: PDF, TXT, RTF`,
                        code: "UNSUPPORTED_CONVERSION"
                    },
                    { status: 400 }
                );
            }
        }
        // TXT conversions
        else if (file.type.includes("text/plain") || file.name.toLowerCase().endsWith(".txt")) {
            if (targetFormat === "pdf") {
                // TXT to PDF - improved version
                try {
                    const pdfDoc = await PDFDocument.create();
                    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
                    const page = pdfDoc.addPage([612, 792]); // Letter size
                    const text = buffer.toString("utf-8");
                    const lines = text.split("\n");
                    
                    let currentPage = page;
                    let y = 750;
                    const fontSize = 12;
                    const lineHeight = fontSize + 4;
                    const margin = 50;
                    const maxWidth = 512;
                    
                    for (const line of lines) {
                        if (y < margin) {
                            currentPage = pdfDoc.addPage([612, 792]);
                            y = 750;
                        }
                        
                        // Handle long lines by word wrapping
                        const words = line.split(' ');
                        let currentLine = '';
                        for (const word of words) {
                            const testLine = currentLine ? `${currentLine} ${word}` : word;
                            const textWidth = helveticaFont.widthOfTextAtSize(testLine, fontSize);
                            
                            if (textWidth > maxWidth && currentLine) {
                                currentPage.drawText(currentLine, {
                                    x: margin,
                                    y: y,
                                    size: fontSize,
                                    font: helveticaFont,
                                    color: rgb(0, 0, 0),
                                });
                                y -= lineHeight;
                                if (y < margin) {
                                    currentPage = pdfDoc.addPage([612, 792]);
                                    y = 750;
                                }
                                currentLine = word;
                            } else {
                                currentLine = testLine;
                            }
                        }
                        
                        if (currentLine) {
                            currentPage.drawText(currentLine, {
                                x: margin,
                                y: y,
                                size: fontSize,
                                font: helveticaFont,
                                color: rgb(0, 0, 0),
                            });
                            y -= lineHeight;
                        }
                    }
                    
                    convertedBuffer = Buffer.from(await pdfDoc.save());
                    contentType = "application/pdf";
                } catch (error: any) {
                    console.error("TXT to PDF error:", error);
                    return NextResponse.json(
                        { 
                            error: "Failed to convert TXT to PDF. The file might be too large or contain invalid characters.",
                            code: "TXT_TO_PDF_FAILED",
                            details: process.env.NODE_ENV === "development" ? error.message : undefined
                        },
                        { status: 500 }
                    );
                }
            } else if (targetFormat === "docx") {
                // TXT to DOCX
                try {
                    const text = buffer.toString("utf-8");
                    const paragraphs = text
                        .split(/\n\s*\n/)
                        .filter(p => p.trim().length > 0)
                        .map(text => new Paragraph({
                            children: [new TextRun(text.trim())],
                            spacing: { after: 200 },
                        }));

                    if (paragraphs.length === 0) {
                        paragraphs.push(new Paragraph({
                            children: [new TextRun("")],
                        }));
                    }

                    const doc = new Document({
                        sections: [{
                            properties: {},
                            children: paragraphs,
                        }],
                    });

                    const docxBuffer = await Packer.toBuffer(doc);
                    convertedBuffer = Buffer.from(docxBuffer);
                    contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                } catch (error: any) {
                    console.error("TXT to DOCX error:", error);
                    return NextResponse.json(
                        { 
                            error: "Failed to convert TXT to DOCX. The file might be too large.",
                            code: "TXT_TO_DOCX_FAILED",
                            details: process.env.NODE_ENV === "development" ? error.message : undefined
                        },
                        { status: 500 }
                    );
                }
            } else if (targetFormat === "rtf") {
                // TXT to RTF - simple conversion
                const text = buffer.toString("utf-8");
                const rtfText = `{\\rtf1\\ansi\\deff0 {\\fonttbl{\\f0 Times New Roman;}}\\f0\\fs24 ${text
                    .replace(/\\/g, "\\\\")
                    .replace(/\{/g, "\\{")
                    .replace(/\}/g, "\\}")
                    .replace(/\n/g, "\\par ")}}`;
                convertedBuffer = Buffer.from(rtfText, "utf-8");
                contentType = "application/rtf";
            } else {
                return NextResponse.json(
                    { 
                        error: `Unsupported conversion: TXT to ${format}. Supported formats are: PDF, DOCX, RTF`,
                        code: "UNSUPPORTED_CONVERSION"
                    },
                    { status: 400 }
                );
            }
        }
        // RTF conversions
        else if (file.type.includes("rtf") || file.name.toLowerCase().endsWith(".rtf")) {
            if (targetFormat === "pdf") {
                // RTF to PDF - extract text and create PDF
                try {
                    const rtfText = buffer.toString("utf-8");
                    // Basic RTF text extraction (remove RTF codes)
                    const plainText = rtfText
                        .replace(/\{[^}]*\}/g, "")
                        .replace(/\\[a-z]+\d*\s?/gi, "")
                        .replace(/\\par\s?/gi, "\n")
                        .replace(/\\tab\s?/gi, "\t")
                        .replace(/\s+/g, " ")
                        .trim();

                    const pdfDoc = await PDFDocument.create();
                    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
                    const page = pdfDoc.addPage([612, 792]);
                    const lines = plainText.split("\n");
                    
                    let currentPage = page;
                    let y = 750;
                    const fontSize = 12;
                    const lineHeight = fontSize + 4;
                    const margin = 50;
                    const maxWidth = 512;
                    
                    for (const line of lines) {
                        if (y < margin) {
                            currentPage = pdfDoc.addPage([612, 792]);
                            y = 750;
                        }
                        
                        const words = line.split(' ');
                        let currentLine = '';
                        for (const word of words) {
                            const testLine = currentLine ? `${currentLine} ${word}` : word;
                            const textWidth = helveticaFont.widthOfTextAtSize(testLine, fontSize);
                            
                            if (textWidth > maxWidth && currentLine) {
                                currentPage.drawText(currentLine, {
                                    x: margin,
                                    y: y,
                                    size: fontSize,
                                    font: helveticaFont,
                                    color: rgb(0, 0, 0),
                                });
                                y -= lineHeight;
                                if (y < margin) {
                                    currentPage = pdfDoc.addPage([612, 792]);
                                    y = 750;
                                }
                                currentLine = word;
                            } else {
                                currentLine = testLine;
                            }
                        }
                        
                        if (currentLine) {
                            currentPage.drawText(currentLine, {
                                x: margin,
                                y: y,
                                size: fontSize,
                                font: helveticaFont,
                                color: rgb(0, 0, 0),
                            });
                            y -= lineHeight;
                        }
                    }
                    
                    convertedBuffer = Buffer.from(await pdfDoc.save());
                    contentType = "application/pdf";
                } catch (error: any) {
                    console.error("RTF to PDF error:", error);
                    return NextResponse.json(
                        { 
                            error: "Failed to convert RTF to PDF. The RTF file might be corrupted or contain unsupported formatting.",
                            code: "RTF_TO_PDF_FAILED",
                            details: process.env.NODE_ENV === "development" ? error.message : undefined
                        },
                        { status: 500 }
                    );
                }
            } else if (targetFormat === "txt") {
                // RTF to TXT - basic extraction (remove RTF codes)
                const rtfText = buffer.toString("utf-8");
                const plainText = rtfText
                    .replace(/\{[^}]*\}/g, "")
                    .replace(/\\[a-z]+\d*\s?/gi, "")
                    .replace(/\\par\s?/gi, "\n")
                    .replace(/\\tab\s?/gi, "\t")
                    .replace(/\s+/g, " ")
                    .trim();
                convertedBuffer = Buffer.from(plainText, "utf-8");
                contentType = "text/plain";
            } else if (targetFormat === "docx") {
                // RTF to DOCX - extract text and create DOCX
                try {
                    const rtfText = buffer.toString("utf-8");
                    // Basic RTF text extraction
                    const plainText = rtfText
                        .replace(/\{[^}]*\}/g, "")
                        .replace(/\\[a-z]+\d*\s?/gi, "")
                        .replace(/\\par\s?/gi, "\n")
                        .replace(/\\tab\s?/gi, "\t")
                        .replace(/\s+/g, " ")
                        .trim();

                    const paragraphs = plainText
                        .split(/\n\s*\n/)
                        .filter(p => p.trim().length > 0)
                        .map(text => new Paragraph({
                            children: [new TextRun(text.trim())],
                            spacing: { after: 200 },
                        }));

                    if (paragraphs.length === 0) {
                        paragraphs.push(new Paragraph({
                            children: [new TextRun("")],
                        }));
                    }

                    const doc = new Document({
                        sections: [{
                            properties: {},
                            children: paragraphs,
                        }],
                    });

                    const docxBuffer = await Packer.toBuffer(doc);
                    convertedBuffer = Buffer.from(docxBuffer);
                    contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                } catch (error: any) {
                    console.error("RTF to DOCX error:", error);
                    return NextResponse.json(
                        { 
                            error: "Failed to convert RTF to DOCX. The RTF file might be corrupted.",
                            code: "RTF_TO_DOCX_FAILED",
                            details: process.env.NODE_ENV === "development" ? error.message : undefined
                        },
                        { status: 500 }
                    );
                }
            } else {
                return NextResponse.json(
                    { 
                        error: `Unsupported conversion: RTF to ${format}. Supported formats are: PDF, TXT, DOCX`,
                        code: "UNSUPPORTED_CONVERSION"
                    },
                    { status: 400 }
                );
            }
        }
        else {
            return NextResponse.json(
                { 
                    error: "Unsupported file type for document conversion. Supported types are: PDF, DOCX, TXT, RTF",
                    code: "UNSUPPORTED_FILE_TYPE"
                },
                { status: 400 }
            );
        }

        // Return the converted file
        const headers = new Headers();
        headers.set("Content-Type", contentType);
        headers.set("Content-Disposition", `attachment; filename="${outputFilename}"`);

        return new NextResponse(convertedBuffer as any, {
            status: 200,
            headers,
        });
    } catch (error: any) {
        console.error("Document conversion error:", error);
        
        // Provide user-friendly error messages
        if (error.message?.includes("timeout") || error.code === "ETIMEDOUT") {
            return NextResponse.json(
                { 
                    error: "Conversion timed out. The document might be too large or complex. Please try a smaller file.",
                    code: "TIMEOUT"
                },
                { status: 504 }
            );
        }
        
        if (error.message?.includes("memory") || error.message?.includes("too large")) {
            return NextResponse.json(
                { 
                    error: "Document is too large to process. Please use a smaller file.",
                    code: "MEMORY_ERROR"
                },
                { status: 413 }
            );
        }
        
        return NextResponse.json(
            { 
                error: "Failed to convert document. Please ensure the file is a valid document format and try again.",
                code: "CONVERSION_ERROR",
                details: process.env.NODE_ENV === "development" ? error.message : undefined
            },
            { status: 500 }
        );
    }
}
