import React, { useContext } from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { ActivityIndicator, View } from 'react-native'

import { AuthProvider, AuthContext } from './src/context/AuthContext'
import { LoginScreen } from './src/screens/LoginScreen'
import { HomeScreen } from './src/screens/HomeScreen'
import { ApartmentDetailsScreen } from './src/screens/ApartmentDetailsScreen'
import { ProfileScreen } from './src/screens/ProfileScreen'
import { GlobalExpensesScreen } from './src/screens/GlobalExpensesScreen'
import { CategoryEditorScreen } from './src/screens/CategoryEditorScreen'

export type RootStackParamList = {
    Login: undefined
    MainTabs: undefined
    ApartmentDetails: { apartmentId: number; apartmentNumber: number }
    CategoryEditor: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator()

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#3498DB',
                tabBarInactiveTintColor: '#95A5A6',
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
                name="GlobalExpensesTab"
                component={GlobalExpensesScreen}
                options={{
                    title: 'Сборы',
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="cash" size={size} color={color} />
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

// СОЗДАЕМ ВНУТРЕННИЙ КОМПОНЕНТ НАВИГАЦИИ, ЧТОБЫ ИМЕТЬ ДОСТУП К КОНТЕКСТУ
const RootNavigator = () => {
    const { user, isLoading } = useContext(AuthContext)

    // Пока проверяем токен в памяти, показываем крутилку на весь экран
    if (isLoading) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#F5F7FA',
                }}>
                <ActivityIndicator size="large" color="#3498DB" />
            </View>
        )
    }

    return (
        <NavigationContainer>
            <Stack.Navigator>
                {/* МАГИЯ ЗДЕСЬ: Если есть user, показываем рабочие экраны. Если нет — только Login */}
                {user ? (
                    <>
                        <Stack.Screen
                            name="MainTabs"
                            component={MainTabs}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="ApartmentDetails"
                            component={ApartmentDetailsScreen}
                            options={({ route }) => ({
                                title: `Квартира ${route.params.apartmentNumber}`,
                            })}
                        />
                        <Stack.Screen
                            name="CategoryEditor"
                            component={CategoryEditorScreen}
                            options={{ title: 'Редактор категорий' }}
                        />
                    </>
                ) : (
                    <Stack.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{ headerShown: false }}
                    />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    )
}

export default function App() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <RootNavigator />
            </AuthProvider>
            <StatusBar style="auto" />
        </SafeAreaProvider>
    )
}
