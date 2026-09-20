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

import { useNavigation } from '@react-navigation/native'

import { MaterialIcons } from '@expo/vector-icons'

import { AppNavigatorRoutesProps } from '@routes/app.routes'

import { ProductDTO } from '@dtos/ProductDTO'

import { api } from '@services/api'

import { ProductCard } from '@components/Product/ProductCard'

import { HomeScreen } from '@components/HomeScreen'

import { CartContext } from '@contexts/CartContext'

const FILTER_OPTIONS = [
  {
    value: 'all',
    label: 'Todos',
  },
  {
    value: '5',
    label: '< 5',
  },
  {
    value: '10',
    label: '< 10',
  },
  {
    value: '15',
    label: '< 15',
  },
]

function safeNumber(value: unknown, fallback = 0) {
  const number = Number(value)

  return Number.isFinite(number) ? number : fallback
}

export function AllProductsQuantity() {
  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const { width } = useWindowDimensions()

  /*
   * Três cards de 120px podem ficar
   * apertados em aparelhos menores.
   */
  const numColumns = width >= 380 ? 3 : 2

  const {
    cartItems,
    activeStoreId,
    addProductCart,
    incrementProduct,
    decrementProduct,
  } = useContext(CartContext)

  const [products, setProducts] = useState<ProductDTO[]>([])

  const [updatingProductIds, setUpdatingProductIds] = useState<string[]>([])

  const [isLoading, setIsLoading] = useState(true)

  const [quantityFilter, setQuantityFilter] = useState('all')

  /*
   * Cancela a busca se a tela
   * for desmontada.
   */
  const requestControllerRef = useRef<AbortController | null>(null)

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
     BUSCAR PRODUTOS
  ============================== */

  const fetchProductByQuantity = useCallback(async () => {
    requestControllerRef.current?.abort()

    const controller = new AbortController()

    requestControllerRef.current = controller

    const requestId = ++requestIdRef.current

    try {
      setIsLoading(true)

      const response = await api.get('/products/quantity', {
        signal: controller.signal,
      })

      if (requestId !== requestIdRef.current) {
        return
      }

      const responseProducts =
        response.data?.products ?? response.data?.data ?? response.data ?? []

      const fetchedProducts: ProductDTO[] = Array.isArray(responseProducts)
        ? responseProducts.filter((product) => Boolean(product?.id))
        : []

      setProducts(fetchedProducts)
    } catch (error: any) {
      /*
       * Cancelamento normal da
       * requisição não é erro.
       */
      if (
        error?.code === 'ERR_CANCELED' ||
        error?.name === 'CanceledError' ||
        error?.message === 'canceled'
      ) {
        return
      }

      console.error('[AllProductsQuantity] Erro ao carregar produtos:', {
        message: error?.message,

        code: error?.code,

        status: error?.response?.status,

        data: error?.response?.data,
      })

      setProducts([])

      Alert.alert(
        'Erro',
        error?.response?.data?.message ??
          'Não foi possível carregar os produtos que estão esgotando.',
      )
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void fetchProductByQuantity()

    return () => {
      requestControllerRef.current?.abort()

      requestIdRef.current += 1
    }
  }, [fetchProductByQuantity])

  /* ==============================
     FILTRO
  ============================== */

  const filteredProducts = useMemo(() => {
    if (quantityFilter === 'all') {
      return products
    }

    const limit = safeNumber(quantityFilter)

    return products.filter((product) => {
      const quantity = safeNumber(product?.quantity)

      return quantity < limit
    })
  }, [products, quantityFilter])

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

      const cartItem = cartItems.find(
        (item) => item.productId === currentProduct.id,
      )

      return safeNumber(cartItem?.quantity)
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
          '[AllProductsQuantity] Produto sem storeId:',
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
        Alert.alert(
          'Produto esgotado',
          'Este produto não possui unidades disponíveis.',
        )

        return
      }

      if (cartQuantity >= stockQuantity) {
        Alert.alert(
          'Estoque insuficiente',
          'Quantidade máxima disponível atingida.',
        )

        return
      }

      try {
        setProductUpdating(currentProduct.id, true)

        if (cartQuantity === 0) {
          /*
           * Envia o produto completo
           * para atualização local
           * imediata do carrinho.
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
        console.error('[AllProductsQuantity] Erro ao adicionar:', {
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
        console.error('[AllProductsQuantity] Erro ao diminuir:', {
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
     EXTRA DATA
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
     RENDER ITEM
  ============================== */

  const renderProduct = useCallback(
    ({ item }: ListRenderItemInfo<ProductDTO>) => {
      return (
        <ProductCard
          product={item}
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
      <HomeScreen title="Esgotando" />

      {/* AVISO */}

      <View style={styles.infoBox}>
        <MaterialIcons name="local-offer" size={18} color="#00875F" />

        <Text style={styles.infoText}>Compre e acumule pontos!</Text>
      </View>

      {/* TÍTULO */}

      <View style={styles.titleRow}>
        <View>
          <Text style={styles.sectionTitle}>Tá acabando</Text>

          <View style={styles.titleAccent} />
        </View>

        <Text style={styles.productCount}>
          {filteredProducts.length}{' '}
          {filteredProducts.length === 1 ? 'produto' : 'produtos'}
        </Text>
      </View>

      {/* FILTROS */}

      <View style={styles.filters}>
        {FILTER_OPTIONS.map((option) => {
          const selected = quantityFilter === option.value

          return (
            <Pressable
              key={option.value}
              onPress={() => setQuantityFilter(option.value)}
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

      {/* LISTA */}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#EAB308" size="large" />

          <Text style={styles.loadingText}>Carregando produtos...</Text>
        </View>
      ) : (
        <FlatList
          key={`quantity-grid-${numColumns}`}
          data={filteredProducts}
          extraData={listExtraData}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          numColumns={numColumns}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          /*
           * Quantidade reduzida de cards
           * mantidos na memória.
           */
          initialNumToRender={numColumns * 2}
          maxToRenderPerBatch={numColumns * 2}
          windowSize={3}
          /*
           * Mais conservador devido aos
           * problemas anteriores de
           * renderização no Android.
           */
          removeClippedSubviews={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="inventory-2" size={48} color="#9CA3AF" />

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

    backgroundColor: '#F3F4F6',
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

  titleRow: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    marginHorizontal: 12,

    marginTop: 2,
  },

  sectionTitle: {
    fontSize: 16,

    fontWeight: '600',

    color: '#1F2937',
  },

  titleAccent: {
    width: 80,

    height: 4,

    marginTop: 4,

    borderRadius: 4,

    backgroundColor: '#FDE047',
  },

  productCount: {
    marginRight: 8,

    fontSize: 12,

    color: '#6B7280',
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

    borderWidth: 1,

    alignItems: 'center',

    justifyContent: 'center',
  },

  filterButtonDefault: {
    backgroundColor: '#FFFFFF',

    borderColor: '#D1D5DB',
  },

  filterButtonSelected: {
    backgroundColor: '#EAB308',

    borderColor: '#EAB308',
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
    paddingHorizontal: 4,

    paddingBottom: 32,
  },

  columnWrapper: {
    justifyContent: 'space-around',

    marginBottom: 12,
  },

  emptyContainer: {
    paddingTop: 50,

    paddingHorizontal: 24,

    alignItems: 'center',
  },

  emptyText: {
    marginTop: 14,

    fontSize: 14,

    textAlign: 'center',

    color: '#6B7280',
  },
})
