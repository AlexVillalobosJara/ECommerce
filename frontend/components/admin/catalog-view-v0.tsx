import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, AlertTriangle } from "lucide-react"
import Image from "next/image"

// Mock product data
const products = [
  {
    id: 1,
    name: "Mesa Roble Moderna",
    sku: "MES-001",
    stock: 15,
    price: "$899.00",
    image: "/wooden-table.png",
    isQuoteOnly: false,
    lowStock: false,
  },
  {
    id: 2,
    name: "Silla Ejecutiva Premium",
    sku: "SIL-045",
    stock: 3,
    price: "$349.00",
    image: "/ergonomic-office-chair.png",
    isQuoteOnly: false,
    lowStock: true,
  },
  {
    id: 3,
    name: "Escritorio Personalizado",
    sku: "ESC-CUSTOM",
    stock: 0,
    price: null,
    image: "/custom-desk.jpg",
    isQuoteOnly: true,
    lowStock: false,
  },
  {
    id: 4,
    name: "Estantería Minimalista",
    sku: "EST-MIN-01",
    stock: 22,
    price: "$599.00",
    image: "/minimalist-shelf.jpg",
    isQuoteOnly: false,
    lowStock: false,
  },
  {
    id: 5,
    name: "Mesa Comedor a Medida",
    sku: "MES-CUSTOM",
    stock: 0,
    price: null,
    image: "/elegant-dining-table.png",
    isQuoteOnly: true,
    lowStock: false,
  },
]

export function CatalogView() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Productos</h1>
          <p className="text-muted-foreground mt-2">Gestiona tu catálogo de productos</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Producto
        </Button>
      </div>

      {/* Products Grid */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Producto</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">SKU</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Stock</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Precio</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-6 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <Image
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground font-mono">{product.sku}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {product.lowStock && <AlertTriangle className="w-4 h-4 text-destructive" />}
                        <span className={product.lowStock ? "text-destructive font-medium" : ""}>
                          {product.isQuoteOnly ? "—" : product.stock}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {product.isQuoteOnly ? (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                          Solo Cotización
                        </Badge>
                      ) : (
                        <span className="font-semibold">{product.price}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm">
                        Ver
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
