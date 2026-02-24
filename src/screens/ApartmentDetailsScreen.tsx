import React, { useEffect, useState, useContext } from 'react'
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
} from 'react-native'
import { useRoute, RouteProp } from '@react-navigation/native'
import { RootStackParamList } from '../../App'
import { api } from '../api/axios'
import { AuthContext } from '../context/AuthContext' // <-- Импортируем контекст!

type DetailsRouteProp = RouteProp<RootStackParamList, 'ApartmentDetails'>

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
    const { apartmentId, apartmentNumber } = route.params

    // Достаем пользователя, чтобы проверить его права
    const { user } = useContext(AuthContext)

    const [data, setData] = useState<ApartmentFullData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Состояния для модального окна добавления операции
    const [isModalVisible, setModalVisible] = useState(false)
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        fetchApartmentDetails()
    }, [])

    const fetchApartmentDetails = async () => {
        try {
            const response = await api.get(`/apartments/${apartmentId}`)
            setData(response.data)
        } catch (error) {
            console.error('Ошибка загрузки деталей:', error)
        } finally {
            setIsLoading(false)
        }
    }

    // Функция для отправки транзакции на бэкенд
    const handleAddTransaction = async (type: 'PAYMENT' | 'CHARGE') => {
        const numAmount = parseFloat(amount)
        if (isNaN(numAmount) || numAmount <= 0) {
            Alert.alert('Ошибка', 'Введите корректную сумму больше нуля')
            return
        }

        try {
            setIsSubmitting(true)

            // Если это долг (CHARGE), отправляем число с минусом, если оплата (PAYMENT) — с плюсом
            const finalAmount = type === 'CHARGE' ? -numAmount : numAmount
            const defaultDesc = type === 'CHARGE' ? 'Начисление' : 'Оплата'

            await api.post('/transactions', {
                amount: finalAmount,
                description: description.trim() || defaultDesc,
                apartmentId: apartmentId,
                categoryId: 1, // В будущем здесь можно сделать выпадающий список категорий
            })

            // Закрываем модалку, очищаем поля и заново запрашиваем данные квартиры (чтобы обновился баланс!)
            setModalVisible(false)
            setAmount('')
            setDescription('')
            await fetchApartmentDetails()
        } catch (error: any) {
            Alert.alert('Ошибка', error.response?.data?.message || 'Не удалось добавить операцию')
        } finally {
            setIsSubmitting(false)
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

                {/* КНОПКА ВИДНА ТОЛЬКО АДМИНУ */}
                {user?.role === 'ADMIN' && (
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => setModalVisible(true)}>
                        <Text style={styles.addButtonText}>+ Добавить операцию</Text>
                    </TouchableOpacity>
                )}
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

            {/* ВСПЛЫВАЮЩЕЕ ОКНО ФОРМЫ */}
            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Новая операция</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Сумма (например, 5000)"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Комментарий (необязательно)"
                            value={description}
                            onChangeText={setDescription}
                        />

                        {isSubmitting ? (
                            <ActivityIndicator
                                size="large"
                                color="#3498DB"
                                style={{ marginVertical: 20 }}
                            />
                        ) : (
                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: '#27AE60' }]}
                                    onPress={() => handleAddTransaction('PAYMENT')}>
                                    <Text style={styles.actionBtnText}>Внести оплату</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: '#E74C3C' }]}
                                    onPress={() => handleAddTransaction('CHARGE')}>
                                    <Text style={styles.actionBtnText}>Начислить долг</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => setModalVisible(false)}>
                            <Text style={styles.cancelBtnText}>Отмена</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    addButton: {
        marginTop: 15,
        backgroundColor: '#3498DB',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    addButtonText: { color: '#FFF', fontWeight: 'bold' },
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

    // Стили для модального окна
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 25,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#F5F7FA',
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E0E6ED',
        marginBottom: 15,
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    actionBtn: {
        flex: 1,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    actionBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    cancelBtn: { padding: 15, alignItems: 'center' },
    cancelBtnText: { color: '#7F8C8D', fontSize: 16, fontWeight: 'bold' },
})
