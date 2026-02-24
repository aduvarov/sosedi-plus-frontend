import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context' // <-- НОВЫЙ И ПРАВИЛЬНЫЙ ИМПОРТ
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

// Импортируем наши экраны
import { LoginScreen } from './src/screens/LoginScreen'
import { HomeScreen } from './src/screens/HomeScreen'

// Типизируем наши маршруты для TypeScript
export type RootStackParamList = {
    Login: undefined
    Home: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function App() {
    return (
        // SafeAreaProvider теперь оборачивает всё приложение на самом верхнем уровне
        <SafeAreaProvider>
            <NavigationContainer>
                <Stack.Navigator initialRouteName="Login">
                    {/* Экран входа (прячем верхнюю шапку навигации) */}
                    <Stack.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{ headerShown: false }}
                    />
                    {/* Главный экран */}
                    <Stack.Screen
                        name="Home"
                        component={HomeScreen}
                        options={{ title: 'Соседи+', headerBackVisible: false }}
                    />
                </Stack.Navigator>
            </NavigationContainer>
            <StatusBar style="auto" />
        </SafeAreaProvider>
    )
}
