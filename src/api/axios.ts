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

// ИНТЕРЦЕПТОР ОТВЕТОВ
api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config

        // Если получили 401 и еще не пробовали обновить токен
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                const refreshToken = await SecureStore.getItemAsync('refreshToken')

                if (refreshToken) {
                    console.log('🔄 Access токен протух, запрашиваем новый...')

                    // Используем чистый axios, но берем базовый URL из наших настроек
                    const response = await axios.post(
                        `${api.defaults.baseURL}/auth/refresh`,
                        {},
                        {
                            headers: {
                                Authorization: `Bearer ${refreshToken}`,
                            },
                        },
                    )

                    // Достаем новые токены (убедитесь, что ваш бэкенд возвращает именно эти названия полей)
                    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
                        response.data

                    await SecureStore.setItemAsync('accessToken', newAccessToken)
                    await SecureStore.setItemAsync('refreshToken', newRefreshToken)

                    // Обновляем заголовок в упавшем запросе и повторяем его
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
                    console.log('✅ Токены обновлены! Повторяем запрос.')

                    return api(originalRequest)
                }
            } catch (refreshError) {
                console.error(
                    '❌ Срок действия Refresh-токена истек. Нужно заново войти в систему.',
                )
                await SecureStore.deleteItemAsync('accessToken')
                await SecureStore.deleteItemAsync('refreshToken')
                // При следующем действии приложение само выкинет пользователя на экран Login
            }
        }

        return Promise.reject(error)
    },
)
