import React from 'react'
import { IconButton, useTheme } from 'native-base'
import { MaterialIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useNavigationHistory } from '@contexts/NavigationHistoryContext'

type Props = {
  route?: string
  params?: any
}

export function ButtonBack({ route, params }: Props) {
  const { colors, sizes } = useTheme()
  const navigation = useNavigation<any>()
  const { popAndGetBackRoute } = useNavigationHistory()

  function handleBack() {
    // 1) se existir stack pai real, usa ele
    const parent = navigation.getParent?.()
    if (parent?.canGoBack?.()) {
      parent.goBack()
      return
    }

    // 2) se você passou um destino explícito, navega pra ele
    if (route) {
      navigation.navigate(route, params)
      return
    }

    // 3) histórico inteligente COM POP (evita ping-pong)
    const target = popAndGetBackRoute()
    if (target?.name) {
      navigation.navigate(target.name, target.params)
      return
    }

    // 4) fallback final
    navigation.navigate('home')
  }

  return (
    <IconButton
      icon={
        <MaterialIcons
          name="arrow-back"
          size={sizes[6]}
          color={colors.gray[700]}
        />
      }
      onPress={handleBack}
    />
  )
}
