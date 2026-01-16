"use client"

import Script from 'next/script'

interface GoogleAnalyticsProps {
    measurementId: string
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
    if (!measurementId || !measurementId.startsWith('G-')) {
        return null
    }

    return (
        <>
            {/* Google Analytics gtag.js */}
            <Script
                strategy="lazyOnload"
                src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
            />

            {/* GA4 Configuration */}
            <Script
                id="ga4-config"
                strategy="lazyOnload"
                dangerouslySetInnerHTML={{
                    __html: `
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', '${measurementId}', {
                            page_path: window.location.pathname,
                        });
                    `,
                }}
            />
        </>
    )
}
