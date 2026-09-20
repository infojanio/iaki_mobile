import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'

import { MaterialIcons } from '@expo/vector-icons'

import { useNavigation } from '@react-navigation/native'

import { api } from '@services/api'

import { ProductDTO } from '@dtos/ProductDTO'

import { ProductCard } from '@components/ProductCard'
import { HomeScreen } from '@components/HomeScreen'

import { CartContext } from '@contexts/CartContext'

import { AppNavigatorRoutesProps } from '@routes/app.routes'

const ITEMS_PER_PAGE = 6

const FILTER_OPTIONS = [
  {
    value: 'all',
    label: 'Todos',
  },
  {
    value: '5',
    label: '> 5%',
  },
  {
    value: '10',
    label: '> 10%',
  },
  {
    value: '15',
    label: '> 15%',
  },
]

function safeNumber(value: unknown, fallback = 0) {
  const number = Number(value)

  return Number.isFinite(number) ? number : fallback
}

export function AllProductsDiscount() {
  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const { width } = useWindowDimensions()

  /*
   * Em aparelhos muito estreitos,
   * três cards de 120px não cabem
   * confortavelmente.
   */
  const numColumns = width >= 380 ? 3 : 2

  const [products, setProducts] = useState<ProductDTO[]>([])

  const [isLoading, setIsLoading] = useState(true)

  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const [cashbackFilter, setCashbackFilter] = useState('all')

  const [page, setPage] = useState(1)

  const [hasMore, setHasMore] = useState(true)

  const [updatingProductIds, setUpdatingProductIds] = useState<string[]>([])

  const {
    cartItems,
    activeStoreId,
    addProductCart,
    incrementProduct,
    decrementProduct,
  } = useContext(CartContext)

  /*
   * Protege onEndReached contra
   * chamadas duplicadas antes do
   * próximo render.
   */
  const loadingMoreRef = useRef(false)

  /*
   * Cancela requisições antigas
   * quando a tela desmontar.
   */
  const requestControllerRef = useRef<AbortController | null>(null)

  /*
   * Evita que uma resposta antiga
   * sobrescreva uma mais recente.
   */
  const requestIdRef = useRef(0)

  /* ==============================
     DETALHES
  ============================== */

  const handleOpenProductDetails = useCallback(
    (productId: string) => {
      if (!productId) {
        return
      }

      navigation.navigate('productDetails', {
        productId,
      })
    },
    [navigation],
  )

  /* ==============================
     LOJA DO PRODUTO
  ============================== */

  const getProductStoreId = useCallback((currentProduct: ProductDTO) => {
    return currentProduct?.storeId ?? currentProduct?.store?.id ?? null
  }, [])

  /* ==============================
     QUANTIDADE NO CARRINHO
  ============================== */

  const getCartQuantity = useCallback(
    (currentProduct: ProductDTO) => {
      const productStoreId = getProductStoreId(currentProduct)

      if (!productStoreId || activeStoreId !== productStoreId) {
        return 0
      }

      const item = cartItems.find(
        (cartItem) => cartItem.productId === currentProduct.id,
      )

      return safeNumber(item?.quantity)
    },
    [activeStoreId, cartItems, getProductStoreId],
  )

  /* ==============================
     PRODUTO ATUALIZANDO
  ============================== */

  const isProductUpdating = useCallback(
    (productId: string) => {
      return updatingProductIds.includes(productId)
    },
    [updatingProductIds],
  )

  const setProductUpdating = useCallback(
    (productId: string, updating: boolean) => {
      setUpdatingProductIds((current) => {
        if (updating) {
          if (current.includes(productId)) {
            return current
          }

          return [...current, productId]
        }

        return current.filter((id) => id !== productId)
      })
    },
    [],
  )

  /* ==============================
     BUSCAR PRODUTOS
  ============================== */

  const fetchProducts = useCallback(async (pageNumber = 1) => {
    const isFirstPage = pageNumber === 1

    if (!isFirstPage && loadingMoreRef.current) {
      return
    }

    if (isFirstPage) {
      requestControllerRef.current?.abort()
    }

    const controller = new AbortController()

    requestControllerRef.current = controller

    const requestId = ++requestIdRef.current

    try {
      if (isFirstPage) {
        setIsLoading(true)

        setHasMore(true)
      } else {
        loadingMoreRef.current = true

        setIsLoadingMore(true)
      }

      const response = await api.get('/products', {
        signal: controller.signal,

        params: {
          page: pageNumber,

          perPage: ITEMS_PER_PAGE,
        },
      })

      if (requestId !== requestIdRef.current) {
        return
      }

      const responseProducts =
        response.data?.products ?? response.data?.data ?? response.data ?? []

      const fetchedProducts: ProductDTO[] = Array.isArray(responseProducts)
        ? responseProducts.filter((product) => Boolean(product?.id))
        : []

      setProducts((currentProducts) => {
        if (isFirstPage) {
          return fetchedProducts
        }

        const currentIds = new Set(currentProducts.map((product) => product.id))

        const newProducts = fetchedProducts.filter(
          (product) => !currentIds.has(product.id),
        )

        return [...currentProducts, ...newProducts]
      })

      const pagination = response.data?.pagination

      const totalPages = safeNumber(pagination?.totalPages)

      if (totalPages > 0) {
        setHasMore(pageNumber < totalPages)
      } else {
        setHasMore(fetchedProducts.length === ITEMS_PER_PAGE)
      }

      setPage(pageNumber)
    } catch (error: any) {
      if (
        error?.code === 'ERR_CANCELED' ||
        error?.name === 'CanceledError' ||
        error?.message === 'canceled'
      ) {
        return
      }

      console.error('[AllProductsDiscount] Erro ao carregar produtos:', {
        message: error?.message,

        code: error?.code,

        status: error?.response?.status,

        data: error?.response?.data,
      })

      if (isFirstPage) {
        setProducts([])
      }

      setHasMore(false)

      Alert.alert(
        'Erro',
        error?.response?.data?.message ??
          'Não foi possível carregar os produtos.',
      )
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false)

        setIsLoadingMore(false)
      }

      loadingMoreRef.current = false
    }
  }, [])

  /* ==============================
     PRIMEIRA CARGA
  ============================== */

  useEffect(() => {
    void fetchProducts(1)

    return () => {
      requestControllerRef.current?.abort()

      requestIdRef.current += 1
    }
  }, [fetchProducts])

  /* ==============================
     FILTRO
  ============================== */

  const filteredProducts = useMemo(() => {
    const minimumDiscount =
      cashbackFilter === 'all' ? 0 : safeNumber(cashbackFilter)

    return products.filter((product) => {
      const discount = safeNumber(product?.cashbackPercentage)

      if (cashbackFilter === 'all') {
        return discount > 0
      }

      return discount > minimumDiscount
    })
  }, [cashbackFilter, products])

  /* ==============================
     PAGINAÇÃO
  ============================== */

  const handleLoadMore = useCallback(() => {
    if (!hasMore || isLoading || isLoadingMore || loadingMoreRef.current) {
      return
    }

    void fetchProducts(page + 1)
  }, [fetchProducts, hasMore, isLoading, isLoadingMore, page])

  /* ==============================
     INCREMENTAR
  ============================== */

  const handleIncrementProduct = useCallback(
    async (currentProduct: ProductDTO) => {
      if (!currentProduct?.id || isProductUpdating(currentProduct.id)) {
        return
      }

      const productStoreId = getProductStoreId(currentProduct)

      if (!productStoreId) {
        console.error(
          '[AllProductsDiscount] Produto sem storeId:',
          currentProduct.id,
        )

        Alert.alert(
          'Erro',
          'Não foi possível identificar a loja deste produto.',
        )

        return
      }

      const stockQuantity = safeNumber(currentProduct.quantity)

      const cartQuantity = getCartQuantity(currentProduct)

      if (stockQuantity <= 0) {
        return
      }

      if (cartQuantity >= stockQuantity) {
        return
      }

      try {
        setProductUpdating(currentProduct.id, true)

        if (cartQuantity === 0) {
          /*
           * IMPORTANTE:
           * envia o produto completo.
           *
           * Assim o CartContext consegue
           * atualizar o carrinho localmente
           * sem precisar fazer outro GET
           * depois do POST.
           */
          await addProductCart({
            productId: currentProduct.id,

            storeId: productStoreId,

            quantity: 1,

            product: {
              id: currentProduct.id,

              name: currentProduct.name ?? 'Produto',

              image: currentProduct.image,

              price: safeNumber(currentProduct.price),

              cashbackPercentage: safeNumber(currentProduct.cashbackPercentage),

              quantity: stockQuantity,
            },
          })
        } else {
          await incrementProduct(currentProduct.id)
        }
      } catch (error: any) {
        console.error('[AllProductsDiscount] Erro ao adicionar:', {
          productId: currentProduct.id,

          message: error?.message,

          code: error?.code,

          status: error?.response?.status,

          data: error?.response?.data,
        })

        Alert.alert(
          'Erro ao adicionar produto',
          error?.response?.data?.message ??
            error?.message ??
            'Não foi possível adicionar o produto.',
        )
      } finally {
        setProductUpdating(currentProduct.id, false)
      }
    },
    [
      addProductCart,
      getCartQuantity,
      getProductStoreId,
      incrementProduct,
      isProductUpdating,
      setProductUpdating,
    ],
  )

  /* ==============================
     DECREMENTAR
  ============================== */

  const handleDecrementProduct = useCallback(
    async (currentProduct: ProductDTO) => {
      if (!currentProduct?.id || isProductUpdating(currentProduct.id)) {
        return
      }

      const cartQuantity = getCartQuantity(currentProduct)

      if (cartQuantity <= 0) {
        return
      }

      try {
        setProductUpdating(currentProduct.id, true)

        await decrementProduct(currentProduct.id)
      } catch (error: any) {
        console.error('[AllProductsDiscount] Erro ao diminuir:', {
          productId: currentProduct.id,

          message: error?.message,

          code: error?.code,

          status: error?.response?.status,

          data: error?.response?.data,
        })

        Alert.alert(
          'Erro ao atualizar produto',
          error?.response?.data?.message ??
            error?.message ??
            'Não foi possível diminuir a quantidade.',
        )
      } finally {
        setProductUpdating(currentProduct.id, false)
      }
    },
    [decrementProduct, getCartQuantity, isProductUpdating, setProductUpdating],
  )

  /* ==============================
     EXTRA DATA ESTÁVEL
  ============================== */

  const listExtraData = useMemo(
    () => ({
      cartItems,
      activeStoreId,
      updatingProductIds,
    }),
    [activeStoreId, cartItems, updatingProductIds],
  )

  /* ==============================
     ITEM
  ============================== */

  const renderProduct = useCallback(
    ({ item }: ListRenderItemInfo<ProductDTO>) => {
      return (
        <ProductCard
          data={item}
          cartQuantity={getCartQuantity(item)}
          isUpdating={isProductUpdating(item.id)}
          onIncrement={() => void handleIncrementProduct(item)}
          onDecrement={() => void handleDecrementProduct(item)}
          onPress={() => handleOpenProductDetails(item.id)}
        />
      )
    },
    [
      getCartQuantity,
      handleDecrementProduct,
      handleIncrementProduct,
      handleOpenProductDetails,
      isProductUpdating,
    ],
  )

  /* ==============================
     TELA
  ============================== */

  return (
    <View style={styles.container}>
      <HomeScreen title="Maiores descontos" />

      {/* AVISO */}

      <View style={styles.infoBox}>
        <MaterialIcons name="local-offer" size={18} color="#00875F" />

        <Text style={styles.infoText}>
          Todos os produtos oferecem descontos!
        </Text>
      </View>

      {/* TÍTULO DO FILTRO */}

      <View style={styles.filterHeader}>
        <Text style={styles.filterTitle}>Filtrar por desconto</Text>

        <View style={styles.filterAccent} />
      </View>

      {/* FILTROS NATIVOS */}

      <View style={styles.filters}>
        {FILTER_OPTIONS.map((option) => {
          const selected = cashbackFilter === option.value

          return (
            <Pressable
              key={option.value}
              onPress={() => setCashbackFilter(option.value)}
              style={({ pressed }) => [
                styles.filterButton,

                selected
                  ? styles.filterButtonSelected
                  : styles.filterButtonDefault,

                pressed ? styles.pressed : null,
              ]}
            >
              <Text
                style={[
                  styles.filterButtonText,

                  selected
                    ? styles.filterButtonTextSelected
                    : styles.filterButtonTextDefault,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {/* PRODUTOS */}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00875F" />

          <Text style={styles.loadingText}>Carregando produtos...</Text>
        </View>
      ) : (
        <FlatList
          /*
           * Quando muda entre 2 e 3
           * colunas, FlatList precisa
           * ser recriada.
           */
          key={`discount-grid-${numColumns}`}
          data={filteredProducts}
          extraData={listExtraData}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          numColumns={numColumns}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          /*
           * Conservador para Android.
           */
          removeClippedSubviews={false}
          initialNumToRender={numColumns * 2}
          maxToRenderPerBatch={numColumns * 2}
          windowSize={3}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator size="small" color="#00875F" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Nenhum produto encontrado com esse filtro.
              </Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  infoBox: {
    flexDirection: 'row',

    alignItems: 'center',

    marginHorizontal: 16,

    marginVertical: 8,

    paddingHorizontal: 16,

    paddingVertical: 10,

    borderRadius: 8,

    backgroundColor: '#DCFCE7',
  },

  infoText: {
    flex: 1,

    marginLeft: 6,

    fontSize: 14,

    fontWeight: '700',

    color: '#00875F',
  },

  filterHeader: {
    flexDirection: 'row',

    alignItems: 'flex-end',

    justifyContent: 'space-between',

    marginHorizontal: 12,

    marginTop: 2,
  },

  filterTitle: {
    fontSize: 16,

    fontWeight: '600',

    color: '#1F2937',
  },

  filterAccent: {
    width: 28,

    height: 4,

    marginRight: 24,

    borderRadius: 4,

    backgroundColor: '#FDE047',
  },

  filters: {
    flexDirection: 'row',

    flexWrap: 'wrap',

    gap: 8,

    paddingHorizontal: 12,

    paddingVertical: 12,
  },

  filterButton: {
    minHeight: 36,

    paddingHorizontal: 14,

    borderRadius: 18,

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 1,
  },

  filterButtonDefault: {
    backgroundColor: '#F3F4F6',

    borderColor: '#D1D5DB',
  },

  filterButtonSelected: {
    backgroundColor: '#00875F',

    borderColor: '#00875F',
  },

  filterButtonText: {
    fontSize: 13,

    fontWeight: '600',
  },

  filterButtonTextDefault: {
    color: '#374151',
  },

  filterButtonTextSelected: {
    color: '#FFFFFF',
  },

  pressed: {
    opacity: 0.7,
  },

  loadingContainer: {
    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 10,

    fontSize: 13,

    color: '#6B7280',
  },

  listContent: {
    paddingBottom: 24,

    paddingHorizontal: 4,
  },

  columnWrapper: {
    justifyContent: 'space-around',

    marginBottom: 12,
  },

  footerLoading: {
    paddingVertical: 20,

    alignItems: 'center',
  },

  emptyContainer: {
    paddingTop: 50,

    alignItems: 'center',
  },

  emptyText: {
    fontSize: 14,

    color: '#6B7280',

    textAlign: 'center',
  },
})
