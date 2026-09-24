import React, { useCallback } from 'react'

import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'

import { MaterialIcons } from '@expo/vector-icons'

import { useNavigation, useRoute } from '@react-navigation/native'

import { SafeAreaView } from 'react-native-safe-area-context'

import { useNavigationHistory } from '@contexts/NavigationHistoryContext'

type Props = {
  title: string
}

export function BackHome({ title }: Props) {
  const navigation = useNavigation<any>()

  const route = useRoute()

  const { getPreviousRoute } = useNavigationHistory()

  const handleBack = useCallback(() => {
    /*
     * 1. Primeiro tenta voltar pela
     * stack da própria tela.
     */
    if (navigation.canGoBack()) {
      navigation.goBack()

      return
    }

    /*
     * 2. A tela pode estar dentro de
     * TabNavigator / Drawer / Stack
     * aninhados.
     *
     * Nesse caso, o navigator atual
     * pode dizer que não consegue voltar,
     * enquanto o navigator pai consegue.
     */
    let parentNavigation = navigation.getParent?.()

    while (parentNavigation) {
      if (parentNavigation.canGoBack()) {
        parentNavigation.goBack()

        return
      }

      parentNavigation = parentNavigation.getParent?.()
    }

    /*
     * 3. Somente se não houver histórico
     * nativo usamos o histórico próprio.
     */
    const previousRoute = getPreviousRoute()

    if (previousRoute?.name && previousRoute.name !== route.name) {
      navigation.navigate(previousRoute.name, previousRoute.params)

      return
    }

    /*
     * Não redirecionamos automaticamente
     * para a Home.
     *
     * Se chegarmos aqui, não existe
     * uma rota anterior válida.
     */
    console.warn('[BackHome] Nenhuma rota anterior disponível.')
  }, [getPreviousRoute, navigation, route.name])

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.header}>
        {/* VOLTAR */}

        <Pressable
          onPress={handleBack}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={({ pressed }) => [
            styles.backButton,

            pressed && styles.backButtonPressed,
          ]}
        >
          <MaterialIcons name="arrow-back-ios-new" size={21} color="#374151" />
        </Pressable>

        {/* TÍTULO */}

        <View style={styles.titleContainer} pointerEvents="none">
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.title}>
            {title || 'Categoria'}
          </Text>
        </View>

        {/* ESPAÇO PARA CENTRALIZAR */}

        <View style={styles.rightSpace} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
  },

  header: {
    height: 58,

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: '#FFFFFF',

    paddingHorizontal: 12,

    borderBottomWidth: StyleSheet.hairlineWidth,

    borderBottomColor: '#E5E7EB',

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

        shadowOpacity: 0.06,

        shadowRadius: 3,
      },
    }),
  },

  backButton: {
    width: 44,

    height: 44,

    borderRadius: 22,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#F3F4F6',

    zIndex: 2,
  },

  backButtonPressed: {
    opacity: 0.65,

    transform: [
      {
        scale: 0.96,
      },
    ],
  },

  titleContainer: {
    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 12,
  },

  title: {
    maxWidth: '100%',

    fontSize: 17,

    lineHeight: 22,

    fontWeight: '600',

    letterSpacing: 0.15,

    color: '#1F2937',

    textAlign: 'center',
  },

  rightSpace: {
    width: 44,

    height: 44,
  },
})
