import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from './supabaseClient'
import { data } from "react-router-dom";

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Ao abrir o site, verifica se já existe uma sessão salva
        supabase.auth.getSession().then(({data}) => {
            setUser(data.session?.user ?? null)
            setLoading(false)
        })

        // Fica "escutando" entrar e sair
        const { data: listener } = supabase.auth.onAuthStateChange(
            (_evento, session) => {
                setUser(session?.user ?? null)
            }
        )

        return () => listener.subscription.unsubscribe()
    }, [])

    return (
        <AuthContext.Provider value={{user, loading}}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}