"use client"

import { useState, useEffect } from "react"
import { Star, StarHalf } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { storefrontApi } from "@/services/storefront-api"
import type { ProductReview } from "@/types/product"
import { cn } from "@/lib/utils"

import { StarRating } from "@/components/ui/star-rating"

interface ProductReviewsProps {
    tenantSlug: string
    productSlug: string
    averageRating: string
    reviewCount: number
}

interface ProductReviewsProps {
    tenantSlug: string
    productSlug: string
    averageRating: string
    reviewCount: number
}

export function ProductReviews({ tenantSlug, productSlug, averageRating, reviewCount }: ProductReviewsProps) {
    const [reviews, setReviews] = useState<ProductReview[]>([])
    const [loading, setLoading] = useState(false)
    const [showForm, setShowForm] = useState(false)

    // Form state
    const [formRating, setFormRating] = useState(5)
    const [formName, setFormName] = useState("")
    const [formEmail, setFormEmail] = useState("")
    const [formComment, setFormComment] = useState("")
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        loadReviews()
    }, [tenantSlug, productSlug])

    const loadReviews = async () => {
        if (!tenantSlug || !productSlug) return
        try {
            setLoading(true)
            const data = await storefrontApi.getProductReviews(tenantSlug, productSlug)
            setReviews(data)
        } catch (err) {
            console.error("Failed to load reviews", err)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formName || !formRating) {
            toast.error("Por favor completa los campos requeridos")
            return
        }

        try {
            setSubmitting(true)
            await storefrontApi.createProductReview(tenantSlug, productSlug, {
                rating: formRating,
                customer_name: formName,
                customer_email: formEmail,
                comment: formComment
            })
            toast.success("¡Gracias por tu reseña!")
            setShowForm(false)
            setFormName("")
            setFormEmail("")
            setFormComment("")
            setFormRating(5)
            loadReviews() // Refresh list
        } catch (err) {
            toast.error("Error al enviar reseña. Inténtalo de nuevo.")
        } finally {
            setSubmitting(false)
        }
    }

    const avg = parseFloat(averageRating || "0")

    return (
        <section className="mt-16 border-t border-gray-200 pt-16" id="reviews">
            <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
                {/* Summary Column */}
                <div className="lg:w-1/3">
                    <h2 className="font-serif text-2xl mb-4">Opiniones de clientes</h2>

                    <div className="flex items-baseline gap-4 mb-4">
                        <span className="text-5xl font-bold">{avg.toFixed(1)}</span>
                        <div className="flex flex-col">
                            <StarRating rating={avg} size={20} />
                            <span className="text-sm text-muted-foreground mt-1">Based on {reviewCount} reviews</span>
                        </div>
                    </div>

                    <Button onClick={() => setShowForm(!showForm)} variant="outline" className="w-full">
                        {showForm ? "Cancelar" : "Escribir una reseña"}
                    </Button>
                </div>

                {/* Reviews List & Form Column */}
                <div className="lg:w-2/3">
                    {showForm && (
                        <div className="bg-gray-50 p-6 rounded-lg mb-8 animate-in fade-in slide-in-from-top-4">
                            <h3 className="font-medium text-lg mb-4">Escribe tu opinión</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label>Calificación</Label>
                                    <div className="mt-2">
                                        <StarRating
                                            rating={formRating}
                                            interactive
                                            onRatingChange={setFormRating}
                                            size={24}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nombre *</Label>
                                        <Input
                                            id="name"
                                            value={formName}
                                            onChange={(e) => setFormName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email (Opcional)</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formEmail}
                                            onChange={(e) => setFormEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="comment">Comentario</Label>
                                    <Textarea
                                        id="comment"
                                        value={formComment}
                                        onChange={(e) => setFormComment(e.target.value)}
                                        placeholder="Cuéntanos qué te pareció el producto..."
                                    />
                                </div>

                                <Button type="submit" disabled={submitting}>
                                    {submitting ? "Enviando..." : "Publicar Reseña"}
                                </Button>
                            </form>
                        </div>
                    )}

                    <div className="space-y-8">
                        {reviews.length === 0 ? (
                            <p className="text-muted-foreground italic">Sé el primero en opinar sobre este producto.</p>
                        ) : (
                            reviews.map((review) => (
                                <div key={review.id} className="border-b pb-8 last:border-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium">{review.customer_name}</h4>
                                        <span className="text-sm text-muted-foreground">
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <StarRating rating={review.rating} size={14} className="mb-3" />
                                    <p className="text-gray-600 leading-relaxed">{review.comment}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}
