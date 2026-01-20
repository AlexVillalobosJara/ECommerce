import { getProductImageUrl } from "@/lib/image-utils"
import { cn } from "@/lib/utils"

interface Feature {
    id: string
    image_url: string
    title: string
    description: string
    sort_order: number
}

interface ProductFeaturesSectionProps {
    features: Feature[]
}

export function ProductFeaturesSection({ features }: ProductFeaturesSectionProps) {
    if (!features || features.length === 0) return null

    return (
        <div className="mt-20 mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-16">
                {features.map((feature) => (
                    <div
                        key={feature.id}
                        className="flex flex-col gap-3 group"
                    >
                        {/* Image */}
                        <div className="w-full aspect-square overflow-hidden rounded-2xl bg-gray-50 shadow-sm border border-gray-100">
                            {feature.image_url ? (
                                <img
                                    src={getProductImageUrl(feature.image_url)}
                                    alt={feature.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    No Image
                                </div>
                            )}
                        </div>

                        {/* Text */}
                        <div className="px-2 text-center">
                            <h3 className="font-serif text-lg font-medium mb-1.5 text-gray-900 tracking-tight">
                                {feature.title}
                            </h3>
                            <p className="text-xs text-gray-500 leading-relaxed font-light max-w-sm mx-auto">
                                {feature.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
