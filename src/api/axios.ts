import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

// Expo автоматически подставит значение из .env во время сборки
// Если переменной нет (например, забыли создать .env), используем localhost как фолбэк
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Интерцептор ЗАПРОСОВ: срабатывает перед тем, как запрос уйдет на сервер
api.interceptors.request.use(
    async config => {
        // Достаем токен из безопасного хранилища
        const token = await SecureStore.getItemAsync('accessToken')

        // Если токен есть, прикрепляем его в заголовок Authorization
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        return config
    },
    error => {
        return Promise.reject(error)
    },
)

// Заготовка для интерцептора ОТВЕТОВ (здесь мы позже настроим автоматический Refresh токена, если сервер вернул 401)
api.interceptors.response.use(
    response => response,
    async error => {
        // Здесь будет логика обновления токена
        return Promise.reject(error)
    },
)
