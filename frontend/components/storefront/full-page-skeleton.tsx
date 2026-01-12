import { Skeleton } from "@/components/ui/skeleton"
import { ProductGridSkeleton } from "./product-skeleton"

export function FullPageStorefrontSkeleton() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header Skeleton */}
            <header className="fixed top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Skeleton className="h-6 w-32" />
                    <div className="hidden md:flex gap-8">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex gap-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </div>
            </header>

            {/* Hero Skeleton */}
            <section className="relative h-[80vh] w-full pt-16">
                <Skeleton className="h-full w-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="container px-4 text-center space-y-4">
                        <Skeleton className="h-12 w-3/4 mx-auto max-w-2xl" />
                        <Skeleton className="h-6 w-1/2 mx-auto max-w-lg" />
                        <Skeleton className="h-12 w-48 mx-auto rounded-full" />
                    </div>
                </div>
            </section>

            {/* Categories Sticky Bar Skeleton */}
            <div className="sticky top-16 z-40 border-b bg-white/80 backdrop-blur-md">
                <div className="container mx-auto flex h-14 items-center justify-center gap-4 px-4 overflow-hidden">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-24 shrink-0 rounded-full" />
                    ))}
                </div>
            </div>

            {/* Featured Section Skeleton */}
            <section className="container mx-auto px-4 py-20">
                <div className="mb-12 flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-64" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-10 w-24 lg:hidden" />
                </div>

                <div className="flex gap-12">
                    {/* Sidebar Skeleton */}
                    <div className="hidden w-[240px] shrink-0 lg:block space-y-8">
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

                    {/* Grid Skeleton */}
                    <div className="flex-1">
                        <ProductGridSkeleton count={6} />
                    </div>
                </div>
            </section>
        </div>
    )
}
