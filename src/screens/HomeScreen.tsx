import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../App'
import React, { useEffect, useState, useCallback } from 'react'
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    TouchableOpacity,
    Dimensions,
} from 'react-native'
import { api } from '../api/axios'

// 1. Описываем, как выглядит квартира из нашего бэкенда
interface Apartment {
    id: number
    number: number
    balance: number
}

// Высчитываем ширину экрана, чтобы сделать красивые квадратные карточки
const numColumns = 3
const screenWidth = Dimensions.get('window').width
const cardMargin = 5
const cardSize = (screenWidth - 40) / numColumns - cardMargin * 2 // 40 - это padding контейнера

export const HomeScreen = () => {
    const [apartments, setApartments] = useState<Apartment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

    // Этот хук будет дергать API каждый раз, когда мы возвращаемся на этот экран
    useFocusEffect(
        useCallback(() => {
            fetchApartments()
        }, []),
    )

    const fetchApartments = async () => {
        try {
            setIsLoading(true)
            setError(null)
            const response = await api.get('/apartments')
            setApartments(response.data)
        } catch (err: any) {
            console.error('Ошибка при загрузке квартир:', err.response?.data || err.message)
            setError('Не удалось загрузить данные с сервера')
        } finally {
            setIsLoading(false)
        }
    }

    // 2. Функция для отрисовки одной карточки
    const renderApartment = ({ item }: { item: Apartment }) => {
        // Определяем цвет карточки в зависимости от баланса
        let cardBackgroundColor = '#FFF' // Белый по умолчанию (баланс 0)
        let balanceColor = '#7F8C8D' // Серый текст

        if (item.balance < 0) {
            cardBackgroundColor = '#FDEDEC' // Нежно-красный фон
            balanceColor = '#E74C3C' // Ярко-красный текст
        } else if (item.balance > 0) {
            cardBackgroundColor = '#EAFAF1' // Нежно-зеленый фон
            balanceColor = '#27AE60' // Ярко-зеленый текст
        }

        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: cardBackgroundColor }]}
                onPress={() =>
                    navigation.navigate('ApartmentDetails', {
                        apartmentId: item.id,
                        apartmentNumber: item.number,
                    })
                }>
                <Text style={styles.aptNumber}>кв. {item.number}</Text>
                <Text style={[styles.aptBalance, { color: balanceColor }]}>{item.balance} ₸</Text>
            </TouchableOpacity>
        )
    }

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#3498DB" />
                <Text style={styles.loadingText}>Загрузка списка квартир...</Text>
            </View>
        )
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchApartments}>
                    <Text style={styles.retryText}>Повторить</Text>
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            {/* 3. Магия FlatList */}
            <FlatList
                data={apartments}
                keyExtractor={item => item.id.toString()}
                renderItem={renderApartment}
                numColumns={numColumns} // Строим в 3 колонки!
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
    },
    listContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    card: {
        width: cardSize,
        height: cardSize,
        margin: cardMargin,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        // Тень для iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        // Тень для Android
        elevation: 3,
    },
    aptNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 8,
    },
    aptBalance: {
        fontSize: 14,
        fontWeight: '600',
    },
    loadingText: {
        marginTop: 10,
        color: '#7F8C8D',
    },
    errorText: {
        color: '#E74C3C',
        fontSize: 16,
        marginBottom: 15,
    },
    retryButton: {
        backgroundColor: '#3498DB',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
})
