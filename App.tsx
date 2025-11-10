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
import { CartProvider } from '@contexts/CartContext'
import { useEffect } from 'react'
import * as NavigationBar from 'expo-navigation-bar'
import { checkAndApplyOtaNow, wireOtaOnAppState } from 'src/lib/updates'

export default function App() {
  const [fontsLoaded] = useFonts({ Roboto_400Regular, Roboto_700Bold })

  useEffect(() => {
    checkAndApplyOtaNow() // checa atualizações no launch
    const unwire = wireOtaOnAppState() // checa quando volta ao foco
    return () => unwire()
  }, [])

  useEffect(() => {
    const hideNavBar = async () => {
      if (Platform.OS === 'android') {
        // Deixa a barra oculta e só aparece ao deslizar a borda
        await NavigationBar.setVisibilityAsync('hidden')
        await NavigationBar.setBehaviorAsync('overlay-swipe')
        // cor transparente quando aparecer
        await NavigationBar.setBackgroundColorAsync('transparent')
      }
    }
    hideNavBar()
  }, [])

  return (
    <SafeAreaProvider>
      <NativeBaseProvider>
        <CartProvider>
          <StatusBar
            barStyle="dark-content"
            translucent
            backgroundColor="transparent"
          />
          <AuthContextProvider>
            {fontsLoaded ? <Routes /> : <Loading />}
          </AuthContextProvider>
        </CartProvider>
      </NativeBaseProvider>
    </SafeAreaProvider>
  )
}
