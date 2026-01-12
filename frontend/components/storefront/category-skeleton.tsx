import { Skeleton } from "@/components/ui/skeleton"
import { ProductGridSkeleton } from "./product-skeleton"

export function CategoryPageSkeleton() {
    return (
        <div className="flex min-h-screen flex-col bg-white">
            {/* Header Placeholder (Already rendered, but keeping flow) */}
            <div className="h-16 border-b" />

            <main className="flex-1">
                {/* Hero / Header Section Skeleton */}
                <div className="bg-muted/30 py-12 md:py-16">
                    <div className="container mx-auto px-4 text-center space-y-4">
                        <div className="flex justify-center mb-4">
                            <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="mx-auto h-12 w-64 md:w-96" />
                        <Skeleton className="mx-auto h-4 w-full max-w-2xl" />
                        <Skeleton className="mx-auto h-4 w-2/3 max-w-lg" />
                    </div>
                </div>

                {/* Content Section Skeleton */}
                <div className="container mx-auto px-4 py-12">
                    <div className="flex gap-12">
                        {/* Desktop Filters Sidebar Skeleton */}
                        <div className="hidden w-[260px] shrink-0 lg:block space-y-8">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="space-y-3">
                                    <Skeleton className="h-6 w-3/4" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-5/6" />
                                        <Skeleton className="h-4 w-4/6" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Products Grid Skeleton */}
                        <div className="flex-1">
                            <div className="mb-6 hidden lg:flex justify-between items-center">
                                <Skeleton className="h-4 w-48" />
                            </div>
                            <ProductGridSkeleton count={6} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
