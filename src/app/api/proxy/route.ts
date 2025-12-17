import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json(
                { error: "URL is required" },
                { status: 400 }
            );
        }

        const response = await fetch(url);

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch URL: ${response.statusText}` },
                { status: response.status }
            );
        }

        const contentType = response.headers.get("content-type");
        const buffer = await response.arrayBuffer();

        // We determine filename from URL or header?
        // Let client handle filename guessing usually, but we can try Content-Disposition
        const contentDisposition = response.headers.get("content-disposition");

        // Return the blob
        const headers = new Headers();
        if (contentType) headers.set("Content-Type", contentType);
        if (contentDisposition) headers.set("Content-Disposition", contentDisposition);

        return new NextResponse(buffer, {
            status: 200,
            headers
        });

    } catch (error) {
        console.error("Proxy error:", error);
        return NextResponse.json(
            { error: "Failed to fetch remote file" },
            { status: 500 }
        );
    }
}
