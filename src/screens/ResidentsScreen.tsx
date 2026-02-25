import React, { useState, useCallback, useContext } from 'react'
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Picker } from '@react-native-picker/picker'
import { api } from '../api/axios'
import { AuthContext } from '../context/AuthContext'

interface User {
    id: number
    phone: string
    fullName?: string
    role: 'ADMIN' | 'USER'
    createdAt: string
    apartmentId: number | null
    apartment: { number: number } | null
}

interface Apartment {
    id: number
    number: number
}

export const ResidentsScreen = () => {
    const { user: currentUser } = useContext(AuthContext)

    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [isModalVisible, setModalVisible] = useState(false)
    const [apartments, setApartments] = useState<Apartment[]>([])

    // Состояния формы
    const [editingUserId, setEditingUserId] = useState<number | null>(null) // Если null - создаем, если есть ID - редактируем
    const [phone, setPhone] = useState('')
    const [fullName, setFullName] = useState('')
    const [password, setPassword] = useState('') // Для редактирования пароль необязателен
    const [selectedApartmentId, setSelectedApartmentId] = useState<number>(1)

    const [isSubmitting, setIsSubmitting] = useState(false)

    useFocusEffect(
        useCallback(() => {
            fetchUsers()
        }, []),
    )

    const fetchUsers = async () => {
        try {
            setIsLoading(true)
            const response = await api.get('/users')
            setUsers(response.data)
        } catch (error) {
            Alert.alert('Ошибка', 'Не удалось загрузить список жильцов')
        } finally {
            setIsLoading(false)
        }
    }

    // Открываем модалку. Если передали userToEdit - это режим редактирования
    const handleOpenModal = async (userToEdit?: User) => {
        try {
            const response = await api.get('/apartments')
            setApartments(response.data)

            if (userToEdit) {
                // РЕЖИМ РЕДАКТИРОВАНИЯ: заполняем поля
                setEditingUserId(userToEdit.id)
                setPhone(userToEdit.phone)
                setFullName(userToEdit.fullName || '')
                setPassword('') // Оставляем пустым, чтобы не перезаписать, если админ не хочет его менять
                setSelectedApartmentId(userToEdit.apartmentId || response.data[0]?.id)
            } else {
                // РЕЖИМ СОЗДАНИЯ: чистим поля
                setEditingUserId(null)
                setPhone('')
                setFullName('')
                setPassword('')
                if (response.data.length > 0) setSelectedApartmentId(response.data[0].id)
            }

            setModalVisible(true)
        } catch (error) {
            Alert.alert('Ошибка', 'Не удалось загрузить список квартир')
        }
    }

    const handleSubmit = async () => {
        if (!phone.trim()) return Alert.alert('Ошибка', 'Введите телефон')
        // При создании пароль обязателен, при редактировании — нет
        if (!editingUserId && (!password || password.length < 6)) {
            return Alert.alert('Ошибка', 'Пароль должен быть не короче 6 символов')
        }
        if (editingUserId && password && password.length < 6) {
            return Alert.alert('Ошибка', 'Новый пароль должен быть не короче 6 символов')
        }

        try {
            setIsSubmitting(true)

            const payload: any = {
                phone: phone.trim(),
                fullName: fullName.trim() || undefined,
                apartmentId: selectedApartmentId,
            }
            if (password) payload.passwordPlain = password // Отправляем пароль, только если его ввели

            if (editingUserId) {
                // ОБНОВЛЕНИЕ
                await api.patch(`/users/${editingUserId}`, payload)
                Alert.alert('Успех', 'Данные жильца обновлены!')
            } else {
                // СОЗДАНИЕ
                await api.post('/users/register-neighbor', payload)
                Alert.alert('Успех', 'Новый жилец успешно зарегистрирован!')
            }

            setModalVisible(false)
            fetchUsers()
        } catch (error: any) {
            Alert.alert('Ошибка', error.response?.data?.message || 'Не удалось сохранить данные')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteUser = (id: number, userPhone: string) => {
        Alert.alert('Удаление жильца', `Удалить аккаунт ${userPhone}?`, [
            { text: 'Отмена', style: 'cancel' },
            {
                text: 'Удалить',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/users/${id}`)
                        fetchUsers()
                    } catch (error: any) {
                        Alert.alert('Ошибка', error.response?.data?.message || 'Не удалось удалить')
                    }
                },
            },
        ])
    }

    const renderUser = ({ item }: { item: User }) => {
        const isAdmin = item.role === 'ADMIN'

        return (
            <View style={styles.card}>
                <View style={styles.userInfo}>
                    <Text style={styles.phone}>
                        {item.fullName || 'Без имени'} ({item.phone})
                    </Text>

                    <View style={styles.detailsRow}>
                        {isAdmin ? (
                            <Text style={styles.adminBadge}>Управдом</Text>
                        ) : (
                            <Text style={styles.aptBadge}>
                                Квартира {item.apartment?.number || '?'}
                            </Text>
                        )}
                        <Text style={styles.date}>
                            {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                        </Text>
                    </View>
                </View>

                {/* БЛОК КНОПОК ДЕЙСТВИЙ */}
                <View style={styles.actionButtons}>
                    {/* Кнопка РЕДАКТИРОВАТЬ доступна для всех жильцов */}
                    {!isAdmin && (
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => handleOpenModal(item)}>
                            <Ionicons name="pencil" size={22} color="#3498DB" />
                        </TouchableOpacity>
                    )}

                    {/* Кнопка УДАЛИТЬ доступна только для жильцов (себя удалить нельзя) */}
                    {!isAdmin && item.id !== currentUser?.id && (
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => handleDeleteUser(item.id, item.phone)}>
                            <Ionicons name="trash-outline" size={22} color="#E74C3C" />
                        </TouchableOpacity>
                    )}
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
            <FlatList
                data={users}
                keyExtractor={item => item.id.toString()}
                renderItem={renderUser}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.emptyText}>Жильцов пока нет</Text>}
            />

            {/* ПЛАВАЮЩАЯ КНОПКА ДОБАВЛЕНИЯ */}
            {currentUser?.role === 'ADMIN' && (
                <TouchableOpacity style={styles.fab} onPress={() => handleOpenModal()}>
                    <Ionicons name="person-add" size={24} color="#FFF" />
                </TouchableOpacity>
            )}

            {/* МОДАЛЬНОЕ ОКНО СОЗДАНИЯ И РЕДАКТИРОВАНИЯ */}
            <Modal visible={isModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {editingUserId ? 'Редактировать жильца' : 'Новый жилец'}
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Номер телефона (логин)"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            autoCapitalize="none"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="ФИО (например, Иванов И.И.)"
                            value={fullName}
                            onChangeText={setFullName}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder={
                                editingUserId
                                    ? 'Новый пароль (оставьте пустым, если не меняете)'
                                    : 'Временный пароль'
                            }
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={false} // Можно оставить открытым для удобства админа
                        />

                        <Text style={styles.label}>Привязать к квартире:</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={selectedApartmentId}
                                onValueChange={val => setSelectedApartmentId(val)}
                                style={styles.picker}>
                                {apartments.map(apt => (
                                    <Picker.Item
                                        key={apt.id}
                                        label={`Квартира № ${apt.number}`}
                                        value={apt.id}
                                    />
                                ))}
                            </Picker>
                        </View>

                        {isSubmitting ? (
                            <ActivityIndicator
                                size="large"
                                color="#3498DB"
                                style={{ marginVertical: 20 }}
                            />
                        ) : (
                            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                                <Text style={styles.submitBtnText}>
                                    {editingUserId ? 'Сохранить изменения' : 'Зарегистрировать'}
                                </Text>
                            </TouchableOpacity>
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
    list: { padding: 20, paddingBottom: 100 },
    card: {
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    userInfo: { flex: 1 },
    phone: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', marginBottom: 5 },
    detailsRow: { flexDirection: 'row', alignItems: 'center' },
    adminBadge: {
        backgroundColor: '#F39C12',
        color: '#FFF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 'bold',
        marginRight: 10,
    },
    aptBadge: {
        backgroundColor: '#3498DB',
        color: '#FFF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 'bold',
        marginRight: 10,
    },
    date: { fontSize: 12, color: '#95A5A6' },

    actionButtons: { flexDirection: 'row', alignItems: 'center' },
    actionBtn: { padding: 8, marginLeft: 5 },

    emptyText: { textAlign: 'center', color: '#7F8C8D', marginTop: 40, fontSize: 16 },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: '#27AE60',
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
    submitBtn: {
        backgroundColor: '#27AE60',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 10,
    },
    submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    cancelBtn: { padding: 15, alignItems: 'center' },
    cancelBtnText: { color: '#7F8C8D', fontSize: 16, fontWeight: 'bold' },
})
