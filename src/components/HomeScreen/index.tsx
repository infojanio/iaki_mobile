import React from 'react'
import { HStack, VStack, Text, IconButton, useTheme, Box } from 'native-base'
import { MaterialIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useNavigationHistory } from '@contexts/NavigationHistoryContext'

type Props = {
  title: string
}

export function HomeScreen({ title }: Props) {
  const { colors, sizes } = useTheme()

  // ✅ NÃO tipar como BottomTabNavigationProp aqui
  const navigation = useNavigation<any>()

  // ✅ usar pilha (evita ping-pong)
  const { popAndGetBackRoute } = useNavigationHistory()

  const handleBack = () => {
    // 1️⃣ Se existe Stack pai (root stack), volta nele
    const parent = navigation.getParent?.()
    if (parent?.canGoBack?.()) {
      parent.goBack()
      return
    }

    // 2️⃣ Se NÃO for tab e tiver como voltar, usa goBack
    const stateType = navigation.getState?.()?.type
    const isTab = stateType === 'tab'
    if (!isTab && navigation.canGoBack?.()) {
      navigation.goBack()
      return
    }

    // 3️⃣ Histórico inteligente COM POP (remove rota atual e volta na anterior)
    const target = popAndGetBackRoute()
    if (target?.name) {
      navigation.navigate(target.name, target.params)
      return
    }

    // 4️⃣ Fallback final
    navigation.navigate('home')
  }

  return (
    <VStack safeArea>
      <Box bg="white" shadow={2}>
        <HStack
          px={2}
          alignItems="center"
          justifyContent="space-between"
          bg="white"
        >
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

          <VStack flex={1} alignItems="center" ml={-8}>
            <Text fontSize="16" fontWeight="normal" color="gray.500">
              {title || 'Categoria'}
            </Text>
          </VStack>

          <Box w={sizes[6]} />
        </HStack>
      </Box>
    </VStack>
  )
}
