import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { ConditionalTenantProvider } from "@/components/conditional-tenant-provider";
import { Toaster } from "@/components/ui/sonner";
import { MarketingScripts } from "@/components/marketing/marketing-scripts";
import { getTenantIdentifier } from "@/lib/tenant";
import { storefrontApi } from "@/services/storefront-api";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "E-commerce Store",
  description: "Multi-tenant e-commerce platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get tenant marketing config for analytics (only for storefront)
  let marketingConfig = null;
  try {
    const headersList = await headers();
    const host = headersList.get("host") || "";
    const identifier = getTenantIdentifier(host);

    // Try to load marketing config, will fail gracefully for admin routes
    if (identifier) {
      const data = await storefrontApi.getHomeData({
        slug: identifier.slug,
        domain: identifier.domain,
      });
      marketingConfig = data.tenant?.marketing_config || null;
    }
  } catch (error) {
    // Silently fail if marketing config can't be loaded (e.g., admin routes)
    // This is expected behavior for admin pages
  }

  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <MarketingScripts config={marketingConfig} />
        <ConditionalTenantProvider>
          {children}
        </ConditionalTenantProvider>
        <Toaster />
      </body>
    </html>
  );
}
