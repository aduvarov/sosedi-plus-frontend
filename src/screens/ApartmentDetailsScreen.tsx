import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native'
import { useRoute, RouteProp } from '@react-navigation/native'
import { RootStackParamList } from '../../App'
import { api } from '../api/axios'

type DetailsRouteProp = RouteProp<RootStackParamList, 'ApartmentDetails'>

// Описываем типы данных, которые придут с бэкенда
interface Transaction {
    id: number
    amount: number
    date: string
    description: string
    category?: { name: string }
}

interface ApartmentFullData {
    id: number
    number: number
    balance: number
    transactions: Transaction[]
}

export const ApartmentDetailsScreen = () => {
    const route = useRoute<DetailsRouteProp>()
    // Достаем переданные параметры
    const { apartmentId, apartmentNumber } = route.params

    const [data, setData] = useState<ApartmentFullData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchApartmentDetails()
    }, [])

    const fetchApartmentDetails = async () => {
        try {
            // Запрашиваем данные конкретной квартиры
            const response = await api.get(`/apartments/${apartmentId}`)
            setData(response.data)
        } catch (error) {
            console.error('Ошибка загрузки деталей:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const renderTransaction = ({ item }: { item: Transaction }) => {
        const isPositive = item.amount > 0

        return (
            <View style={styles.txCard}>
                <View style={styles.txInfo}>
                    <Text style={styles.txDescription}>{item.description || 'Операция'}</Text>
                    <Text style={styles.txDate}>
                        {new Date(item.date).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </Text>
                    {item.category && <Text style={styles.txCategory}>{item.category.name}</Text>}
                </View>

                <Text style={[styles.txAmount, { color: isPositive ? '#27AE60' : '#E74C3C' }]}>
                    {isPositive ? '+' : ''}
                    {item.amount} ₸
                </Text>
            </View>
        )
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
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Текущий баланс</Text>
                <Text
                    style={[
                        styles.headerBalance,
                        { color: (data?.balance || 0) < 0 ? '#E74C3C' : '#2C3E50' },
                    ]}>
                    {data?.balance} ₸
                </Text>
            </View>

            <Text style={styles.sectionTitle}>История операций</Text>

            <FlatList
                data={data?.transactions || []}
                keyExtractor={item => item.id.toString()}
                renderItem={renderTransaction}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={<Text style={styles.emptyText}>Операций пока нет</Text>}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        backgroundColor: '#FFF',
        padding: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E6ED',
    },
    headerTitle: { fontSize: 14, color: '#7F8C8D', textTransform: 'uppercase', marginBottom: 5 },
    headerBalance: { fontSize: 32, fontWeight: 'bold' },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2C3E50',
        margin: 20,
        marginBottom: 10,
    },
    list: { paddingHorizontal: 20, paddingBottom: 30 },
    txCard: {
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    txInfo: { flex: 1, paddingRight: 10 },
    txDescription: { fontSize: 16, fontWeight: '600', color: '#2C3E50', marginBottom: 4 },
    txDate: { fontSize: 12, color: '#95A5A6', marginBottom: 4 },
    txCategory: { fontSize: 12, color: '#3498DB', fontWeight: '500' },
    txAmount: { fontSize: 16, fontWeight: 'bold' },
    emptyText: { textAlign: 'center', color: '#7F8C8D', marginTop: 20 },
})
