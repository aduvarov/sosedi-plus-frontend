import React, { useContext, useState } from 'react'
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../App'
import { AuthContext } from '../context/AuthContext'
import { api } from '../api/axios'

export const ProfileScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
    const { user, setUser } = useContext(AuthContext)

    // Состояния для модалки смены пароля
    const [isModalVisible, setModalVisible] = useState(false)
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleLogout = async () => {
        await SecureStore.deleteItemAsync('accessToken')
        await SecureStore.deleteItemAsync('refreshToken')
        setUser(null)
    }

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            return Alert.alert('Ошибка', 'Пожалуйста, заполните все поля')
        }
        if (newPassword !== confirmPassword) {
            return Alert.alert('Ошибка', 'Новые пароли не совпадают')
        }
        if (newPassword.length < 6) {
            return Alert.alert('Ошибка', 'Новый пароль должен быть не короче 6 символов')
        }

        try {
            setIsSubmitting(true)

            // Отправляем запрос на наш новый эндпоинт
            await api.patch('/users/change-password', {
                oldPasswordPlain: oldPassword,
                newPasswordPlain: newPassword,
            })

            Alert.alert('Успех', 'Пароль успешно изменен!')

            // Закрываем и очищаем форму
            setModalVisible(false)
            setOldPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (error: any) {
            Alert.alert('Ошибка', error.response?.data?.message || 'Не удалось изменить пароль')
        } finally {
            setIsSubmitting(false)
        }
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
            {/* КНОПКА УПРАВЛЕНИЯ КАТЕГОРИЯМИ (ТОЛЬКО ДЛЯ АДМИНА) */}
            {user?.role === 'ADMIN' && (
                <TouchableOpacity
                    style={[styles.changePasswordBtn, { backgroundColor: '#27AE60' }]}
                    onPress={() => navigation.navigate('CategoryEditor')}>
                    <Text style={styles.changePasswordText}>Редактор категорий</Text>
                </TouchableOpacity>
            )}
            {/* КНОПКА СМЕНЫ ПАРОЛЯ */}
            <TouchableOpacity
                style={styles.changePasswordBtn}
                onPress={() => setModalVisible(true)}>
                <Text style={styles.changePasswordText}>Изменить пароль</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Выйти из аккаунта</Text>
            </TouchableOpacity>

            {/* ВСПЛЫВАЮЩЕЕ ОКНО СМЕНЫ ПАРОЛЯ */}
            <Modal visible={isModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Смена пароля</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Текущий пароль"
                            secureTextEntry
                            value={oldPassword}
                            onChangeText={setOldPassword}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Новый пароль"
                            secureTextEntry
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Повторите новый пароль"
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />

                        {isSubmitting ? (
                            <ActivityIndicator
                                size="large"
                                color="#3498DB"
                                style={{ marginVertical: 10 }}
                            />
                        ) : (
                            <TouchableOpacity
                                style={styles.submitBtn}
                                onPress={handleChangePassword}>
                                <Text style={styles.submitBtnText}>Сохранить пароль</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => {
                                setModalVisible(false)
                                setOldPassword('')
                                setNewPassword('')
                                setConfirmPassword('')
                            }}>
                            <Text style={styles.cancelBtnText}>Отмена</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#F5F7FA' },
    card: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    label: { fontSize: 14, color: '#7F8C8D', marginBottom: 5, marginTop: 15 },
    value: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },

    changePasswordBtn: {
        backgroundColor: '#34495E',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 15,
    },
    changePasswordText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

    logoutButton: {
        backgroundColor: '#E74C3C',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    logoutText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

    // Стили модалки
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
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
    submitBtn: {
        backgroundColor: '#27AE60',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 10,
    },
    submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    cancelBtn: { padding: 15, alignItems: 'center' },
    cancelBtnText: { color: '#7F8C8D', fontSize: 16, fontWeight: 'bold' },
})
