import React, { useCallback, useMemo, useRef, useState } from 'react'

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ListRenderItemInfo,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { MaterialIcons } from '@expo/vector-icons'

import { useFocusEffect } from '@react-navigation/native'

import { api } from '@services/api'

import { formatCurrency } from '@utils/format'

import { HomeScreen } from '@components/HomeScreen'

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

const PAGE_SIZE = 8

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

function safeNumber(value: unknown, fallback = 0) {
  const number = Number(value)

  return Number.isFinite(number) ? number : fallback
}

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

function getStatusStyle(status: string) {
  switch (status) {
    case 'PENDING':
      return {
        backgroundColor: '#FEF3C7',

        color: '#92400E',
      }

    case 'VALIDATED':
      return {
        backgroundColor: '#DCFCE7',

        color: '#166534',
      }

    case 'EXPIRED':
      return {
        backgroundColor: '#FEE2E2',

        color: '#991B1B',
      }

    default:
      return {
        backgroundColor: '#E5E7EB',

        color: '#374151',
      }
  }
}

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

function getImageUri(image?: string | null) {
  if (!image) {
    return null
  }

  const value = image.trim()

  if (!value) {
    return null
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }

  const baseURL = api.defaults.baseURL?.replace(/\/+$/, '')

  if (!baseURL) {
    return null
  }

  const normalizedImage = value.replace(/^\/+/, '')

  if (normalizedImage.startsWith('uploads/')) {
    return `${baseURL}/${normalizedImage}`
  }

  return `${baseURL}/uploads/${normalizedImage}`
}

type ProductImageProps = {
  image?: string | null
}

function ProductImage({ image }: ProductImageProps) {
  const [hasError, setHasError] = useState(false)

  const uri = useMemo(() => getImageUri(image), [image])

  if (!uri || hasError) {
    return (
      <View style={styles.productImageFallback}>
        <MaterialIcons name="image-not-supported" size={28} color="#9CA3AF" />
      </View>
    )
  }

  return (
    <Image
      source={{
        uri,
      }}
      style={styles.productImage}
      resizeMode="contain"
      resizeMethod="resize"
      fadeDuration={0}
      onError={() => {
        setHasError(true)
      }}
    />
  )
}

