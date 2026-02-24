import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { api } from '../api/axios'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../App'

export const ProfileScreen = () => {
    const [user, setUser] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            const response = await api.get('/auth/profile')
            setUser(response.data)
        } catch (error) {
            console.error('Ошибка при загрузке профиля:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = async () => {
        // 1. Удаляем токены из хранилища
        await SecureStore.deleteItemAsync('accessToken')
        await SecureStore.deleteItemAsync('refreshToken')

        // 2. Полностью сбрасываем историю навигации и кидаем на экран Login
        // (чтобы нельзя было нажать системную кнопку "Назад" и вернуться)
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        })
    }

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#3498DB" />
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.label}>Телефон</Text>
                <Text style={styles.value}>{user?.phone}</Text>

                <Text style={styles.label}>Роль в системе</Text>
                <Text style={styles.value}>
                    {user?.role === 'ADMIN' ? '👑 Управдом' : '👤 Сосед'}
                </Text>

                {user?.apartmentId && (
                    <>
                        <Text style={styles.label}>Привязанная квартира</Text>
                        <Text style={styles.value}>№ {user?.apartmentId}</Text>
                    </>
                )}
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Выйти из аккаунта</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#F5F7FA' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 12,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    label: { fontSize: 14, color: '#7F8C8D', marginBottom: 5, marginTop: 15 },
    value: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
    logoutButton: {
        backgroundColor: '#E74C3C',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    logoutText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
})
