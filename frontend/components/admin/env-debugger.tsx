"use client"

import { useState, useEffect } from 'react'
import { API_BASE_URL } from '@/config/api'
import { supabase } from '@/lib/supabase'

export function EnvDebugger() {
    const [isVisible, setIsVisible] = useState(false)
    const [envData, setEnvData] = useState<any>({
        SUPABASE_URL_LEN: 0,
        SUPABASE_KEY_LEN: 0,
        API_URL: '',
        NODE_ENV: '',
        NEXT_PUBLIC_AVAILABLE: []
    })

    useEffect(() => {
        // Find all NEXT_PUBLIC keys in process.env (as much as Next.js allows)
        const keys = Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_'))

        setEnvData({
            SUPABASE_URL_LEN: (process.env.NEXT_PUBLIC_SUPABASE_URL || '').length,
            SUPABASE_KEY_LEN: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').length,
            SUPABASE_URL_PREFIX: (process.env.NEXT_PUBLIC_SUPABASE_URL || '').substring(0, 15),
            API_URL: API_BASE_URL,
            NODE_ENV: process.env.NODE_ENV,
            SUPABASE_CLIENT_EXISTS: !!supabase,
            NEXT_PUBLIC_AVAILABLE: keys
        })
    }, [])

    if (!isVisible) {
        return (
            <button
                onClick={() => setIsVisible(true)}
                className="fixed bottom-0 right-0 z-[9999] bg-red-600 text-white text-[10px] px-2 py-1 opacity-20 hover:opacity-100 transition-opacity"
            >
                DEBUG ENV
            </button>
        )
    }

    return (
        <div className="fixed bottom-4 right-4 z-[9999] bg-black/90 text-green-400 p-4 rounded-lg shadow-2xl font-mono text-xs max-w-md overflow-hidden border border-green-500/30">
            <div className="flex justify-between items-center mb-2 border-b border-green-500/30 pb-1">
                <span className="font-bold">SYSTEM DIAGNOSTICS</span>
                <button onClick={() => setIsVisible(false)} className="text-red-400 hover:text-red-300">[X]</button>
            </div>

            <div className="space-y-1">
                <p><span className="text-gray-400">NODE_ENV:</span> {envData.NODE_ENV}</p>
                <p><span className="text-gray-400">API_BASE_URL:</span> {envData.API_URL}</p>
                <div className="mt-2 text-blue-300 underline">SUPABASE CONFIG:</div>
                <p><span className="text-gray-400">URL Length:</span> {envData.SUPABASE_URL_LEN}</p>
                <p><span className="text-gray-400">Key Length:</span> {envData.SUPABASE_KEY_LEN}</p>
                <p><span className="text-gray-400">URL Starts:</span> {envData.SUPABASE_URL_PREFIX}...</p>
                <p><span className="text-gray-400">Client Init:</span> {envData.SUPABASE_CLIENT_EXISTS ? 'YES' : 'NO (NULL)'}</p>

                <div className="mt-2 text-blue-300 underline">DETECTED KEYS:</div>
                <ul className="list-disc list-inside">
                    {envData.NEXT_PUBLIC_AVAILABLE.length > 0 ? (
                        envData.NEXT_PUBLIC_AVAILABLE.map((k: string) => <li key={k}>{k}</li>)
                    ) : (
                        <li className="text-red-400">No NEXT_PUBLIC_ keys found (Inlined as undefined)</li>
                    )}
                </ul>
            </div>

            <div className="mt-4 text-[10px] text-gray-500 italic">
                Nota: Si no hay llaves detectadas, Vercel no las inyectó durante el build.
            </div>
        </div>
    )
}
