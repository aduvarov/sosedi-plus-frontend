import React from 'react'
import { AuthProvider } from './src/context/AuthContext'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons' // Встроенные иконки Expo
import { LoginScreen } from './src/screens/LoginScreen'
import { HomeScreen } from './src/screens/HomeScreen'
import { ApartmentDetailsScreen } from './src/screens/ApartmentDetailsScreen'
import { ProfileScreen } from './src/screens/ProfileScreen'

// 1. Описываем типы для основной стековой навигации
export type RootStackParamList = {
    Login: undefined
    MainTabs: undefined // Теперь вместо Home у нас MainTabs
    ApartmentDetails: { apartmentId: number; apartmentNumber: number }
}

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator()

// 2. Создаем компонент с нижними вкладками
function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#3498DB', // Синий цвет для активной вкладки
                tabBarInactiveTintColor: '#95A5A6', // Серый для неактивной
            }}>
            <Tab.Screen
                name="HomeTab"
                component={HomeScreen}
                options={{
                    title: 'Квартиры',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={ProfileScreen}
                options={{
                    title: 'Профиль',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    )
}

// 3. Собираем всё в корневом компоненте
export default function App() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <NavigationContainer>
                    <Stack.Navigator initialRouteName="Login">
                        {/* Экран входа */}
                        <Stack.Screen
                            name="Login"
                            component={LoginScreen}
                            options={{ headerShown: false }}
                        />

                        {/* Главный экран приложения (с вкладками внизу) */}
                        <Stack.Screen
                            name="MainTabs"
                            component={MainTabs}
                            options={{ headerShown: false }}
                        />

                        {/* Экран деталей квартиры (открывается поверх вкладок) */}
                        <Stack.Screen
                            name="ApartmentDetails"
                            component={ApartmentDetailsScreen}
                            options={({ route }) => ({
                                title: `Квартира ${route.params.apartmentNumber}`,
                            })}
                        />
                    </Stack.Navigator>
                </NavigationContainer>
            </AuthProvider>
            <StatusBar style="auto" />
        </SafeAreaProvider>
    )
}
