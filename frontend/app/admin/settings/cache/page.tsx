'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Server,
    Zap,
    Activity,
    Trash2,
    RefreshCcw,
    CheckCircle2,
    XCircle,
    Database,
    Clock
} from 'lucide-react'
import { toast } from "sonner"
import api from '@/lib/api' // Assuming this is the admin api client

interface CacheStats {
    backend: string
    has_redis_config: boolean
    connection_working: boolean
    latency_ms: number
    has_delete_pattern: boolean
    error_details: string
    cache_prefix: string
    is_redis: boolean
}

export default function CacheDiagnosticsPage() {
    const [stats, setStats] = useState<CacheStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [clearing, setClearing] = useState(false)

    const fetchStats = async () => {
        setLoading(true)
        try {
            const response = await api.get('/admin/settings/cache/diagnostics/')
            setStats(response.data)
        } catch (error) {
            console.error('Error fetching cache stats:', error)
            toast.error('No se pudieron obtener las estadísticas del cache')
        } finally {
            setLoading(false)
        }
    }

    const handleClearCache = async () => {
        if (!confirm('¿Estás seguro de que quieres limpiar el cache de tu tienda? Esto podría ralentizar temporalmente el panel admin.')) return

        setClearing(true)
        try {
            await api.post('/admin/settings/cache/clear/')
            toast.success('Cache limpiado correctamente')
            fetchStats()
        } catch (error) {
            console.error('Error clearing cache:', error)
            toast.error('Hubo un error al intentar limpiar el cache')
        } finally {
            setClearing(false)
        }
    }

    useEffect(() => {
        fetchStats()
    }, [])

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Diagnóstico de Cache</h2>
                    <p className="text-muted-foreground">
                        Monitorea el rendimiento y estado del sistema de aceleración (Redis).
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={fetchStats} disabled={loading}>
                        <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </Button>
                    <Button variant="destructive" onClick={handleClearCache} disabled={clearing || loading}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Limpiar Cache
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Connection Status Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Estado de Conexión</CardTitle>
                        <Activity className={`h-4 w-4 ${stats?.connection_working ? 'text-green-500' : 'text-red-500'}`} />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="h-8 w-24 animate-pulse bg-muted rounded" />
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold">
                                    {stats?.connection_working ? 'Activo' : 'Inactivo'}
                                </span>
                                {stats?.connection_working ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-500" />
                                )}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Backend: {stats?.backend || 'Cargando...'}
                        </p>
                    </CardContent>
                </Card>

                {/* Latency Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Latencia</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="h-8 w-24 animate-pulse bg-muted rounded" />
                        ) : (
                            <div className="text-2xl font-bold">
                                {stats?.latency_ms !== -1 ? `${stats?.latency_ms} ms` : 'N/A'}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Tiempo de respuesta del servidor cache
                        </p>
                    </CardContent>
                </Card>

                {/* Backend Type Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tipo de Motor</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="h-8 w-24 animate-pulse bg-muted rounded" />
                        ) : (
                            <Badge variant={stats?.is_redis ? "default" : "secondary"} className="text-sm">
                                {stats?.is_redis ? 'Redis (Producción)' : 'LocMem (Local)'}
                            </Badge>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Sistema de almacenamiento actual
                        </p>
                    </CardContent>
                </Card>

                {/* Redis Config Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Configuración</CardTitle>
                        <Zap className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="h-8 w-24 animate-pulse bg-muted rounded" />
                        ) : (
                            <div className="text-2xl font-bold">
                                {stats?.has_redis_config ? 'Válida' : 'Pendiente'}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Variable REDIS_URL detectada
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Info Section */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Detalles Técnicos</CardTitle>
                    <CardDescription>
                        Información específica de la instancia de cache actual.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 border-t pt-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Clase del Backend</p>
                            <p className="font-mono text-sm">{stats?.backend || '...'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Soporta Patrones (Delete Pattern)</p>
                            <p className="text-sm">{stats?.has_delete_pattern ? 'Sí (Avanzado)' : 'No (Básico)'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Prefijo de Llaves</p>
                            <p className="font-mono text-sm">{stats?.cache_prefix || 'Ninguno'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Estado Crítico</p>
                            <p className="text-sm font-semibold">
                                {stats?.connection_working
                                    ? 'Sistema Operativo y Optimizado'
                                    : stats?.error_details
                                        ? `Error: ${stats.error_details}`
                                        : 'Esperando configuración...'}
                            </p>
                        </div>
                    </div>

                    {!stats?.is_redis && stats?.connection_working && (
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mt-4">
                            <div className="flex items-start gap-3">
                                <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-blue-900">Modo Desarrollo Detectado</h4>
                                    <p className="text-sm text-blue-800">
                                        Estás usando el cache en memoria local. Para obtener el máximo rendimiento en producción
                                        (80% más rápido), asegúrate de activar el servicio de Redis en Render.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {stats?.error_details && (
                        <div className="bg-red-50 border border-red-200 p-4 rounded-lg mt-4">
                            <div className="flex items-start gap-3">
                                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-red-900">Error de Configuración</h4>
                                    <p className="text-sm font-mono text-red-800 mt-1">
                                        {stats.error_details}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
