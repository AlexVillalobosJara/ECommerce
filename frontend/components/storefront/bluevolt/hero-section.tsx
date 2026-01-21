"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Zap, Award } from "lucide-react"
import Image from "next/image"

interface HeroSectionProps {
    title: string
    subtitle?: string
    ctaText?: string
    ctaHref?: string
    backgroundImage?: string
    onCtaClick?: () => void
    priority?: boolean // Added to match interface
}

export function BlueVoltHero({
    title,
    subtitle,
    ctaText = "Explorar",
    ctaHref,
    backgroundImage = "/hero-tools-workshop.jpg",
    onCtaClick,
}: HeroSectionProps) {
    return (
        <section className="relative w-full overflow-hidden bg-[#0a1628]">
            {/* Background Image with enhanced overlay */}
            <div className="absolute inset-0">
                <Image
                    src={backgroundImage || "/placeholder.svg"}
                    alt="Hero background"
                    fill
                    priority
                    className="object-cover opacity-90"
                    sizes="100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/95 via-[#0a1628]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-[#0a1628]/30" />
                {/* Subtle blue tint overlay */}
                <div className="absolute inset-0 bg-[#1a4b8c]/10 mix-blend-overlay" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex min-h-[500px] items-center py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl space-y-8">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
                            <Zap className="size-4 text-[#e63329]" />
                            <span className="text-sm font-medium tracking-wide text-white">Herramientas Profesionales</span>
                        </div>

                        {/* Title */}
                        <h1 className="font-serif text-5xl font-bold leading-[1.1] tracking-tight text-white md:text-6xl lg:text-7xl">
                            {title.split(" ").map((word, i) => (
                                <span key={i}>
                                    {word === "Potencia" || word === "Precisión" ? (
                                        <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                                            {word}
                                        </span>
                                    ) : (
                                        word
                                    )}{" "}
                                </span>
                            ))}
                        </h1>

                        {/* Subtitle */}
                        {subtitle && <p className="max-w-xl text-xl leading-relaxed text-white/80 md:text-2xl">{subtitle}</p>}

                        {/* CTA Buttons */}
                        <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                            {ctaText && (
                                <Button
                                    size="lg"
                                    className="group h-14 gap-3 bg-[#1a4b8c] px-8 text-lg font-semibold text-white shadow-lg shadow-[#1a4b8c]/30 transition-all duration-300 hover:bg-[#1a5ba8] hover:shadow-xl hover:shadow-[#1a4b8c]/40"
                                    onClick={onCtaClick}
                                    asChild={!!ctaHref}
                                >
                                    {ctaHref ? (
                                        <a href={ctaHref}>
                                            {ctaText}
                                            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                                        </a>
                                    ) : (
                                        <>
                                            {ctaText}
                                            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                                        </>
                                    )}
                                </Button>
                            )}
                            <Button
                                size="lg"
                                variant="outline"
                                className="h-14 gap-2 border-white/30 bg-white/5 px-8 text-lg font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/50"
                                asChild
                            >
                                <a href="/products">
                                    Ver Catálogo
                                </a>
                            </Button>
                        </div>

                        {/* Trust Badges */}
                        <div className="flex flex-wrap items-center gap-8 pt-8 border-t border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="flex size-12 items-center justify-center rounded-lg bg-[#1a4b8c]/30 backdrop-blur-sm">
                                    <Shield className="size-6 text-[#1a4b8c]" />
                                </div>
                                <div>
                                    <p className="font-semibold text-white">Garantía Extendida</p>
                                    <p className="text-sm text-white/60">Hasta 3 años</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex size-12 items-center justify-center rounded-lg bg-[#e63329]/20 backdrop-blur-sm">
                                    <Zap className="size-6 text-[#e63329]" />
                                </div>
                                <div>
                                    <p className="font-semibold text-white">Envío Express</p>
                                    <p className="text-sm text-white/60">24-48 horas</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex size-12 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                                    <Award className="size-6 text-amber-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-white">Calidad Premium</p>
                                    <p className="text-sm text-white/60">Marcas líderes</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
