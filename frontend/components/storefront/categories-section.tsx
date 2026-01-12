"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { CategoryCard } from "./category-card"
import { Button } from "@/components/ui/button"
import type { Category } from "@/types/product"

interface CategoriesSectionProps {
    title?: string
    subtitle?: string
    categories: Category[]
    className?: string
}

export function CategoriesSection({
    title = "Explora por Categoría",
    subtitle = "Encuentra exactamente lo que necesitas",
    categories,
    className = "",
}: CategoriesSectionProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [itemsPerPage, setItemsPerPage] = useState(3)

    // Handle responsive items per page
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) {
                setItemsPerPage(1)
            } else {
                setItemsPerPage(4)
            }
        }

        // Initial check
        handleResize()

        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    const maxIndex = Math.max(0, categories.length - itemsPerPage)

    // Reset index if it goes out of bounds on resize
    useEffect(() => {
        if (currentIndex > maxIndex) {
            setCurrentIndex(Math.max(0, maxIndex))
        }
    }, [itemsPerPage, maxIndex, currentIndex])

    const handlePrev = () => {
        setCurrentIndex((prev) => Math.max(0, prev - 1))
    }

    const handleNext = () => {
        setCurrentIndex((prev) => Math.min(maxIndex, prev + 1))
    }

    const showControls = categories.length > itemsPerPage

    return (
        <section id="categorias" className={`px-4 py-20 md:px-6 lg:px-8 ${className}`}>
            <div className="mx-auto max-w-7xl">
                {/* Section Header */}
                <div className="mb-12 text-center">
                    <h2 className="text-balance font-serif text-4xl font-light tracking-tight text-foreground md:text-5xl">
                        {title}
                    </h2>
                    {subtitle && <p className="mt-4 text-pretty text-lg text-muted-foreground">{subtitle}</p>}
                </div>

                <div className="relative">
                    {/* Navigation Buttons */}
                    {showControls && (
                        <>
                            <Button
                                variant="outline"
                                size="icon"
                                className="absolute -left-4 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full border-2 bg-background shadow-lg transition-all hover:scale-110 hover:shadow-xl disabled:opacity-50 md:-left-6"
                                onClick={handlePrev}
                                disabled={currentIndex === 0}
                                aria-label="Anterior"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="absolute -right-4 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full border-2 bg-background shadow-lg transition-all hover:scale-110 hover:shadow-xl disabled:opacity-50 md:-right-6"
                                onClick={handleNext}
                                disabled={currentIndex >= maxIndex}
                                aria-label="Siguiente"
                            >
                                <ChevronRight className="h-6 w-6" />
                            </Button>
                        </>
                    )}

                    {/* Carousel Content */}
                    <div className="overflow-hidden">
                        <div
                            className="flex transition-transform duration-500 ease-out"
                            style={{
                                transform: `translateX(-${(currentIndex * 100) / itemsPerPage}%)`,
                            }}
                        >
                            {categories.map((category, index) => (
                                <div
                                    key={category.id}
                                    className="w-full flex-shrink-0 px-3 sm:w-1/2 lg:w-1/4"
                                    style={{
                                        animationDelay: `${index * 100}ms`,
                                        animationFillMode: "backwards",
                                    }}
                                >
                                    <CategoryCard category={category} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Indicators */}
                    {showControls && (
                        <div className="mt-8 flex justify-center gap-2">
                            {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`h-2 rounded-full transition-all ${idx === currentIndex ? "w-8 bg-foreground" : "w-2 bg-muted-foreground/30"
                                        }`}
                                    aria-label={`Ir a página ${idx + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}
