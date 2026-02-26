import React, { useContext, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { api } from '../api/axios'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../App' // Путь к типам из App.tsx

export const LoginScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
    const { loadUser } = useContext(AuthContext)
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleLogin = async () => {
        if (!phone || !password) {
            Alert.alert('Ошибка', 'Пожалуйста, заполните все поля')
            return
        }

        setIsLoading(true)
        try {
            // Отправляем запрос на наш NestJS бэкенд
            const response = await api.post('/auth/login', {
                phone,
                password,
            })

            const { accessToken, refreshToken } = response.data

            // Надежно сохраняем токены в памяти устройства
            await SecureStore.setItemAsync('accessToken', accessToken)
            await SecureStore.setItemAsync('refreshToken', refreshToken)

            // Загружаем профиль в глобальный стейт перед переходом на главную!
            await loadUser()
        } catch (error: any) {
            // Обрабатываем ошибку от сервера (например, неверный пароль)
            const message = error.response?.data?.message || 'Что-то пошло не так при входе'
            Alert.alert('Ошибка авторизации', message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Соседи+</Text>
            <Text style={styles.subtitle}>Вход в систему</Text>

            <TextInput
                style={styles.input}
                placeholder="Номер телефона"
                placeholderTextColor="#95A5A6"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Пароль"
                placeholderTextColor="#95A5A6"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
                {isLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Войти</Text>
                )}
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#F5F7FA',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2C3E50',
        textAlign: 'center',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: '#7F8C8D',
        textAlign: 'center',
        marginBottom: 30,
    },
    input: {
        backgroundColor: '#FFF',
        padding: 18, // Чуть больше места для текста
        borderRadius: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#E0E6ED',
        fontSize: 16,
        color: '#2C3E50', // Цвет вводимого текста
        // Легкая тень для объема
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    button: {
        backgroundColor: '#3498DB',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
})
