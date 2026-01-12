import { Skeleton } from "@/components/ui/skeleton"
import { ProductGridSkeleton } from "@/components/storefront/product-skeleton"

export default function CategoryLoading() {
    return (
        <div className="flex min-h-screen flex-col bg-white">
            {/* Nav Skeleton */}
            <header className="h-16 border-b bg-white" />

            <main className="flex-1">
                {/* Banner Skeleton */}
                <div className="bg-muted/30 py-12 md:py-16">
                    <div className="container mx-auto px-4 text-center">
                        <Skeleton className="mx-auto h-10 w-2/3 md:h-12 lg:h-14" />
                        <Skeleton className="mx-auto mt-6 h-6 w-1/2 md:w-1/3" />
                    </div>
                </div>

                <div className="container mx-auto px-4 py-12">
                    <div className="flex gap-12">
                        {/* Sidebar Skeleton (Visible on LG) */}
                        <div className="hidden w-[260px] shrink-0 lg:block space-y-8">
                            <Skeleton className="h-8 w-1/2" />
                            <div className="space-y-4">
                                <Skeleton className="h-6 w-full" />
                                <Skeleton className="h-6 w-full" />
                                <Skeleton className="h-6 w-full" />
                                <Skeleton className="h-6 w-full" />
                            </div>
                        </div>

                        {/* Grid Skeleton */}
                        <div className="flex-1">
                            <div className="mb-6 flex items-center justify-between">
                                <Skeleton className="h-6 w-48" />
                            </div>
                            <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="space-y-4">
                                        <Skeleton className="aspect-square w-full rounded-lg" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-6 w-3/4" />
                                            <Skeleton className="h-5 w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
