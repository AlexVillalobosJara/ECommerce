"use client"

import { ShoppingCart } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ProductList } from "@/types/product"
import { StarRating } from "@/components/ui/star-rating"
import { useTenant } from "@/contexts/TenantContext"
import { formatPrice } from "@/lib/format-price"

interface ProductCardProps {
    product: ProductList
    onAddToCart?: (product: ProductList) => void
    onRequestQuote?: (product: ProductList) => void
    className?: string
    aspectRatio?: "portrait" | "square"
}

export function ProductCard({ product, onAddToCart, onRequestQuote, className, aspectRatio = "portrait" }: ProductCardProps) {
    const router = useRouter()
    const { tenant } = useTenant()

    const handleAction = (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent navigation when clicking action button
        // Always navigate to detail page for consistent UX
        router.push(`/products/${product.slug}`)
    }

    const handleCardClick = () => {
        router.push(`/products/${product.slug}`)
    }

    return (
        <div
            onClick={handleCardClick}
            className={cn(
                "group relative overflow-hidden transition-all cursor-pointer",
                !product.in_stock && "opacity-60",
                className
            )}
        >
            {/* Image Container */}
            <div className={cn(
                "relative overflow-hidden bg-muted",
                aspectRatio === "portrait" ? "aspect-[3/4]" : "aspect-square"
            )}>
                <img
                    src={product.primary_image ? `http://localhost:8000${product.primary_image}` : "/placeholder.svg"}
                    alt={product.name}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Stock Badge */}
                {!product.in_stock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                        <span className="rounded-sm bg-foreground px-4 py-2 text-sm font-medium text-background">Agotado</span>
                    </div>
                )}

                {/* Hover Action Button */}
                {product.in_stock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/10 group-hover:opacity-100">
                        <Button
                            onClick={handleAction}
                            size="default"
                            className="scale-90 transition-transform group-hover:scale-100"
                        >
                            <span className="text-sm font-medium">Ver producto</span>
                        </Button>
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="mt-4 space-y-2">
                <h3 className="text-pretty text-lg font-medium tracking-tight">{product.name}</h3>

                {/* Rating */}
                {tenant?.show_product_ratings && parseFloat(product.average_rating || "0") > 0 && (
                    <div className="flex items-center gap-1">
                        <StarRating rating={parseFloat(product.average_rating || "0")} size={14} />
                        <span className="text-xs text-muted-foreground">({product.review_count})</span>
                    </div>
                )}


                <div className="flex items-center justify-between">
                    {!product.is_quote_only && product.min_price ? (
                        <div className="flex items-baseline gap-2">
                            {product.min_price !== product.max_price && product.max_price && (
                                <p className="text-sm text-muted-foreground line-through">
                                    {formatPrice(product.max_price, tenant)}
                                </p>
                            )}
                            <p className={cn(
                                "text-lg font-semibold",
                                product.min_price !== product.max_price && product.max_price && "text-destructive"
                            )}>
                                {formatPrice(product.min_price, tenant)}
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Precio por cotización</p>
                    )}

                    {product.variants_count > 1 && (
                        <p className="text-xs text-muted-foreground">{product.variants_count} variantes</p>
                    )}
                </div>
            </div>
        </div>
    )
}
