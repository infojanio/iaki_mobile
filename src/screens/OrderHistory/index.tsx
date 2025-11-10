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

  // Função para carregar os pedidos
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/orders/history')

      const validatedOrders = (response.data.orders || []).map(
        (order: any) => ({
          id: order.id || '',
          createdAt: order.createdAt || new Date().toISOString(),
          totalAmount: order.totalAmount || 0,
          status: order.status || 'PENDING',
          items: (order.items || []).map((item: any) => ({
            id: item.id || Math.random().toString(36).substr(2, 9),
            quantity: item.quantity || 0,
            product: {
              id: item.product?.id || item.productId?.id || '',
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
          cashbackAmount: order.cashbackAmount,
          qrCodeUrl: order.qrCodeUrl || null,
        }),
      )

      setOrders(validatedOrders)
      return validatedOrders
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error)
      toast.show({
        description: 'Erro ao carregar histórico de pedidos',
        bgColor: 'red.500',
        placement: 'top',
      })
      return []
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [toast])

  // Atualiza os pedidos quando a tela recebe foco
  useFocusEffect(
    useCallback(() => {
      fetchOrders()
    }, [fetchOrders]),
  )

  // Filtra os pedidos quando o status selecionado muda
  useEffect(() => {
    if (selectedStatus === '') {
      setFilteredOrders(orders)
    } else {
      setFilteredOrders(
        orders.filter((order) => order.status === selectedStatus),
      )
    }
  }, [selectedStatus, orders])

  // Função para atualização manual (pull-to-refresh)
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
      const price = item.product?.price || 0
      const percentage = item.product?.cashbackPercentage || 0
      return total + (price * item.quantity * percentage) / 100
    }, 0)
  }

  if (loading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Spinner size="lg" />
      </Box>
    )
  }

  return (
    <Box flex={1} bg="gray.50" safeArea mt={-5}>
      <HomeScreen title="Meus Pedidos" />

      {/* Filtro por Status com Pressable */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        mb={2}
        py={2}
      >
        <HStack space={1} mb={2}>
          {STATUS_OPTIONS.map((option) => (
            <Pressable
              key={`status-${option.value}`}
              onPress={() => setSelectedStatus(option.value)}
            >
              <Box
                mr={3}
                w={24}
                h={10}
                borderRadius="2xl"
                bg={
                  selectedStatus === option.value ? 'primary.500' : 'gray.200'
                }
              >
                <Center>
                  <Text
                    color={
                      selectedStatus === option.value ? 'white' : 'gray.700'
                    }
                    fontWeight="medium"
                    alignItems={'center'}
                    justifyContent={'center'}
                    ml={2}
                    mt={2}
                  >
                    {option.label}
                  </Text>
                </Center>
              </Box>
            </Pressable>
          ))}
        </HStack>
      </ScrollView>

      {filteredOrders.length === 0 ? (
        <Box
          bg="white"
          pb={280}
          borderRadius="md"
          alignItems={'center'}
          fontSize={'16'}
        >
          <Text color="red.500">
            {selectedStatus === ''
              ? 'Nenhum pedido encontrado'
              : `Nenhum pedido com status ${STATUS_OPTIONS.find(
                  (o) => o.value === selectedStatus,
                )?.label.toLowerCase()}`}
          </Text>
        </Box>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => `order-${item.id}`}
          renderItem={({ item }) => (
            <Box mb={4} bg="white" p={4} borderRadius="md" shadow={1}>
              <HStack justifyContent="space-between" mb={2}>
                <Text fontWeight="bold">Pedido #{item.id.substring(0, 8)}</Text>
                <Badge colorScheme={getStatusColor(item.status)}>
                  {STATUS_OPTIONS.find((o) => o.value === item.status)?.label ||
                    item.status}
                </Badge>
              </HStack>

              <Text color="gray.500" mb={3}>
                {new Date(item.createdAt).toLocaleDateString('pt-BR')}
              </Text>

              <VStack space={3} mb={3}>
                {item.items.map((orderItem) => (
                  <HStack
                    key={`item-${item.id}-${orderItem.id}`}
                    space={3}
                    alignItems="center"
                  >
                    <Image
                      source={{
                        uri: orderItem.product.image || DEFAULT_PRODUCT_IMAGE,
                      }}
                      alt={orderItem.product.name}
                      size="sm"
                      borderRadius="md"
                      fallbackElement={
                        <Box
                          bg="gray.200"
                          size="sm"
                          borderRadius="md"
                          justifyContent="center"
                          alignItems="center"
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

              <VStack space={2}>
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
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </Box>
  )
}
