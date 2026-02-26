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
import { AuthContext } from '../context/AuthContext'
import { Ionicons } from '@expo/vector-icons'

type DetailsRouteProp = RouteProp<RootStackParamList, 'ApartmentDetails'>

interface Transaction {
    id: number
    amount: number
    date: string
    description: string
    category?: { name: string }
    paymentStatus?: 'PAID' | 'UNPAID' | null
}

interface ApartmentFullData {
    id: number
    number: number
    walletBalance: number
    totalDebt: number
    activeDebts: Transaction[]
    transactions: Transaction[]
}

export const ApartmentDetailsScreen = () => {
    const route = useRoute<DetailsRouteProp>()
    const { apartmentId, apartmentNumber } = route.params
    const { user } = useContext(AuthContext)

    const [data, setData] = useState<ApartmentFullData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const [isTopUpVisible, setTopUpVisible] = useState(false)
    const [topUpAmount, setTopUpAmount] = useState('')
    const [isSubmittingTopUp, setIsSubmittingTopUp] = useState(false)

    const [selectedDebt, setSelectedDebt] = useState<Transaction | null>(null)
    const [isSubmittingPay, setIsSubmittingPay] = useState(false)

    useEffect(() => {
        fetchApartmentDetails().finally(() => setIsLoading(false))
    }, [])

    const fetchApartmentDetails = async () => {
        try {
            const response = await api.get(`/apartments/${apartmentId}`)
            setData(response.data)
        } catch (error) {
            console.error('Ошибка загрузки деталей:', error)
        }
    }

    // 1. Пополнение кошелька (Категория 1)
    const handleTopUp = async () => {
        const numAmount = parseFloat(topUpAmount)
        if (isNaN(numAmount) || numAmount <= 0)
            return Alert.alert('Ошибка', 'Введите сумму больше нуля')

        try {
            setIsSubmittingTopUp(true)
            await api.post('/transactions', {
                amount: numAmount,
                description: 'Пополнение баланса',
                apartmentId: apartmentId,
                categoryId: 1,
            })
            setTopUpVisible(false)
            setTopUpAmount('')
            await fetchApartmentDetails()
        } catch (error: any) {
            Alert.alert('Ошибка', error.response?.data?.message || 'Ошибка пополнения')
        } finally {
            setIsSubmittingTopUp(false)
        }
    }

    // 2. Оплата конкретной квитанции
    const handlePayDebt = async () => {
        if (!selectedDebt) return
        const requiredAmount = Math.abs(selectedDebt.amount)

        // Проверка баланса прямо на фронте для удобства
        if ((data?.walletBalance || 0) < requiredAmount) {
            Alert.alert(
                'Недостаточно средств',
                `Свободно: ${data?.walletBalance} ₸, нужно: ${requiredAmount} ₸.\nПополните баланс.`,
            )
            setTopUpVisible(true)
            setSelectedDebt(null)
            return
        }

        try {
            setIsSubmittingPay(true)
            // Передаем ID конкретной транзакции-долга
            await api.post('/transactions/pay-debt', {
                apartmentId: apartmentId,
                debtTransactionId: selectedDebt.id,
            })

            Alert.alert('Успех', 'Счет успешно оплачен!')
            setSelectedDebt(null)
            await fetchApartmentDetails()
        } catch (error: any) {
            Alert.alert('Ошибка', error.response?.data?.message || 'Ошибка при оплате')
        } finally {
            setIsSubmittingPay(false)
        }
    }

    const renderTransaction = ({ item }: { item: Transaction }) => {
        const isPositive = item.amount > 0

        let StatusBadge = null
        if (item.paymentStatus === 'PAID') {
            StatusBadge = (
                <Text
                    style={[styles.statusBadge, { color: '#27AE60', backgroundColor: '#E8F8F5' }]}>
                    Оплачено
                </Text>
            )
        }

        return (
            <View style={[styles.txCard, { opacity: item.paymentStatus === 'PAID' ? 0.6 : 1 }]}>
                <View style={styles.txInfo}>
                    <Text style={styles.txDescription}>{item.description}</Text>
                    <Text style={styles.txDate}>
                        {new Date(item.date).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        {item.category && (
                            <Text style={styles.txCategory}>{item.category.name}</Text>
                        )}
                        {StatusBadge && <View style={{ marginLeft: 10 }}>{StatusBadge}</View>}
                    </View>
                </View>
                <Text style={[styles.txAmount, { color: isPositive ? '#27AE60' : '#2C3E50' }]}>
                    {isPositive ? '+' : ''}
                    {item.amount} ₸
                </Text>
            </View>
        )
    }

    const ListHeader = () => (
        <View>
            {/* БЛОК АКТИВНЫХ СЧЕТОВ */}
            {data?.activeDebts && data.activeDebts.length > 0 && (
                <View style={styles.debtsContainer}>
                    <Text style={styles.sectionTitle}>Счета на оплату</Text>
                    {data.activeDebts.map(debt => (
                        <TouchableOpacity
                            key={debt.id}
                            style={styles.debtCard}
                            onPress={() => setSelectedDebt(debt)}>
                            <View style={styles.debtMain}>
                                <View style={styles.debtIconBox}>
                                    <Ionicons name="receipt-outline" size={24} color="#E74C3C" />
                                </View>
                                <View style={styles.debtInfo}>
                                    <Text style={styles.debtCategory}>{debt.category?.name}</Text>
                                    <Text style={styles.debtDesc} numberOfLines={2}>
                                        {debt.description}
                                    </Text>
                                    <Text style={styles.debtDate}>
                                        от{' '}
                                        {new Date(debt.date).toLocaleDateString('ru-RU', {
                                            day: 'numeric',
                                            month: 'long',
                                        })}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.debtAmountBox}>
                                <Text style={styles.debtAmount}>{Math.abs(debt.amount)} ₸</Text>
                                <View style={styles.payBtnText}>
                                    <Text
                                        style={{
                                            color: '#E74C3C',
                                            fontWeight: 'bold',
                                            fontSize: 12,
                                        }}>
                                        ОПЛАТИТЬ
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
            <Text style={styles.sectionTitle}>История операций</Text>
        </View>
    )

    if (isLoading)
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#3498DB" />
            </View>
        )

    return (
        <View style={styles.container}>
            {/* ШАПКА: БАЛАНС И ДОЛГИ */}
            <View style={styles.header}>
                <View style={styles.balanceRow}>
                    <View style={styles.balanceBlock}>
                        <Text style={styles.headerTitle}>Свободно</Text>
                        <Text style={[styles.headerBalance, { color: '#27AE60' }]}>
                            {data?.walletBalance || 0} ₸
                        </Text>
                    </View>
                    <View style={styles.balanceBlock}>
                        <Text style={styles.headerTitle}>Общий долг</Text>
                        <Text style={[styles.headerBalance, { color: '#E74C3C' }]}>
                            {Math.abs(data?.totalDebt || 0)} ₸
                        </Text>
                    </View>
                </View>
                {user?.role === 'ADMIN' && (
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => setTopUpVisible(true)}>
                        <Ionicons
                            name="add-circle"
                            size={20}
                            color="#FFF"
                            style={{ marginRight: 8 }}
                        />
                        <Text style={styles.addButtonText}>Пополнить баланс</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* СПИСОК СЧЕТОВ И ИСТОРИИ */}
            <FlatList
                data={data?.transactions || []}
                keyExtractor={item => item.id.toString()}
                renderItem={renderTransaction}
                ListHeaderComponent={ListHeader}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            />

            {/* МОДАЛКА 1: ПОПОЛНЕНИЕ */}
            <Modal visible={isTopUpVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Пополнение баланса</Text>
                        <Text style={styles.modalSubtitle}>Квартира № {apartmentNumber}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Сумма"
                            keyboardType="numeric"
                            value={topUpAmount}
                            onChangeText={setTopUpAmount}
                        />
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#27AE60' }]}
                            onPress={handleTopUp}>
                            <Text style={styles.actionBtnText}>Внести средства</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => setTopUpVisible(false)}>
                            <Text style={styles.cancelBtnText}>Отмена</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* МОДАЛКА 2: ПОДТВЕРЖДЕНИЕ ОПЛАТЫ */}
            <Modal visible={!!selectedDebt} transparent={true} animationType="fade">
                <View style={styles.modalOverlayCenter}>
                    <View style={styles.alertContent}>
                        <Ionicons name="help-circle-outline" size={50} color="#3498DB" />
                        <Text style={styles.alertTitle}>Оплата счета</Text>
                        <Text style={styles.alertText}>
                            Списать {Math.abs(selectedDebt?.amount || 0)} ₸ с баланса в счет оплаты
                            "{selectedDebt?.description}"?
                        </Text>
                        <View style={styles.alertButtons}>
                            <TouchableOpacity
                                style={[styles.alertBtn, { backgroundColor: '#95A5A6' }]}
                                onPress={() => setSelectedDebt(null)}>
                                <Text style={styles.alertBtnText}>Отмена</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.alertBtn, { backgroundColor: '#3498DB' }]}
                                onPress={handlePayDebt}>
                                <Text style={styles.alertBtnText}>Оплатить</Text>
                            </TouchableOpacity>
                        </View>
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
        paddingTop: 30,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E6ED',
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 15,
    },
    balanceBlock: { alignItems: 'center' },
    headerTitle: {
        fontSize: 14,
        color: '#7F8C8D',
        textTransform: 'uppercase',
        marginBottom: 5,
        fontWeight: 'bold',
    },
    headerBalance: { fontSize: 28, fontWeight: 'bold' },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#27AE60',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 10,
    },
    addButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginTop: 20,
        marginBottom: 10,
        paddingHorizontal: 5,
    },
    list: { paddingHorizontal: 15, paddingBottom: 40 },

    // История
    txCard: {
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    txInfo: { flex: 1, paddingRight: 10 },
    txDescription: { fontSize: 15, fontWeight: '600', color: '#2C3E50', marginBottom: 4 },
    txDate: { fontSize: 12, color: '#95A5A6', marginBottom: 4 },
    txCategory: { fontSize: 12, color: '#3498DB', fontWeight: '500' },
    txAmount: { fontSize: 16, fontWeight: 'bold' },
    statusBadge: {
        fontSize: 10,
        fontWeight: 'bold',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },

    // Новые карточки долгов (Квитанции)
    debtsContainer: { marginTop: 10 },
    debtCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        borderWidth: 1,
        borderColor: '#FADBD8',
        shadowColor: '#E74C3C',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    debtMain: { flexDirection: 'row', flex: 1 },
    debtIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FDEDEC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    debtInfo: { flex: 1, justifyContent: 'center' },
    debtCategory: {
        color: '#E74C3C',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    debtDesc: { color: '#2C3E50', fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
    debtDate: { color: '#95A5A6', fontSize: 12 },
    debtAmountBox: { alignItems: 'flex-end', justifyContent: 'center', paddingLeft: 10 },
    debtAmount: { color: '#E74C3C', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    payBtnText: {
        backgroundColor: '#FDEDEC',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },

    // Модалки
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 25,
        paddingBottom: 40,
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50', textAlign: 'center' },
    modalSubtitle: { fontSize: 14, color: '#7F8C8D', textAlign: 'center', marginBottom: 20 },
    input: {
        backgroundColor: '#F5F7FA',
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E0E6ED',
        marginBottom: 20,
        fontSize: 18,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    actionBtn: { padding: 18, borderRadius: 10, alignItems: 'center' },
    actionBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    cancelBtn: { padding: 15, alignItems: 'center', marginTop: 10 },
    cancelBtnText: { color: '#7F8C8D', fontSize: 16, fontWeight: 'bold' },
    modalOverlayCenter: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    alertContent: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 25,
        width: '100%',
        alignItems: 'center',
    },
    alertTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginTop: 15,
        marginBottom: 10,
    },
    alertText: {
        fontSize: 16,
        color: '#7F8C8D',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 22,
    },
    alertButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
    alertBtn: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center', marginHorizontal: 5 },
    alertBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
})
