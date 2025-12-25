"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
    rating: number
    max?: number
    size?: number
    className?: string
    interactive?: boolean
    onRatingChange?: (rating: number) => void
}

export function StarRating({
    rating,
    max = 5,
    size = 16,
    className,
    interactive = false,
    onRatingChange
}: StarRatingProps) {
    const [hoverRating, setHoverRating] = useState(0)

    return (
        <div className={cn("flex items-center gap-1", className)}>
            {Array.from({ length: max }).map((_, i) => {
                const filled = (hoverRating || rating) >= i + 1
                // const half = !filled && (hoverRating || rating) >= i + 0.5 // Half stars not implemented visually yet

                return (
                    <button
                        key={i}
                        type="button"
                        disabled={!interactive}
                        className={cn(
                            "transition-colors",
                            interactive ? "cursor-pointer hover:scale-110" : "cursor-default"
                        )}
                        onClick={() => interactive && onRatingChange?.(i + 1)}
                        onMouseEnter={() => interactive && setHoverRating(i + 1)}
                        onMouseLeave={() => interactive && setHoverRating(0)}
                    >
                        <Star
                            className={cn(
                                filled ? "fill-yellow-400 text-yellow-400" : "text-gray-300",
                            )}
                            size={size}
                        />
                    </button>
                )
            })}
        </div>
    )
}
