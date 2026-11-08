import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import { Alert, FlatList } from 'react-native'

import { useFocusEffect, useNavigation } from '@react-navigation/native'

import { Box, Text, VStack, HStack, Image, Button, Divider } from 'native-base'

import { api } from '@services/api'
import { formatCurrency } from '@utils/format'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { CartContext } from '@contexts/CartContext'
import { ButtonBack } from '@components/ButtonBack'

type DeliveryInfo = {
  storeId: string
  status: 'available' | 'pickup' | 'unknown'
}

export function Checkout() {
  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const { cartItems, syncOpenCart, activeStoreId } = useContext(CartContext)

  const [loading, setLoading] = useState(false)

  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null)

  const [deliveryLoading, setDeliveryLoading] = useState(false)

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

  useFocusEffect(
    useCallback(() => {
      let active = true

      setDeliveryInfo(null)

      if (!activeStoreId) {
        setDeliveryLoading(false)
        return
      }

      const storeId = activeStoreId

      async function fetchDeliveryInfo() {
        setDeliveryLoading(true)

        try {
          const response = await api.get(`/stores/${storeId}`)

          if (!active) return

          const store = response.data?.store ?? response.data

          if (store?.id !== storeId) {
            throw new Error('Loja não identificada.')
          }

          const whatsapp =
            typeof store.deliveryWhatsapp === 'string'
              ? store.deliveryWhatsapp.replace(/\D/g, '')
              : ''

          const hasPaymentMethods =
            Array.isArray(store.deliveryPaymentMethods) &&
            store.deliveryPaymentMethods.some(
              (method: unknown) =>
                typeof method === 'string' && method.trim() !== '',
            )

          let status: DeliveryInfo['status'] = 'unknown'

          if (store.isActive === true && store.deliveryEnabled === false) {
            status = 'pickup'
          } else if (
            store.isActive === true &&
            store.deliveryEnabled === true &&
            /^55\d{10,11}$/.test(whatsapp) &&
            hasPaymentMethods
          ) {
            status = 'available'
          }

          setDeliveryInfo({
            storeId,
            status,
          })
        } catch {
          if (active) {
            setDeliveryInfo({
              storeId,
              status: 'unknown',
            })
          }
        } finally {
          if (active) {
            setDeliveryLoading(false)
          }
        }
      }

      void fetchDeliveryInfo()

      return () => {
        active = false
      }
    }, [activeStoreId]),
  )

  const deliveryStatus =
    deliveryInfo?.storeId === activeStoreId ? deliveryInfo.status : 'unknown'

  const checkingDelivery =
    deliveryLoading ||
    Boolean(activeStoreId && deliveryInfo?.storeId !== activeStoreId)

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
                <Box
                  bg={deliveryStatus === 'available' ? 'green.50' : 'gray.50'}
                  p={3}
                  rounded="lg"
                  accessibilityLiveRegion="polite"
                >
                  {checkingDelivery ? (
                    <Text color="gray.600" fontSize="sm">
                      Consultando opções de entrega...
                    </Text>
                  ) : deliveryStatus === 'available' ? (
                    <>
                      <Text color="green.800" fontSize="sm" fontWeight="bold">
                        🚚 Esta loja aceita solicitações de entrega
                      </Text>

                      <Text color="green.700" fontSize="xs" mt={2}>
                        Registre o pedido e toque em Solicitar entrega na
                        próxima tela. A loja confirma disponibilidade, taxa e
                        prazo pelo WhatsApp.
                      </Text>
                    </>
                  ) : deliveryStatus === 'pickup' ? (
                    <>
                      <Text color="gray.800" fontSize="16" fontWeight="bold">
                        📍 Retirada na loja
                      </Text>

                      <Text color="gray.600" fontSize="xs" mt={2}>
                        A solicitação de entrega não está habilitada. Faça o
                        pagamento e a validação da compra no estabelecimento.
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text color="gray.800" fontSize="sm" fontWeight="bold">
                        Combine o atendimento com a loja
                      </Text>

                      <Text color="gray.600" fontSize="xs" mt={2}>
                        Não foi possível confirmar a opção de entrega. O
                        registro do pedido não confirma uma entrega.
                      </Text>
                    </>
                  )}
                </Box>

                <Divider my={3} />

                <HStack justifyContent="space-between">
                  <Text fontWeight="bold" fontSize="md">
                    Valor do pedido
                  </Text>

                  <Text fontWeight="bold" fontSize="md">
                    {formatCurrency(total)}
                  </Text>
                </HStack>

                {deliveryStatus === 'available' && (
                  <Text color="gray.500" fontSize="xs" mt={2}>
                    * Receba em casa ou retire na loja.
                  </Text>
                )}
              </Box>

              <Box
                bg="purple.50"
                p={4}
                rounded="xl"
                borderWidth={1}
                borderColor="purple.100"
              >
                <Text color="purple.800" fontWeight="bold" fontSize="lg">
                  🪙 Acumule {pointsToEarn} pontos!
                </Text>

                <Text color="purple.700" fontSize="sm" mt={1}>
                  Só serão creditados após validar a compra.
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
