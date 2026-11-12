import React, { useCallback, useRef, useState } from 'react'
import { Alert, FlatList, Linking } from 'react-native'
import {
  Box,
  Text,
  VStack,
  HStack,
  Image,
  Spinner,
  Badge,
  Divider,
  Pressable,
  ScrollView,
  Center,
} from 'native-base'
import { addDays, differenceInCalendarDays, format } from 'date-fns'
import { useFocusEffect } from '@react-navigation/native'
import { api } from '@services/api'
import { formatCurrency } from '@utils/format'
import { HomeScreen } from '@components/HomeScreen'
import { OrderDeliveryModal } from '@components/OrderDeliveryModal'
import type { DeliveryOrder } from '@components/OrderDeliveryModal'
import type { DeliveryPilotStore } from '../config/deliveryPilot'
interface Product {
  id: string
  name: string
  price: number
  image: string | null
}
interface OrderItem {
  id: string
  quantity: number
  product: Product
}
interface Order {
  id: string
  createdAt: string
  totalAmount: number
  discountApplied?: number
  status: string
  items: OrderItem[]
  pointsEarned?: number
  store?: {
    id: string
    name: string
    avatar?: string | null
    latitude?: number | null
    longitude?: number | null
  } | null
}
type ExpirationInfo = {
  daysRemaining: number
  expirationDate: Date
  message: string
  backgroundColor: string
  borderColor: string
  textColor: string
}
const DEFAULT_PRODUCT_IMAGE = 'https://via.placeholder.com/80'
const ORDER_EXPIRATION_DAYS = 30
const STATUS_OPTIONS = [
  {
    value: 'PENDING',
    label: 'Pendente',
  },
  {
    value: 'VALIDATED',
    label: 'Aprovado',
  },
  {
    value: 'EXPIRED',
    label: 'Cancelado',
  },
]
function calculateOrderPoints(order: Order) {
  const valorPago =
    Number(order.totalAmount) - Number(order.discountApplied ?? 0)
  return Math.floor(Math.max(valorPago, 0) / 10)
}
// Prazo de 30 dias após a criação, conforme a regra atual do backend.
function getOrderExpirationInfo(order: Order): ExpirationInfo | null {
  if (order.status !== 'PENDING') {
    return null
  }
  const purchaseDate = new Date(order.createdAt)
  if (Number.isNaN(purchaseDate.getTime())) {
    return null
  }
  const expirationDate = addDays(purchaseDate, ORDER_EXPIRATION_DAYS)
  const daysRemaining = differenceInCalendarDays(expirationDate, new Date())
  if (Date.now() >= expirationDate.getTime()) {
    return {
      daysRemaining,
      expirationDate,
      message: 'O prazo para validar este pedido já expirou.',
      backgroundColor: 'red.100',
      borderColor: 'red.500',
      textColor: 'red.700',
    }
  }
  if (daysRemaining === 0) {
    return {
      daysRemaining,
      expirationDate,
      message:
        'Este pedido expira hoje. A compra já pode ser validada após o pagamento.',
      backgroundColor: 'red.100',
      borderColor: 'red.500',
      textColor: 'red.700',
    }
  }
  if (daysRemaining === 1) {
    return {
      daysRemaining,
      expirationDate,
      message: 'Este pedido expira amanhã. Valide a compra após o pagamento.',
      backgroundColor: 'red.100',
      borderColor: 'red.500',
      textColor: 'red.700',
    }
  }
  if (daysRemaining <= 5) {
    return {
      daysRemaining,
      expirationDate,
      message: `Este pedido expira em ${daysRemaining} dias. Valide a compra após o pagamento.`,
      backgroundColor: 'red.100',
      borderColor: 'red.500',
      textColor: 'red.700',
    }
  }
  if (daysRemaining <= 10) {
    return {
      daysRemaining,
      expirationDate,
      message: `Este pedido expira em ${daysRemaining} dias.`,
      backgroundColor: 'orange.100',
      borderColor: 'orange.400',
      textColor: 'orange.700',
    }
  }
  return {
    daysRemaining,
    expirationDate,
    message: `Este pedido expira em ${daysRemaining} dias.`,
    backgroundColor: 'white',
    borderColor: 'white',
    textColor: 'red.700',
  }
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
async function handleOpenStoreMaps(order: Order) {
  const latitude = order.store?.latitude
  const longitude = order.store?.longitude
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
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
export function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('PENDING')
  const [refreshing, setRefreshing] = useState(false)
  const requestIdRef = useRef(0)
  const deliveryLockRef = useRef(false)
  const [storeSettings, setStoreSettings] = useState<
    Record<string, DeliveryPilotStore>
  >({})
  const [openingOrderId, setOpeningOrderId] = useState<string | null>(null)
  const [deliveryRequest, setDeliveryRequest] = useState<{
    order: DeliveryOrder
    pilot: DeliveryPilotStore
  } | null>(null)

  const filteredOrders = orders.filter(
    (order) => order.status === selectedStatus,
  )

  async function loadStoreSettings(pendingOrders: Order[], requestId: number) {
    const ids = [
      ...new Set(
        pendingOrders
          .filter((order) => order.status === 'PENDING')
          .map((order) => order.store?.id)
          .filter((id): id is string => Boolean(id)),
      ),
    ]
    const settings: Record<string, DeliveryPilotStore> = {}
    let cursor = 0
    async function worker() {
      while (cursor < ids.length && requestIdRef.current === requestId) {
        const id = ids[cursor++]
        try {
          const response = await api.get(`/stores/${id}`)
          const store = response.data?.store ?? response.data
          const whatsapp =
            typeof store?.deliveryWhatsapp === 'string'
              ? store.deliveryWhatsapp.replace(/\D/g, '')
              : ''
          const methods: string[] = Array.isArray(store?.deliveryPaymentMethods)
            ? store.deliveryPaymentMethods.filter(
                (method: unknown): method is string =>
                  typeof method === 'string' && method.trim() !== '',
              )
            : []
          if (
            store?.id === id &&
            store.isActive === true &&
            store.deliveryEnabled === true &&
            /^55\d{10,11}$/.test(whatsapp) &&
            methods.length > 0
          ) {
            settings[id] = {
              storeId: id,
              storeName: store.name,
              whatsapp,
              paymentMethods: [...new Set(methods)],
            }
          }
        } catch {
          // Uma falha de consulta não impede visualizar os pedidos.
        }
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(4, ids.length) }, () => worker()),
    )
    if (requestIdRef.current === requestId) setStoreSettings(settings)
  }

  async function handleDelivery(order: Order) {
    const pilot = order.store?.id ? storeSettings[order.store.id] : undefined
    if (!pilot || deliveryLockRef.current) return
    deliveryLockRef.current = true
    setOpeningOrderId(order.id)
    const requestId = requestIdRef.current
    try {
      // O histórico pode omitir subtotais: usa o detalhe salvo do pedido.
      const response = await api.get(`/orders/${order.id}`)
      if (requestIdRef.current !== requestId) return
      const data = response.data?.order ?? response.data
      const storeId = data?.store?.id ?? data?.storeId
      const createdAt = new Date(
        data?.createdAt ?? data?.created_at ?? order.createdAt,
      )
      if (
        data?.id !== order.id ||
        data.status !== 'PENDING' ||
        storeId !== pilot.storeId ||
        Number.isNaN(createdAt.getTime()) ||
        Date.now() >= addDays(createdAt, ORDER_EXPIRATION_DAYS).getTime()
      ) {
        Alert.alert(
          'Pedido indisponível',
          'Este pedido não está disponível para solicitar entrega. Atualize o histórico.',
        )
        return
      }
      const totalAmount = Number(data.totalAmount)
      const discountApplied = Number(data.discountApplied ?? 0)
      if (
        !Number.isFinite(totalAmount) ||
        !Number.isFinite(discountApplied) ||
        !Array.isArray(data.items) ||
        !data.items.length
      ) {
        throw new Error('Dados incompletos.')
      }
      setDeliveryRequest({
        pilot,
        order: {
          id: data.id,
          store: { id: storeId, name: data.store?.name ?? pilot.storeName },
          totalAmount,
          discountApplied,
          items: data.items.map((item: any) => ({
            quantity: Number(item.quantity),
            subtotal:
              item.subtotal != null && Number.isFinite(Number(item.subtotal))
                ? Number(item.subtotal)
                : null,
            product: { name: item.product?.name ?? 'Produto indisponível' },
          })),
        },
      })
    } catch {
      if (requestIdRef.current === requestId) {
        Alert.alert(
          'Não foi possível abrir a solicitação',
          'Confira sua conexão e tente novamente. Nenhum novo pedido foi criado.',
        )
      }
    } finally {
      deliveryLockRef.current = false
      setOpeningOrderId(null)
    }
  }
  const fetchOrders = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setStoreSettings({})
    setDeliveryRequest(null)
    try {
      setLoading(true)
      const response = await api.get('/orders/history')
      const responseOrders =
        response.data?.orders ?? response.data?.data ?? response.data ?? []
      const parsedOrders: Order[] = Array.isArray(responseOrders)
        ? responseOrders.map((order: any) => {
            const total = Number(order.totalAmount ?? 0)
            const discount = Number(order.discountApplied ?? 0)
            const parsedOrder: Order = {
              id: order.id,
              createdAt: order.createdAt,
              totalAmount: total,
              discountApplied: discount,
              status: order.status,
              pointsEarned: order.pointsEarned,
              store: order.store
                ? {
                    id: order.store.id ?? '',
                    name: order.store.name ?? 'Loja não identificada',
                    avatar: order.store.avatar ?? null,
                    latitude: parseCoordinate(order.store.latitude),
                    longitude: parseCoordinate(order.store.longitude),
                  }
                : null,
              items: (order.items ?? []).map((item: any, index: number) => ({
                id: item.id ?? `${order.id}-${index}`,
                quantity: Number(item.quantity ?? 0),
                product: {
                  id: item.product?.id ?? '',
                  name: item.product?.name ?? 'Produto desconhecido',
                  price: Number(item.product?.price ?? 0),
                  image: item.product?.image ?? DEFAULT_PRODUCT_IMAGE,
                },
              })),
            }
            parsedOrder.pointsEarned =
              order.pointsEarned ?? calculateOrderPoints(parsedOrder)
            return parsedOrder
          })
        : []
      if (requestIdRef.current !== requestId) return
      setOrders(parsedOrders)
      void loadStoreSettings(parsedOrders, requestId)
    } catch (error: any) {
      console.error('[OrderHistory] Erro ao carregar pedidos:', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      })
      if (requestIdRef.current === requestId) {
        Alert.alert(
          'Não foi possível atualizar os pedidos',
          'Confira sua conexão e tente novamente.',
        )
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [])
  useFocusEffect(
    useCallback(() => {
      void fetchOrders()
      return () => {
        requestIdRef.current += 1
        setDeliveryRequest(null)
      }
    }, [fetchOrders]),
  )
  async function handleRefresh() {
    setRefreshing(true)
    await fetchOrders()
  }
  function getStatusColor(status: string) {
    switch (status) {
      case 'PENDING':
        return 'warning'
      case 'VALIDATED':
        return 'success'
      case 'EXPIRED':
        return 'error'
      default:
        return 'coolGray'
    }
  }
  function getStatusLabel(status: string) {
    return (
      STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status
    )
  }
  const StatusFilterHeader = () => (
    <Box px={4} pt={2} pb={4}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <HStack space={2}>
          {STATUS_OPTIONS.map((option) => (
            <Pressable
              key={`status-${option.value}`}
              onPress={() => setSelectedStatus(option.value)}
            >
              <Box
                px={4}
                py={2}
                borderRadius="2xl"
                bg={
                  selectedStatus === option.value ? 'primary.500' : 'gray.200'
                }
              >
                <Text
                  color={selectedStatus === option.value ? 'white' : 'gray.700'}
                  fontWeight="medium"
                >
                  {option.label}
                </Text>
              </Box>
            </Pressable>
          ))}
        </HStack>
      </ScrollView>
    </Box>
  )
  if (loading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Spinner size="lg" />
      </Box>
    )
  }
  return (
    <Box flex={1} bg="gray.50">
      <HomeScreen title="Meus Pedidos" />
      <StatusFilterHeader />
      <FlatList
        ListEmptyComponent={
          <Center mt={8}>
            <Text color="gray.500">
              Nenhum pedido com status {getStatusLabel(selectedStatus)}.
            </Text>
          </Center>
        }
        data={filteredOrders}
        keyExtractor={(item) => `order-${item.id}`}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={{
          paddingBottom: 32,
        }}
        renderItem={({ item }) => {
          const expirationInfo = getOrderExpirationInfo(item)
          const points =
            item.status === 'EXPIRED'
              ? 0
              : (item.pointsEarned ?? calculateOrderPoints(item))
          return (
            <Box mb={4} bg="white" p={4} mx={4} borderRadius="xl" shadow={1}>
              <HStack
                justifyContent="space-between"
                alignItems="flex-start"
                mb={2}
                space={2}
              >
                <Text flex={1} fontWeight="bold">
                  Pedido #{item.id.substring(0, 8)}
                </Text>
                <Badge colorScheme={getStatusColor(item.status)}>
                  {getStatusLabel(item.status)}
                </Badge>
              </HStack>
              <HStack alignItems="center" space={3} mb={3}>
                {item.store?.avatar ? (
                  <Image
                    source={{
                      uri: item.store.avatar,
                    }}
                    alt={item.store.name}
                    size="xs"
                    borderRadius="full"
                    resizeMode="cover"
                  />
                ) : (
                  <Center size={10} borderRadius="full" bg="primary.100">
                    <Text color="primary.700" fontSize="md" fontWeight="bold">
                      {item.store?.name?.charAt(0).toUpperCase() ?? 'L'}
                    </Text>
                  </Center>
                )}
                <VStack flex={1}>
                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    color="coolGray.800"
                    numberOfLines={1}
                  >
                    {item.store?.name ?? 'Loja não identificada'}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    Pedido registrado em{' '}
                    {Number.isNaN(new Date(item.createdAt).getTime())
                      ? 'Data não informada'
                      : format(new Date(item.createdAt), 'dd/MM/yyyy')}
                  </Text>
                </VStack>
              </HStack>
              {/* Prazo para validação */}
              {expirationInfo && (
                <Box
                  mb={4}
                  px={4}
                  py={3}
                  borderRadius="lg"
                  bg={expirationInfo.backgroundColor}
                  borderWidth={1}
                  borderColor={expirationInfo.borderColor}
                >
                  <Text
                    fontSize="sm"
                    fontWeight="normal"
                    color={expirationInfo.textColor}
                  >
                    ⚠️ {expirationInfo.message}
                  </Text>
                  {/*
                  <Text mt={1} fontSize="xs" color={expirationInfo.textColor}>
                    Prazo final:{' '}
                    {format(expirationInfo.expirationDate, 'dd/MM/yyyy HH:mm')}
                  </Text>
                  {Date.now() < expirationInfo.expirationDate.getTime() && (
                    <Text mt={2} fontSize="xs" color={expirationInfo.textColor}>
                      Valide a compra e ganhe seus pontos.
                    </Text>
                    
                  }
                  
                  )} */}
                </Box>
              )}
              {item.status === 'PENDING' &&
                item.store?.id &&
                storeSettings[item.store.id] &&
                expirationInfo &&
                Date.now() < expirationInfo.expirationDate.getTime() && (
                  <Pressable
                    mb={3}
                    isDisabled={openingOrderId !== null}
                    accessibilityRole="button"
                    accessibilityLabel={`Solicitar entrega do pedido ${item.id.slice(0, 8)}`}
                    onPress={() => void handleDelivery(item)}
                  >
                    {({ isPressed }) => (
                      <Box
                        px={4}
                        py={3}
                        rounded="lg"
                        borderWidth={1}
                        borderColor="green.300"
                        bg={isPressed ? 'green.100' : 'green.50'}
                      >
                        <HStack
                          space={2}
                          alignItems="center"
                          justifyContent="center"
                        >
                          {openingOrderId === item.id && (
                            <Spinner size="sm" color="green.700" />
                          )}
                          <Text color="green.800" fontWeight="bold">
                            {openingOrderId === item.id
                              ? 'Carregando pedido...'
                              : '🚚 Solicitar entrega'}
                          </Text>
                        </HStack>
                      </Box>
                    )}
                  </Pressable>
                )}
              {/* Ações do pedido */}
              {item.status === 'PENDING' && (
                <Pressable
                  mb={4}
                  onPress={() => void handleOpenStoreMaps(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Abrir rota até ${
                    item.store?.name ?? 'a loja'
                  } no Google Maps`}
                >
                  {({ isPressed }) => (
                    <Box
                      px={4}
                      py={3}
                      borderRadius="lg"
                      borderWidth={1}
                      borderColor="blue.200"
                      bg={isPressed ? 'blue.100' : 'blue.50'}
                      alignItems="center"
                    >
                      <Text color="blue.700" fontWeight="bold">
                        📍 Retirar na loja
                      </Text>
                    </Box>
                  )}
                </Pressable>
              )}
              <VStack space={3} mb={3}>
                {item.items.map((orderItem, index) => (
                  <HStack
                    key={`order-${item.id}-item-` + `${orderItem.id ?? index}`}
                    space={3}
                    alignItems="center"
                  >
                    <Image
                      source={{
                        uri: orderItem.product.image ?? DEFAULT_PRODUCT_IMAGE,
                      }}
                      alt={orderItem.product.name}
                      size="sm"
                      borderRadius="md"
                      resizeMode="contain"
                    />
                    <VStack flex={1}>
                      <Text fontWeight="medium" numberOfLines={2}>
                        {orderItem.product.name}
                      </Text>
                      <Text color="gray.500">
                        {orderItem.quantity}x{' '}
                        {formatCurrency(orderItem.product.price)}
                      </Text>
                    </VStack>
                  </HStack>
                ))}
              </VStack>
              <Divider my={2} />
              <VStack space={2}>
                <HStack justifyContent="space-between">
                  <Text fontWeight="bold">Total:</Text>
                  <Text>{formatCurrency(item.totalAmount)}</Text>
                </HStack>
                {Number(item.discountApplied ?? 0) > 0 && (
                  <HStack justifyContent="space-between">
                    <Text fontWeight="bold" color="orange.600">
                      Desconto:
                    </Text>
                    <Text color="orange.600">
                      - {formatCurrency(item.discountApplied ?? 0)}
                    </Text>
                  </HStack>
                )}
                <HStack justifyContent="space-between">
                  <Text fontWeight="bold">
                    {item.status === 'VALIDATED'
                      ? 'Pontos acumulados:'
                      : 'Pontos previstos:'}
                  </Text>
                  <Text
                    color={
                      item.status === 'EXPIRED' ? 'gray.500' : 'purple.600'
                    }
                    fontWeight="bold"
                  >
                    +{points} 🪙
                  </Text>
                </HStack>
              </VStack>
            </Box>
          )
        }}
      />
      {deliveryRequest && (
        <OrderDeliveryModal
          key={deliveryRequest.order.id}
          order={deliveryRequest.order}
          pilot={deliveryRequest.pilot}
          onClose={() => setDeliveryRequest(null)}
        />
      )}
    </Box>
  )
}
