import { Skeleton } from "@/components/ui/skeleton"
import { ProductGridSkeleton } from "./product-skeleton"

export function ProductDetailsSkeleton() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header Placeholder */}
            <div className="h-16 border-b" />

            <main className="container mx-auto px-4 py-12 pt-16">
                {/* Back Button Skeleton */}
                <div className="mb-8">
                    <Skeleton className="h-10 w-32" />
                </div>

                {/* Product Main Section Skeleton */}
                <div className="grid gap-12 lg:grid-cols-2">
                    {/* Image Gallery Skeleton */}
                    <div className="space-y-4">
                        <Skeleton className="aspect-square w-full rounded-lg" />
                        <div className="grid grid-cols-4 gap-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="aspect-square rounded-lg" />
                            ))}
                        </div>
                    </div>

                    {/* Product Info Skeleton */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Skeleton className="h-12 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>

                        <Skeleton className="h-10 w-48" />

                        <div className="border-t border-b py-6 space-y-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>

                        <div className="space-y-3">
                            <Skeleton className="h-6 w-24" />
                            <div className="flex gap-2">
                                <Skeleton className="h-10 w-24 rounded-lg" />
                                <Skeleton className="h-10 w-24 rounded-lg" />
                                <Skeleton className="h-10 w-24 rounded-lg" />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-6 w-20" />
                                <Skeleton className="h-10 w-32 rounded-lg" />
                            </div>
                            <Skeleton className="h-12 w-full rounded-lg" />
                        </div>
                    </div>
                </div>

                {/* Tabs Section Skeleton */}
                <div className="mt-20">
                    <div className="flex gap-8 border-b h-12">
                        <Skeleton className="h-full w-24" />
                        <Skeleton className="h-full w-24" />
                        <Skeleton className="h-full w-24" />
                    </div>
                    <div className="mt-8 space-y-4">
                        <Skeleton className="h-8 w-64" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
