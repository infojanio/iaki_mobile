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
  cashback_percentage: number
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
  cashbackAmount?: number
  qrCodeUrl?: string | null
}

const DEFAULT_PRODUCT_IMAGE = 'https://via.placeholder.com/80'
const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pendente' },
  { value: 'VALIDATED', label: 'Aprovado' },
  // { value: 'EXPIRED', label: 'Recusado' },
  { value: 'EXPIRED', label: 'Cancelado' }, // 👈 novo (caso seu backend use esse status)
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

  // 'validate' | 'cancel'
  const [dialogAction, setDialogAction] = useState<'validate' | 'cancel'>(
    'validate',
  )

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
          id: order.id || '',
          user_name: order.user_name,
          createdAt: order.createdAt || new Date().toISOString(),
          totalAmount: order.totalAmount || 0,
          discountApplied: order.discountApplied ?? 0,
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
              cashback_percentage:
                item.product?.cashback_percentage ||
                item.productId?.cashback_percentage ||
                0,
            },
          })),
          cashbackAmount: order.cashbackAmount,
          qrCodeUrl: order.qrCodeUrl || null,
        }))

        if (reset) {
          setOrders(newOrders)
        } else {
          setOrders((prev) => [...prev, ...newOrders])
        }

        setHasMore(newOrders.length === PAGE_SIZE)
        return newOrders
      } catch (error) {
        console.error('Erro ao buscar pedidos:', error)
        toast.show({
          description: 'Erro ao carregar histórico de pedidos',
          bgColor: 'red.500',
          placement: 'top',
        })
        return []
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
      setHasLoaded(false)
      fetchOrders(1, true)
    }, [fetchOrders]),
  )

  useEffect(() => {
    setPage(1)
    setHasLoaded(false)
    fetchOrders(1, true)
  }, [selectedStatus, searchId, fetchOrders])

  const filteredOrders = useMemo(() => {
    let result = orders
    if (searchId.trim() !== '') {
      const searchTerm = searchId.trim().toLowerCase()
      result = result.filter((o) => o.id.toLowerCase().includes(searchTerm))
    }
    return result
  }, [orders, searchId])

  const handleRefresh = async () => {
    setRefreshing(true)
    setPage(1)
    setHasLoaded(false)
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

  const calculateOrderCashback = (order: Order) => {
    if ((order.discountApplied ?? 0) > 0) return 0
    if (order.cashbackAmount !== undefined) return order.cashbackAmount
    return order.items.reduce((total, item) => {
      const price = item.product?.price || 0
      const percentage = item.product?.cashback_percentage || 0
      return total + (price * item.quantity * percentage) / 100
    }, 0)
  }

  const validateOrder = async (orderId: string) => {
    try {
      console.log('[VALIDATE] Enviando validação do pedido:', orderId)

      const response = await api.patch(`/orders/${orderId}/validate`)

      console.log('[VALIDATE] Sucesso:', response.data)

      toast.show({
        description: response.data?.message || 'Cashback aprovado com sucesso!',
        bgColor: 'green.500',
        placement: 'top',
      })

      setPage(1)
      setHasLoaded(false)
      fetchOrders(1, true)
    } catch (error: any) {
      console.log('================ VALIDATE ORDER ERROR ================')
      console.log('MESSAGE:', error?.message)
      console.log('STATUS:', error?.response?.status)
      console.log('DATA:', error?.response?.data)
      console.log('HEADERS:', error?.response?.headers)
      console.log('CONFIG URL:', error?.config?.url)
      console.log('CONFIG METHOD:', error?.config?.method)
      console.log('FULL ERROR:', error)
      console.log('=====================================================')

      toast.show({
        description:
          error?.response?.data?.message ||
          error?.message ||
          'Erro ao aprovar cashback',
        bgColor: 'red.500',
        placement: 'top',
      })
    }
  }

  // 👇 NOVO: cancelar pedido
  const cancelOrder = async (orderId: string) => {
    try {
      // Ajuste a rota se no seu backend for diferente (ex: /orders/:id/expire)
      const response = await api.patch(`/orders/${orderId}/cancel`)
      toast.show({
        description: response?.data?.message || 'Pedido cancelado com sucesso!',
        bgColor: 'red.500',
        placement: 'top',
      })
      setPage(1)
      setHasLoaded(false)
      fetchOrders(1, true)
    } catch (error) {
      const message =
        (error as any)?.response?.data?.message || 'Erro ao cancelar pedido'
      toast.show({ description: message, bgColor: 'red.500', placement: 'top' })
    }
  }

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <Center my={4}>
          <Spinner size="lg" />
        </Center>
      )
    }
    if (!hasMore && orders.length > 0) {
      return (
        <Center my={4}>
          <Text color="gray.500">Não há mais pedidos para carregar</Text>
        </Center>
      )
    }
    return null
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
        <HStack bg="gray.50">
          <Box flex={1} ml={2} mt={2}>
            <Input
              placeholder="Buscar por ID (ex: ABC123)"
              value={searchId}
              onChangeText={setSearchId}
            />
          </Box>
          <Box mr={1} ml={1} mt={1} alignItems="center">
            <Button onPress={() => setSearchId('')} variant="outline">
              Limpar
            </Button>
          </Box>
        </HStack>

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
                  borderRadius="full"
                  bg={
                    selectedStatus === option.value ? 'primary.500' : 'gray.200'
                  }
                >
                  <Text
                    color={
                      selectedStatus === option.value ? 'white' : 'gray.700'
                    }
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

      {filteredOrders.length === 0 ? (
        <Center flex={1}>
          <Text color="gray.500">
            {searchId || selectedStatus !== 'PENDING'
              ? 'Nenhum pedido encontrado com os filtros atuais'
              : 'Nenhum pedido disponível para validação'}
          </Text>
        </Center>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => `order-${item.id}`}
          renderItem={({ item }) => {
            const usedCashback = (item.discountApplied ?? 0) > 0
            const isPending = item.status === 'PENDING'

            return (
              <Box mb={4} mx={4} bg="white" p={4} borderRadius="md" shadow={1}>
                <Box mb={2}>
                  <Text fontWeight="normal">Cliente: {item.user_name}</Text>
                </Box>

                <HStack justifyContent="space-between" mb={2}>
                  <Text fontWeight="bold">
                    Pedido #{item.id.substring(0, 8)}
                  </Text>
                  <Badge colorScheme={getStatusColor(item.status)}>
                    {STATUS_OPTIONS.find((o) => o.value === item.status)
                      ?.label || item.status}
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
                        <Text fontWeight="medium">
                          {orderItem.product.name}
                        </Text>
                        <HStack justifyContent="space-between">
                          <Text color="gray.500">
                            {orderItem.quantity}x{' '}
                            {formatCurrency(orderItem.product.price)}
                          </Text>
                          {!usedCashback && (
                            <Text color="green.600">
                              {orderItem.product.cashback_percentage}% cashback
                            </Text>
                          )}
                        </HStack>
                      </VStack>
                    </HStack>
                  ))}
                </VStack>

                <Divider my={2} />
                <VStack space={2} mb={3}>
                  <HStack justifyContent="space-between">
                    <Text fontWeight="bold">Total a pagar:</Text>
                    <Text>{formatCurrency(item.totalAmount)}</Text>
                  </HStack>

                  {usedCashback ? (
                    <HStack justifyContent="space-between">
                      <Text fontWeight="bold" color="orange.600">
                        Desconto aplicado:
                      </Text>
                      <Text color="orange.600">
                        -{formatCurrency(item.discountApplied!)} (
                        {Math.round(
                          ((item.discountApplied ?? 0) /
                            (item.totalAmount + (item.discountApplied ?? 0))) *
                            100,
                        )}
                        %)
                      </Text>
                    </HStack>
                  ) : (
                    <HStack justifyContent="space-between">
                      <Text fontWeight="bold">Cashback:</Text>
                      <Text color="green.600">
                        {formatCurrency(calculateOrderCashback(item))}
                      </Text>
                    </HStack>
                  )}
                </VStack>

                {isPending && (
                  <HStack space={3}>
                    <Button
                      flex={1}
                      onPress={() => {
                        setSelectedOrderId(item.id)
                        setDialogAction('validate')
                        onOpen()
                      }}
                      bg="green.600"
                      _pressed={{ bg: 'green.700' }}
                    >
                      Validar Cashback
                    </Button>

                    <Button
                      flex={1}
                      onPress={() => {
                        setSelectedOrderId(item.id)
                        setDialogAction('cancel')
                        onOpen()
                      }}
                      bg="red.600"
                      _pressed={{ bg: 'red.700' }}
                      variant="solid"
                    >
                      Cancelar Pedido
                    </Button>
                  </HStack>
                )}
              </Box>
            )
          }}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onEndReached={loadMoreOrders}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
        />
      )}

      {/* Dialog compartilhado para validar/cancelar */}
      <AlertDialog
        leastDestructiveRef={cancelRef}
        isOpen={isOpen}
        onClose={onClose}
      >
        <AlertDialog.Content>
          <AlertDialog.CloseButton />
          <AlertDialog.Header>
            {dialogAction === 'validate'
              ? 'Confirmar Validação'
              : 'Confirmar Cancelamento'}
          </AlertDialog.Header>
          <AlertDialog.Body>
            {dialogAction === 'validate'
              ? 'Tem certeza que deseja validar este pedido? '
              : 'Tem certeza que deseja cancelar este pedido? '}
            <Text fontWeight="bold">
              Pedido: #{selectedOrderId?.substring(0, 8)}
            </Text>
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button ref={cancelRef} onPress={onClose} variant="ghost">
              Voltar
            </Button>
            <Button
              colorScheme={dialogAction === 'validate' ? 'green' : 'red'}
              onPress={async () => {
                if (!selectedOrderId) return
                if (dialogAction === 'validate') {
                  await validateOrder(selectedOrderId)
                } else {
                  await cancelOrder(selectedOrderId)
                }
                onClose()
              }}
              ml={3}
            >
              {dialogAction === 'validate' ? 'Validar' : 'Cancelar Pedido'}
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </Box>
  )
}
