import React, { createContext, useState, useEffect } from 'react'
import * as SecureStore from 'expo-secure-store'
import { api } from '../api/axios'

// Описываем, что будет лежать в нашем глобальном контексте
interface AuthContextType {
    user: any | null
    setUser: (user: any | null) => void
    loadUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    setUser: () => {},
    loadUser: async () => {},
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null)

    // Функция для загрузки профиля с бэкенда
    const loadUser = async () => {
        try {
            // Проверяем, есть ли вообще токен
            const token = await SecureStore.getItemAsync('accessToken')
            if (token) {
                const response = await api.get('/auth/profile')
                setUser(response.data) // Сохраняем профиль глобально!
            }
        } catch (error) {
            console.error('Ошибка загрузки глобального профиля:', error)
        }
    }

    // Пытаемся загрузить юзера при самом первом запуске приложения
    useEffect(() => {
        loadUser()
    }, [])

    return (
        <AuthContext.Provider value={{ user, setUser, loadUser }}>{children}</AuthContext.Provider>
    )
}
