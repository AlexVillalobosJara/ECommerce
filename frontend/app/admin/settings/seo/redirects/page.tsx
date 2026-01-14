"use client"

import { useState, useEffect } from "react"
import {
    Plus,
    Trash2,
    ExternalLink,
    Search,
    Loader2,
    ArrowRight,
    CheckCircle2,
    XCircle,
    AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { DashboardShell } from "@/components/admin/dashboard-shell"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const getAuthHeaders = () => {
    const token = localStorage.getItem("admin_access_token")
    return {
        "Content-Type": "application/json",
        ...(token && { "Authorization": `Bearer ${token}` }),
    }
}

interface Redirect {
    id: string
    old_path: string
    new_path: string
    is_active: boolean
    created_at: string
}

export default function RedirectsPage() {
    const [redirects, setRedirects] = useState<Redirect[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [newRedirect, setNewRedirect] = useState({
        old_path: "",
        new_path: "",
        is_active: true
    })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchRedirects()
    }, [])

    const fetchRedirects = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${API_URL}/api/admin/redirects/`, {
                headers: getAuthHeaders()
            })
            if (!response.ok) throw new Error("Error loading redirects")
            const data = await response.json()
            setRedirects(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Fetch error:", error)
            toast.error("No se pudieron cargar las redirecciones")
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async () => {
        if (!newRedirect.old_path || !newRedirect.new_path) {
            toast.error("Ambos campos son obligatorios")
            return
        }

        try {
            setSaving(true)
            const response = await fetch(`${API_URL}/api/admin/redirects/`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(newRedirect)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.old_path?.[0] || "Error al crear la redirección")
            }

            toast.success("Redirección creada correctamente")
            setIsAddDialogOpen(false)
            setNewRedirect({ old_path: "", new_path: "", is_active: true })
            fetchRedirects()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar esta redirección?")) return

        try {
            const response = await fetch(`${API_URL}/api/admin/redirects/${id}/`, {
                method: "DELETE",
                headers: getAuthHeaders()
            })

            if (!response.ok) throw new Error("Error al eliminar")

            toast.success("Redirección eliminada")
            fetchRedirects()
        } catch (error) {
            toast.error("No se pudo eliminar la redirección")
        }
    }

    const toggleActive = async (redirect: Redirect) => {
        try {
            const response = await fetch(`${API_URL}/api/admin/redirects/${redirect.id}/`, {
                method: "PATCH",
                headers: getAuthHeaders(),
                body: JSON.stringify({ is_active: !redirect.is_active })
            })

            if (!response.ok) throw new Error("Error al actualizar")

            setRedirects(redirects.map(r =>
                r.id === redirect.id ? { ...r, is_active: !r.is_active } : r
            ))
            toast.success(redirect.is_active ? "Redirección desactivada" : "Redirección activada")
        } catch (error) {
            toast.error("No se pudo actualizar el estado")
        }
    }

    const filteredRedirects = redirects.filter(r =>
        r.old_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.new_path.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <DashboardShell>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Redirecciones 301</h2>
                        <p className="text-muted-foreground">
                            Gestiona redirecciones para mantener tu autoridad SEO cuando cambian las URLs.
                        </p>
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" />
                                Nueva Redirección
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Crear Redirección</DialogTitle>
                                <DialogDescription>
                                    Configura una redirección permanente (301) desde una ruta antigua a una nueva.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="old_path">Ruta Antigua (Desde)</Label>
                                    <Input
                                        id="old_path"
                                        placeholder="/mi-pagina-antigua"
                                        value={newRedirect.old_path}
                                        onChange={e => setNewRedirect({ ...newRedirect, old_path: e.target.value })}
                                    />
                                    <p className="text-[10px] text-muted-foreground">Debe empezar con /</p>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="new_path">Ruta Nueva (Hacia)</Label>
                                    <Input
                                        id="new_path"
                                        placeholder="/productos/mi-nuevo-producto"
                                        value={newRedirect.new_path}
                                        onChange={e => setNewRedirect({ ...newRedirect, new_path: e.target.value })}
                                    />
                                    <p className="text-[10px] text-muted-foreground">Ruta interna (empieza con /) o URL completa.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="is_active"
                                        checked={newRedirect.is_active}
                                        onCheckedChange={checked => setNewRedirect({ ...newRedirect, is_active: checked })}
                                    />
                                    <Label htmlFor="is_active">Activa</Label>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
                                <Button onClick={handleCreate} disabled={saving}>
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Crear Redirección
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Listado de Redirecciones</CardTitle>
                            <div className="relative w-72">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por ruta..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">Cargando redirecciones...</p>
                            </div>
                        ) : filteredRedirects.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                                <div className="p-4 bg-muted/50 rounded-full">
                                    <AlertCircle className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-lg font-medium">No se encontraron redirecciones</p>
                                    <p className="text-sm text-muted-foreground">
                                        Empieza creando una nueva redirección para tu tienda.
                                    </p>
                                </div>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
                                    Crear mi primera redirección
                                </Button>
                            </div>
                        ) : (
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Estado</TableHead>
                                            <TableHead>Ruta Origen</TableHead>
                                            <TableHead></TableHead>
                                            <TableHead>Destino</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredRedirects.map((redirect) => (
                                            <TableRow key={redirect.id}>
                                                <TableCell>
                                                    <button onClick={() => toggleActive(redirect)}>
                                                        {redirect.is_active ? (
                                                            <Badge variant="default" className="bg-green-500 hover:bg-green-600 gap-1">
                                                                <CheckCircle2 className="w-3 h-3" /> Activa
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="gap-1">
                                                                <XCircle className="w-3 h-3" /> Inactiva
                                                            </Badge>
                                                        )}
                                                    </button>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{redirect.old_path}</TableCell>
                                                <TableCell>
                                                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-primary">{redirect.new_path}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            asChild
                                                        >
                                                            <a href={redirect.old_path} target="_blank" rel="noreferrer">
                                                                <ExternalLink className="w-4 h-4" />
                                                            </a>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(redirect.id)}
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">¿Por qué usar redirecciones 301?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">
                                Las redirecciones 301 indican a los buscadores que una página se ha movido permanentemente, transfiriendo el 90-99% de la autoridad SEO de la URL antigua a la nueva.
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Evita el error 404</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">
                                Si cambias el nombre de un producto pero los clientes tienen el link antiguo guardado, verán un error. Una redirección 301 los llevará automáticamente al nuevo sitio.
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Consistencia en Google</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">
                                Ayuda a Google Search Console a entender tu nueva estructura de sitio eliminando URLs duplicadas o inexistentes de su índice de búsqueda.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardShell>
    )
}
