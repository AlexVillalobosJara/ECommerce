"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

interface AdminUIContextType {
    title: string | null
    description: string | null
    setTitle: (title: string | null) => void
    setDescription: (description: string | null) => void
}

const AdminUIContext = createContext<AdminUIContextType | undefined>(undefined)

export function AdminUIProvider({ children }: { children: ReactNode }) {
    const [title, setTitle] = useState<string | null>(null)
    const [description, setDescription] = useState<string | null>(null)

    return (
        <AdminUIContext.Provider value={{ title, description, setTitle, setDescription }}>
            {children}
        </AdminUIContext.Provider>
    )
}

export function useAdminUI() {
    const context = useContext(AdminUIContext)
    if (context === undefined) {
        throw new Error("useAdminUI must be used within an AdminUIProvider")
    }
    return context
}
