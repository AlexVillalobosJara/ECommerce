"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DEFAULT_PRIVACY_POLICY, DEFAULT_TERMS_AND_CONDITIONS, formatPolicy } from "@/config/default-policies"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"

interface TenantGeneralSettingsProps {
    data: any
    onChange: (updates: any) => void
}

export function TenantGeneralSettings({ data, onChange }: TenantGeneralSettingsProps) {

    // Helper to generate preview
    const getPolicyPreview = (type: 'privacy' | 'terms') => {
        if (type === 'privacy') {
            return formatPolicy(DEFAULT_PRIVACY_POLICY, data);
        }
        if (type === 'terms') {
            return formatPolicy(DEFAULT_TERMS_AND_CONDITIONS, data);
        }
        return "Plantilla no disponible";
    }

    const loadTemplate = (type: 'privacy' | 'terms') => {
        if (type === 'privacy') {
            const text = formatPolicy(DEFAULT_PRIVACY_POLICY, data);
            onChange({ privacy_policy_text: text, privacy_policy_mode: 'Custom' });
        }
        if (type === 'terms') {
            const text = formatPolicy(DEFAULT_TERMS_AND_CONDITIONS, data);
            onChange({ terms_policy_text: text, terms_policy_mode: 'Custom' });
        }
    }

    return (
        <div className="space-y-6">
            {/* Store Preferences */}
            <Card>
                <CardHeader>
                    <CardTitle>Preferencias de Tienda</CardTitle>
                    <CardDescription>
                        Controla el comportamiento y visualización de tu tienda.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Precios incluyen IVA</Label>
                            <p className="text-sm text-muted-foreground">
                                Si está activo, los precios mostrados incluirán el impuesto.
                            </p>
                        </div>
                        <Switch
                            checked={data.prices_include_tax}
                            onCheckedChange={(checked) => onChange({ prices_include_tax: checked })}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Mostrar Calificaciones</Label>
                            <p className="text-sm text-muted-foreground">
                                Mostrar estrellas y promedios de calificación en productos.
                            </p>
                        </div>
                        <Switch
                            checked={data.show_product_ratings}
                            onCheckedChange={(checked) => onChange({ show_product_ratings: checked })}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Permitir Reseñas</Label>
                            <p className="text-sm text-muted-foreground">
                                Permitir a los clientes dejar reseñas en los productos.
                            </p>
                        </div>
                        <Switch
                            checked={data.allow_reviews}
                            onCheckedChange={(checked) => onChange({ allow_reviews: checked })}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Productos Relacionados</Label>
                            <p className="text-sm text-muted-foreground">
                                Mostrar sección de productos relacionados en el detalle.
                            </p>
                        </div>
                        <Switch
                            checked={data.show_related_products}
                            onCheckedChange={(checked) => onChange({ show_related_products: checked })}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Policies Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle>Configuración de Políticas</CardTitle>
                    <CardDescription>
                        Define las variables para generar tus políticas legales automáticamente.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Días de Despacho (Estimado)</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={data.shipping_days_min || 3}
                                    onChange={(e) => onChange({ shipping_days_min: parseInt(e.target.value) })}
                                    className="w-20"
                                />
                                <span className="text-sm">a</span>
                                <Input
                                    type="number"
                                    value={data.shipping_days_max || 7}
                                    onChange={(e) => onChange({ shipping_days_max: parseInt(e.target.value) })}
                                    className="w-20"
                                />
                                <span className="text-sm">días hábiles</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Ventana de Devolución</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={data.return_window_days || 30}
                                    onChange={(e) => onChange({ return_window_days: parseInt(e.target.value) })}
                                    className="w-24"
                                />
                                <span className="text-sm">días corridos</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Costo de Envío por Devolución</Label>
                            <Select
                                value={data.return_shipping_cost_cover || 'Customer'}
                                onValueChange={(val) => onChange({ return_shipping_cost_cover: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Customer">Paga el Cliente</SelectItem>
                                    <SelectItem value="Company">Paga la Empresa (Gratis)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Garantía Legal/Fabrica</Label>
                            <Input
                                placeholder="Ej: 6 meses"
                                value={data.warranty_period || '6 meses'}
                                onChange={(e) => onChange({ warranty_period: e.target.value })}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Policies Texts */}
            <Card>
                <CardHeader>
                    <CardTitle>Textos Legales</CardTitle>
                    <CardDescription>
                        Personaliza o utiliza nuestras plantillas predeterminadas.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Privacy Policy */}
                    <div className="space-y-4 pt-4 border-t first:border-t-0">
                        <div className="flex flex-col space-y-2">
                            <Label className="text-base">Política de Privacidad</Label>
                            <Select
                                value={data.privacy_policy_mode || 'Default'}
                                onValueChange={(val) => onChange({ privacy_policy_mode: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione modo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Default">Usar plantilla predeterminada</SelectItem>
                                    <SelectItem value="Custom">Texto personalizado</SelectItem>
                                    <SelectItem value="Url">URL externa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {data.privacy_policy_mode === 'Default' && (
                            <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground whitespace-pre-wrap max-h-[200px] overflow-y-auto border">
                                <p className="font-semibold mb-2 flex items-center gap-2">
                                    <Eye className="w-3 h-3" /> Vista previa:
                                </p>
                                {getPolicyPreview('privacy')}
                                <div className="mt-3">
                                    <Button variant="outline" size="sm" onClick={() => loadTemplate('privacy')}>
                                        Editar como personalizado
                                    </Button>
                                </div>
                            </div>
                        )}

                        {(data.privacy_policy_mode === 'Custom' || data.privacy_policy_mode === 'Url') && (
                            <Textarea
                                placeholder={data.privacy_policy_mode === 'Url' ? "https://..." : "Ingrese el texto completo de su política..."}
                                value={data.privacy_policy_text || ''}
                                onChange={(e) => onChange({ privacy_policy_text: e.target.value })}
                                className="min-h-[150px]"
                            />
                        )}
                    </div>

                    {/* Terms & Conditions (Replacing Refund Policy) */}
                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex flex-col space-y-2">
                            <Label className="text-base">Términos y Condiciones de Uso</Label>
                            <Select
                                value={data.terms_policy_mode || 'Default'}
                                onValueChange={(val) => onChange({ terms_policy_mode: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione modo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Default">Usar plantilla predeterminada</SelectItem>
                                    <SelectItem value="Custom">Texto personalizado</SelectItem>
                                    <SelectItem value="Url">URL externa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {data.terms_policy_mode === 'Default' && (
                            <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground whitespace-pre-wrap max-h-[200px] overflow-y-auto border">
                                <p className="font-semibold mb-2 flex items-center gap-2">
                                    <Eye className="w-3 h-3" /> Vista previa (se rellenará con tus datos):
                                </p>
                                {getPolicyPreview('terms')}
                                <div className="mt-3">
                                    <Button variant="outline" size="sm" onClick={() => loadTemplate('terms')}>
                                        Editar como personalizado
                                    </Button>
                                </div>
                            </div>
                        )}

                        {(data.terms_policy_mode === 'Custom' || data.terms_policy_mode === 'Url') && (
                            <Textarea
                                placeholder={data.terms_policy_mode === 'Url' ? "https://..." : "Ingrese el texto completo de sus términos..."}
                                value={data.terms_policy_text || ''}
                                onChange={(e) => onChange({ terms_policy_text: e.target.value })}
                                className="min-h-[150px]"
                            />
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Institutional Content */}
            <Card>
                <CardHeader>
                    <CardTitle>Contenido Institucional</CardTitle>
                    <CardDescription>
                        Textos para las páginas de "Quiénes Somos", "Misión", etc. Dejar en blanco para ocultar.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Acerca de Nosotros / Quiénes Somos</Label>
                        <Textarea
                            placeholder="Descripción general de la empresa..."
                            value={data.about_us_text || ''}
                            onChange={(e) => onChange({ about_us_text: e.target.value })}
                            className="min-h-[100px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Nuestra Historia</Label>
                        <Textarea
                            placeholder="Breve historia de la compañía..."
                            value={data.our_history_text || ''}
                            onChange={(e) => onChange({ our_history_text: e.target.value })}
                            className="min-h-[100px]"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Misión</Label>
                            <Textarea
                                placeholder="Nuestra misión es..."
                                value={data.mission_text || ''}
                                onChange={(e) => onChange({ mission_text: e.target.value })}
                                className="min-h-[100px]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Visión</Label>
                            <Textarea
                                placeholder="Nuestra visión es..."
                                value={data.vision_text || ''}
                                onChange={(e) => onChange({ vision_text: e.target.value })}
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Preguntas Frecuentes (FAQ)</Label>
                        <Textarea
                            placeholder="Texto o HTML simple para FAQ..."
                            value={data.faq_text || ''}
                            onChange={(e) => onChange({ faq_text: e.target.value })}
                            className="min-h-[150px]"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
