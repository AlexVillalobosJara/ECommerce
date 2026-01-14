/**
 * Utility to calculate estimated shipping dates based on tenant business rules
 * and product preparation times (lead times).
 */

export function getEstimatedShippingDate(params: {
    shippingWorkdays: number[] | undefined,
    minShippingDays: number,
    baseDate?: Date
}): Date | null {
    const { shippingWorkdays, minShippingDays, baseDate = new Date() } = params;

    if (!shippingWorkdays || shippingWorkdays.length === 0) return null;

    const date = new Date(baseDate);
    date.setHours(0, 0, 0, 0); // Normalize to start of day

    // 1. Add preparation lead time (business days)
    let preparationDaysAdded = 0;
    while (preparationDaysAdded < minShippingDays) {
        date.setDate(date.getDate() + 1);
        const day = date.getDay();
        // preparation usually happens on standard business days (Mon-Fri)
        if (day !== 0 && day !== 6) {
            preparationDaysAdded++;
        }
    }

    // 2. Find the next valid shipping day defined by the tenant
    const isShippingDay = (jsDay: number) => {
        // JS: 0=Sun, 1=Mon ... 6=Sat
        // Backend: 0=Mon, 1=Tue ... 6=Sun
        const backendDay = jsDay === 0 ? 6 : jsDay - 1;
        return shippingWorkdays.some(d => Number(d) === backendDay);
    };

    let iterations = 0;
    // Don't loop more than 14 days to prevent infinite loop if config is weird
    while (!isShippingDay(date.getDay()) && iterations < 14) {
        date.setDate(date.getDate() + 1);
        iterations++;
    }

    return date;
}

export function formatEstimatedDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Formats a Date object to YYYY-MM-DD for backend consumption
 */
export function formatDateForBackend(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
