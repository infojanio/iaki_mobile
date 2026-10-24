import React, { useCallback, useEffect, useRef, useState } from 'react'

import { Alert, Animated, Linking } from 'react-native'

import {
  Box,
  Text,
  VStack,
  HStack,
  ScrollView,
  Image,
  Button,
  Spinner,
  Badge,
  Divider,
  Pressable,
} from 'native-base'

import { useNavigation, useRoute } from '@react-navigation/native'
import { MaterialIcons } from '@expo/vector-icons'

import { api } from '@services/api'
import { formatCurrency } from '@utils/format'
import { AppNavigatorRoutesProps } from '@routes/app.routes'

type OrderItem = {
  id: string
  quantity: number
  subtotal: number | null
  product: {
    id: string
    name: string
    image: string | null
  }
}

type ConfirmationOrder = {
  id: string
  store: {
    id: string
    name: string
    latitude: number | null
    longitude: number | null
  }
  totalAmount: number
  discountApplied: number
  status: string
  createdAt: string | null
  items: OrderItem[]
}

function toNumber(value: unknown, fallback = 0) {
  if (value === null || value === undefined || value === '') {
    return fallback
  }

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : fallback
}

function parseCoordinate(value: unknown): number | null {
  if (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && !value.trim())
  ) {
    return null
  }

  if (typeof value !== 'number' && typeof value !== 'string') {
    return null
  }

  const coordinate = Number(value)

  return Number.isFinite(coordinate) ? coordinate : null
}

function formatDate(value: string | null) {
  if (!value) return 'Não informada'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Não informada'
  }

  return date.toLocaleDateString('pt-BR')
}

function getStatusInfo(status: string) {
  switch (status) {
    case 'PENDING':
      return {
        title: 'Pedido registrado!',
        label: 'Aguardando validação',
        color: 'warning',
      }

    case 'VALIDATED':
      return {
        title: 'Compra validada!',
        label: 'Validado',
        color: 'success',
      }

    case 'EXPIRED':
      return {
        title: 'Pedido encerrado',
        label: 'Encerrado',
        color: 'coolGray',
      }

    default:
      return {
        title: 'Detalhes do pedido',
        label: 'Consulte o status na loja',
        color: 'coolGray',
      }
  }
}

async function handleOpenStoreMaps(order: ConfirmationOrder) {
  const { latitude, longitude } = order.store

  if (
    latitude === null ||
    longitude === null ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    Alert.alert(
      'Localização indisponível',
      'Esta loja ainda não possui uma localização válida cadastrada.',
    )

    return
  }

  const destination = encodeURIComponent(`${latitude},${longitude}`)

  const url =
    'https://www.google.com/maps/dir/?api=1' + `&destination=${destination}`

  try {
    await Linking.openURL(url)
  } catch {
    Alert.alert(
      'Não foi possível abrir o mapa',
      'Tente novamente em instantes.',
    )
  }
}

