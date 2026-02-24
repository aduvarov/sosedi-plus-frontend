import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { LoginScreen } from './src/screens/LoginScreen'
import { HomeScreen } from './src/screens/HomeScreen'
import { ApartmentDetailsScreen } from './src/screens/ApartmentDetailsScreen'

// Описываем параметры для каждого экрана
export type RootStackParamList = {
    Login: undefined
    Home: undefined
    // Новый экран принимает id и number квартиры
    ApartmentDetails: { apartmentId: number; apartmentNumber: number }
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function App() {
    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <Stack.Navigator initialRouteName="Login">
                    <Stack.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="Home"
                        component={HomeScreen}
                        options={{ title: 'Соседи+', headerBackVisible: false }}
                    />
                    <Stack.Screen
                        name="ApartmentDetails"
                        component={ApartmentDetailsScreen}
                        options={({ route }) => ({
                            title: `Квартира ${route.params.apartmentNumber}`,
                        })}
                    />
                </Stack.Navigator>
            </NavigationContainer>
            <StatusBar style="auto" />
        </SafeAreaProvider>
    )
}
