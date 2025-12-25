import { Tenant } from "@/types/tenant"

/**
 * Formats a price number or string according to tenant configuration or fallback defaults.
 * 
 * @param amount - The price to format (number or string)
 * @param tenant - The tenant configuration object (optional)
 * @returns Formatted price string
 */
export function formatPrice(amount: number | string | null | undefined, tenant?: Tenant | null): string {
    if (amount === null || amount === undefined) return ""

    const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount

    if (isNaN(numericAmount)) return ""

    // Tenant configuration with fallbacks
    const currency = "CLP" // Default currency, could be from tenant if added later
    const locale = "es-CL" // Default locale

    // Explicit tenant settings
    const decimalPlaces = tenant?.decimal_places ?? 0
    const thousandsSeparator = tenant?.thousands_separator || "."
    const decimalSeparator = tenant?.decimal_separator || ","

    try {
        const num = numericAmount
        const fixed = num.toFixed(decimalPlaces)
        const parts = fixed.split(".")

        const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator)

        // Build result
        let result = `$${intPart}`

        if (decimalPlaces > 0 && parts.length > 1) {
            result += `${decimalSeparator}${parts[1]}`
        }

        return result
    } catch (e) {
        // Fallback
        return `$${numericAmount.toFixed(decimalPlaces)}`
    }
}
