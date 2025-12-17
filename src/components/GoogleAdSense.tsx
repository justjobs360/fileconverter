"use client";

import Script from "next/script";

type AdSenseProps = {
    slot: string;
    style?: React.CSSProperties;
    format?: "auto" | "fluid" | "rectangle";
    responsive?: boolean;
};

const GoogleAdSense = ({ slot, style, format = "auto", responsive = true }: AdSenseProps) => {
    const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

    if (!clientId) {
        return null; // Or return a placeholder in dev
    }

    return (
        <div className="adsense-container my-4 text-center overflow-hidden">
            <Script
                async
                src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
                crossOrigin="anonymous"
                strategy="afterInteractive"
            />

            {/* Ad Unit */}
            <ins
                className="adsbygoogle block"
                style={style || { display: "block" }}
                data-ad-client={clientId}
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive={responsive ? "true" : "false"}
            />

            <Script id={`adsense-init-${slot}`} strategy="afterInteractive">
                {`(adsbygoogle = window.adsbygoogle || []).push({});`}
            </Script>
        </div>
    );
};

export default GoogleAdSense;
