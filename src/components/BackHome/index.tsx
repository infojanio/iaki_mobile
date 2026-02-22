import React from 'react'
import { HStack, VStack, Text, IconButton, useTheme, Box } from 'native-base'
import { MaterialIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useNavigationHistory } from '@contexts/NavigationHistoryContext'

type Props = {
  title: string
}

export function BackHome({ title }: Props) {
  const { colors, sizes } = useTheme()
  const navigation = useNavigation<any>()
  const { getPreviousRoute } = useNavigationHistory()

  const handleBack = () => {
    // Se existir stack de verdade em algum fluxo, usa
    if (navigation.canGoBack()) {
      navigation.goBack()
      return
    }

    // Caso Tab/sem stack: volta para a tela anterior registrada
    const prev = getPreviousRoute()
    if (prev?.name) {
      navigation.navigate(prev.name, prev.params)
      return
    }

    // fallback
    navigation.navigate('home')
  }

  return (
    <VStack safeArea>
      <Box bg="white" shadow={2} mb={2} ml={1}>
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
