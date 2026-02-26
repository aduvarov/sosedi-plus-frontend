import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../App'
import React, { useState, useCallback } from 'react'
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

// 1. Обновленный интерфейс (теперь разделяем баланс на кошелек и долги)
interface Apartment {
    id: number
    number: number
    walletBalance: number
    totalDebt: number
}

const numColumns = 3
const screenWidth = Dimensions.get('window').width
const cardMargin = 5
const cardSize = (screenWidth - 40) / numColumns - cardMargin * 2

export const HomeScreen = () => {
    const [apartments, setApartments] = useState<Apartment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

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

    // 2. Новая отрисовка карточки
    const renderApartment = ({ item }: { item: Apartment }) => {
        const hasDebt = item.totalDebt > 0
        const notEnoughMoney = item.walletBalance < item.totalDebt

        // Логика цвета фона
        let cardBackgroundColor //= '#FFF' // По умолчанию белый (по нулям)

        if (hasDebt && notEnoughMoney) {
            cardBackgroundColor = '#f7c8c8' // Красный: Долг есть, денег не хватает
        } else if (hasDebt && !notEnoughMoney) {
            cardBackgroundColor = '#d3f0df' // Желтый: Долг есть, но денег в кошельке хватает (НАДО ЗАЙТИ И ОПЛАТИТЬ)
        } else if (item.walletBalance > 0) {
            cardBackgroundColor = '#cdeedc' // Зеленый: Долгов нет, есть переплата
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
                {/* 1. Номер сверху */}
                <Text style={styles.aptNumber}>кв. {item.number}</Text>

                {/* 2. Кошелек по центру (Зеленый) */}
                <View style={styles.balanceContainer}>
                    <Text style={styles.walletLabel}>В кошельке:</Text>
                    <Text style={[styles.aptBalance, { color: '#27AE60' }]}>
                        {item.walletBalance} ₸
                    </Text>
                </View>

                {/* 3. Долг внизу (Красный) - Показываем только если есть долг */}
                {hasDebt ? (
                    <View style={styles.debtContainer}>
                        <Text style={styles.debtLabel}>СЧЕТОВ НА:</Text>
                        <Text style={styles.aptDebt}>{item.totalDebt} ₸</Text>
                    </View>
                ) : (
                    // Пустая заглушка, чтобы верстка не прыгала
                    <View style={styles.debtContainer} />
                )}
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
            <FlatList
                data={apartments}
                keyExtractor={item => item.id.toString()}
                renderItem={renderApartment}
                numColumns={numColumns}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
    },
    listContainer: { padding: 20, paddingBottom: 40 },
    card: {
        width: cardSize,
        height: cardSize,
        margin: cardMargin,
        borderRadius: 12,
        justifyContent: 'space-between', // Распределяем элементы по вертикали
        alignItems: 'center',
        paddingVertical: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    aptNumber: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50' },

    balanceContainer: { alignItems: 'center' },
    walletLabel: { fontSize: 10, color: '#7F8C8D', textTransform: 'uppercase' },
    aptBalance: { fontSize: 16, fontWeight: 'bold' },

    debtContainer: { alignItems: 'center', height: 30, justifyContent: 'flex-end' },
    debtLabel: {
        fontSize: 10,
        color: '#E74C3C',
        textTransform: 'uppercase',
    },
    aptDebt: { fontSize: 14, fontWeight: 'bold', color: '#E74C3C' },

    loadingText: { marginTop: 10, color: '#7F8C8D' },
    errorText: { color: '#E74C3C', fontSize: 16, marginBottom: 15 },
    retryButton: {
        backgroundColor: '#3498DB',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryText: { color: '#FFF', fontWeight: 'bold' },
})
