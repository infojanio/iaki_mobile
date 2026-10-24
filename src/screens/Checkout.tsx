import React, { useContext, useEffect, useRef, useState } from 'react'

import { Alert, FlatList } from 'react-native'
import { useNavigation } from '@react-navigation/native'

import { Box, Text, VStack, HStack, Image, Button, Divider } from 'native-base'

import { api } from '@services/api'
import { formatCurrency } from '@utils/format'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { CartContext } from '@contexts/CartContext'
import { ButtonBack } from '@components/ButtonBack'

export function Checkout() {
  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const { cartItems, syncOpenCart } = useContext(CartContext)

  const [loading, setLoading] = useState(false)

  const submittingRef = useRef(false)
  const initialSyncStartedRef = useRef(false)

  useEffect(() => {
    if (initialSyncStartedRef.current) return

    initialSyncStartedRef.current = true

    async function loadCart() {
      try {
        await syncOpenCart()
      } catch {
        Alert.alert(
          'Não foi possível atualizar o carrinho',
          'Confira sua conexão e tente novamente.',
        )
      }
    }

    void loadCart()
  }, [syncOpenCart])

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0,
  )

  const total = subtotal
  const pointsToEarn = Math.floor(total / 10)

  async function handleConfirmOrder() {
    if (submittingRef.current || cartItems.length === 0) {
      return
    }

    submittingRef.current = true
    setLoading(true)

    try {
      const response = await api.post('/cart/checkout')
      const orderId = response.data?.orderId

      if (!orderId) {
        Alert.alert(
          'Confira seus pedidos',
          'Não foi possível obter o código. Consulte Meus pedidos antes de tentar novamente.',
        )

        navigation.navigate('orderHistory')
        return
      }

      try {
        await syncOpenCart()
      } catch (error) {
        console.warn(
          '[Checkout] Pedido criado, mas o carrinho não foi atualizado:',
          error,
        )
      }

      navigation.navigate('orderConfirmation', {
        orderId,
        pointsEarned: pointsToEarn,
      })
    } catch (error: any) {
      const status = error?.response?.status

      if (!status || status >= 500) {
        Alert.alert(
          'Confira se o pedido foi registrado',
          'Não conseguimos confirmar o resultado. Consulte Meus pedidos antes de tentar novamente.',
          [
            {
              text: 'Fechar',
              style: 'cancel',
            },
            {
              text: 'Meus pedidos',
              onPress: () => navigation.navigate('orderHistory'),
            },
          ],
        )

        return
      }

      Alert.alert(
        'Não foi possível registrar',
        error?.response?.data?.message ??
          'Confira os produtos do carrinho e tente novamente.',
      )
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }

  return (
    <Box flex={1} bg="gray.50" safeAreaTop>
      <HStack
        px={4}
        py={3}
        alignItems="center"
        bg="white"
        borderBottomWidth={1}
        borderBottomColor="gray.100"
      >
        <ButtonBack />

        <Text flex={1} ml={3} fontSize="lg" fontWeight="bold">
          Confira seu pedido
        </Text>
      </HStack>

      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.productId}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 32,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <VStack space={4} mb={4}>
            <Text fontWeight="bold" fontSize="md">
              Produtos do pedido
            </Text>
          </VStack>
        }
        renderItem={({ item }) => (
          <HStack
            space={3}
            alignItems="center"
            mb={3}
            p={3}
            bg="white"
            rounded="xl"
          >
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                alt={item.name}
                width={16}
                height={16}
                rounded="lg"
                resizeMode="contain"
              />
            ) : (
              <Box
                width={16}
                height={16}
                rounded="lg"
                bg="gray.100"
                alignItems="center"
                justifyContent="center"
              >
                <Text color="gray.500" fontSize="xs">
                  Sem foto
                </Text>
              </Box>
            )}

            <VStack flex={1} space={1}>
              <Text fontWeight="semibold" numberOfLines={2}>
                {item.name}
              </Text>

              <Text color="gray.500" fontSize="xs">
                {item.quantity} × {formatCurrency(Number(item.price))}
              </Text>
            </VStack>

            <Text fontWeight="bold" fontSize="sm">
              {formatCurrency(Number(item.price) * Number(item.quantity))}
            </Text>
          </HStack>
        )}
        ListEmptyComponent={
          <Box bg="white" p={6} rounded="xl" alignItems="center">
            <Text fontWeight="bold">
              {loading
                ? 'Finalizando seu pedido...'
                : 'Seu carrinho está vazio'}
            </Text>

            {!loading && (
              <>
                <Text color="gray.600" textAlign="center" mt={2}>
                  Adicione produtos para registrar um pedido.
                </Text>

                <Button
                  mt={4}
                  variant="outline"
                  onPress={() => navigation.goBack()}
                >
                  Voltar
                </Button>
              </>
            )}
          </Box>
        }
        ListFooterComponent={
          cartItems.length > 0 ? (
            <VStack space={4} mt={3}>
              <Box bg="white" p={4} rounded="xl">
                <HStack justifyContent="space-between">
                  <Text color="gray.600">Subtotal</Text>

                  <Text>{formatCurrency(subtotal)}</Text>
                </HStack>

                <Divider my={3} />

                <HStack justifyContent="space-between">
                  <Text fontWeight="bold" fontSize="md">
                    Valor do pedido
                  </Text>

                  <Text fontWeight="bold" fontSize="md">
                    {formatCurrency(total)}
                  </Text>
                </HStack>

                <Text color="red.500" fontSize="xs" mt={2}>
                  Pagamento diretamente na loja.
                </Text>
              </Box>

              <Box
                bg="purple.50"
                p={4}
                rounded="xl"
                borderWidth={1}
                borderColor="purple.100"
              >
                <Text color="purple.800" fontWeight="bold" fontSize="lg">
                  Previsão: {pointsToEarn} pontos
                </Text>

                <Text color="purple.700" fontSize="sm" mt={1}>
                  Os pontos serão creditados após validar a compra.
                </Text>

                <Text color="purple.600" fontSize="14" mt={2}>
                  1 ponto a cada R$ 10 pagos.
                </Text>
              </Box>

              <Button
                size="lg"
                colorScheme="blue"
                rounded="xl"
                isLoading={loading}
                isLoadingText="Registrando..."
                isDisabled={loading}
                onPress={handleConfirmOrder}
              >
                Registrar pedido
              </Button>

              <Text textAlign="center" color="gray.500" fontSize="xs">
                Nenhum pagamento será realizado pelo aplicativo.
              </Text>
            </VStack>
          ) : null
        }
      />
    </Box>
  )
}

type InstructionStepProps = {
  number: string
  text: string
}

function InstructionStep({ number, text }: InstructionStepProps) {
  return (
    <HStack space={3} alignItems="flex-start">
      <Box
        width={6}
        height={6}
        rounded="full"
        bg="blue.700"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="white" fontWeight="bold" fontSize="xs">
          {number}
        </Text>
      </Box>

      <Text flex={1} color="blue.800" fontSize="sm">
        {text}
      </Text>
    </HStack>
  )
}
