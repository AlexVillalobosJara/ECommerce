"use client"

import { useState, useEffect } from "react"
import { DashboardShell } from "@/components/admin/dashboard-shell"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Plus, Edit, Trash2, Search, Palette, Sparkles, MoreHorizontal, ExternalLink } from "lucide-react"
import { adminPremiumPaletteService } from "@/services/adminPremiumPaletteService"
import { PremiumPalette } from "@/types/tenant"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function PremiumPalettesPage() {
    const [palettes, setPalettes] = useState<PremiumPalette[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [activeTab, setActiveTab] = useState("all")

    useEffect(() => {
        loadPalettes()
    }, [])

    async function loadPalettes() {
        try {
            setIsLoading(true)
            const data = await adminPremiumPaletteService.listPalettes()
            setPalettes(data)
        } catch (error) {
            toast.error("Error al cargar las paletas")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("¿Estás seguro de que deseas eliminar esta paleta?")) return

        try {
            await adminPremiumPaletteService.deletePalette(id)
            toast.success("Paleta eliminada")
            loadPalettes()
        } catch (error) {
            toast.error("Error al eliminar la paleta")
        }
    }

    const filteredPalettes = palettes.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesTab = activeTab === "all" || p.palette_type === activeTab
        return matchesSearch && matchesTab
    })

    return (
        <DashboardShell>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <Sparkles className="w-8 h-8 text-primary" />
                            Paletas de Colores
                        </h1>
                        <p className="text-muted-foreground">
                            Gestiona las combinaciones de colores disponibles para las tiendas.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/admin/premium-palettes/new">
                            <Plus className="w-4 h-4 mr-2" />
                            Nueva Paleta
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                                <TabsList>
                                    <TabsTrigger value="all">Todas</TabsTrigger>
                                    <TabsTrigger value="basic">Básicas</TabsTrigger>
                                    <TabsTrigger value="premium">Premium</TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <div className="relative w-full md:w-auto md:min-w-[300px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar paletas..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Colores Base</TableHead>
                                    <TableHead>Acentos Premium</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            Cargando paletas...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredPalettes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No se encontraron paletas.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredPalettes.map((palette) => (
                                        <TableRow key={palette.id}>
                                            <TableCell>
                                                <div className="font-medium">{palette.name}</div>
                                                <div className="text-xs text-muted-foreground md:hidden">
                                                    {palette.primary_color} / {palette.secondary_color}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <div
                                                        className="w-6 h-6 rounded border border-border"
                                                        style={{ backgroundColor: palette.primary_color }}
                                                        title={`Primario: ${palette.primary_color}`}
                                                    />
                                                    <div
                                                        className="w-6 h-6 rounded border border-border"
                                                        style={{ backgroundColor: palette.secondary_color }}
                                                        title={`Secundario: ${palette.secondary_color}`}
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <div
                                                        className="w-6 h-6 rounded border border-border"
                                                        style={{ backgroundColor: palette.secondary_text_color }}
                                                        title={`Texto Secundario: ${palette.secondary_text_color}`}
                                                    />
                                                    <div
                                                        className="w-6 h-6 rounded border border-border"
                                                        style={{ backgroundColor: palette.accent_dark_color }}
                                                        title={`Acento Oscuro: ${palette.accent_dark_color}`}
                                                    />
                                                    <div
                                                        className="w-6 h-6 rounded border border-border"
                                                        style={{ backgroundColor: palette.accent_medium_color }}
                                                        title={`Acento Medio: ${palette.accent_medium_color}`}
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Badge variant={palette.is_active ? "default" : "secondary"}>
                                                        {palette.is_active ? "Activa" : "Inactiva"}
                                                    </Badge>
                                                    <Badge variant={palette.palette_type === 'premium' ? "default" : "outline"}>
                                                        {palette.palette_type === 'premium' ? 'Premium' : 'Básica'}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/admin/premium-palettes/${palette.id}`} className="flex items-center">
                                                                <Edit className="w-4 h-4 mr-2" />
                                                                Editar
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => handleDelete(palette.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardShell>
    )
}
