import React, { useEffect, useRef, useState } from 'react'

import { Platform, StatusBar, StyleSheet, View } from 'react-native'

import * as SplashScreen from 'expo-splash-screen'

import * as NavigationBar from 'expo-navigation-bar'

import { NativeBaseProvider } from 'native-base'

import { SafeAreaProvider } from 'react-native-safe-area-context'

import {
  useFonts,
  Roboto_400Regular,
  Roboto_700Bold,
} from '@expo-google-fonts/roboto'

import { AnimatedSplash } from '@components/AnimatedSplash'

import { Loading } from '@components/Loading'

import { AppModalRoot } from '@components/AppModalRoot'

import { AppErrorBoundary } from '@components/AppErrorBoundary'

import { NetworkGuard } from '@screens/NetworkGuard'

import { Routes } from './src/routes'

import { AuthContextProvider } from '@contexts/AuthContext'

import { CityProvider } from '@contexts/CityContext'

import { CartProvider } from '@contexts/CartContext'

import { StorePointsProvider } from '@contexts/StorePointsContext'

import { checkAndApplyOtaNow, wireOtaOnAppState } from 'src/lib/updates'

/*
 * Mantém a splash nativa aberta
 * até liberarmos manualmente.
 */
void SplashScreen.preventAutoHideAsync()

export default function App() {
  /* =====================================
     FONTES
  ===================================== */

  const [fontsLoaded, fontError] = useFonts({
    Roboto_400Regular,
    Roboto_700Bold,
  })

  /* =====================================
     SPLASH
  ===================================== */

  const [nativeSplashHidden, setNativeSplashHidden] = useState(false)

  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true)

  /*
   * Impede hideAsync de ser chamado
   * mais de uma vez.
   */
  const splashHandledRef = useRef(false)

  /* =====================================
     OTA
  ===================================== */

  useEffect(() => {
    void checkAndApplyOtaNow()

    const unwire = wireOtaOnAppState()

    return () => {
      unwire()
    }
  }, [])

  /* =====================================
     ANDROID NAVIGATION BAR
  ===================================== */

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

  /* =====================================
     OCULTAR SPLASH NATIVA
  ===================================== */

  useEffect(() => {
    /*
     * Enquanto as fontes ainda estão
     * carregando, mantém a splash nativa.
     */
    if (!fontsLoaded && !fontError) {
      return
    }

    /*
     * Evita executar novamente.
     */
    if (splashHandledRef.current) {
      return
    }

    splashHandledRef.current = true

    async function hideNativeSplash() {
      try {
        /*
         * Pequeno frame para garantir
         * que a árvore React já foi
         * renderizada atrás da splash.
         */
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            resolve()
          })
        })

        await SplashScreen.hideAsync()

        /*
         * SOMENTE depois de remover
         * a splash nativa, mostramos
         * a splash animada.
         */
        setNativeSplashHidden(true)
      } catch (error) {
        console.warn('[App] Erro ao ocultar splash nativa:', error)

        /*
         * Não bloqueia o aplicativo
         * caso hideAsync falhe.
         */
        setNativeSplashHidden(true)
      }
    }

    void hideNativeSplash()
  }, [fontsLoaded, fontError])

  /* =====================================
     TELA
  ===================================== */

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          translucent
          backgroundColor="transparent"
        />

        {/* =================================
            APP
        ================================= */}

        <AppErrorBoundary>
          <NetworkGuard>
            <NativeBaseProvider>
              <AuthContextProvider>
                <CityProvider>
                  <CartProvider>
                    <StorePointsProvider>
                      {fontsLoaded || fontError ? <Routes /> : <Loading />}

                      <AppModalRoot />
                    </StorePointsProvider>
                  </CartProvider>
                </CityProvider>
              </AuthContextProvider>
            </NativeBaseProvider>
          </NetworkGuard>
        </AppErrorBoundary>

        {/* =================================
            SPLASH ANIMADA
        ================================= */}

        {nativeSplashHidden && showAnimatedSplash && (
          <AnimatedSplash
            onFinish={() => {
              setShowAnimatedSplash(false)
            }}
          />
        )}
      </View>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: '#FFFFFF',
  },
})
