import { NextRequest, NextResponse } from "next/server"

/**
 * Next.js Route Handler for /payment/callback
 * Handles POST requests from payment gateways (like Flow)
 * and redirects to the GET version of the same page to avoid 405 errors.
 */
export async function POST(request: NextRequest) {
    try {
        console.log("POST /payment/callback received")

        // Extract data from the request body
        const formData = await request.formData()
        const token = formData.get("token")

        // Extract query parameters
        const { searchParams } = new URL(request.url)
        const orderId = searchParams.get("order")
        const tenant = searchParams.get("tenant")

        console.log("Callback details:", { orderId, tenant, hasToken: !!token })

        // Build the redirect URL
        const redirectUrl = new URL("/payment/callback", request.url)

        if (orderId) redirectUrl.searchParams.set("order", orderId)
        if (tenant) redirectUrl.searchParams.set("tenant", tenant)
        if (token) redirectUrl.searchParams.set("token", token.toString())

        // Perform a clean GET redirect
        return NextResponse.redirect(redirectUrl.toString(), {
            status: 303, // See Other (forces a GET request)
        })
    } catch (error) {
        console.error("Error in Payment Callback Route Handler:", error)
        // Fallback to home if everything fails
        return NextResponse.redirect(new URL("/", request.url))
    }
}

// Ensure GET requests still fall back to the standard page strategy
// (though Next.js usually handles this if page.tsx exists)
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    return NextResponse.redirect(new URL(`/payment/callback?${searchParams.toString()}`, request.url))
}
