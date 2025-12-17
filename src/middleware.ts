import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Configuration
// In a real app, use Upstash Rate Limit
// import { Ratelimit } from "@upstash/ratelimit";
// import { Redis } from "@upstash/redis";

export function middleware(request: NextRequest) {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";

    // Simple "Block List" or basic check
    // For MVP, we just ensure simple validity.

    // Rate Limiting Placeholder
    // if (tooManyRequests(ip)) {
    //   return new NextResponse("Too Many Requests", { status: 429 });
    // }

    const response = NextResponse.next();

    // Security Headers
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    return response;
}

export const config = {
    matcher: "/api/:path*",
};
