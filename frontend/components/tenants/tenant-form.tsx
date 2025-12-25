"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Tenant } from "@/types/tenant"

interface TenantFormProps {
  tenant?: Tenant
  onSubmit: (tenant: Partial<Tenant>) => void
  onCancel: () => void
}

export function TenantForm({ tenant, onSubmit, onCancel }: TenantFormProps) {
  const [formData, setFormData] = useState<Partial<Tenant>>(
    tenant || {
      name: "",
      slug: "",
      status: "Trial",
      email: "",
      phone: "",
      primary_color: "#000000",
      secondary_color: "#FFFFFF",
    },
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (field: keyof Tenant, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
            placeholder="Acme Corporation"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => handleChange("slug", e.target.value)}
            required
            placeholder="acme-corp"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Trial">Trial</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Suspended">Suspended</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="contact@acme.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="+56 9 1234 5678"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="legal_name">Legal Name</Label>
          <Input
            id="legal_name"
            value={formData.legal_name}
            onChange={(e) => handleChange("legal_name", e.target.value)}
            placeholder="Acme Corporation S.A."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tax_id">Tax ID / RUT</Label>
          <Input
            id="tax_id"
            value={formData.tax_id}
            onChange={(e) => handleChange("tax_id", e.target.value)}
            placeholder="12.345.678-9"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="custom_domain">Custom Domain</Label>
          <Input
            id="custom_domain"
            value={formData.custom_domain}
            onChange={(e) => handleChange("custom_domain", e.target.value)}
            placeholder="acme.example.com"
          />
        </div>

        {/* Branding */}
        <div className="space-y-2">
          <Label htmlFor="primary_color">Primary Color</Label>
          <div className="flex gap-2">
            <Input
              id="primary_color"
              type="color"
              value={formData.primary_color}
              onChange={(e) => handleChange("primary_color", e.target.value)}
              className="w-16 h-10"
            />
            <Input
              value={formData.primary_color}
              onChange={(e) => handleChange("primary_color", e.target.value)}
              placeholder="#000000"
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="secondary_color">Secondary Color</Label>
          <div className="flex gap-2">
            <Input
              id="secondary_color"
              type="color"
              value={formData.secondary_color}
              onChange={(e) => handleChange("secondary_color", e.target.value)}
              className="w-16 h-10"
            />
            <Input
              value={formData.secondary_color}
              onChange={(e) => handleChange("secondary_color", e.target.value)}
              placeholder="#FFFFFF"
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subscription_plan">Subscription Plan</Label>
          <Input
            id="subscription_plan"
            value={formData.subscription_plan}
            onChange={(e) => handleChange("subscription_plan", e.target.value)}
            placeholder="Basic, Pro, Enterprise"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_products">Max Products</Label>
          <Input
            id="max_products"
            type="number"
            value={formData.max_products}
            onChange={(e) => handleChange("max_products", Number.parseInt(e.target.value))}
            placeholder="100"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{tenant ? "Update Tenant" : "Create Tenant"}</Button>
      </div>
    </form>
  )
}
