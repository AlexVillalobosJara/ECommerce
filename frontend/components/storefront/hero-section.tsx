"use client"

import { Button } from "@/components/ui/button"
import { getImageUrl } from "@/lib/image-utils"

interface HeroSectionProps {
    title: string
    subtitle?: string
    ctaText?: string
    ctaHref?: string
    backgroundImage?: string
    onCtaClick?: () => void
    priority?: boolean
}

export function HeroSection({
    title,
    subtitle,
    ctaText = "Explorar",
    ctaHref,
    backgroundImage,
    onCtaClick,
    priority = false,
}: HeroSectionProps) {
    return (
        <section className="relative h-[80vh] min-h-[600px] w-full overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0">
                <img
                    src={getImageUrl(backgroundImage)}
                    alt="Hero background"
                    className="size-full object-cover scale-105 animate-fade-in"
                    loading={priority ? "eager" : "lazy"}
                    // @ts-ignore
                    fetchpriority={priority ? "high" : "auto"}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/40" />
            </div>

            {/* Content Overlay */}
            <div className="relative flex size-full items-center justify-center text-center">
                <div className="max-w-4xl space-y-8 px-4 animate-fade-in-up">
                    <h1 className="text-balance font-serif text-5xl font-light tracking-tight text-white drop-shadow-lg md:text-6xl lg:text-7xl">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-pretty text-xl text-white/95 drop-shadow-md md:text-2xl lg:text-3xl">
                            {subtitle}
                        </p>
                    )}
                    {ctaText && (
                        <div className="pt-4">
                            <Button
                                size="lg"
                                variant="secondary"
                                className="px-10 py-6 text-lg font-medium shadow-xl transition-all duration-300 hover:scale-105"
                                onClick={onCtaClick}
                                asChild={!!ctaHref}
                            >
                                {ctaHref ? <a href={ctaHref}>{ctaText}</a> : ctaText}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}
