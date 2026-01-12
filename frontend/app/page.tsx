import { headers } from "next/headers"
import { storefrontApi } from "@/services/storefront-api"
import { getTenantIdentifier } from "@/lib/tenant"
import { StorefrontClientPage } from "@/components/storefront/storefront-client-page"
import { Metadata } from "next"

// Dynamic rendering for SaaS
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const host = headersList.get("host") || ""
  const identifier = getTenantIdentifier(host)

  if (!identifier) {
    return { title: "Tienda no encontrada" }
  }

  try {
    const data = await storefrontApi.getHomeData({
      slug: identifier.slug,
      domain: identifier.domain
    })
    return {
      title: data.tenant.name || "Tienda Virtual",
      description: data.tenant.hero_subtitle || "Nuestra colección exclusiva",
    }
  } catch (e) {
    return {
      title: "Tienda no encontrada",
    }
  }
}

export default async function Page() {
  const headersList = await headers()
  const host = headersList.get("host") || ""

  // 1. Resolve tenant from hostname
  const identifier = getTenantIdentifier(host)

  if (!identifier || (!identifier.slug && !identifier.domain)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold">Tienda no configurada</h1>
        <p className="mt-2 text-muted-foreground">Por favor acceda vía subdominio o dominio personalizado.</p>
      </div>
    )
  }

  try {
    // 2. Atomically fetch all home data on the server
    const homeData = await storefrontApi.getHomeData({
      slug: identifier.slug,
      domain: identifier.domain
    })

    // 3. Render the client shell with pre-loaded data
    return <StorefrontClientPage initialData={homeData} />
  } catch (error) {
    console.error("SSR Error:", error)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold">Tienda no encontrada o error de conexión</h1>
        <p className="mt-2 text-muted-foreground">No pudimos cargar la información de la tienda "{identifier.slug || identifier.domain}".</p>
      </div>
    )
  }
}
