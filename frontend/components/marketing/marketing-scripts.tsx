"use client"

import { GoogleTagManager } from './google-tag-manager'
import { GoogleAnalytics } from './google-analytics'

interface MarketingScriptsProps {
    config: {
        gtm_container_id?: string | null
        ga4_measurement_id?: string | null
    } | null
}

export function MarketingScripts({ config }: MarketingScriptsProps) {
    if (!config) {
        return null
    }

    return (
        <>
            {config.gtm_container_id && (
                <GoogleTagManager containerId={config.gtm_container_id} />
            )}

            {config.ga4_measurement_id && (
                <GoogleAnalytics measurementId={config.ga4_measurement_id} />
            )}
        </>
    )
}
