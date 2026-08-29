import React, { useCallback, useEffect, useState } from 'react'

import {
  Box,
  Text,
  VStack,
  HStack,
  Image,
  Spinner,
  useToast,
  Badge,
  Divider,
  Pressable,
  ScrollView,
  Center,
} from 'native-base'

import { addDays, differenceInCalendarDays, format } from 'date-fns'

import { api } from '@services/api'
import { formatCurrency } from '@utils/format'

import { useFocusEffect } from '@react-navigation/native'

import { HomeScreen } from '@components/HomeScreen'
import { FlatList } from 'react-native'

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
    value: '',
    label: 'Todos',
  },
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

  if (daysRemaining < 0) {
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
      message: 'Seu pedido expira hoje! Vá até a loja para validar sua compra.',
      backgroundColor: 'red.100',
      borderColor: 'red.500',
      textColor: 'red.700',
    }
  }

  if (daysRemaining === 1) {
    return {
      daysRemaining,
      expirationDate,
      message: 'Seu pedido expira em 1 dia.',
      backgroundColor: 'red.100',
      borderColor: 'red.500',
      textColor: 'red.700',
    }
  }

  if (daysRemaining <= 5) {
    return {
      daysRemaining,
      expirationDate,
      message: `Seu pedido expira em ${daysRemaining} dias!`,
      backgroundColor: 'red.100',
      borderColor: 'red.500',
      textColor: 'red.700',
    }
  }

  if (daysRemaining <= 10) {
    return {
      daysRemaining,
      expirationDate,
      message: `Faltam ${daysRemaining} dias para validar sua compra na loja.`,
      backgroundColor: 'orange.100',
      borderColor: 'orange.400',
      textColor: 'orange.700',
    }
  }

  return {
    daysRemaining,
    expirationDate,
    message: `Faltam ${daysRemaining} dias para validar sua compra.`,
    backgroundColor: 'blue.50',
    borderColor: 'blue.400',
    textColor: 'blue.700',
  }
}

export function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([])

  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])

  const [loading, setLoading] = useState(true)

  const [selectedStatus, setSelectedStatus] = useState('')

  const [refreshing, setRefreshing] = useState(false)

  const toast = useToast()

  const fetchOrders = useCallback(async () => {
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

      setOrders(parsedOrders)
    } catch (error: any) {
      console.error('[OrderHistory] Erro ao carregar pedidos:', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      })

      toast.show({
        description:
          error?.response?.data?.message ??
          'Erro ao carregar histórico de pedidos',
        placement: 'top',
        bgColor: 'red.500',
      })

      setOrders([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [toast])

  useFocusEffect(
    useCallback(() => {
      fetchOrders()
    }, [fetchOrders]),
  )

  useEffect(() => {
    if (!selectedStatus) {
      setFilteredOrders(orders)
      return
    }

    setFilteredOrders(orders.filter((order) => order.status === selectedStatus))
  }, [orders, selectedStatus])

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

      {filteredOrders.length === 0 ? (
        <Center flex={1} mt={8}>
          <Text color="gray.500">
            {selectedStatus === ''
              ? 'Nenhum pedido encontrado'
              : `Nenhum pedido com status ${
                  STATUS_OPTIONS.find(
                    (option) => option.value === selectedStatus,
                  )?.label
                }`}
          </Text>
        </Center>
      ) : (
        <FlatList
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
                      source={{ uri: item.store.avatar }}
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
                      Compra realizada em{' '}
                      {format(new Date(item.createdAt), 'dd/MM/yyyy')}
                    </Text>
                  </VStack>
                </HStack>

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
                      fontWeight="bold"
                      color={expirationInfo.textColor}
                    >
                      ⚠️ {expirationInfo.message}
                    </Text>

                    <Text mt={1} fontSize="xs" color={expirationInfo.textColor}>
                      Prazo final:{' '}
                      {format(expirationInfo.expirationDate, 'dd/MM/yyyy')}
                    </Text>
                  </Box>
                )}

                <VStack space={3} mb={3}>
                  {item.items.map((orderItem, index) => (
                    <HStack
                      key={`order-${item.id}-item-${orderItem.id ?? index}`}
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
      )}
    </Box>
  )
}
