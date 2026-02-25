import React, { useState, useEffect } from 'react'
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native'
import { api } from '../api/axios'
import { Ionicons } from '@expo/vector-icons'

export const CategoryEditorScreen = () => {
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
    const [newName, setNewName] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories')
            setCategories(res.data)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAdd = async () => {
        if (!newName.trim()) return
        try {
            await api.post('/categories', { name: newName })
            setNewName('')
            fetchCategories()
        } catch (e) {
            Alert.alert('Ошибка', 'Не удалось добавить категорию')
        }
    }

    const handleDelete = (id: number) => {
        Alert.alert('Удаление', 'Точно удалить категорию?', [
            { text: 'Отмена', style: 'cancel' },
            {
                text: 'Удалить',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/categories/${id}`)
                        fetchCategories()
                    } catch (e: any) {
                        // Если сервер ругается на связи в БД, покажем понятную ошибку
                        Alert.alert(
                            'Ошибка',
                            'Нельзя удалить категорию, по которой уже были платежи!',
                        )
                    }
                },
            },
        ])
    }

    if (isLoading) return <ActivityIndicator size="large" color="#3498DB" style={{ flex: 1 }} />

    return (
        <View style={styles.container}>
            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    placeholder="Новая категория (напр. Охрана)"
                    value={newName}
                    onChangeText={setNewName}
                />
                <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
                    <Ionicons name="add" size={30} color="#FFF" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={categories}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.item}>
                        <Text style={styles.name}>{item.name}</Text>
                        {/* Скрываем корзину для системной категории ID 1 */}
                        {item.id > 1 && (
                            <TouchableOpacity onPress={() => handleDelete(item.id)}>
                                <Ionicons name="trash-outline" size={24} color="#E74C3C" />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20 },
    inputRow: { flexDirection: 'row', marginBottom: 20 },
    input: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 10,
        padding: 15,
        borderWidth: 1,
        borderColor: '#E0E6ED',
    },
    addBtn: {
        backgroundColor: '#27AE60',
        marginLeft: 10,
        width: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
    },
    item: {
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    name: { fontSize: 16, color: '#2C3E50', fontWeight: 'bold' },
})
