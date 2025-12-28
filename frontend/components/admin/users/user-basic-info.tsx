"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface UserBasicInfoProps {
  data: {
    username: string
    email: string
    first_name: string
    last_name: string
    password: string
    confirm_password: string
  }
  onChange: (updates: Partial<UserBasicInfoProps["data"]>) => void
  isEditing: boolean
}

export function UserBasicInfo({ data, onChange, isEditing }: UserBasicInfoProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información Básica</CardTitle>
        <CardDescription>Datos personales y credenciales del usuario</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Username and Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="username">
              Usuario <span className="text-destructive">*</span>
            </Label>
            <Input
              id="username"
              placeholder="nombre.apellido"
              value={data.username}
              onChange={(e) => onChange({ username: e.target.value })}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">Debe ser único en el sistema</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@zumi.com"
              value={data.email}
              onChange={(e) => onChange({ email: e.target.value })}
            />
          </div>
        </div>

        {/* First and Last Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="first_name"
              placeholder="Juan"
              value={data.first_name}
              onChange={(e) => onChange({ first_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">
              Apellido <span className="text-destructive">*</span>
            </Label>
            <Input
              id="last_name"
              placeholder="Pérez"
              value={data.last_name}
              onChange={(e) => onChange({ last_name: e.target.value })}
            />
          </div>
        </div>

        {/* Password Section */}
        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-medium mb-4">{isEditing ? "Cambiar Contraseña (opcional)" : "Contraseña"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">
                {isEditing ? "Nueva Contraseña" : "Contraseña"}{" "}
                {!isEditing && <span className="text-destructive">*</span>}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={data.password}
                  onChange={(e) => onChange({ password: e.target.value })}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Debe tener al menos 8 caracteres</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">
                Confirmar Contraseña {!isEditing && <span className="text-destructive">*</span>}
              </Label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repite la contraseña"
                  value={data.confirm_password}
                  onChange={(e) => onChange({ confirm_password: e.target.value })}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
