import type { ProductList } from "@/types/product"
import { ProductCard } from "./product-card"

interface ProductGridProps {
    products: ProductList[]
    onAddToCart?: (product: ProductList) => void
    onRequestQuote?: (product: ProductList) => void
    className?: string
}

export function ProductGrid({ products, onAddToCart, onRequestQuote, className = "" }: ProductGridProps) {
    return (
        <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className}`}>
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={onAddToCart}
                    onRequestQuote={onRequestQuote}
                />
            ))}
        </div>
    )
}
