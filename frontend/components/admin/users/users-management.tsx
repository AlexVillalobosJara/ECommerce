"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Search, User, Shield, UserCog, Mail, Calendar, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getUsers, deleteUser } from "@/services/adminUserService"
import { AdminTenantUser } from "@/types/admin"
import { useToast } from "@/hooks/use-toast"
import { useAdminAuth } from "@/contexts/AdminAuthContext"

export function UsersManagement() {
  const [users, setUsers] = useState<AdminTenantUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const router = useRouter()
  const { toast } = useToast()
  const { user: currentUser } = useAdminAuth()

  const isOperator = currentUser?.role === 'Operator'

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const data = await getUsers()
      // Handle paginated response
      const userList = Array.isArray(data) ? data : ((data as any).results || [])
      setUsers(userList)
      setError(null)
    } catch (err: any) {
      console.error("Error fetching users:", err)
      setError(err.message || "Error al cargar los usuarios")
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleCreateUser = () => {
    router.push("/admin/users/new")
  }

  const handleEditUser = (userId: string) => {
    router.push(`/admin/users/${userId}`)
  }

  const handleDeleteUser = async (userId: string) => {
    if (confirm("¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.")) {
      try {
        await deleteUser(userId)
        setUsers(users.filter((u) => u.id !== userId))
        toast({
          title: "Éxito",
          description: "Usuario eliminado correctamente",
        })
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "No se pudo eliminar el usuario",
          variant: "destructive",
        })
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-CL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Owner':
        return <Badge className="bg-purple-50 text-purple-700 border-purple-200">Propietario</Badge>
      case 'Admin':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Administrador</Badge>
      case 'Operator':
        return <Badge className="bg-orange-50 text-orange-700 border-orange-200">Operador</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const filteredUsers = users.filter((u: AdminTenantUser) => {
    const { user } = u
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole =
      roleFilter === "all" || u.role === roleFilter

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && u.is_active) ||
      (statusFilter === "inactive" && !u.is_active)

    return matchesSearch && matchesRole && matchesStatus
  })

  const stats = {
    total: users.length,
    owners: users.filter((u: AdminTenantUser) => u.role === 'Owner').length,
    admins: users.filter((u: AdminTenantUser) => u.role === 'Admin').length,
    active: users.filter((u: AdminTenantUser) => u.is_active).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-2">Administra los usuarios del sistema y sus permisos</p>
        </div>
        {!isOperator && (
          <Button onClick={handleCreateUser} className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Usuario
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Usuarios</p>
                <p className="text-3xl font-bold mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Propietarios</p>
                <p className="text-3xl font-bold mt-1">{stats.owners}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Administradores</p>
                <p className="text-3xl font-bold mt-1">{stats.admins}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <UserCog className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Activos</p>
                <p className="text-3xl font-bold mt-1">{stats.active}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                <User className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, usuario o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Estados</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Tabs value={roleFilter} onValueChange={setRoleFilter}>
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="Owner">Propietarios</TabsTrigger>
                <TabsTrigger value="Admin">Admin</TabsTrigger>
                <TabsTrigger value="Operator">Operadores</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Usuario</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Contacto</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Rol</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Estado</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Fechas</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-6 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span>Cargando usuarios...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((tu: AdminTenantUser) => (
                    <tr key={tu.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm ${tu.role === 'Owner'
                              ? "bg-purple-50 text-purple-600"
                              : tu.role === 'Admin'
                                ? "bg-blue-50 text-blue-600"
                                : "bg-orange-50 text-orange-600"
                              }`}
                          >
                            {tu.user.first_name?.[0] || '?'}
                            {tu.user.last_name?.[0] || '?'}
                          </div>
                          <div>
                            <div className="font-medium">
                              {tu.user.first_name} {tu.user.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground font-mono">@{tu.user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">{tu.user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getRoleBadge(tu.role)}</td>
                      <td className="px-6 py-4">
                        <Badge variant={tu.is_active ? "default" : "secondary"}>
                          {tu.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>Registrado: {formatDate(tu.user.date_joined)}</span>
                          </div>
                          {tu.user.last_login && (
                            <div className="text-xs text-muted-foreground">
                              Último acceso: {formatDateTime(tu.user.last_login)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {!isOperator && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleEditUser(tu.id)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(tu.id)}
                                className="text-destructive hover:text-destructive"
                                disabled={tu.role === 'Owner'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && !isLoading && (
        <div className="text-center py-12 text-destructive">
          <p>{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchUsers}>
            Reintentar
          </Button>
        </div>
      )}
    </div>
  )
}