export function OrderValidation() {
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

  const loadingMoreRef = useRef(false)

  const requestControllerRef = useRef<AbortController | null>(null)

  const requestSequenceRef = useRef(0)

  /* ==============================
     PONTOS
  ============================== */

  const calculateOrderPoints = useCallback((order: Order) => {
    const total = safeNumber(order.totalAmount)

    const discount = safeNumber(order.discountApplied)

    const paidValue = Math.max(0, total - discount)

    return Math.floor(paidValue / 10)
  }, [])

  /* ==============================
     NORMALIZAÇÃO
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

          totalAmount: safeNumber(order.totalAmount),

          discountApplied: safeNumber(order.discountApplied),

          status: String(order.status ?? 'PENDING'),

          items: Array.isArray(order.items)
            ? order.items.map(
                (item: any, index: number): OrderItem => ({
                  id: String(item?.id ?? `${order.id}-${index}`),

                  quantity: safeNumber(item?.quantity),

                  product: {
                    id: String(item?.product?.id ?? ''),

                    name: String(item?.product?.name ?? 'Produto'),

                    price: safeNumber(item?.product?.price),

                    image: item?.product?.image ?? null,
                  },
                }),
              )
            : [],
        }),
      )
  }, [])

  /* ==============================
     BUSCAR PEDIDOS
  ============================== */

  const fetchOrders = useCallback(
    async (pageNumber = 1, reset = false) => {
      if (pageNumber > 1 && loadingMoreRef.current) {
        return
      }

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

        console.log('[OrderValidation] Buscando pedidos:', {
          page: pageNumber,

          status: selectedStatus,
        })

        const response = await api.get('/orders', {
          signal: controller.signal,

          params: {
            page: pageNumber,

            pageSize: PAGE_SIZE,

            status: selectedStatus,
          },
        })

        if (requestSequence !== requestSequenceRef.current) {
          return
        }

        const responseOrders =
          response.data?.orders ?? response.data?.data ?? []

        const newOrders = normalizeOrders(responseOrders)

        if (reset) {
          setOrders(newOrders)
        } else {
          setOrders((currentOrders) => {
            const knownIds = new Set(currentOrders.map((order) => order.id))

            const uniqueOrders = newOrders.filter(
              (order) => !knownIds.has(order.id),
            )

            return [...currentOrders, ...uniqueOrders]
          })
        }

        const pagination = response.data?.pagination ?? response.data?.meta

        const totalPages = safeNumber(pagination?.totalPages)

        if (totalPages > 0) {
          setHasMore(pageNumber < totalPages)
        } else {
          setHasMore(newOrders.length === PAGE_SIZE)
        }

        setPage(pageNumber)
      } catch (error: any) {
        if (
          error?.code === 'ERR_CANCELED' ||
          error?.name === 'CanceledError' ||
          error?.name === 'AbortError' ||
          error?.message === 'canceled'
        ) {
          return
        }

        console.error('[OrderValidation] Erro ao carregar pedidos:', {
          message: error?.message,

          code: error?.code,

          status: error?.response?.status,

          data: error?.response?.data,
        })

        if (reset) {
          setOrders([])
        }

        setHasMore(false)

        Alert.alert(
          'Erro',
          error?.response?.data?.message ?? 'Erro ao carregar pedidos.',
        )
      } finally {
        if (requestSequence === requestSequenceRef.current) {
          setLoading(false)

          setLoadingMore(false)

          setRefreshing(false)

          loadingMoreRef.current = false
        }
      }
    },
    [normalizeOrders, selectedStatus],
  )

  /* ==============================
     FOCO
  ============================== */

  useFocusEffect(
    useCallback(() => {
      setPage(1)

      setHasMore(true)

      void fetchOrders(1, true)

      return () => {
        requestControllerRef.current?.abort()

        requestSequenceRef.current += 1

        loadingMoreRef.current = false
      }
    }, [fetchOrders]),
  )

  /* ==============================
     FILTRO POR ID
  ============================== */

  const filteredOrders = useMemo(() => {
    const search = searchId.trim().toLowerCase()

    if (!search) {
      return orders
    }

    return orders.filter((order) => order.id.toLowerCase().includes(search))
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
     PAGINAÇÃO
  ============================== */

  const loadMoreOrders = useCallback(() => {
    if (loading || loadingMore || loadingMoreRef.current || !hasMore) {
      return
    }

    void fetchOrders(page + 1, false)
  }, [fetchOrders, hasMore, loading, loadingMore, page])

  /* ==============================
     VALIDAR
  ============================== */

  const validateOrder = useCallback(
    async (orderId: string) => {
      if (processingOrderId) {
        return
      }

      try {
        setProcessingOrderId(orderId)

        const response = await api.patch(`/orders/${orderId}/validate`)

        await fetchOrders(1, true)

        Alert.alert(
          'Pedido validado',
          response.data?.message ?? 'Pedido validado e pontos gerados!',
        )
      } catch (error: any) {
        console.error('[OrderValidation] Erro ao validar pedido:', {
          orderId,

          message: error?.message,

          code: error?.code,

          status: error?.response?.status,

          data: error?.response?.data,
        })

        Alert.alert(
          'Erro',
          error?.response?.data?.message ?? 'Erro ao validar pedido.',
        )
      } finally {
        setProcessingOrderId(null)
      }
    },
    [fetchOrders, processingOrderId],
  )

  /* ==============================
     CANCELAR
  ============================== */

  const cancelOrder = useCallback(
    async (orderId: string) => {
      if (processingOrderId) {
        return
      }

      try {
        setProcessingOrderId(orderId)

        await api.patch(`/orders/${orderId}/cancel`)

        await fetchOrders(1, true)

        Alert.alert('Pedido cancelado', 'Pedido cancelado com sucesso!')
      } catch (error: any) {
        console.error('[OrderValidation] Erro ao cancelar pedido:', {
          orderId,

          message: error?.message,

          code: error?.code,

          status: error?.response?.status,

          data: error?.response?.data,
        })

        Alert.alert(
          'Erro',
          error?.response?.data?.message ?? 'Erro ao cancelar pedido.',
        )
      } finally {
        setProcessingOrderId(null)
      }
    },
    [fetchOrders, processingOrderId],
  )

  /* ==============================
     CONFIRMAÇÃO
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
     ITEM
  ============================== */

  const renderOrder = useCallback(
    ({ item }: ListRenderItemInfo<Order>) => {
      const isPending = item.status === 'PENDING'

      const isProcessing = processingOrderId === item.id

      const statusStyle = getStatusStyle(item.status)

      return (
        <View style={styles.orderCard}>
          <Text numberOfLines={1} style={styles.orderTitle}>
            Pedido #{item.id.slice(0, 8)}
          </Text>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusStyle.backgroundColor,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color: statusStyle.color,
                },
              ]}
            >
              {getStatusLabel(item.status)}
            </Text>
          </View>

          <Text numberOfLines={1} style={styles.secondaryText}>
            Cliente: {item.user_name}
          </Text>

          <Text style={styles.secondaryText}>
            {formatOrderDate(item.createdAt)}
          </Text>

          <View style={styles.divider} />

          {item.items.length > 0 ? (
            item.items.map((orderItem) => (
              <View
                key={`item-${item.id}-${orderItem.id}`}
                style={styles.productRow}
              >
                <ProductImage image={orderItem.product.image} />

                <View style={styles.productInfo}>
                  <Text numberOfLines={2} style={styles.productName}>
                    {orderItem.quantity}x {orderItem.product.name}
                  </Text>

                  <Text style={styles.productPrice}>
                    {formatCurrency(orderItem.product.price)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.secondaryText}>
              Nenhum produto encontrado neste pedido.
            </Text>
          )}

          <View style={styles.divider} />

          <View style={styles.valueRow}>
            <Text style={styles.valueLabel}>Total:</Text>

            <Text style={styles.valueLabel}>
              {formatCurrency(item.totalAmount)}
            </Text>
          </View>

          {item.discountApplied > 0 ? (
            <View style={styles.valueRow}>
              <Text style={styles.discountValue}>Desconto aplicado:</Text>

              <Text style={styles.discountValue}>
                -{formatCurrency(item.discountApplied)}
              </Text>
            </View>
          ) : null}

          <View style={[styles.valueRow, styles.pointsRow]}>
            <Text style={styles.pointsText}>Pontos a gerar:</Text>

            <Text style={styles.pointsText}>
              {calculateOrderPoints(item)} pontos
            </Text>
          </View>

          {isPending ? (
            <View style={styles.actions}>
              <Pressable
                disabled={processingOrderId !== null}
                onPress={() => handleConfirmAction(item.id, 'validate')}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.validateButton,

                  processingOrderId !== null && styles.disabledButton,

                  pressed && styles.pressed,
                ]}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.actionButtonText}>Validar Pedido</Text>
                )}
              </Pressable>

              <Pressable
                disabled={processingOrderId !== null}
                onPress={() => handleConfirmAction(item.id, 'cancel')}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.cancelButton,

                  processingOrderId !== null && styles.disabledButton,

                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.actionButtonText}>Cancelar</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      )
    },
    [calculateOrderPoints, handleConfirmAction, processingOrderId],
  )

  /* ==============================
     LOADING
  ============================== */

  if (loading && orders.length === 0) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#00875F" />

        <Text style={styles.loadingText}>Carregando pedidos...</Text>
      </View>
    )
  }

  /* ==============================
     TELA
  ============================== */

  return (
    <View style={styles.container}>
      <HomeScreen title="Validação de Pedidos" />

      {/* BUSCA */}

      <View style={styles.searchArea}>
        <View style={styles.searchRow}>
          <TextInput
            value={searchId}
            onChangeText={setSearchId}
            placeholder="Buscar por ID"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.searchInput}
          />

          <Pressable
            onPress={() => setSearchId('')}
            style={({ pressed }) => [
              styles.clearButton,

              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.clearButtonText}>Limpar</Text>
          </Pressable>
        </View>

        {/* STATUS */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusFilters}
        >
          {STATUS_OPTIONS.map((option) => {
            const selected = selectedStatus === option.value

            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  if (selected) {
                    return
                  }

                  setSearchId('')

                  setPage(1)

                  setHasMore(true)

                  setSelectedStatus(option.value)
                }}
                style={({ pressed }) => [
                  styles.filterButton,

                  selected
                    ? styles.filterButtonSelected
                    : styles.filterButtonDefault,

                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,

                    selected
                      ? styles.filterTextSelected
                      : styles.filterTextDefault,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>
      </View>

      {/* LISTA */}

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => `order-${item.id}`}
        renderItem={renderOrder}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
        initialNumToRender={PAGE_SIZE}
        maxToRenderPerBatch={PAGE_SIZE}
        windowSize={4}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onEndReached={loadMoreOrders}
        onEndReachedThreshold={0.2}
        contentContainerStyle={[
          styles.listContent,

          filteredOrders.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="receipt-long" size={52} color="#9CA3AF" />

            <Text style={styles.emptyTitle}>Nenhum pedido encontrado</Text>

            <Text style={styles.emptyText}>
              {searchId.trim()
                ? 'Nenhum pedido corresponde ao ID informado.'
                : 'Não existem pedidos com este status.'}
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator size="small" color="#00875F" />

              <Text style={styles.footerLoadingText}>
                Carregando mais pedidos...
              </Text>
            </View>
          ) : (
            <View style={styles.footerSpace} />
          )
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#6B7280',
  },

  searchArea: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  searchInput: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    fontSize: 15,
    color: '#111827',
  },

  clearButton: {
    minHeight: 48,
    marginLeft: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#00875F',
  },

  clearButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  statusFilters: {
    gap: 8,
    paddingTop: 12,
    paddingRight: 16,
  },

  filterButton: {
    minHeight: 38,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
  },

  filterButtonDefault: {
    backgroundColor: '#E5E7EB',
    borderColor: '#E5E7EB',
  },

  filterButtonSelected: {
    backgroundColor: '#00875F',
    borderColor: '#00875F',
  },

  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },

  filterTextDefault: {
    color: '#374151',
  },

  filterTextSelected: {
    color: '#FFFFFF',
  },

  listContent: {
    paddingBottom: 40,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  orderCard: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },

  orderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  statusBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },

  secondaryText: {
    marginTop: 7,
    fontSize: 13,
    color: '#6B7280',
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
    backgroundColor: '#E5E7EB',
  },

  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  productImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },

  productImageFallback: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },

  productInfo: {
    flex: 1,
    marginLeft: 12,
  },

  productName: {
    fontSize: 14,
    color: '#1F2937',
  },

  productPrice: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },

  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },

  valueLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  discountValue: {
    fontSize: 13,
    color: '#C2410C',
  },

  pointsRow: {
    marginTop: 10,
  },

  pointsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7E22CE',
  },

  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },

  actionButton: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
  },

  validateButton: {
    backgroundColor: '#16A34A',
  },

  cancelButton: {
    backgroundColor: '#DC2626',
  },

  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  disabledButton: {
    opacity: 0.55,
  },

  pressed: {
    opacity: 0.7,
  },

  emptyContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 70,
    alignItems: 'center',
  },

  emptyTitle: {
    marginTop: 14,
    fontSize: 17,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },

  emptyText: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
    textAlign: 'center',
  },

  footerLoading: {
    paddingVertical: 22,
    alignItems: 'center',
  },

  footerLoadingText: {
    marginTop: 7,
    fontSize: 12,
    color: '#6B7280',
  },

  footerSpace: {
    height: 16,
  },
})
