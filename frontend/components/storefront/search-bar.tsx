"use client"

import { useState, useEffect, Suspense } from "react"
import { Search, X } from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SearchBarProps {
    className?: string
}

function SearchBarContent({ className }: SearchBarProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Initialize query from URL
    const [query, setQuery] = useState("")

    // Sync input from URL only when URL changes (e.g. navigation, back button)
    useEffect(() => {
        const urlSearch = searchParams.get("search") || ""
        // Only update if they differ significantly to avoid cursor jumps if we were syncing while typing (which we aren't anymore)
        if (urlSearch !== query) {
            setQuery(urlSearch)
        }
    }, [searchParams]) // Removed query dependency to avoid loops

    const performSearch = (searchQuery: string) => {
        const trimmedQuery = searchQuery.trim()

        if (pathname === '/products' || pathname === '/') {
            // In-place update for Home and Products pages
            const params = new URLSearchParams(searchParams.toString())
            if (trimmedQuery) {
                params.set("search", trimmedQuery)
                // Scroll to featured-products section
                const section = document.getElementById('featured-products');
                if (section) {
                    section.scrollIntoView({ behavior: 'smooth' });
                }
            } else {
                params.delete("search")
            }
            router.push(`${pathname}?${params.toString()}`, { scroll: false })
        } else {
            // Redirect to products page for other pages
            if (trimmedQuery) {
                router.push(`/products?search=${encodeURIComponent(trimmedQuery)}`)
            }
        }
    }

    const handleClear = () => {
        setQuery("")
        // If we are on products or home, clear the filter immediately
        if (pathname === '/products' || pathname === '/') {
            performSearch("")
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        performSearch(query)
    }

    return (
        <form onSubmit={handleSubmit} className={className}>
            <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Buscar productos..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-10 pr-10"
                    />
                    {query && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleClear}
                            className="absolute right-1 top-1/2 size-8 -translate-y-1/2 p-0"
                        >
                            <X className="size-4" />
                        </Button>
                    )}
                </div>
                <Button type="submit" size="sm">
                    Buscar
                </Button>
            </div>
        </form>
    )
}

export function SearchBar(props: SearchBarProps) {
    return (
        <Suspense fallback={<div className="w-full h-10 bg-muted/10 animate-pulse rounded-md" />}>
            <SearchBarContent {...props} />
        </Suspense>
    )
}
