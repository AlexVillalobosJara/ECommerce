"use client"

import { cn } from "@/lib/utils"

interface TechnicalSpecsProps {
    specifications: Record<string, string>
    className?: string
}

export function TechnicalSpecs({ specifications, className }: TechnicalSpecsProps) {
    if (!specifications || Object.keys(specifications).length === 0) {
        return null
    }

    return (
        <section className={cn("mt-12", className)}>
            <h3 className="text-xl font-serif mb-6">Ficha Técnica</h3>
            <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <tbody className="divide-y">
                        {Object.entries(specifications).map(([key, value], index) => (
                            <tr key={key} className={cn(
                                "divide-x",
                                index % 2 === 0 ? "bg-muted/30" : "bg-white"
                            )}>
                                <td className="p-3 font-medium text-muted-foreground w-1/3 md:w-1/4 bg-muted/10">
                                    {key}
                                </td>
                                <td className="p-3 text-foreground">
                                    {value}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}
