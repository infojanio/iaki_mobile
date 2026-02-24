import React from 'react'
import { Box, Text, Icon, VStack, HStack, Link } from 'native-base'
import { MaterialIcons } from '@expo/vector-icons'
import { TouchableOpacity } from 'react-native'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { useNavigation } from '@react-navigation/native'

export function CashbackRegulationCard() {
  const navigation = useNavigation<AppNavigatorRoutesProps>()

  function handleOpenAbout() {
    navigation.navigate('about')
  }

  return (
    <Box
      bg="white"
      borderRadius="md"
      p={4}
      mt={4}
      mx={4}
      my={2}
      shadow={1}
      borderWidth={1}
      borderColor="primary.100"
    >
      <TouchableOpacity
        style={{
          marginLeft: 8,
          marginBottom: 16,
          paddingVertical: 4,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
        }}
        onPress={() => handleOpenAbout()}
      >
        <Text style={{ fontSize: 16, color: '#374151' }}>
          ℹ️ Sobre o sistema
        </Text>
      </TouchableOpacity>
      <HStack space={2} alignItems="center" mb={3}>
        <Icon as={MaterialIcons} name="info" size="md" color="primary.500" />
        <Text fontSize="lg" fontWeight="bold" color="primary.500">
          Passos para acumular Pontos
        </Text>
      </HStack>

      <VStack space={3}>
        <HStack space={3} alignItems="flex-start">
          <Icon
            as={MaterialIcons}
            name="store"
            size="sm"
            color="gray.500"
            mt={0.5}
          />
          <Text flex={1}>
            <Text fontWeight="bold">1. Compre em nosso app:</Text> Escolha os
            produtos, adicione ao carrinho e confirme o pedido.
          </Text>
        </HStack>

        <HStack space={3} alignItems="flex-start">
          <Icon
            as={MaterialIcons}
            name="payment"
            size="sm"
            color="gray.500"
            mt={0.5}
          />
          <Text flex={1}>
            <Text fontWeight="bold">
              2. Após finalizar o pedido, vá até nossa loja física:
            </Text>{' '}
            Informe ao atendente que deseja acumular pontos.
          </Text>
        </HStack>

        <HStack space={3} alignItems="flex-start">
          <Icon
            as={MaterialIcons}
            name="smartphone"
            size="sm"
            color="gray.500"
            mt={0.5}
          />
          <Text flex={1}>
            <Text fontWeight="bold">3. Realize o pagamento:</Text> Forneça o
            código do pedido para aprovação.
          </Text>
        </HStack>

        <HStack space={3} alignItems="flex-start">
          <Icon
            as={MaterialIcons}
            name="schedule"
            size="sm"
            color="gray.500"
            mt={0.5}
          />
          <Text flex={1}>
            <Text fontWeight="bold">4. Solicite a validação:</Text> Seus pontos
            serão creditados após validação feita pela loja.
          </Text>
        </HStack>
      </VStack>

      <Box mt={4} p={3} bg="primary.50" borderRadius="sm">
        <Text fontSize="sm" color="gray.600" textAlign="center">
          Acumule pontos.{' '}
          <Link
            _text={{
              color: 'primary.600',
              fontWeight: 'medium',
              textDecoration: 'none',
            }}
            href="https://iaki.com.br"
            isExternal
          >
            Depois troque por brindes na loja.
          </Link>
        </Text>
      </Box>
    </Box>
  )
}
