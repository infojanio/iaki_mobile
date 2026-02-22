import { Platform, StatusBar } from 'react-native'
import { NativeBaseProvider } from 'native-base'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import {
  useFonts,
  Roboto_400Regular,
  Roboto_700Bold,
} from '@expo-google-fonts/roboto'
import { useEffect } from 'react'
import * as NavigationBar from 'expo-navigation-bar'

import { Loading } from '@components/Loading'
import { Routes } from './src/routes'

import { AuthContextProvider } from '@contexts/AuthContext'
import { CityProvider } from '@contexts/CityContext'
import { CartProvider } from '@contexts/CartContext'

import { AppModalRoot } from '@components/AppModalRoot'

import { checkAndApplyOtaNow, wireOtaOnAppState } from 'src/lib/updates'
import { StorePointsProvider } from '@contexts/StorePointsContext'

export default function App() {
  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_700Bold,
  })

  /* ==============================
     🔄 OTA Updates
  ============================== */
  useEffect(() => {
    checkAndApplyOtaNow()
    const unwire = wireOtaOnAppState()
    return () => unwire()
  }, [])

  /* ==============================
     🤖 ANDROID NAV BAR
  ============================== */
  useEffect(() => {
    async function hideNavBar() {
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
              <StorePointsProvider>
                {/* 🔄 Loading protegido pelo NativeBase */}
                {fontsLoaded ? <Routes /> : <Loading />}

                {/* 🧠 Modais globais */}
                <AppModalRoot />
              </StorePointsProvider>
            </CartProvider>
          </CityProvider>
        </AuthContextProvider>
      </NativeBaseProvider>
    </SafeAreaProvider>
  )
}
