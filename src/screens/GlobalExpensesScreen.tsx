import React, { useState, useCallback, useContext } from 'react'
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform, // <-- Добавили для работы с клавиатурой
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Picker } from '@react-native-picker/picker'
import { api } from '../api/axios'
import { AuthContext } from '../context/AuthContext'

interface Participant {
    id: number
    number: number
    isPaid: boolean
}

interface GlobalExpense {
    id: number
    description: string
    totalAmount: number
    date: string
    category?: { name: string }
    collectedAmount: number
    progress: number
    participants: Participant[]
}

interface Category {
    id: number
    name: string
}
interface Apartment {
    id: number
    number: number
}

export const GlobalExpensesScreen = () => {
    const { user } = useContext(AuthContext)
    const [expenses, setExpenses] = useState<GlobalExpense[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [isModalVisible, setModalVisible] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [apartments, setApartments] = useState<Apartment[]>([])

    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [selectedCategoryId, setSelectedCategoryId] = useState<number>(1)
    const [selectedApartmentIds, setSelectedApartmentIds] = useState<number[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    useFocusEffect(
        useCallback(() => {
            fetchExpenses()
        }, []),
    )

    const fetchExpenses = async () => {
        try {
            setIsLoading(true)
            const response = await api.get('/global-expenses')
            setExpenses(response.data)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleOpenModal = async () => {
        setModalVisible(true)
        try {
            const [catRes, aptRes] = await Promise.all([
                api.get('/categories'),
                api.get('/apartments'),
            ])

            // 1. ИСКЛЮЧАЕМ КАТЕГОРИЮ "КОШЕЛЕК" (ID = 1)
            const filteredCategories = catRes.data.filter((cat: Category) => cat.id !== 1)
            setCategories(filteredCategories)
            setApartments(aptRes.data)

            if (filteredCategories.length > 0) setSelectedCategoryId(filteredCategories[0].id)
            setSelectedApartmentIds(aptRes.data.map((a: Apartment) => a.id))
        } catch (error) {
            Alert.alert('Ошибка', 'Не удалось загрузить данные')
        }
    }

    const toggleApartment = (id: number) => {
        setSelectedApartmentIds(prev =>
            prev.includes(id) ? prev.filter(aptId => aptId !== id) : [...prev, id],
        )
    }

    const handleSubmit = async () => {
        const numAmount = parseFloat(amount)
        if (isNaN(numAmount) || numAmount <= 0)
            return Alert.alert('Ошибка', 'Введите корректную сумму')
        if (selectedApartmentIds.length === 0)
            return Alert.alert('Ошибка', 'Выберите хотя бы одну квартиру')

        try {
            setIsSubmitting(true)
            await api.post('/global-expenses', {
                totalAmount: numAmount,
                description: description.trim() || 'Общий сбор',
                categoryId: selectedCategoryId,
                participatingApartmentIds: selectedApartmentIds,
            })
            setModalVisible(false)
            setAmount('')
            setDescription('')
            fetchExpenses()
            Alert.alert('Успех!', 'Сумма успешно распределена.')
        } catch (error: any) {
            Alert.alert('Ошибка', error.response?.data?.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    // 2. ДИНАМИЧЕСКИЙ ЗАГОЛОВОК
    const calculateShare = () => {
        const numAmount = parseFloat(amount) || 0
        const selectedCount = selectedApartmentIds.length
        if (numAmount > 0 && selectedCount > 0) {
            return Math.ceil(numAmount / selectedCount)
        }
        return 0
    }
    const shareAmount = calculateShare()
    const modalTitleText = shareAmount > 0 ? `Новый сбор по ${shareAmount} ₸` : 'Новый сбор'

    const renderExpense = ({ item }: { item: GlobalExpense }) => {
        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.info}>
                        <Text style={styles.description}>{item.description || 'Общий сбор'}</Text>
                        <Text style={styles.date}>
                            {new Date(item.date).toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            })}
                        </Text>
                        {item.category && <Text style={styles.category}>{item.category.name}</Text>}
                    </View>
                    <View style={styles.amountContainer}>
                        <Text style={styles.amount}>{item.totalAmount} ₸</Text>
                        <Text style={styles.amountLabel}>общая сумма</Text>
                    </View>
                </View>

                <View style={styles.progressBarBg}>
                    <View
                        style={[
                            styles.progressBarFill,
                            { width: `${Math.min(item.progress * 100, 100)}%` },
                        ]}
                    />
                </View>
                <Text style={styles.progressText}>
                    Собрано {item.collectedAmount} из {item.totalAmount} ₸
                </Text>

                <Text style={styles.participantsLabel}>Статус оплат:</Text>
                <View style={styles.trafficLightContainer}>
                    {item.participants?.map(p => (
                        <View
                            key={p.id}
                            style={[
                                styles.trafficSquare,
                                p.isPaid ? styles.trafficPaid : styles.trafficUnpaid,
                            ]}>
                            <Text
                                style={[
                                    styles.trafficText,
                                    p.isPaid ? styles.trafficTextPaid : styles.trafficTextUnpaid,
                                ]}>
                                {p.number}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        )
    }

    if (isLoading)
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#3498DB" />
            </View>
        )

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Общие сборы</Text>
                <Text style={styles.headerSubtitle}>Контроль платежей по дому</Text>
            </View>

            <FlatList
                data={expenses}
                keyExtractor={item => item.id.toString()}
                renderItem={renderExpense}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={<Text style={styles.emptyText}>Сборов пока нет</Text>}
            />

            {user?.role === 'ADMIN' && (
                <TouchableOpacity style={styles.fab} onPress={handleOpenModal}>
                    <Text style={styles.fabText}>+</Text>
                </TouchableOpacity>
            )}

            <Modal visible={isModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    {/* 3. Обертка для клавиатуры */}
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={{ width: '100%', justifyContent: 'flex-end', maxHeight: '90%' }}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Новый сбор</Text>
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: 20 }}>
                                <Text style={styles.label}>Категория:</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={selectedCategoryId}
                                        onValueChange={val => setSelectedCategoryId(val)}
                                        style={styles.picker}>
                                        {categories.map(cat => (
                                            <Picker.Item
                                                key={cat.id}
                                                label={cat.name}
                                                value={cat.id}
                                            />
                                        ))}
                                    </Picker>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Общая сумма (на всех), например 150000"
                                    keyboardType="numeric"
                                    value={amount}
                                    onChangeText={setAmount}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Описание (например, Ремонт лифта)"
                                    value={description}
                                    onChangeText={setDescription}
                                />

                                <Text style={styles.label}>
                                    Распределить на квартиры ({selectedApartmentIds.length} из{' '}
                                    {apartments.length}):
                                </Text>
                                <View style={styles.grid}>
                                    {apartments.map(apt => {
                                        const isSelected = selectedApartmentIds.includes(apt.id)
                                        return (
                                            <TouchableOpacity
                                                key={apt.id}
                                                style={[
                                                    styles.aptSquare,
                                                    isSelected
                                                        ? styles.aptSelected
                                                        : styles.aptUnselected,
                                                ]}
                                                onPress={() => toggleApartment(apt.id)}>
                                                <Text
                                                    style={
                                                        isSelected
                                                            ? styles.aptTextSelected
                                                            : styles.aptTextUnselected
                                                    }>
                                                    {apt.number}
                                                </Text>
                                            </TouchableOpacity>
                                        )
                                    })}
                                </View>

                                {isSubmitting ? (
                                    <ActivityIndicator
                                        size="large"
                                        color="#3498DB"
                                        style={{ marginVertical: 20 }}
                                    />
                                ) : (
                                    <TouchableOpacity
                                        style={styles.submitBtn}
                                        onPress={handleSubmit}>
                                        {/* ДИНАМИЧЕСКИЙ ТЕКСТ КНОПКИ */}
                                        <Text style={styles.submitBtnText}>
                                            {shareAmount > 0
                                                ? `Распределить по ${shareAmount} ₸`
                                                : 'Распределить сумму'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => setModalVisible(false)}>
                                    <Text style={styles.cancelBtnText}>Отмена</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        padding: 20,
        paddingTop: 40,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E6ED',
        marginBottom: 10,
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50' },
    headerSubtitle: { fontSize: 14, color: '#7F8C8D', marginTop: 5 },
    list: { paddingHorizontal: 20, paddingBottom: 100 },

    card: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    info: { flex: 1, paddingRight: 10 },
    description: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginBottom: 5 },
    date: { fontSize: 12, color: '#95A5A6', marginBottom: 5 },
    category: { fontSize: 12, color: '#3498DB', fontWeight: '600' },
    amountContainer: {
        alignItems: 'flex-end',
        backgroundColor: '#F9EBEA',
        padding: 8,
        borderRadius: 8,
    },
    amount: { fontSize: 16, fontWeight: 'bold', color: '#E74C3C' },
    amountLabel: {
        fontSize: 10,
        color: '#C0392B',
        marginTop: 2,
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },

    progressBarBg: {
        height: 8,
        backgroundColor: '#ECF0F1',
        borderRadius: 4,
        marginTop: 15,
        overflow: 'hidden',
    },
    progressBarFill: { height: '100%', backgroundColor: '#27AE60' },
    progressText: {
        fontSize: 12,
        color: '#7F8C8D',
        marginTop: 5,
        textAlign: 'right',
        fontWeight: '500',
    },

    participantsLabel: {
        fontSize: 12,
        color: '#95A5A6',
        marginTop: 15,
        marginBottom: 5,
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },
    trafficLightContainer: { flexDirection: 'row', flexWrap: 'wrap' },
    trafficSquare: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        margin: 4,
        borderWidth: 1,
    },
    trafficPaid: { backgroundColor: '#E8F8F5', borderColor: '#27AE60' },
    trafficUnpaid: { backgroundColor: '#FDEDEC', borderColor: '#E74C3C' },
    trafficText: { fontWeight: 'bold', fontSize: 13 },
    trafficTextPaid: { color: '#27AE60' },
    trafficTextUnpaid: { color: '#E74C3C' },

    emptyText: { textAlign: 'center', color: '#7F8C8D', marginTop: 40, fontSize: 16 },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: '#3498DB',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    fabText: { color: '#FFF', fontSize: 30, fontWeight: 'bold', marginTop: -2 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 25,
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
    label: { fontSize: 14, color: '#7F8C8D', marginBottom: 10, fontWeight: 'bold' },
    pickerContainer: {
        backgroundColor: '#F5F7FA',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E0E6ED',
        marginBottom: 20,
        overflow: 'hidden',
    },
    picker: { height: 50, width: '100%' },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
        justifyContent: 'flex-start',
    },
    aptSquare: {
        width: 35,
        height: 35,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        margin: 4,
        borderWidth: 1,
    },
    aptSelected: { backgroundColor: '#6bf469', borderColor: '#2980B9' },
    aptUnselected: { backgroundColor: '#f8c0c0', borderColor: '#BDC3C7' },
    aptTextSelected: { color: '#000000', fontWeight: 'bold', fontSize: 16 },
    aptTextUnselected: { color: '#f39b92', fontWeight: 'bold', fontSize: 16 },
    submitBtn: {
        backgroundColor: '#2482f5',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 10,
    },
    submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    cancelBtn: { padding: 15, alignItems: 'center' },
    cancelBtnText: { color: '#7F8C8D', fontSize: 16, fontWeight: 'bold' },
})
