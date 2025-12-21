import { Platform, StatusBar } from 'react-native'
import { NativeBaseProvider } from 'native-base'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import {
  useFonts,
  Roboto_400Regular,
  Roboto_700Bold,
} from '@expo-google-fonts/roboto'

import { Loading } from '@components/Loading'
import { Routes } from './src/routes'

import { AuthContextProvider } from '@contexts/AuthContext'
import { CityProvider } from '@contexts/CityContext'
import { CartProvider } from '@contexts/CartContext'

import { useEffect } from 'react'
import * as NavigationBar from 'expo-navigation-bar'
import { checkAndApplyOtaNow, wireOtaOnAppState } from 'src/lib/updates'

export default function App() {
  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_700Bold,
  })

  useEffect(() => {
    checkAndApplyOtaNow()
    const unwire = wireOtaOnAppState()
    return () => unwire()
  }, [])

  useEffect(() => {
    const hideNavBar = async () => {
      if (Platform.OS === 'android') {
        await NavigationBar.setVisibilityAsync('hidden')
        await NavigationBar.setBehaviorAsync('overlay-swipe')
        await NavigationBar.setBackgroundColorAsync('transparent')
      }
    }
    hideNavBar()
  }, [])

  return (
    <SafeAreaProvider>
      <NativeBaseProvider>
        <StatusBar
          barStyle="dark-content"
          translucent
          backgroundColor="transparent"
        />

        <AuthContextProvider>
          <CityProvider>
            <CartProvider>
              {fontsLoaded ? <Routes /> : <Loading />}
            </CartProvider>
          </CityProvider>
        </AuthContextProvider>
      </NativeBaseProvider>
    </SafeAreaProvider>
  )
}
