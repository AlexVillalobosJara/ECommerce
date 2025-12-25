"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { X, Search, MapPin } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { adminApi } from "@/services/admin-api"
import type { CommunesByRegion } from "@/types/shipping"

interface ShippingZoneCommunesSelectorProps {
    data: {
        commune_codes: string[]
    }
    onChange: (updates: Partial<ShippingZoneCommunesSelectorProps["data"]>) => void
}

export function ShippingZoneCommunesSelector({ data, onChange }: ShippingZoneCommunesSelectorProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [expandedRegions, setExpandedRegions] = useState<string[]>(["13"]) // Región Metropolitana by default
    const [communesByRegion, setCommunesByRegion] = useState<CommunesByRegion[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Load communes from API
    useEffect(() => {
        const loadCommunes = async () => {
            try {
                setIsLoading(true)
                const data = await adminApi.getCommunesByRegion()
                setCommunesByRegion(data)
            } catch (error) {
                console.error("Error loading communes:", error)
            } finally {
                setIsLoading(false)
            }
        }

        loadCommunes()
    }, [])

    const toggleRegion = (regionCode: string) => {
        setExpandedRegions((prev) =>
            prev.includes(regionCode) ? prev.filter((r) => r !== regionCode) : [...prev, regionCode]
        )
    }

    const toggleCommune = (commune: { code: string; name: string }) => {
        const isSelected = data.commune_codes.includes(commune.code) || data.commune_codes.includes(commune.name)

        let newCodes = [...data.commune_codes]
        if (isSelected) {
            // Remove both code and name to ensure clean cleanup of legacy data
            newCodes = newCodes.filter((c) => c !== commune.code && c !== commune.name)
        } else {
            // Always add code for new selections
            newCodes.push(commune.code)
        }

        onChange({ commune_codes: newCodes })
    }

    const selectAllInRegion = (regionCode: string) => {
        const region = communesByRegion.find((r) => r.region_code === regionCode)
        if (!region) return

        const regionCommunes = region.communes
        const allSelected = regionCommunes.every((c) =>
            data.commune_codes.includes(c.code) || data.commune_codes.includes(c.name)
        )

        if (allSelected) {
            // Deselect all from this region (remove codes and names)
            const codesToRemove = regionCommunes.map(c => c.code)
            const namesToRemove = regionCommunes.map(c => c.name)

            onChange({
                commune_codes: data.commune_codes.filter((c) => !codesToRemove.includes(c) && !namesToRemove.includes(c)),
            })
        } else {
            // Select all from this region (add codes)
            const newCodesFromFile = regionCommunes.map(c => c.code)
            const currentCodes = data.commune_codes
            const newCodes = [...new Set([...currentCodes, ...newCodesFromFile])]
            onChange({ commune_codes: newCodes })
        }
    }

    const removeCommune = (codeOrName: string) => {
        onChange({
            commune_codes: data.commune_codes.filter((c) => c !== codeOrName),
        })
    }

    const getSelectedCommunes = () => {
        const allCommunes = communesByRegion.flatMap((r) => r.communes)
        // Map codes/names to actual commune objects, filtering out duplicates if both code and name exist
        const uniqueCommunes = new Map<string, { code: string; name: string }>()

        data.commune_codes.forEach(codeOrName => {
            const commune = allCommunes.find((c) =>
                c.code === codeOrName ||
                c.name === codeOrName ||
                String(c.name).trim() === String(codeOrName).trim()
            )
            if (commune) {
                uniqueCommunes.set(commune.code, commune)
            }
        })

        return Array.from(uniqueCommunes.values())
    }

    const filterCommunes = (communes: { code: string; name: string }[]) => {
        if (!searchQuery) return communes
        return communes.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    if (isLoading) {
        return (
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Comunas Incluidas
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                        Cargando comunas...
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Comunas Incluidas
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
                {/* Selected Communes */}
                {data.commune_codes.length > 0 && (
                    <div className="space-y-2">
                        <Label>Comunas Seleccionadas ({data.commune_codes.length})</Label>
                        <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border border-border min-h-[60px]">
                            {getSelectedCommunes().map((commune) => (
                                <Badge key={commune.code} variant="secondary" className="gap-1.5 pl-3 pr-2 py-1.5">
                                    {commune.name}
                                    <button
                                        onClick={() => removeCommune(commune.code)}
                                        className="hover:bg-background rounded-full p-0.5 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search */}
                <div className="space-y-2">
                    <Label htmlFor="commune-search">Buscar Comuna</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            id="commune-search"
                            placeholder="Buscar por nombre..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Communes by Region */}
                <ScrollArea className="h-[400px] rounded-lg border border-border">
                    <div className="p-4 space-y-4">
                        {communesByRegion.map((region) => {
                            const filteredCommunes = filterCommunes(region.communes)
                            if (filteredCommunes.length === 0 && searchQuery) return null

                            const isExpanded = expandedRegions.includes(region.region_code)
                            const selectedInRegion = region.communes.filter((c) =>
                                data.commune_codes.includes(c.code) || data.commune_codes.includes(c.name)
                            ).length
                            const allSelectedInRegion = selectedInRegion === region.communes.length

                            return (
                                <div key={region.region_code} className="space-y-2">
                                    <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                                        <button
                                            onClick={() => toggleRegion(region.region_code)}
                                            className="flex items-center gap-2 flex-1 text-left font-medium text-sm"
                                        >
                                            <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <MapPin className="w-3 h-3 text-primary" />
                                            </div>
                                            {region.region_name}
                                            {selectedInRegion > 0 && (
                                                <Badge variant="secondary" className="ml-2 text-xs">
                                                    {selectedInRegion}/{region.communes.length}
                                                </Badge>
                                            )}
                                        </button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => selectAllInRegion(region.region_code)}
                                            className="text-xs h-7 px-2"
                                        >
                                            {allSelectedInRegion ? "Deseleccionar todo" : "Seleccionar todo"}
                                        </Button>
                                    </div>

                                    {isExpanded && (
                                        <div className="pl-4 space-y-2">
                                            {filteredCommunes.map((commune) => {
                                                // Relaxed comparison for debugging
                                                const isSelected = data.commune_codes.some(c =>
                                                    c === commune.code ||
                                                    c === commune.name ||
                                                    String(c).trim() === String(commune.name).trim()
                                                )

                                                return (
                                                    <div key={commune.code} className="flex items-center space-x-3 py-1.5">
                                                        <Checkbox
                                                            id={commune.code}
                                                            checked={isSelected}
                                                            onCheckedChange={() => toggleCommune(commune)}
                                                        />
                                                        <label htmlFor={commune.code} className="text-sm cursor-pointer flex-1 select-none">
                                                            {commune.name}
                                                            {/* Debug info hidden but present */}
                                                            <span className="hidden">{commune.code}</span>
                                                        </label>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
