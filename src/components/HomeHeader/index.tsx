import React, { useCallback, useEffect, useMemo, useState } from 'react'

import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'

import { MaterialIcons } from '@expo/vector-icons'

import { useNavigation } from '@react-navigation/native'

import { SafeAreaView } from 'react-native-safe-area-context'

import MarketPng from '@assets/novoLogo.png'

import { useAuth } from '@hooks/useAuth'

import { LocationSelector } from '@components/LocationSelector'

import { AppNavigatorRoutesProps } from '@routes/app.routes'

export function HomeHeader() {
  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const { user, signOut } = useAuth()

  const [avatarError, setAvatarError] = useState(false)

  /* =====================================
     PRIMEIRO NOME
  ===================================== */

  const firstName = useMemo(() => {
    const fullName = user?.name?.trim()

    if (!fullName) {
      return 'Cliente'
    }

    return fullName.split(/\s+/)[0] || 'Cliente'
  }, [user?.name])

  /* =====================================
     RESETA ERRO DO AVATAR
  ===================================== */

  useEffect(() => {
    setAvatarError(false)
  }, [user?.avatar])

  /* =====================================
     PERFIL
  ===================================== */

  const handleOpenProfile = useCallback(() => {
    navigation.navigate('profileEdit')
  }, [navigation])

  /* =====================================
     LOGOUT
  ===================================== */

  const handleLogout = useCallback(async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('[HomeHeader] Erro ao sair:', error)
    }
  }, [signOut])

  /* =====================================
     TELA
  ===================================== */

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.container}>
        {/* =================================
            PRIMEIRA LINHA
        ================================= */}

        <View style={styles.topRow}>
          {/* PERFIL */}

          <Pressable
            onPress={handleOpenProfile}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Editar perfil"
            style={({ pressed }) => [
              styles.profileArea,

              pressed && styles.pressed,
            ]}
          >
            {/* AVATAR */}

            <View style={styles.avatarContainer}>
              {user?.avatar && !avatarError ? (
                <Image
                  source={{
                    uri: user.avatar,
                  }}
                  style={styles.avatar}
                  resizeMode="cover"
                  resizeMethod="resize"
                  fadeDuration={0}
                  onError={() => {
                    setAvatarError(true)
                  }}
                />
              ) : (
                <Text style={styles.avatarInitial}>
                  {firstName.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>

            {/* SAUDAÇÃO */}

            <View style={styles.userInfo}>
              <Text numberOfLines={1} style={styles.hello}>
                Olá,
              </Text>

              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={styles.userName}
              >
                {firstName}
              </Text>
            </View>
          </Pressable>

          {/* =================================
              LOGOUT
          ================================= */}

          <Pressable
            onPress={handleLogout}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Sair"
            style={({ pressed }) => [
              styles.logoutButton,

              pressed && styles.pressed,
            ]}
          >
            <MaterialIcons name="logout" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* =================================
            SEGUNDA LINHA
        ================================= */}

        <View style={styles.bottomRow}>
          {/* LOCALIZAÇÃO */}

          <View style={styles.locationContainer}>
            <LocationSelector />
          </View>

          {/* LOGO */}

          <View style={styles.logoContainer}>
            <Image
              source={MarketPng}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

/* =====================================
   ESTILOS
===================================== */

const styles = StyleSheet.create({
  /* ==================================
       SAFE AREA
    ================================== */

  safeArea: {
    width: '100%',

    backgroundColor: 'transparent',
  },

  /* ==================================
       CONTAINER
    ================================== */

  container: {
    width: '98%',

    marginHorizontal: 4,

    paddingHorizontal: 16,

    paddingTop: 4,

    paddingBottom: 16,

    backgroundColor: '#1D4ED8',

    borderTopLeftRadius: 24,

    borderTopRightRadius: 24,

    borderBottomWidth: StyleSheet.hairlineWidth,

    borderBottomColor: '#9CA3AF',

    ...Platform.select({
      android: {
        elevation: 3,
      },

      ios: {
        shadowColor: '#000000',

        shadowOffset: {
          width: 0,
          height: 2,
        },

        shadowOpacity: 0.14,

        shadowRadius: 4,
      },
    }),
  },

  /* ==================================
       PRIMEIRA LINHA
    ================================== */

  topRow: {
    /*
     * Altura estável.
     * Alterar nome/avatar não modifica
     * a posição do SearchBar.
     */
    height: 56,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },

  /* ==================================
       PERFIL
    ================================== */

  profileArea: {
    flex: 1,

    minWidth: 0,

    flexDirection: 'row',

    alignItems: 'center',

    marginRight: 8,
  },

  /* ==================================
       AVATAR
    ================================== */

  avatarContainer: {
    width: 48,

    height: 48,

    borderRadius: 24,

    flexShrink: 0,

    alignItems: 'center',

    justifyContent: 'center',

    overflow: 'hidden',

    backgroundColor: '#60A5FA',
  },

  avatar: {
    width: '100%',

    height: '100%',
  },

  avatarInitial: {
    fontSize: 19,

    fontWeight: '700',

    color: '#FFFFFF',
  },

  /* ==================================
       NOME
    ================================== */

  userInfo: {
    flex: 1,

    minWidth: 0,

    marginLeft: 10,

    justifyContent: 'center',
  },

  hello: {
    fontSize: 14,

    lineHeight: 17,

    fontWeight: '500',

    color: 'rgba(255,255,255,0.90)',
  },

  userName: {
    marginTop: 1,

    fontSize: 14,

    lineHeight: 18,

    fontWeight: '700',

    color: '#FFFFFF',

    textTransform: 'capitalize',

    flexShrink: 1,
  },

  /* ==================================
       LOGOUT
    ================================== */

  logoutButton: {
    width: 40,

    height: 40,

    borderRadius: 20,

    flexShrink: 0,

    alignItems: 'center',

    justifyContent: 'center',
  },

  /* ==================================
       SEGUNDA LINHA
    ================================== */

  bottomRow: {
    /*
     * Também permanece estável.
     */
    height: 56,

    marginTop: 2,

    flexDirection: 'row',

    alignItems: 'center',
  },

  /* ==================================
       LOCALIZAÇÃO
    ================================== */

  locationContainer: {
    flex: 1,

    minWidth: 0,

    minHeight: 44,

    justifyContent: 'center',

    paddingHorizontal: 4,

    borderRadius: 20,

    backgroundColor: '#FFFFFF',

    ...Platform.select({
      android: {
        elevation: 2,
      },

      ios: {
        shadowColor: '#000000',

        shadowOffset: {
          width: 0,
          height: 1,
        },

        shadowOpacity: 0.1,

        shadowRadius: 3,
      },
    }),
  },

  /* ==================================
       LOGO
    ================================== */

  logoContainer: {
    width: 72,

    height: 50,

    marginLeft: 10,

    flexShrink: 0,

    alignItems: 'center',

    justifyContent: 'center',
  },

  logo: {
    width: 66,

    height: 48,

    borderRadius: 14,
  },

  /* ==================================
       INTERAÇÃO
    ================================== */

  pressed: {
    opacity: 0.65,
  },
})
