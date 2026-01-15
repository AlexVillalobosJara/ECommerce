"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { UserBasicInfo } from "./user-basic-info"
import { UserPermissions } from "./user-permissions"
import { UserSettings } from "./user-settings"
import { getUser, createUser, updateUser } from "@/services/adminUserService"
import { toast } from "sonner"
import { AdminTenantUser, UserFormData } from "@/types/admin"

interface UserEditorProps {
  userId?: string
}

type UserFormState = UserFormData & {
  confirm_password?: string
}

export function UserEditor({ userId }: UserEditorProps) {
  const router = useRouter()

  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(!!userId)
  const [formData, setFormData] = useState<UserFormState>({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    confirm_password: "",
    role: "Operator",
    tenant: undefined // Can be set for superusers
  })
  const [isActive, setIsActive] = useState(true)

  const isEditing = !!userId

  useEffect(() => {
    async function loadUser() {
      if (userId) {
        try {
          setIsLoading(true)
          const tu = await getUser(userId)
          setFormData({
            username: tu.user.username || "",
            email: tu.user.email || "",
            first_name: tu.user.first_name || "",
            last_name: tu.user.last_name || "",
            role: tu.role,
            password: "",
            confirm_password: "",
          })
          setIsActive(tu.is_active)
        } catch (err: any) {
          toast.error("No se pudo cargar la información del usuario")
          router.push("/admin/users")
        } finally {
          setIsLoading(false)
        }
      }
    }
    loadUser()
  }, [userId, router, toast])

  const handleSave = async () => {
    // Basic validation
    if (!formData.username || !formData.email || !formData.first_name || !formData.last_name) {
      toast.error("Completa todos los campos obligatorios")
      return
    }

    if (!isEditing && !formData.password) {
      toast.error("La contraseña es obligatoria para nuevos usuarios")
      return
    }

    if (formData.password && formData.password !== formData.confirm_password) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    try {
      setIsSaving(true)

      const payload: UserFormData = {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        is_active: isActive,
      }

      if (formData.password) {
        payload.password = formData.password
      }

      if (isEditing) {
        await updateUser(userId, payload)
        toast.success("Usuario actualizado correctamente")
      } else {
        await createUser(payload)
        toast.success("Usuario creado correctamente")
      }

      router.push("/admin/users")
    } catch (err: any) {
      toast.error(err.message || "No se pudo guardar el usuario")
    } finally {
      setIsSaving(false)
    }
  }

  const updateFormData = (updates: Partial<UserFormState>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  const getUserDisplayName = () => {
    return formData.first_name || formData.last_name
      ? `${formData.first_name} ${formData.last_name}`.trim()
      : formData.username || null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-12">
      {/* Header */}
      <div className="bg-background border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/admin/users")} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-xl font-semibold">{isEditing ? "Editar Usuario" : "Nuevo Usuario"}</h1>
                {getUserDisplayName() && <p className="text-sm text-muted-foreground">{getUserDisplayName()}</p>}
              </div>
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <UserBasicInfo data={formData as any} onChange={updateFormData as any} isEditing={isEditing} />
            <UserPermissions data={formData as any} onChange={updateFormData as any} />
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            <UserSettings data={{ is_active: isActive }} onChange={(u) => setIsActive(u.is_active ?? true)} />

            {/* Preview Card */}
            <Card className="p-6 space-y-4 sticky top-24">
              <h3 className="font-semibold text-sm">Resumen</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Nombre Completo</p>
                  <p className="font-medium">
                    {getUserDisplayName() || <span className="text-muted-foreground">Sin nombre</span>}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Usuario</p>
                  <p className="font-medium font-mono">
                    {formData.username || <span className="text-muted-foreground">Sin usuario</span>}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Email</p>
                  <p className="font-medium">
                    {formData.email || <span className="text-muted-foreground">Sin email</span>}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Rol</p>
                  <p className="font-medium">
                    {formData.role === 'Owner' ? (
                      <span className="text-purple-600">Propietario</span>
                    ) : formData.role === 'Admin' ? (
                      <span className="text-blue-600">Administrador</span>
                    ) : (
                      <span className="text-orange-600">Operador</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Estado</p>
                  <p className="font-medium">
                    {isActive ? (
                      <span className="text-green-600">Activo</span>
                    ) : (
                      <span className="text-gray-600">Inactivo</span>
                    )}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
