"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Header } from "@/components/storefront/header"
import { Footer } from "@/components/storefront/footer"
import { OrderSummary } from "@/components/storefront/order-summary"
import { CheckoutSkeleton } from "@/components/storefront/checkout-skeleton"
import { useTenant } from "@/contexts/TenantContext"
import { useCart } from "@/hooks/useCart"
import { storefrontApi, type OrderCreate } from "@/services/storefront-api"
import { FileText, Loader2, TicketPercent, ChevronLeft, Calendar } from "lucide-react"
import { formatPrice } from "@/lib/format-price"
import { trackBeginCheckout } from "@/lib/analytics"
import { getEstimatedShippingDate, formatEstimatedDate, formatDateForBackend } from "@/lib/shipping-utils"

export default function CheckoutPage() {
    const router = useRouter()
    const { tenant, loading: tenantLoading } = useTenant()
    const [initialLoading, setInitialLoading] = useState(true)
    const { purchaseItems, quoteItems, getTotalItems, mounted, clearCart } = useCart()
    const [freshLeadTimes, setFreshLeadTimes] = useState<Record<string, number>>({})

    // Simulated loading delay for development
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            const timer = setTimeout(() => setInitialLoading(false), 2000)
            return () => clearTimeout(timer)
        } else {
            setInitialLoading(false)
        }
    }, [])


    const [loading, setLoading] = useState(false)
    const [calculatingShipping, setCalculatingShipping] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [shippingError, setShippingError] = useState<string | null>(null)
    const [termsAccepted, setTermsAccepted] = useState(false)

    // Dynamic location data
    const [regionsData, setRegionsData] = useState<any[]>([])
    const [availableCommunes, setAvailableCommunes] = useState<any[]>([])

    // Shipping calculation
    const [shippingCost, setShippingCost] = useState(0)
    const [shippingZoneId, setShippingZoneId] = useState<string | null>(null)
    const [shippingMethodName, setShippingMethodName] = useState<string>("")
    const [allowsStorePickup, setAllowsStorePickup] = useState(false)
    const [isStorePickup, setIsStorePickup] = useState(false)

    // Coupon State
    const [couponCode, setCouponCode] = useState("")
    const [discountAmount, setDiscountAmount] = useState(0)
    const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [validatingCoupon, setValidatingCoupon] = useState(false)

    // Billing Type
    const [wantsFactura, setWantsFactura] = useState(false)

    // Determine if this is a quote-only request
    const isQuoteOnly = quoteItems.length > 0 && purchaseItems.length === 0

    const [formData, setFormData] = useState({
        email: "",
        phone: "",
        firstName: "",
        lastName: "",
        company: "",
        address: "",
        apartment: "",
        commune: "", // Stores commune CODE
        communeName: "", // Stores commune NAME for order record
        city: "", // Can be mapped from commune/region
        region: "", // Stores region CODE
        regionName: "", // Stores region NAME
        notes: "",
        // Factura fields
        billingBusinessName: "",
        billingBusinessGiro: "",
        billingTaxId: "",
    })

    // Lead Time Sync: Fetch latest product data to ensure calculation is NOT stale
    useEffect(() => {
        if (!tenant || !mounted) return;

        const syncLeadTimes = async () => {
            const allItems = [...purchaseItems, ...quoteItems];
            const newLeadTimes: Record<string, number> = {};

            for (const item of allItems) {
                try {
                    // We use getProduct to get the latest min_shipping_days
                    const product = await storefrontApi.getProduct(tenant.slug, item.product.slug);
                    newLeadTimes[item.product.id] = Number(product.min_shipping_days) || 0;
                } catch (err) {
                    console.error(`Failed to sync lead time for ${item.product.name}:`, err);
                    newLeadTimes[item.product.id] = Number(item.product.min_shipping_days) || 0;
                }
            }
            setFreshLeadTimes(newLeadTimes);
        };

        syncLeadTimes();
        syncLeadTimes();
    }, [tenant, mounted, purchaseItems, quoteItems]); // Re-run when items change or load

    // Load regions and communes
    useEffect(() => {
        const loadLocations = async () => {
            if (regionsData.length > 0 && !formData.region) return
            try {
                const data = await storefrontApi.getCommunesByRegion()
                setRegionsData(data)

                if (formData.region) {
                    const selectedRegion = data.find((r: any) => r.region_code === formData.region)
                    if (selectedRegion) {
                        setAvailableCommunes(selectedRegion.communes)
                    }
                }
            } catch (err) {
                console.error("Failed to load locations:", err)
            }
        }
        loadLocations()
    }, [formData.region])

    // Calculate totals
    const subtotal = purchaseItems.reduce((sum, item) => {
        return sum + parseFloat(item.variant.selling_price || "0") * item.quantity
    }, 0)

    // Tax Logic
    const taxRate = tenant?.tax_rate ? tenant.tax_rate / 100 : 0
    let tax = 0
    let total = 0

    if (tenant?.prices_include_tax) {
        tax = subtotal * (1 - (1 / (1 + taxRate)))
        total = Math.max(0, subtotal + (isStorePickup ? 0 : shippingCost) - discountAmount)
    } else {
        tax = subtotal * taxRate
        total = Math.max(0, subtotal + tax + (isStorePickup ? 0 : shippingCost) - discountAmount)
    }

    // Track begin_checkout when purchaseItems are available
    useEffect(() => {
        if (mounted && purchaseItems.length > 0) {
            trackBeginCheckout(purchaseItems, subtotal + tax)
        }
    }, [mounted, purchaseItems, subtotal, tax])

    const formatRut = (value: string) => {
        const raw = value.replace(/[^0-9kK]/g, '').toUpperCase();
        if (!raw) return '';

        const clean = raw.slice(0, 9);
        if (clean.length <= 1) return clean;

        const dv = clean.slice(-1);
        const rest = clean.slice(0, -1);

        const dotted = rest.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return `${dotted}-${dv}`;
    };

    const updateField = (field: string, value: string) => {
        let finalValue = value;
        if (field === "billingTaxId") {
            finalValue = formatRut(value);
        }
        setFormData((prev) => ({ ...prev, [field]: finalValue }))
    }

    // Helper to calculate estimated shipping date
    const estimatedDate = getEstimatedShippingDate({
        shippingWorkdays: tenant?.shipping_workdays,
        minShippingDays: purchaseItems.length > 0
            ? Math.max(...purchaseItems.map(item => {
                const fresh = freshLeadTimes[item.product.id];
                return fresh !== undefined ? fresh : (Number(item.product.min_shipping_days) || 0);
            }), 0)
            : 0,
    });

    const handleRegionChange = (regionCode: string) => {
        const region = regionsData.find(r => r.region_code === regionCode)
        if (region) {
            setFormData(prev => ({
                ...prev,
                region: regionCode,
                regionName: region.region_name,
                commune: "", // Reset commune
                communeName: "",
                city: region.region_name // Approximate city as region for now
            }))
            setAvailableCommunes(region.communes)
            setShippingCost(0)
            setShippingZoneId(null)
            setShippingMethodName("")
            setShippingError(null)
        }
    }

    const handleCommuneChange = async (communeCode: string) => {
        const commune = availableCommunes.find(c => c.code === communeCode)
        if (!commune) return

        setFormData(prev => ({
            ...prev,
            commune: communeCode,
            communeName: commune.name,
            city: commune.name
        }))

        // Calculate shipping immediately if not a quote
        if (!isQuoteOnly && tenant) {
            setCalculatingShipping(true)
            setShippingError(null)
            try {
                const result = await storefrontApi.calculateShipping(
                    tenant.slug,
                    communeCode,
                    5, // Default weight 5kg for now
                    subtotal
                )
                setShippingCost(parseFloat(result.cost.toString()))
                setShippingZoneId(result.zone_id)
                setShippingMethodName(result.zone_name)
                setAllowsStorePickup(result.allows_store_pickup)

                // Auto-disable pickup if it's no longer allowed for this commune
                if (!result.allows_store_pickup) {
                    setIsStorePickup(false)
                }
            } catch (err) {
                console.error("Shipping calc error:", err)
                setShippingCost(0)
                setShippingZoneId(null)
                setShippingMethodName("")
                setShippingError("No hay cobertura de envío a domicilio para esta comuna.")

                // Even if no shipping coverage, check if we should still allow pickup
                // For now, if the tenant has an address, we can assume pickup might be possible 
                // or we could check a global tenant setting.
                if (tenant.address) {
                    setAllowsStorePickup(true)
                }
            } finally {
                setCalculatingShipping(false)
            }
        }
    }

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return
        setValidatingCoupon(true)
        setCouponMessage(null)
        try {
            const result = await storefrontApi.validateCoupon(couponCode, subtotal)

            if (result.valid) {
                setDiscountAmount(result.discount_amount)
                setCouponMessage({ type: 'success', text: `Cupón aplicado: -${formatPrice(result.discount_amount, tenant)}` })
            } else {
                setDiscountAmount(0)
                setCouponMessage({ type: 'error', text: result.message || "Cupón inválido" })
            }
        } catch (error) {
            setDiscountAmount(0)
            setCouponMessage({ type: 'error', text: "Error al validar cupón" })
        } finally {
            setValidatingCoupon(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!tenant) {
            setError("Tenant no encontrado")
            return
        }

        const allItems = [...purchaseItems, ...quoteItems]
        if (allItems.length === 0) {
            setError("El carrito está vacío")
            return
        }

        if (!isQuoteOnly && !isStorePickup && !shippingZoneId && !shippingMethodName) {
            setError("No hemos encontrado opción de envío para esta comuna. Contáctanos.")
            return
        }

        if (!termsAccepted) {
            setError("Debes aceptar los términos y condiciones para continuar.")
            return
        }

        setLoading(true)
        setError(null)

        try {
            const orderType = isQuoteOnly ? "Quote" : "Sale"

            const orderData: OrderCreate = {
                order_type: orderType,
                customer_email: formData.email,
                customer_phone: formData.phone,
                first_name: formData.firstName,
                last_name: formData.lastName,
                shipping_recipient_name: `${formData.firstName} ${formData.lastName}`,
                shipping_phone: formData.phone,
                shipping_street_address: formData.address,
                shipping_apartment: formData.apartment,
                shipping_commune: formData.communeName,
                shipping_city: formData.city,
                shipping_region: formData.regionName,
                is_store_pickup: isStorePickup,
                items: allItems.map((item) => ({
                    product_variant_id: item.variant.id,
                    quantity: item.quantity,
                })),
                customer_notes: formData.notes,
                shipping_zone_id: shippingZoneId || undefined,
                shipping_method: shippingMethodName,
                coupon_code: discountAmount > 0 ? couponCode : undefined,
                // Chilean Billing
                billing_type: wantsFactura ? "Factura" : "Boleta",
                billing_business_name: wantsFactura ? formData.billingBusinessName : undefined,
                billing_business_giro: wantsFactura ? formData.billingBusinessGiro : undefined,
                billing_tax_id: wantsFactura ? formData.billingTaxId : undefined,
                estimated_delivery_date: estimatedDate ? formatDateForBackend(estimatedDate) : undefined,
            }

            const order = await storefrontApi.createOrder(tenant.slug, orderData)

            // CLEAR CART on success
            clearCart()

            if (orderType === "Quote") {
                router.push(`/checkout/success?order=${order.order_number}&id=${order.id}&tenant=${tenant.slug}`)
            } else {
                router.push(`/payment?order=${order.id}`)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al crear la orden")
            console.error("Order creation error:", err)
        } finally {
            setLoading(false)
        }
    }

    if (tenantLoading || loading || initialLoading || !mounted) {
        return <CheckoutSkeleton />
    }

    return (
        <div className="flex min-h-screen flex-col">
            <Header categories={[]} />

            <main className="flex-1 bg-secondary/30">
                <div className="container mx-auto px-4 py-12 lg:py-16">
                    <div className="mb-12 text-center relative">
                        <Button
                            variant="ghost"
                            className="absolute left-0 top-1/2 -translate-y-1/2 gap-2 hidden lg:flex"
                            onClick={() => router.back()}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Volver
                        </Button>
                        <h1 className="font-serif text-4xl font-normal tracking-tight text-foreground lg:text-5xl">
                            {isQuoteOnly ? "Solicitud de Cotización" : "Finalizar Compra"}
                        </h1>
                        <p className="mt-4 text-muted-foreground">
                            {isQuoteOnly
                                ? "Complete sus datos de contacto y dirección de envío para calcular el costo de envío en su cotización"
                                : "Complete sus datos para procesar su pedido"
                            }
                        </p>
                    </div>

                    {error && (
                        <div className="mx-auto mb-6 max-w-7xl rounded-lg bg-red-50 p-4 text-red-800">
                            {error}
                        </div>
                    )}

                    <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr,420px]">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <Card className="border-border bg-white p-6 lg:p-8">
                                <h2 className="mb-6 font-serif text-2xl font-normal tracking-tight">Información de Contacto</h2>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="email" className="text-sm font-medium">
                                            Correo Electrónico *
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            required
                                            placeholder="su@correo.com"
                                            value={formData.email}
                                            onChange={(e) => updateField("email", e.target.value)}
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="phone" className="text-sm font-medium">Teléfono *</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            required
                                            placeholder="+56 9 1234 5678"
                                            value={formData.phone}
                                            onChange={(e) => updateField("phone", e.target.value)}
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <Label htmlFor="firstName" className="text-sm font-medium">Nombre *</Label>
                                            <Input
                                                id="firstName"
                                                required
                                                value={formData.firstName}
                                                onChange={(e) => updateField("firstName", e.target.value)}
                                                className="mt-1.5"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="lastName" className="text-sm font-medium">Apellido *</Label>
                                            <Input
                                                id="lastName"
                                                required
                                                value={formData.lastName}
                                                onChange={(e) => updateField("lastName", e.target.value)}
                                                className="mt-1.5"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="company" className="text-sm font-medium">Empresa (Opcional)</Label>
                                        <Input
                                            id="company"
                                            value={formData.company}
                                            onChange={(e) => updateField("company", e.target.value)}
                                            className="mt-1.5"
                                        />
                                    </div>
                                </div>
                            </Card>

                            <Card className="border-border bg-white p-6 lg:p-8">
                                <h2 className="mb-6 font-serif text-2xl font-normal tracking-tight">Dirección de Envío</h2>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="address" className="text-sm font-medium">Dirección {isStorePickup ? "(Opcional)" : "*"}</Label>
                                        <Input
                                            id="address"
                                            required={!isStorePickup}
                                            value={formData.address}
                                            onChange={(e) => updateField("address", e.target.value)}
                                            className="mt-1.5"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="apartment" className="text-sm font-medium">Depto/Oficina (Opcional)</Label>
                                        <Input
                                            id="apartment"
                                            value={formData.apartment}
                                            onChange={(e) => updateField("apartment", e.target.value)}
                                            className="mt-1.5"
                                        />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <Label htmlFor="region" className="text-sm font-medium">Región {isStorePickup ? "(Opcional)" : "*"}</Label>
                                            <Select value={formData.region} onValueChange={handleRegionChange}>
                                                <SelectTrigger id="region" className="mt-1.5">
                                                    <SelectValue placeholder="Seleccionar región" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {regionsData.map((region) => (
                                                        <SelectItem key={region.region_code} value={region.region_code}>
                                                            {region.region_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="commune" className="text-sm font-medium">Comuna {isStorePickup ? "(Opcional)" : "*"}</Label>
                                            <Select value={formData.commune} onValueChange={handleCommuneChange} disabled={!formData.region && !isStorePickup}>
                                                <SelectTrigger id="commune" className="mt-1.5">
                                                    <SelectValue placeholder="Seleccionar comuna" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableCommunes.map((comuna) => (
                                                        <SelectItem key={comuna.code} value={comuna.code}>
                                                            {comuna.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {calculatingShipping && (
                                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                    <Loader2 className="h-3 w-3 animate-spin" /> Calculando envío...
                                                </p>
                                            )}
                                            {shippingError && (
                                                <p className="text-xs text-red-600 mt-1">{shippingError}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="border-border bg-white p-6 lg:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <FileText className="w-5 h-5 text-muted-foreground" />
                                    <h2 className="font-serif text-2xl font-normal tracking-tight">
                                        {isQuoteOnly ? "Detalles de su Solicitud" : "Notas Adicionales"}
                                    </h2>
                                </div>
                                <div>
                                    <Label htmlFor="notes" className="text-sm font-medium">
                                        {isQuoteOnly ? "Describa sus necesidades" : "Instrucciones especiales (Opcional)"}
                                    </Label>
                                    <Textarea
                                        id="notes"
                                        value={formData.notes}
                                        onChange={(e) => updateField("notes", e.target.value)}
                                        className="mt-1.5 min-h-[120px] resize-none"
                                    />
                                </div>
                            </Card>

                            {allowsStorePickup && !isQuoteOnly && (
                                <Card className="border-border bg-white p-6 lg:p-8">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h2 className="font-serif text-2xl font-normal tracking-tight">Retiro en Tienda</h2>
                                            <p className="text-sm text-muted-foreground">Retira tu pedido directamente en nuestro local sin costo de envío</p>
                                        </div>
                                        <Switch
                                            checked={isStorePickup}
                                            onCheckedChange={setIsStorePickup}
                                        />
                                    </div>
                                    {isStorePickup && (
                                        <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                                            <p className="text-sm font-medium text-primary">Dirección de retiro:</p>
                                            <p className="text-sm text-muted-foreground">{tenant?.address || "Avenida Providencia 1234, Santiago"}</p>
                                        </div>
                                    )}
                                </Card>
                            )}

                            {estimatedDate && !isQuoteOnly && (
                                <Card className="border-border bg-white p-6 lg:p-8">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-primary/10 rounded-full">
                                            <Calendar className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-lg">Fecha estimada de entrega</h3>
                                            <p className="text-muted-foreground mt-1">
                                                Tu pedido estará listo aproximadamente para él:
                                            </p>
                                            <p className="text-xl font-semibold text-primary mt-2 capitalize">
                                                {formatEstimatedDate(estimatedDate)}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-2 italic">
                                                * El tiempo de entrega puede variar según la demanda.
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            <Card className="border-border bg-white p-6 lg:p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="space-y-1">
                                        <h2 className="font-serif text-2xl font-normal tracking-tight">Tipo de Documento</h2>
                                        <p className="text-sm text-muted-foreground">Elija si necesita Boleta o Factura</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div
                                        onClick={() => setWantsFactura(false)}
                                        className={`cursor-pointer p-4 rounded-lg border-2 transition-all text-center ${!wantsFactura ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                                    >
                                        <p className="font-semibold">Boleta</p>
                                        <p className="text-xs text-muted-foreground mt-1">Consumidor Final</p>
                                    </div>
                                    <div
                                        onClick={() => setWantsFactura(true)}
                                        className={`cursor-pointer p-4 rounded-lg border-2 transition-all text-center ${wantsFactura ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                                    >
                                        <p className="font-semibold">Factura</p>
                                        <p className="text-xs text-muted-foreground mt-1">Empresas (IVA)</p>
                                    </div>
                                </div>

                                {wantsFactura && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div>
                                            <Label htmlFor="billingTaxId" className="text-sm font-medium">RUT Empresa *</Label>
                                            <Input
                                                id="billingTaxId"
                                                required={wantsFactura}
                                                placeholder="12.345.678-9"
                                                value={formData.billingTaxId}
                                                onChange={(e) => updateField("billingTaxId", e.target.value)}
                                                className="mt-1.5"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="billingBusinessName" className="text-sm font-medium">Razón Social *</Label>
                                            <Input
                                                id="billingBusinessName"
                                                required={wantsFactura}
                                                placeholder="Mi Empresa S.A."
                                                value={formData.billingBusinessName}
                                                onChange={(e) => updateField("billingBusinessName", e.target.value)}
                                                className="mt-1.5"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="billingBusinessGiro" className="text-sm font-medium">Giro Comercial *</Label>
                                            <Input
                                                id="billingBusinessGiro"
                                                required={wantsFactura}
                                                placeholder="Venta de artículos..."
                                                value={formData.billingBusinessGiro}
                                                onChange={(e) => updateField("billingBusinessGiro", e.target.value)}
                                                className="mt-1.5"
                                            />
                                        </div>
                                        <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-100 italic">
                                            * Los datos de facturación serán validados antes de emitir el documento.
                                        </p>
                                    </div>
                                )}
                            </Card>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="terms"
                                    checked={termsAccepted}
                                    onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                                />
                                <label
                                    htmlFor="terms"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Acepto los <a href="/terms" target="_blank" className="underline text-primary">términos y condiciones</a> y la política de privacidad.
                                </label>
                            </div>

                            <Button
                                type="submit"
                                size="lg"
                                disabled={loading || calculatingShipping}
                                className="w-full py-6 text-base font-medium"
                            >
                                {loading
                                    ? "Procesando..."
                                    : isQuoteOnly
                                        ? "Enviar Solicitud de Cotización"
                                        : "Continuar al Pago"
                                }
                            </Button>
                        </form>

                        <div>
                            {/* Coupon Input */}
                            {!isQuoteOnly && (
                                <Card className="mb-6 border-border bg-white p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <TicketPercent className="w-5 h-5 text-muted-foreground" />
                                        <h2 className="font-serif text-lg font-normal tracking-tight">Código de Descuento</h2>
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Ingresa tu código"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(); } }}
                                        />
                                        <Button
                                            onClick={(e) => { e.preventDefault(); handleApplyCoupon(); }}
                                            disabled={validatingCoupon || !couponCode}
                                            variant="outline"
                                        >
                                            {validatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                                        </Button>
                                    </div>
                                    {couponMessage && (
                                        <p className={`text-sm mt-2 ${couponMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                                            {couponMessage.text}
                                        </p>
                                    )}
                                </Card>
                            )}

                            <OrderSummary
                                purchaseItems={purchaseItems}
                                quoteItems={quoteItems}
                                subtotal={subtotal}
                                shipping={isStorePickup ? 0 : shippingCost}
                                tax={tax}
                                discount={discountAmount}
                                total={total}
                            />
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
