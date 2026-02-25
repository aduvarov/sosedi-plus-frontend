import React, { createContext, useState, useEffect } from 'react'
import * as SecureStore from 'expo-secure-store'
import { api } from '../api/axios'

interface AuthContextType {
    user: any | null
    setUser: (user: any | null) => void
    loadUser: () => Promise<void>
    isLoading: boolean // <-- НОВОЕ ПОЛЕ
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    setUser: () => {},
    loadUser: async () => {},
    isLoading: true, // <-- ПО УМОЛЧАНИЮ TRUE
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true) // <-- СОСТОЯНИЕ ЗАГРУЗКИ

    const loadUser = async () => {
        try {
            const token = await SecureStore.getItemAsync('accessToken')
            if (token) {
                const response = await api.get('/auth/profile')
                setUser(response.data)
            }
        } catch (error: any) {
            if (error.response?.status === 401) {
                await SecureStore.deleteItemAsync('accessToken')
                await SecureStore.deleteItemAsync('refreshToken')
                setUser(null)
            }
        } finally {
            setIsLoading(false) // <-- КОГДА ПРОВЕРКА ЗАКОНЧЕНА, ВЫКЛЮЧАЕМ ЗАГРУЗКУ
        }
    }

    useEffect(() => {
        loadUser()
    }, [])

    return (
        <AuthContext.Provider value={{ user, setUser, loadUser, isLoading }}>
            {children}
        </AuthContext.Provider>
    )
}
