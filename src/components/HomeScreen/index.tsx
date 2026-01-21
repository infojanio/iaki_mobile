import React from 'react'
import { HStack, VStack, Text, IconButton, useTheme, Box } from 'native-base'
import { MaterialIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { AppNavigatorRoutesProps } from '@routes/app.routes'

type Props = {
  title: string // Nome da categoria atual
}

export function HomeScreen({ title }: Props) {
  const { colors, sizes } = useTheme()
  const navigation = useNavigation<AppNavigatorRoutesProps>()

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
            onPress={() => navigation.goBack()}
          />

          <VStack flex={1} alignItems="center" ml={-8}>
            <Text fontSize="16" fontWeight="normal" color="gray.500">
              {title || 'Categoria'}
            </Text>
          </VStack>

          {/* Espaço reservado à direita para manter alinhamento */}
          <Box w={sizes[6]} />
        </HStack>
      </Box>
    </VStack>
  )
}
