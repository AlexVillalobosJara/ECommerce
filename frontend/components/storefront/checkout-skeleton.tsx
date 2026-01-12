import { Skeleton } from "@/components/ui/skeleton"

export function CheckoutSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 pb-20 pt-8">
            <div className="container mx-auto px-4">
                <header className="mb-12">
                    <Skeleton className="h-4 w-32 mb-6" />
                    <Skeleton className="h-10 w-64" />
                </header>

                <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
                    {/* Form Section */}
                    <div className="lg:col-span-7 space-y-8">
                        <section className="rounded-xl border bg-white p-6 shadow-sm space-y-6">
                            <Skeleton className="h-6 w-48" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full md:col-span-2" />
                            </div>
                        </section>

                        <section className="rounded-xl border bg-white p-6 shadow-sm space-y-6">
                            <Skeleton className="h-6 w-48" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full md:col-span-2" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        </section>
                    </div>

                    {/* Summary Section */}
                    <div className="lg:col-span-5">
                        <div className="sticky top-24 rounded-xl border bg-white p-6 shadow-sm space-y-6">
                            <Skeleton className="h-6 w-48" />
                            <div className="space-y-4">
                                {Array.from({ length: 2 }).map((_, i) => (
                                    <div key={i} className="flex gap-4">
                                        <Skeleton className="h-16 w-16 rounded" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t pt-4 space-y-2">
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                                <div className="flex justify-between pt-2 border-t font-bold">
                                    <Skeleton className="h-6 w-16" />
                                    <Skeleton className="h-6 w-24" />
                                </div>
                            </div>
                            <Skeleton className="h-12 w-full rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
