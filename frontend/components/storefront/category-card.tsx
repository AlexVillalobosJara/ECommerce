import Link from "next/link"
import type { Category } from "@/types/product"
import { getImageUrl } from "@/lib/image-utils"

interface CategoryCardProps {
    category: Category
    className?: string
}

export function CategoryCard({ category, className = "" }: CategoryCardProps) {
    return (
        <Link
            href={`/category/${category.slug}`}
            className={`group relative block overflow-hidden rounded-lg bg-muted transition-all hover:shadow-lg ${className}`}
        >
            {/* Image */}
            <div className="aspect-[4/3] overflow-hidden">
                <img
                    src={getImageUrl(category.image_url)}
                    alt={category.name}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-6">
                <h3 className="text-2xl font-semibold text-white">{category.name}</h3>
                <p className="mt-1 text-sm text-white/80">{category.product_count} productos</p>
            </div>
        </Link>
    )
}
