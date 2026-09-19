import React, { useCallback, useMemo, useRef, useState } from 'react'

import { Alert, FlatList, ScrollView } from 'react-native'

import {
  Badge,
  Box,
  Button,
  Divider,
  HStack,
  Image,
  Pressable,
  Spinner,
  Text,
  VStack,
  useToast,
} from 'native-base'

import { useFocusEffect } from '@react-navigation/native'

import { api } from '@services/api'

import { formatCurrency } from '@utils/format'

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
  userId?: string
  user_name: string
  createdAt: string
  totalAmount: number
  discountApplied: number
  status: string
  items: OrderItem[]
}

const DEFAULT_PRODUCT_IMAGE = 'https://via.placeholder.com/80'

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

const PAGE_SIZE = 8

export function OrderValidation() {
  const toast = useToast()

  const [orders, setOrders] = useState<Order[]>([])

  const [loading, setLoading] = useState(true)

  const [loadingMore, setLoadingMore] = useState(false)

  const [refreshing, setRefreshing] = useState(false)

  const [selectedStatus, setSelectedStatus] = useState('PENDING')

  const [searchId, setSearchId] = useState('')

  const [page, setPage] = useState(1)

  const [hasMore, setHasMore] = useState(true)

  const [processingOrderId, setProcessingOrderId] = useState<string | null>(
    null,
  )

  /*
   * Evita disparar várias páginas ao mesmo
   * tempo através do onEndReached.
   */
  const loadingMoreRef = useRef(false)

  /*
   * Permite cancelar requisições antigas
   * quando status/tela mudar.
   */
  const requestControllerRef = useRef<AbortController | null>(null)

  /*
   * Mesmo que uma requisição antiga consiga
   * terminar, ela não sobrescreve a mais nova.
   */
  const requestSequenceRef = useRef(0)

  /* ==============================
     STATUS
  ============================== */

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

  /* ==============================
     DATA
  ============================== */

  function formatOrderDate(date: string) {
    if (!date) {
      return '-'
    }

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      return '-'
    }

    return parsedDate.toLocaleDateString('pt-BR')
  }

  /* ==============================
     PONTOS
  ============================== */

  function calculateOrderPoints(order: Order) {
    const total = Number(order.totalAmount ?? 0)

    const discount = Number(order.discountApplied ?? 0)

    const paidValue = Math.max(0, total - discount)

    return Math.floor(paidValue / 10)
  }

  /* ==============================
     NORMALIZAR PEDIDOS
  ============================== */

  const normalizeOrders = useCallback((rawOrders: any[]): Order[] => {
    if (!Array.isArray(rawOrders)) {
      return []
    }

    return rawOrders
      .filter((order) => Boolean(order?.id))
      .map(
        (order): Order => ({
          id: String(order.id),

          userId: order.userId ? String(order.userId) : undefined,

          user_name: String(order.user_name ?? order.user?.name ?? 'Cliente'),

          createdAt: String(order.createdAt ?? ''),

          totalAmount: Number(order.totalAmount ?? 0),

          discountApplied: Number(order.discountApplied ?? 0),

          status: String(order.status ?? 'PENDING'),

          items: Array.isArray(order.items)
            ? order.items.map(
                (item: any, index: number): OrderItem => ({
                  id: String(item?.id ?? `${order.id}-${index}`),

                  quantity: Number(item?.quantity ?? 0),

                  product: {
                    id: String(item?.product?.id ?? ''),

                    name: String(item?.product?.name ?? 'Produto'),

                    price: Number(item?.product?.price ?? 0),

                    image: item?.product?.image || DEFAULT_PRODUCT_IMAGE,
                  },
                }),
              )
            : [],
        }),
      )
  }, [])

  /* ==============================
     CARREGAR PEDIDOS
  ============================== */

  const fetchOrders = useCallback(
    async (pageNumber = 1, reset = false) => {
      /*
       * Evita paginação paralela.
       */
      if (pageNumber > 1 && loadingMoreRef.current) {
        return
      }

      /*
       * Nova carga principal:
       * cancela a anterior.
       */
      if (reset) {
        requestControllerRef.current?.abort()
      }

      const controller = new AbortController()

      requestControllerRef.current = controller

      const requestSequence = ++requestSequenceRef.current

      try {
        if (reset) {
          setLoading(true)

          setHasMore(true)
        } else {
          loadingMoreRef.current = true

          setLoadingMore(true)
        }

        const response = await api.get('/orders', {
          signal: controller.signal,

          params: {
            page: pageNumber,

            pageSize: PAGE_SIZE,

            status: selectedStatus,
          },
        })

        /*
         * Uma requisição mais recente
         * já começou.
         */
        if (requestSequence !== requestSequenceRef.current) {
          return
        }

        const responseOrders =
          response.data?.orders ?? response.data?.data ?? []

        const newOrders = normalizeOrders(responseOrders)

        if (reset) {
          setOrders(newOrders)
        } else {
          /*
           * Evita pedidos duplicados
           * caso onEndReached dispare
           * novamente para a mesma página.
           */
          setOrders((currentOrders) => {
            const knownIds = new Set(currentOrders.map((order) => order.id))

            const uniqueOrders = newOrders.filter(
              (order) => !knownIds.has(order.id),
            )

            return [...currentOrders, ...uniqueOrders]
          })
        }

        /*
         * Compatível tanto com backend
         * paginado quanto com retorno simples.
         */
        const pagination = response.data?.pagination ?? response.data?.meta

        const totalPages = Number(pagination?.totalPages ?? 0)

        if (totalPages > 0) {
          setHasMore(pageNumber < totalPages)
        } else {
          setHasMore(newOrders.length === PAGE_SIZE)
        }

        setPage(pageNumber)
      } catch (error: any) {
        /*
         * Requisição cancelada não é erro.
         */
        if (
          error?.code === 'ERR_CANCELED' ||
          error?.name === 'CanceledError' ||
          error?.name === 'AbortError'
        ) {
          return
        }

        console.error('[OrderValidation] Erro ao carregar pedidos:', {
          status: error?.response?.status,

          data: error?.response?.data,

          message: error?.message,
        })

        toast.show({
          description:
            error?.response?.data?.message ?? 'Erro ao carregar pedidos',

          bgColor: 'red.500',

          placement: 'top',
        })

        if (reset) {
          setOrders([])
        }

        setHasMore(false)
      } finally {
        /*
         * Uma requisição antiga não deve
         * mexer no loading da nova.
         */
        if (requestSequence === requestSequenceRef.current) {
          setLoading(false)

          setLoadingMore(false)

          setRefreshing(false)
        }

        loadingMoreRef.current = false
      }
    },
    [normalizeOrders, selectedStatus, toast],
  )

  /* ==============================
     FOCO DA TELA
  ============================== */

  useFocusEffect(
    useCallback(() => {
      setPage(1)

      setHasMore(true)

      void fetchOrders(1, true)

      /*
       * Ao sair da tela ou mudar
       * selectedStatus, cancela
       * requisição pendente.
       */
      return () => {
        requestControllerRef.current?.abort()
      }
    }, [fetchOrders]),
  )

  /* ==============================
     FILTRO LOCAL POR ID
  ============================== */

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchId.trim().toLowerCase()

    if (!normalizedSearch) {
      return orders
    }

    return orders.filter((order) =>
      order.id.toLowerCase().includes(normalizedSearch),
    )
  }, [orders, searchId])

  /* ==============================
     REFRESH
  ============================== */

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)

    setPage(1)

    setHasMore(true)

    await fetchOrders(1, true)
  }, [fetchOrders])

  /* ==============================
     CARREGAR MAIS
  ============================== */

  const loadMoreOrders = useCallback(() => {
    if (loading || loadingMore || loadingMoreRef.current || !hasMore) {
      return
    }

    const nextPage = page + 1

    void fetchOrders(nextPage, false)
  }, [fetchOrders, hasMore, loading, loadingMore, page])

  /* ==============================
     VALIDAR PEDIDO
  ============================== */

  const validateOrder = useCallback(
    async (orderId: string) => {
      if (processingOrderId) {
        return
      }

      try {
        setProcessingOrderId(orderId)

        const response = await api.patch(`/orders/${orderId}/validate`)

        toast.show({
          description:
            response.data?.message ?? 'Pedido validado e pontos gerados!',

          bgColor: 'green.500',

          placement: 'top',
        })

        setPage(1)

        await fetchOrders(1, true)
      } catch (error: any) {
        console.error('[OrderValidation] Erro ao validar pedido:', {
          orderId,

          status: error?.response?.status,

          data: error?.response?.data,

          message: error?.message,
        })

        toast.show({
          description:
            error?.response?.data?.message ?? 'Erro ao validar pedido',

          bgColor: 'red.500',

          placement: 'top',
        })
      } finally {
        setProcessingOrderId(null)
      }
    },
    [fetchOrders, processingOrderId, toast],
  )

  /* ==============================
     CANCELAR PEDIDO
  ============================== */

  const cancelOrder = useCallback(
    async (orderId: string) => {
      if (processingOrderId) {
        return
      }

      try {
        setProcessingOrderId(orderId)

        await api.patch(`/orders/${orderId}/cancel`)

        toast.show({
          description: 'Pedido cancelado com sucesso!',

          bgColor: 'green.500',

          placement: 'top',
        })

        setPage(1)

        await fetchOrders(1, true)
      } catch (error: any) {
        console.error('[OrderValidation] Erro ao cancelar pedido:', {
          orderId,

          status: error?.response?.status,

          data: error?.response?.data,

          message: error?.message,
        })

        toast.show({
          description:
            error?.response?.data?.message ?? 'Erro ao cancelar pedido',

          bgColor: 'red.500',

          placement: 'top',
        })
      } finally {
        setProcessingOrderId(null)
      }
    },
    [fetchOrders, processingOrderId, toast],
  )

  /* ==============================
     CONFIRMAÇÃO NATIVA
  ============================== */

  const handleConfirmAction = useCallback(
    (orderId: string, action: 'validate' | 'cancel') => {
      if (processingOrderId) {
        return
      }

      const isValidate = action === 'validate'

      Alert.alert(
        isValidate ? 'Validar pedido' : 'Cancelar pedido',

        isValidate
          ? 'Deseja confirmar a validação deste pedido?'
          : 'Deseja realmente cancelar este pedido?',

        [
          {
            text: 'Voltar',
            style: 'cancel',
          },

          {
            text: 'Confirmar',

            style: action === 'cancel' ? 'destructive' : 'default',

            onPress: () => {
              if (isValidate) {
                void validateOrder(orderId)

                return
              }

              void cancelOrder(orderId)
            },
          },
        ],
        {
          cancelable: true,
        },
      )
    },
    [cancelOrder, processingOrderId, validateOrder],
  )

  /* ==============================
     LOADING INICIAL
  ============================== */

  if (loading && orders.length === 0) {
    return (
      <Box flex={1} bg="gray.50" justifyContent="center" alignItems="center">
        <Spinner size="lg" color="green.600" />

        <Text mt={3} color="gray.500">
          Carregando pedidos...
        </Text>
      </Box>
    )
  }

  /* ==============================
     TELA
  ============================== */

  return (
    <Box flex={1} bg="gray.50">
      <HomeScreen title="Validação de Pedidos" />

      {/* ==========================
          BUSCA E FILTRO
      ========================== */}

      <Box px={4} py={2}>
        <HStack alignItems="center">
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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingRight: 16,
          }}
        >
          <HStack space={2} mt={3}>
            {STATUS_OPTIONS.map((option) => {
              const isSelected = selectedStatus === option.value

              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    if (selectedStatus === option.value) {
                      return
                    }

                    setSearchId('')

                    setPage(1)

                    setHasMore(true)

                    setSelectedStatus(option.value)
                  }}
                >
                  <Box
                    px={4}
                    py={2}
                    borderRadius="full"
                    bg={isSelected ? 'primary.500' : 'gray.200'}
                  >
                    <Text
                      color={isSelected ? 'white' : 'gray.700'}
                      fontWeight={isSelected ? 'bold' : 'normal'}
                    >
                      {option.label}
                    </Text>
                  </Box>
                </Pressable>
              )
            })}
          </HStack>
        </ScrollView>
      </Box>

      {/* ==========================
          LISTA
      ========================== */}

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => `order-${item.id}`}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        /*
         * Como cada página possui poucos
         * pedidos, desativamos clipping.
         * Isso evita componentes sumindo
         * em determinados builds Android.
         */
        removeClippedSubviews={false}
        initialNumToRender={PAGE_SIZE}
        maxToRenderPerBatch={PAGE_SIZE}
        windowSize={5}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onEndReached={loadMoreOrders}
        onEndReachedThreshold={0.2}
        contentContainerStyle={{
          paddingBottom: 40,

          flexGrow: filteredOrders.length === 0 ? 1 : undefined,
        }}
        renderItem={({ item }) => {
          const isPending = item.status === 'PENDING'

          const isProcessing = processingOrderId === item.id

          return (
            <Box bg="white" p={4} mx={4} mt={4} borderRadius="md" shadow={1}>
              {/* PEDIDO */}

              <Text fontWeight="bold" numberOfLines={1}>
                Pedido #{item.id.slice(0, 8)}
              </Text>

              {/* STATUS */}

              <Box alignSelf="flex-start" mt={2}>
                <Badge colorScheme={getStatusColor(item.status)}>
                  {getStatusLabel(item.status)}
                </Badge>
              </Box>

              {/* CLIENTE */}

              <Text color="gray.500" mt={2} numberOfLines={1}>
                Cliente: {item.user_name}
              </Text>

              {/* DATA */}

              <Text color="gray.500">{formatOrderDate(item.createdAt)}</Text>

              <Divider my={3} />

              {/* PRODUTOS */}

              {item.items.length > 0 ? (
                <VStack space={2}>
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
                        alt={`Imagem de ${orderItem.product.name}`}
                        size="sm"
                        borderRadius="md"
                        resizeMode="contain"
                      />

                      <VStack flex={1}>
                        <Text numberOfLines={2}>
                          {orderItem.quantity}x {orderItem.product.name}
                        </Text>

                        <Text color="gray.500">
                          {formatCurrency(orderItem.product.price)}
                        </Text>
                      </VStack>
                    </HStack>
                  ))}
                </VStack>
              ) : (
                <Text color="gray.500" fontSize="sm">
                  Nenhum produto encontrado neste pedido.
                </Text>
              )}

              <Divider my={3} />

              {/* TOTAL */}

              <HStack justifyContent="space-between">
                <Text fontWeight="bold">Total:</Text>

                <Text fontWeight="bold">
                  {formatCurrency(item.totalAmount)}
                </Text>
              </HStack>

              {/* DESCONTO */}

              {item.discountApplied > 0 ? (
                <HStack justifyContent="space-between" mt={1}>
                  <Text color="orange.600">Desconto aplicado:</Text>

                  <Text color="orange.600">
                    -{formatCurrency(item.discountApplied)}
                  </Text>
                </HStack>
              ) : null}

              {/* PONTOS */}

              <HStack justifyContent="space-between" mt={2}>
                <Text fontWeight="bold" color="purple.700">
                  Pontos a gerar:
                </Text>

                <Text fontWeight="bold" color="purple.700">
                  {calculateOrderPoints(item)} pontos
                </Text>
              </HStack>

              {/* AÇÕES */}

              {isPending && (
                <HStack mt={4} space={3}>
                  <Button
                    flex={1}
                    colorScheme="green"
                    isDisabled={processingOrderId !== null}
                    isLoading={isProcessing}
                    onPress={() => handleConfirmAction(item.id, 'validate')}
                  >
                    Validar Pedido
                  </Button>

                  <Button
                    flex={1}
                    colorScheme="red"
                    isDisabled={processingOrderId !== null}
                    onPress={() => handleConfirmAction(item.id, 'cancel')}
                  >
                    Cancelar
                  </Button>
                </HStack>
              )}
            </Box>
          )
        }}
        /* ==========================
           LISTA VAZIA
        ========================== */

        ListEmptyComponent={
          <Box flex={1} px={6} pt={20} alignItems="center">
            <Text
              fontSize="lg"
              fontWeight="bold"
              color="gray.700"
              textAlign="center"
            >
              Nenhum pedido encontrado
            </Text>

            <Text mt={2} fontSize="sm" color="gray.500" textAlign="center">
              {searchId.trim()
                ? 'Nenhum pedido corresponde ao ID informado.'
                : 'Não existem pedidos com este status.'}
            </Text>
          </Box>
        }
        /* ==========================
           FOOTER
        ========================== */

        ListFooterComponent={
          loadingMore ? (
            <Box py={6} alignItems="center">
              <Spinner size="sm" color="green.600" />

              <Text mt={2} fontSize="xs" color="gray.500">
                Carregando mais pedidos...
              </Text>
            </Box>
          ) : (
            <Box h={4} />
          )
        }
      />
    </Box>
  )
}
