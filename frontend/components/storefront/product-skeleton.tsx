import { Skeleton } from "@/components/ui/skeleton"

export function ProductCardSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="aspect-[3/4] w-full rounded-lg" />
            <div className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
            </div>
        </div>
    )
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    )
}
