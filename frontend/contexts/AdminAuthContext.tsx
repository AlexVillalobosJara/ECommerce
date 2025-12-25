"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { API_ENDPOINTS } from "@/config/api"

interface User {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    is_staff: boolean
    is_superuser: boolean
}

interface AuthContextType {
    user: User | null
    login: (username: string, password: string) => Promise<void>
    logout: () => Promise<void>
    isLoading: boolean
    getAccessToken: () => string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        // Check if user is authenticated on mount
        const checkAuth = async () => {
            const userData = localStorage.getItem("admin_user")
            const accessToken = localStorage.getItem("admin_access_token")

            if (userData && accessToken) {
                try {
                    setUser(JSON.parse(userData))
                } catch (error) {
                    console.error("Auth check failed:", error)
                    localStorage.removeItem("admin_user")
                    localStorage.removeItem("admin_access_token")
                    localStorage.removeItem("admin_refresh_token")
                }
            }
            setIsLoading(false)
        }

        checkAuth()
    }, [])

    const login = async (username: string, password: string) => {
        const response = await fetch(API_ENDPOINTS.ADMIN_LOGIN, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "Login failed")
        }

        const data = await response.json()

        // Store user data and JWT tokens
        localStorage.setItem("admin_user", JSON.stringify(data.user))
        localStorage.setItem("admin_access_token", data.access)
        localStorage.setItem("admin_refresh_token", data.refresh)

        setUser(data.user)
        router.push("/admin")
    }

    const logout = async () => {
        localStorage.removeItem("admin_user")
        localStorage.removeItem("admin_access_token")
        localStorage.removeItem("admin_refresh_token")
        setUser(null)
        router.push("/admin/login")
    }

    const getAccessToken = () => {
        return localStorage.getItem("admin_access_token")
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading, getAccessToken }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAdminAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAdminAuth must be used within AdminAuthProvider")
    }
    return context
}
