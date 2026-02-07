import React, { useCallback, useEffect, useState } from 'react'
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
import { api } from '@services/api'
import { formatCurrency } from '@utils/format'
import { useFocusEffect } from '@react-navigation/native'
import { HomeScreen } from '@components/HomeScreen'

interface Product {
  id: string
  name: string
  price: number
  image: string | null
  cashbackPercentage: number
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
  status: string
  items: OrderItem[]
  cashbackAmount?: number
  qrCodeUrl?: string | null
}

const DEFAULT_PRODUCT_IMAGE = 'https://via.placeholder.com/80'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'VALIDATED', label: 'Aprovado' },
  { value: 'EXPIRED', label: 'Recusado' },
]

export function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [refreshing, setRefreshing] = useState(false)

  const toast = useToast()

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)

      const response = await api.get('/orders/history')

      const validatedOrders: Order[] = (response.data.orders || []).map(
        (order: any) => ({
          id: order.id,
          createdAt: order.createdAt,
          totalAmount: order.totalAmount,
          status: order.status,
          cashbackAmount: order.cashbackAmount,
          qrCodeUrl: order.qrCodeUrl ?? null,
          items: (order.items || []).map((item: any) => ({
            id: item.id,
            quantity: item.quantity,
            product: {
              id: item.product?.id || item.productId?.id,
              name:
                item.product?.name ||
                item.productId?.name ||
                'Produto desconhecido',
              price: item.product?.price || item.productId?.price || 0,
              image:
                item.product?.image ||
                item.productId?.image ||
                DEFAULT_PRODUCT_IMAGE,
              cashbackPercentage:
                item.product?.cashbackPercentage ||
                item.productId?.cashbackPercentage ||
                0,
            },
          })),
        }),
      )

      setOrders(validatedOrders)
    } catch (error) {
      toast.show({
        description: 'Erro ao carregar histórico de pedidos',
        placement: 'top',
        bgColor: 'red.500',
      })
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
    if (selectedStatus === '') {
      setFilteredOrders(orders)
    } else {
      setFilteredOrders(
        orders.filter((order) => order.status === selectedStatus),
      )
    }
  }, [orders, selectedStatus])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchOrders()
  }

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

  const calculateOrderCashback = (order: Order) => {
    if (order.cashbackAmount !== undefined) {
      return order.cashbackAmount
    }

    return order.items.reduce((total, item) => {
      return (
        total +
        (item.product.price * item.quantity * item.product.cashbackPercentage) /
          100
      )
    }, 0)
  }

  const StatusFilterHeader = () => (
    <Box px={4} pt={2} pb={4}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <HStack space={2}>
          {STATUS_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setSelectedStatus(option.value)}
            >
              <Box
                px={4}
                py={2}
                borderRadius="2xl"
                justifyContent="center"
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
    <Box flex={1} bg="gray.50" safeArea>
      <HomeScreen title="Meus Pedidos" />

      {filteredOrders.length === 0 ? (
        <Center flex={1}>
          <Text color="gray.500">
            {selectedStatus === ''
              ? 'Nenhum pedido encontrado'
              : `Nenhum pedido com status ${
                  STATUS_OPTIONS.find((o) => o.value === selectedStatus)?.label
                }`}
          </Text>
        </Center>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={<StatusFilterHeader />}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item }) => (
            <Box mb={4} bg="white" p={4} mx={4} borderRadius="md" shadow={1}>
              <HStack justifyContent="space-between" alignItems="center" mb={2}>
                <Text fontWeight="bold" flexShrink={1}>
                  Pedido #{item.id.substring(0, 8)}
                </Text>

                <Box minW={90} alignItems="flex-end">
                  <Badge
                    colorScheme={getStatusColor(item.status)}
                    alignSelf="flex-end"
                    px={3}
                    py={1}
                    borderRadius="full"
                  >
                    <Text fontSize="xs" fontWeight="bold" color="white">
                      {
                        STATUS_OPTIONS.find((o) => o.value === item.status)
                          ?.label
                      }
                    </Text>
                  </Badge>
                </Box>
              </HStack>

              <Text color="gray.500" mb={3}>
                {new Date(item.createdAt).toLocaleDateString('pt-BR')}
              </Text>

              <VStack space={3} mb={3}>
                {item.items.map((orderItem) => (
                  <HStack key={orderItem.id} space={3} alignItems="center">
                    <Image
                      source={{
                        uri: orderItem.product.image ?? DEFAULT_PRODUCT_IMAGE,
                      }}
                      fallbackElement={
                        <Box
                          bg="gray.200"
                          size="sm"
                          borderRadius="md"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text color="gray.500">Sem imagem</Text>
                        </Box>
                      }
                    />

                    <VStack flex={1}>
                      <Text fontWeight="medium">{orderItem.product.name}</Text>
                      <HStack justifyContent="space-between">
                        <Text color="gray.500">
                          {orderItem.quantity}x{' '}
                          {formatCurrency(orderItem.product.price)}
                        </Text>
                        <Text color="green.600">
                          {orderItem.product.cashbackPercentage}% cashback
                        </Text>
                      </HStack>
                    </VStack>
                  </HStack>
                ))}
              </VStack>

              <Divider my={2} />

              <VStack space={1}>
                <HStack justifyContent="space-between">
                  <Text fontWeight="bold">Subtotal:</Text>
                  <Text>{formatCurrency(item.totalAmount)}</Text>
                </HStack>

                <HStack justifyContent="space-between">
                  <Text fontWeight="bold">Cashback:</Text>
                  <Text color="green.600">
                    {formatCurrency(calculateOrderCashback(item))}
                  </Text>
                </HStack>
              </VStack>
            </Box>
          )}
        />
      )}
    </Box>
  )
}
