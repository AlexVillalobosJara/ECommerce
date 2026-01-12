import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

export default function ProductLoading() {
    return (
        <div className="min-h-screen bg-white">
            <header className="h-16 border-b bg-white" />

            <main className="container mx-auto px-4 py-12 pt-16">
                <div className="mb-8">
                    <Skeleton className="h-10 w-32" />
                </div>

                <div className="grid gap-12 lg:grid-cols-2">
                    {/* Media Gallery Skeleton */}
                    <div className="space-y-4">
                        <Skeleton className="aspect-square w-full rounded-lg" />
                        <div className="grid grid-cols-4 gap-4">
                            <Skeleton className="aspect-square w-full rounded-lg" />
                            <Skeleton className="aspect-square w-full rounded-lg" />
                            <Skeleton className="aspect-square w-full rounded-lg" />
                            <Skeleton className="aspect-square w-full rounded-lg" />
                        </div>
                    </div>

                    {/* Content Skeleton */}
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Skeleton className="h-12 w-3/4" />
                            <Skeleton className="h-4 w-1/3" />
                        </div>

                        <div className="flex items-baseline gap-3">
                            <Skeleton className="h-10 w-32" />
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>

                        <div className="space-y-3 pt-4">
                            <Skeleton className="h-10 w-full rounded-lg" />
                            <div className="grid grid-cols-4 gap-2">
                                <Skeleton className="h-12 w-full rounded-lg" />
                                <Skeleton className="h-12 w-full rounded-lg" />
                                <Skeleton className="h-12 w-full rounded-lg" />
                                <Skeleton className="h-12 w-full rounded-lg" />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-6 w-24" />
                                <Skeleton className="h-10 w-32" />
                            </div>
                            <Skeleton className="h-14 w-full rounded-lg" />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
