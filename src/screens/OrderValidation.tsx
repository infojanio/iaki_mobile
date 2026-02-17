import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  Button,
  AlertDialog,
  useDisclose,
} from 'native-base'
import { api } from '@services/api'
import { formatCurrency } from '@utils/format'
import { useFocusEffect } from '@react-navigation/native'
import { HomeScreen } from '@components/HomeScreen'
import { Input } from '@components/Input/index'

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
  userId: string
  user_name: string
  createdAt: string
  totalAmount: number
  discountApplied?: number
  status: string
  items: OrderItem[]
}

const DEFAULT_PRODUCT_IMAGE = 'https://via.placeholder.com/80'

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pendente' },
  { value: 'VALIDATED', label: 'Aprovado' },
  { value: 'EXPIRED', label: 'Cancelado' },
]

const PAGE_SIZE = 8

export function OrderValidation() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING')
  const [searchId, setSearchId] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclose()
  const cancelRef = useRef(null)

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [dialogAction, setDialogAction] = useState<'validate' | 'cancel'>(
    'validate',
  )

  function getStatusLabel(status: string) {
    switch (status) {
      case 'PENDING':
        return 'Pendente'
      case 'VALIDATED':
        return 'Aprovado'
      case 'EXPIRED':
        return 'Cancelado'
      default:
        return status
    }
  }

  const calculateOrderPoints = (order: Order) => {
    const valorPago =
      Number(order.totalAmount) - Number(order.discountApplied ?? 0)

    return Math.floor(valorPago / 10)
  }

  const fetchOrders = useCallback(
    async (pageNumber = 1, reset = false) => {
      try {
        if (reset) {
          setLoading(true)
          setHasMore(true)
        } else {
          setLoadingMore(true)
        }

        const response = await api.get('/orders', {
          params: { page: pageNumber, status: selectedStatus },
        })

        const newOrders = (response.data.orders || []).map((order: any) => ({
          id: order.id,
          user_name: order.user_name,
          createdAt: order.createdAt,
          totalAmount: order.totalAmount,
          discountApplied: order.discountApplied ?? 0,
          status: order.status,
          items: (order.items || []).map((item: any) => ({
            id: item.id,
            quantity: item.quantity,
            product: {
              id: item.product?.id,
              name: item.product?.name,
              price: item.product?.price,
              image: item.product?.image || DEFAULT_PRODUCT_IMAGE,
            },
          })),
        }))

        if (reset) setOrders(newOrders)
        else setOrders((prev) => [...prev, ...newOrders])

        setHasMore(newOrders.length === PAGE_SIZE)
      } catch (error) {
        toast.show({
          description: 'Erro ao carregar pedidos',
          bgColor: 'red.500',
          placement: 'top',
        })
      } finally {
        if (reset) {
          setLoading(false)
          setHasLoaded(true)
        }
        setLoadingMore(false)
        setRefreshing(false)
      }
    },
    [selectedStatus, toast],
  )

  const loadMoreOrders = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchOrders(nextPage)
    }
  }, [page, loadingMore, hasMore, fetchOrders])

  useFocusEffect(
    useCallback(() => {
      setPage(1)
      fetchOrders(1, true)
    }, [fetchOrders]),
  )

  useEffect(() => {
    setPage(1)
    fetchOrders(1, true)
  }, [selectedStatus])

  const filteredOrders = useMemo(() => {
    if (!searchId.trim()) return orders
    return orders.filter((o) =>
      o.id.toLowerCase().includes(searchId.toLowerCase()),
    )
  }, [orders, searchId])

  const handleRefresh = async () => {
    setRefreshing(true)
    setPage(1)
    await fetchOrders(1, true)
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

  const validateOrder = async (orderId: string) => {
    try {
      const response = await api.patch(`/orders/${orderId}/validate`)

      toast.show({
        description:
          response.data?.message || 'Pedido validado e pontos gerados!',
        bgColor: 'green.500',
        placement: 'top',
      })

      fetchOrders(1, true)
    } catch (error: any) {
      toast.show({
        description: error?.response?.data?.message || 'Erro ao validar pedido',
        bgColor: 'red.500',
        placement: 'top',
      })
    }
  }

  const cancelOrder = async (orderId: string) => {
    try {
      await api.patch(`/orders/${orderId}/cancel`)

      toast.show({
        description: 'Pedido cancelado com sucesso!',
        bgColor: 'red.500',
        placement: 'top',
      })

      fetchOrders(1, true)
    } catch {
      toast.show({
        description: 'Erro ao cancelar pedido',
        bgColor: 'red.500',
        placement: 'top',
      })
    }
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
      <HomeScreen title="Validação de Pedidos" />

      <Box px={4} py={2}>
        <HStack>
          <Box flex={1} mt={2}>
            <Input
              placeholder="Buscar por ID"
              value={searchId}
              onChangeText={setSearchId}
            />
          </Box>
          <Button ml={2} mt={2} onPress={() => setSearchId('')}>
            Limpar
          </Button>
        </HStack>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <HStack space={2} mt={3}>
            {STATUS_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setSelectedStatus(option.value)}
              >
                <Box
                  px={4}
                  py={2}
                  borderRadius="full"
                  bg={
                    selectedStatus === option.value ? 'primary.500' : 'gray.200'
                  }
                >
                  <Text
                    color={
                      selectedStatus === option.value ? 'white' : 'gray.700'
                    }
                  >
                    {option.label}
                  </Text>
                </Box>
              </Pressable>
            ))}
          </HStack>
        </ScrollView>
      </Box>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item, index) =>
          item.id ? `order-${item.id}` : `order-${index}`
        }
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onEndReached={loadMoreOrders}
        onEndReachedThreshold={0.1}
        renderItem={({ item }) => {
          const isPending = item.status === 'PENDING'

          return (
            <Box bg="white" p={4} m={4} borderRadius="md" shadow={1}>
              <Text fontWeight="bold">Pedido #{item.id.substring(0, 8)}</Text>

              <Badge colorScheme={getStatusColor(item.status)}>
                {getStatusLabel(item.status)}
              </Badge>

              <Text color="gray.500" mt={2}>
                Cliente: {item.user_name}
              </Text>

              <Text color="gray.500">
                {new Date(item.createdAt).toLocaleDateString('pt-BR')}
              </Text>

              <Divider my={3} />

              <VStack space={2}>
                {item.items.map((orderItem, index) => (
                  <HStack
                    key={`item-${item.id}-${orderItem.id ?? index}`}
                    space={3}
                  >
                    <Image
                      source={{
                        uri: orderItem.product.image || DEFAULT_PRODUCT_IMAGE,
                      }}
                      alt="Produto"
                      size="sm"
                      borderRadius="md"
                    />
                    <VStack flex={1}>
                      <Text>
                        {orderItem.quantity}x {orderItem.product.name}
                      </Text>
                      <Text color="gray.500">
                        {formatCurrency(orderItem.product.price)}
                      </Text>
                    </VStack>
                  </HStack>
                ))}
              </VStack>

              <Divider my={3} />

              <HStack justifyContent="space-between">
                <Text fontWeight="bold">Total:</Text>
                <Text>{formatCurrency(item.totalAmount)}</Text>
              </HStack>

              {item.discountApplied ? (
                <HStack justifyContent="space-between">
                  <Text color="orange.600">Desconto aplicado:</Text>
                  <Text color="orange.600">
                    -{formatCurrency(item.discountApplied)}
                  </Text>
                </HStack>
              ) : null}

              <HStack justifyContent="space-between" mt={2}>
                <Text fontWeight="bold" color="purple.700">
                  Pontos a gerar:
                </Text>
                <Text fontWeight="bold" color="purple.700">
                  {calculateOrderPoints(item)} pontos
                </Text>
              </HStack>

              {isPending && (
                <HStack mt={4} space={3}>
                  <Button
                    flex={1}
                    colorScheme="green"
                    onPress={() => {
                      setSelectedOrderId(item.id)
                      setDialogAction('validate')
                      onOpen()
                    }}
                  >
                    Validar Pedido
                  </Button>

                  <Button
                    flex={1}
                    colorScheme="red"
                    onPress={() => {
                      setSelectedOrderId(item.id)
                      setDialogAction('cancel')
                      onOpen()
                    }}
                  >
                    Cancelar
                  </Button>
                </HStack>
              )}
            </Box>
          )
        }}
      />

      <AlertDialog
        leastDestructiveRef={cancelRef}
        isOpen={isOpen}
        onClose={onClose}
      >
        <AlertDialog.Content>
          <AlertDialog.Header>Confirmar ação</AlertDialog.Header>
          <AlertDialog.Body>Deseja confirmar esta ação?</AlertDialog.Body>
          <AlertDialog.Footer>
            <Button variant="ghost" onPress={onClose}>
              Voltar
            </Button>
            <Button
              ml={3}
              colorScheme={dialogAction === 'validate' ? 'green' : 'red'}
              onPress={async () => {
                if (!selectedOrderId) return
                if (dialogAction === 'validate')
                  await validateOrder(selectedOrderId)
                else await cancelOrder(selectedOrderId)
                onClose()
              }}
            >
              Confirmar
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </Box>
  )
}
