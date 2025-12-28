"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Shield, UserCog, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAdminAuth } from "@/contexts/AdminAuthContext"
import { cn } from "@/lib/utils"

interface UserPermissionsProps {
  data: {
    role: 'Owner' | 'Admin' | 'Operator'
  }
  onChange: (updates: Partial<UserPermissionsProps["data"]>) => void
}

export function UserPermissions({ data, onChange }: UserPermissionsProps) {
  const { user: currentUser } = useAdminAuth()
  const canAssignOwner = currentUser?.is_superuser || currentUser?.role === 'Owner'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permisos y Roles</CardTitle>
        <CardDescription>Configura los permisos y nivel de acceso del usuario</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={data.role}
          onValueChange={(value) => onChange({ role: value as any })}
          className="grid gap-4"
        >
          {/* Owner Role */}
          {canAssignOwner && (
            <div className={cn(
              "flex items-start gap-4 p-4 border border-border rounded-lg transition-colors hover:bg-muted/50"
            )}>
              <RadioGroupItem
                value="Owner"
                id="role-owner"
                className="mt-1"
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <Label htmlFor="role-owner" className="text-base font-medium">
                    Propietario (Owner)
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Acceso total al sistema. Puede gestionar usuarios, configuración y todos los módulos. Solo los Propietarios pueden crear otros Propietarios.
                </p>
              </div>
            </div>
          )}

          {/* Admin Role */}
          <div className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="Admin" id="role-admin" className="mt-1" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <UserCog className="w-5 h-5 text-blue-600" />
                <Label htmlFor="role-admin" className="text-base font-medium">
                  Administrador (Admin)
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Acceso administrativo completo al tenant. Puede gestionar catálogos, pedidos y otros usuarios (excepto Propietarios).
              </p>
            </div>
          </div>

          {/* Operator Role */}
          <div className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="Operator" id="role-operator" className="mt-1" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <Label htmlFor="role-operator" className="text-base font-medium">
                  Operador (Operator)
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Acceso limitado. Puede ver información y realizar operaciones del día a día, pero tiene restringido el acceso a configuraciones críticas.
              </p>
            </div>
          </div>
        </RadioGroup>

        {data.role === 'Owner' && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              El rol de Propietario tiene permisos máximos. Ten precaución al asignar este rol.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
