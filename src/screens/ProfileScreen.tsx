import React, { useContext } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../App'
import { AuthContext } from '../context/AuthContext' // Импортируем контекст

export const ProfileScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

    // Достаем юзера прямо из глобальной памяти!
    const { user, setUser } = useContext(AuthContext)

    const handleLogout = async () => {
        await SecureStore.deleteItemAsync('accessToken')
        await SecureStore.deleteItemAsync('refreshToken')

        setUser(null) // Очищаем глобальный стейт при выходе

        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        })
    }

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.label}>Телефон</Text>
                <Text style={styles.value}>{user?.phone || 'Загрузка...'}</Text>

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

// ... стили остаются прежними ...

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
