import React, { useCallback, useState, useMemo } from 'react'
import {
  Box,
  Text,
  VStack,
  HStack,
  Image,
  FlatList,
  Spinner,
  useToast,
  Badge,
  Divider,
  Pressable,
  ScrollView,
  Center,
} from 'native-base'
import { useFocusEffect } from '@react-navigation/native'

import { api } from '@services/api'
import { formatCurrency } from '@utils/format'
import { HomeScreen } from '@components/HomeScreen'
import { OrderDTO, OrderItemDTO } from '@dtos/OrderDTO'

const DEFAULT_PRODUCT_IMAGE = 'https://via.placeholder.com/80'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'VALIDATED', label: 'Aprovado' },
  { value: 'EXPIRED', label: 'Cancelado' },
]

export function OrderHistory() {
  const [orders, setOrders] = useState<OrderDTO[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const toast = useToast()

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)

      const response = await api.get('/orders/history')

      const mappedOrders: OrderDTO[] = (response.data.orders || []).map(
        (order: any) => ({
          id: order.id,
          store: {
            id: order.store.id,
            name: order.store.name,
          },
          totalAmount: Number(order.totalAmount),
          discountApplied: Number(order.discountApplied ?? 0),
          status: order.status,
          created_at: order.created_at,
          validated_at: order.validated_at ?? null,
          qrCodeUrl: order.qrCodeUrl ?? null,
          cashbackAmount: order.cashbackAmount,
          items: order.items.map((item: any) => ({
            id: item.id,
            quantity: Number(item.quantity),
            product: {
              id: item.product.id,
              name: item.product.name,
              price: Number(item.product.price),
              image: item.product.image ?? DEFAULT_PRODUCT_IMAGE,
              cashback_percentage: item.product.cashback_percentage,
            },
          })),
        }),
      )

      setOrders(mappedOrders)
      setHasLoaded(true)
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error)
      toast.show({
        description: 'Erro ao carregar histórico de pedidos',
        bgColor: 'red.500',
        placement: 'top',
      })
      setHasLoaded(true)
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

  const filteredOrders = useMemo(() => {
    if (!selectedStatus) return orders
    return orders.filter((order) => order.status === selectedStatus)
  }, [orders, selectedStatus])

  const getStatusColor = (status: string) => {
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

  const calculateCashback = (order: OrderDTO) => {
    if (order.discountApplied > 0) return 0

    if (order.cashbackAmount !== undefined) {
      return order.cashbackAmount
    }

    return order.items.reduce((total, item) => {
      return (
        total +
        (item.product.price *
          item.quantity *
          item.product.cashback_percentage) /
          100
      )
    }, 0)
  }

  if (loading || !hasLoaded) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Spinner size="lg" />
      </Box>
    )
  }

  return (
    <Box flex={1} bg="gray.50">
      <HomeScreen title="Meus Pedidos" />

      {/* Filtro de status */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        mb={4}
        py={2}
      >
        <HStack space={2} px={2}>
          {STATUS_OPTIONS.map((option) => (
            <Pressable
              key={`status-${option.value}`}
              onPress={() => setSelectedStatus(option.value)}
            >
              <Box
                px={4}
                py={1}
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

      {filteredOrders.length === 0 ? (
        <Center mb={20} mt={8}>
          <Text color="gray.500">
            {selectedStatus
              ? 'Nenhum pedido com esse status'
              : 'Nenhum pedido encontrado'}
          </Text>
        </Center>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshing={refreshing}
          onRefresh={fetchOrders}
          renderItem={({ item }) => (
            <Box mb={4} bg="white" p={4} borderRadius="md" shadow={1}>
              <HStack justifyContent="space-between" mb={1}>
                <Text fontWeight="bold">Pedido #{item.id.substring(0, 8)}</Text>

                <Badge colorScheme={getStatusColor(item.status)}>
                  {STATUS_OPTIONS.find((o) => o.value === item.status)?.label}
                </Badge>
              </HStack>

              <Text color="gray.500" mb={3}>
                {new Date(item.created_at).toLocaleDateString('pt-BR')}
              </Text>

              <VStack space={3}>
                {item.items.map((orderItem: OrderItemDTO, index: number) => (
                  <HStack
                    key={`${item.id}-item-${index}`}
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
                    />
                    <VStack flex={1}>
                      <Text fontWeight="medium">{orderItem.product.name}</Text>
                      <Text color="gray.500">
                        {orderItem.quantity}x{' '}
                        {formatCurrency(orderItem.product.price)}
                      </Text>
                    </VStack>
                  </HStack>
                ))}
              </VStack>

              <Box my={2} />
              {/* 🔥 Loja */}
              <Box bg={'amber.50'} mt={'2'} mb={2}>
                <Text color="gray.600" fontWeight={'bold'} fontSize="sm" mb={2}>
                  📍 Vendido por {item.store.name}
                </Text>

                <VStack space={1}>
                  <HStack justifyContent="space-between">
                    <Text ml={2} fontWeight="bold">
                      Total
                    </Text>
                    <Text mr={2}>{formatCurrency(item.totalAmount)}</Text>
                  </HStack>

                  {item.discountApplied > 0 ? (
                    <HStack justifyContent="space-between">
                      <Text color="orange.600">Desconto</Text>
                      <Text color="orange.600">
                        -{formatCurrency(item.discountApplied)}
                      </Text>
                    </HStack>
                  ) : (
                    <HStack justifyContent="space-between">
                      <Text ml={2} color="green.600">
                        Cashback
                      </Text>
                      <Text mr={2} color="green.600">
                        {formatCurrency(calculateCashback(item))}
                      </Text>
                    </HStack>
                  )}
                </VStack>
              </Box>
            </Box>
          )}
        />
      )}
    </Box>
  )
}
