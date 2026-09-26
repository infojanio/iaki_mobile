import { useEffect } from 'react'

import { Platform, StatusBar } from 'react-native'

import { NativeBaseProvider } from 'native-base'

import { SafeAreaProvider } from 'react-native-safe-area-context'

import {
  useFonts,
  Roboto_400Regular,
  Roboto_700Bold,
} from '@expo-google-fonts/roboto'

import * as NavigationBar from 'expo-navigation-bar'

import { Loading } from '@components/Loading'

import { AppModalRoot } from '@components/AppModalRoot'

import { AppErrorBoundary } from '@components/AppErrorBoundary'

import { Routes } from './src/routes'

import { AuthContextProvider } from '@contexts/AuthContext'

import { CityProvider } from '@contexts/CityContext'

import { CartProvider } from '@contexts/CartContext'

import { StorePointsProvider } from '@contexts/StorePointsContext'

import { checkAndApplyOtaNow, wireOtaOnAppState } from 'src/lib/updates'
import { NetworkGuard } from '@screens/NetworkGuard'

export default function App() {
  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_700Bold,
  })

  /* ==============================
     🔄 OTA UPDATES
  ============================== */

  useEffect(() => {
    void checkAndApplyOtaNow()

    const unwire = wireOtaOnAppState()

    return () => {
      unwire()
    }
  }, [])

  /* ==============================
     🤖 ANDROID NAV BAR
  ============================== */

  useEffect(() => {
    async function configureNavigationBar() {
      if (Platform.OS !== 'android') {
        return
      }

      try {
        await NavigationBar.setVisibilityAsync('hidden')

        await NavigationBar.setBehaviorAsync('overlay-swipe')

        await NavigationBar.setBackgroundColorAsync('transparent')
      } catch (error) {
        console.warn(
          '[App] Não foi possível configurar a barra de navegação:',
          error,
        )
      }
    }

    void configureNavigationBar()
  }, [])

  /* ==============================
     APP
  ============================== */

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      {/* =================================
          PROTEÇÃO GLOBAL CONTRA ERROS
      ================================= */}

      <AppErrorBoundary>
        {/* =================================
            PROTEÇÃO GLOBAL DE INTERNET
        ================================= */}

        <NetworkGuard>
          {/* =================================
              NATIVE BASE
          ================================= */}

          <NativeBaseProvider>
            {/* =================================
                AUTENTICAÇÃO
            ================================= */}

            <AuthContextProvider>
              {/* =================================
                  CIDADE
              ================================= */}

              <CityProvider>
                {/* =================================
                    CARRINHO
                ================================= */}

                <CartProvider>
                  {/* =================================
                      PONTOS
                  ================================= */}

                  <StorePointsProvider>
                    {/* =================================
                        ROTAS / LOADING
                    ================================= */}

                    {fontsLoaded ? <Routes /> : <Loading />}

                    {/* =================================
                        MODAIS GLOBAIS
                    ================================= */}

                    <AppModalRoot />
                  </StorePointsProvider>
                </CartProvider>
              </CityProvider>
            </AuthContextProvider>
          </NativeBaseProvider>
        </NetworkGuard>
      </AppErrorBoundary>
    </SafeAreaProvider>
  )
}