export function OrderConfirmation() {
  const route = useRoute<any>()

  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const orderId = route.params?.orderId as string | undefined

  const [order, setOrder] = useState<ConfirmationOrder | null>(null)

  const [loading, setLoading] = useState(true)

  const scaleAnim = useRef(new Animated.Value(0.85)).current

  const opacityAnim = useRef(new Animated.Value(0)).current

  const fetchOrder = useCallback(async () => {
    setLoading(true)

    if (!orderId) {
      setOrder(null)
      setLoading(false)
      return
    }

    try {
      const response = await api.get(`/orders/${orderId}`)

      const data = response.data?.order ?? response.data

      if (!data?.id) {
        throw new Error('Pedido não encontrado.')
      }

      const mapped: ConfirmationOrder = {
        id: data.id,

        store: {
          id: data.store?.id ?? data.storeId ?? '',

          name:
            typeof data.store?.name === 'string' && data.store.name.trim()
              ? data.store.name.trim()
              : 'Loja não identificada',

          latitude: parseCoordinate(data.store?.latitude),

          longitude: parseCoordinate(data.store?.longitude),
        },

        totalAmount: toNumber(data.totalAmount),

        discountApplied: toNumber(data.discountApplied),

        status: data.status ?? '',

        createdAt: data.created_at ?? data.createdAt ?? null,

        items: (Array.isArray(data.items) ? data.items : []).map(
          (item: any, index: number): OrderItem => ({
            id: item.id ?? `${data.id}-item-${index}`,

            quantity: toNumber(item.quantity),

            // Valor registrado no pedido.
            subtotal:
              item.subtotal === null || item.subtotal === undefined
                ? null
                : toNumber(item.subtotal),

            product: {
              id: item.product?.id ?? '',

              name: item.product?.name ?? 'Produto indisponível',

              image: item.product?.image ?? null,
            },
          }),
        ),
      }

      setOrder(mapped)
    } catch (error) {
      console.error('[OrderConfirmation] Erro ao buscar pedido:', error)

      setOrder(null)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    void fetchOrder()
  }, [fetchOrder])

  useEffect(() => {
    if (loading || !order) return

    scaleAnim.setValue(0.85)
    opacityAnim.setValue(0)

    const animation = Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),

      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ])

    animation.start()

    return () => animation.stop()
  }, [loading, order, scaleAnim, opacityAnim])

  if (loading) {
    return (
      <Box flex={1} bg="gray.50" alignItems="center" justifyContent="center">
        <Spinner size="lg" color="blue.600" />

        <Text color="gray.600" mt={3}>
          Carregando seu pedido...
        </Text>
      </Box>
    )
  }

  if (!order) {
    return (
      <Box
        flex={1}
        bg="gray.50"
        alignItems="center"
        justifyContent="center"
        p={6}
        safeArea
      >
        <Text fontSize="lg" fontWeight="bold" textAlign="center">
          Não conseguimos carregar o pedido
        </Text>

        <Text color="gray.600" textAlign="center" mt={2}>
          Tente novamente ou consulte seus pedidos.
        </Text>

        <Button mt={5} onPress={() => void fetchOrder()}>
          Tentar novamente
        </Button>

        <Button
          mt={3}
          variant="outline"
          onPress={() => navigation.navigate('orderHistory')}
        >
          Meus pedidos
        </Button>
      </Box>
    )
  }

  const isPending = order.status === 'PENDING'
  const isValidated = order.status === 'VALIDATED'
  const isExpired = order.status === 'EXPIRED'

  const statusInfo = getStatusInfo(order.status)

  const netAmount = Math.max(order.totalAmount - order.discountApplied, 0)

  const estimatedPoints = Math.floor(netAmount / 10)

  return (
    <Box flex={1} bg="gray.50" safeAreaTop>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 32,
        }}
      >
        <VStack space={4}>
          <Box bg="white" p={5} rounded="2xl">
            <Animated.View
              style={{
                opacity: opacityAnim,
                transform: [{ scale: scaleAnim }],
              }}
            >
              <Text
                textAlign="center"
                fontSize="2xl"
                fontWeight="bold"
                color={isValidated ? 'green.700' : 'blue.800'}
              >
                {statusInfo.title}
              </Text>
            </Animated.View>

            <HStack justifyContent="center" mt={3}>
              <Badge colorScheme={statusInfo.color} rounded="md" px={3} py={1}>
                {statusInfo.label}
              </Badge>
            </HStack>

            <Text textAlign="center" color="gray.500" fontSize="sm" mt={3}>
              código: #{order.id.slice(0, 8).toUpperCase()}
            </Text>

            <Text
              textAlign="center"
              fontWeight="semibold"
              color="gray.800"
              mt={1}
            >
              Vendido por: {order.store.name}
            </Text>

            <Text textAlign="center" color="gray.500" fontSize="xs" mt={1}>
              Registrado em {formatDate(order.createdAt)}
            </Text>
          </Box>

          {isPending && (
            <>
              <Box
                bg="blue.50"
                p={5}
                rounded="2xl"
                borderWidth={1}
                borderColor="blue.100"
              >
                <Text fontSize="lg" fontWeight="bold" color="blue.900">
                  Próximo passo, vá ao estabelecimento:
                  {'\n\n'}
                  📍 {order.store.name}
                </Text>

                <VStack space={3} mt={3}>
                  <NextStep
                    number="1"
                    text="Confira a disponibilidade dos produtos."
                  />

                  <NextStep
                    number="2"
                    text="Faça o pagamento no estabelecimento."
                  />

                  <NextStep
                    number="3"
                    text="Apresente o código ao atendente e peça a validação dos pontos."
                  />
                </VStack>

                <Pressable
                  mt={4}
                  onPress={() => void handleOpenStoreMaps(order)}
                  accessibilityRole="button"
                  accessibilityLabel={`Como chegar à loja ${order.store.name}`}
                  accessibilityHint="Abre a rota no Google Maps"
                >
                  {({ isPressed }) => (
                    <HStack
                      alignItems="center"
                      space={3}
                      px={4}
                      py={4}
                      minH={18}
                      rounded="xl"
                      bg={isPressed ? '#174EA6' : '#1A73E8'}
                      style={{
                        transform: [
                          {
                            scale: isPressed ? 0.98 : 1,
                          },
                        ],
                      }}
                    >
                      <MaterialIcons
                        name="directions"
                        size={28}
                        color="#FFFFFF"
                      />

                      <VStack flex={1} space={1}>
                        <Text color="white" fontSize="md" fontWeight="bold">
                          Como chegar
                        </Text>

                        <Text color="white" fontSize="xs">
                          Ver rota no Google Maps
                        </Text>
                      </VStack>

                      <MaterialIcons
                        name="open-in-new"
                        size={20}
                        color="#FFFFFF"
                      />
                    </HStack>
                  )}
                </Pressable>
                <Button
                  mt={3}
                  variant="outline"
                  colorScheme="blue"
                  rounded="xl"
                  onPress={() => navigation.navigate('orderHistory')}
                >
                  Meus pedidos
                </Button>

                <Text color="blue.800" fontSize="xs" mt={3}>
                  Este pedido não reserva nem separa os produtos.
                </Text>
              </Box>

              <Box
                bg="purple.50"
                p={5}
                rounded="2xl"
                borderWidth={1}
                borderColor="purple.100"
                alignItems="center"
              >
                <Text color="purple.700" fontSize="sm">
                  Você poderá receber
                </Text>

                <Animated.View
                  style={{
                    opacity: opacityAnim,
                    transform: [{ scale: scaleAnim }],
                  }}
                >
                  <Text fontSize="5xl" fontWeight="bold" color="purple.700">
                    {estimatedPoints}
                  </Text>
                </Animated.View>

                <Text color="purple.800" fontWeight="bold">
                  pontos
                </Text>

                <Text
                  color="purple.700"
                  fontSize="sm"
                  textAlign="center"
                  mt={2}
                >
                  Aguardando a validação da compra.
                </Text>

                <Text
                  color="purple.600"
                  fontSize="xs"
                  textAlign="center"
                  mt={2}
                >
                  Estimativa de 1 ponto a cada R$ 10 pagos.
                </Text>
              </Box>
            </>
          )}

          {isValidated && (
            <Box
              bg="green.50"
              p={5}
              rounded="2xl"
              borderWidth={1}
              borderColor="green.200"
            >
              <Text color="green.800" fontWeight="bold" fontSize="lg">
                Compra concluída
              </Text>

              <Text color="green.800" fontSize="sm" mt={2}>
                Consulte seu saldo de pontos nesta loja.
              </Text>

              <Text color="green.800" fontSize="sm" mt={2}>
                Para trocar seus pontos, abra a loja no aplicativo e acesse a
                seção Brindes.
              </Text>
            </Box>
          )}

          {isExpired && (
            <Box
              bg="orange.50"
              p={5}
              rounded="2xl"
              borderWidth={1}
              borderColor="orange.200"
            >
              <Text color="orange.900" fontWeight="bold">
                Este pedido não pode mais ser validado
              </Text>

              <Text color="orange.800" fontSize="sm" mt={2}>
                Para realizar a compra, adicione os produtos ao carrinho e
                registre um novo pedido.
              </Text>
            </Box>
          )}

          <Box bg="white" p={5} rounded="2xl">
            <Text fontSize="md" fontWeight="bold" mb={4}>
              Resumo dos produtos
            </Text>

            <VStack space={4}>
              {order.items.map((item) => (
                <HStack key={item.id} space={3} alignItems="center">
                  {item.product.image ? (
                    <Image
                      source={{
                        uri: item.product.image,
                      }}
                      alt={item.product.name}
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

                  <VStack flex={1}>
                    <Text fontWeight="semibold" numberOfLines={2}>
                      {item.product.name}
                    </Text>

                    <Text color="gray.500" fontSize="xs" mt={1}>
                      Quantidade: {item.quantity}
                    </Text>
                  </VStack>

                  {item.subtotal !== null && (
                    <Text fontWeight="bold" fontSize="sm">
                      {formatCurrency(item.subtotal)}
                    </Text>
                  )}
                </HStack>
              ))}
            </VStack>

            <Divider my={4} />

            {order.discountApplied > 0 && (
              <VStack space={2} mb={3}>
                <HStack justifyContent="space-between">
                  <Text color="gray.600">Valor dos produtos</Text>

                  <Text>{formatCurrency(order.totalAmount)}</Text>
                </HStack>

                <HStack justifyContent="space-between">
                  <Text color="green.700">Desconto registrado</Text>

                  <Text color="green.700">
                    -{formatCurrency(order.discountApplied)}
                  </Text>
                </HStack>
              </VStack>
            )}

            <HStack justifyContent="space-between">
              <Text fontWeight="bold">Valor do pedido</Text>

              <Text fontWeight="bold">{formatCurrency(netAmount)}</Text>
            </HStack>

            {isPending && (
              <Text color="gray.500" fontSize="xs" mt={2}>
                Pagamento diretamente na loja.
              </Text>
            )}
          </Box>

          {!isPending && (
            <Button
              colorScheme="blue"
              rounded="xl"
              onPress={() => navigation.navigate('orderHistory')}
            >
              Meus pedidos
            </Button>
          )}

          <Button
            variant="outline"
            colorScheme="blue"
            rounded="xl"
            onPress={() => navigation.navigate('home')}
          >
            Voltar ao início
          </Button>
        </VStack>
      </ScrollView>
    </Box>
  )
}

type NextStepProps = {
  number: string
  text: string
}

function NextStep({ number, text }: NextStepProps) {
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

      <Text flex={1} color="blue.900" fontSize="sm">
        {text}
      </Text>
    </HStack>
  )
}
