import React, {
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  AppState,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
} from 'react-native'
import { Box, HStack, Icon, Text, VStack, useToast } from 'native-base'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { MaterialIcons } from '@expo/vector-icons'
import debounce from 'lodash.debounce'

import { CartContext } from '@contexts/CartContext'
import { CityContext } from '@contexts/CityContext'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { api } from '@services/api'
import { AppError } from '@utils/AppError'
import { ProductDTO } from '@dtos/ProductDTO'
import { ProductCard } from '@components/ProductCard'
import { Loading } from '@components/Loading'
import { HomeScreen } from '@components/HomeScreen'

const PAGE_SIZE = 24
const SEARCH_DEBOUNCE_MS = 450

type LoadMode = 'initial' | 'search' | 'refresh' | 'background' | 'more'

function normalizeQuery(text: string) {
  return text
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function normalizeProducts(raw: unknown): ProductDTO[] {
  if (!Array.isArray(raw)) return []

  return raw.flatMap((product) => {
    const id = product?.id ?? product?._id
    return id ? [{ ...product, id: String(id) }] : []
  })
}

export function SearchProducts() {
  const toast = useToast()
  const toastRef = useRef(toast)
  toastRef.current = toast

  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const { city } = useContext(CityContext)
  const cityId = city?.id

  const {
    cartItems,
    activeStoreId,
    addProductCart,
    incrementProduct,
    decrementProduct,
  } = useContext(CartContext)

  const inputRef = useRef<TextInput>(null)
  const queryRef = useRef('')
  const requestRef = useRef<AbortController | null>(null)
  const pendingSearchRef = useRef(false)
  const productLocksRef = useRef(new Set<string>())

  const [searchTerm, setSearchTerm] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [products, setProducts] = useState<ProductDTO[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [updatingProductIds, setUpdatingProductIds] = useState<string[]>([])

  const loadProducts = useCallback(
    async (pageNumber: number, mode: LoadMode, query = queryRef.current) => {
      if (!cityId) {
        requestRef.current?.abort()
        requestRef.current = null
        setProducts([])
        setPage(1)
        setHasMore(false)
        setIsLoading(false)
        setIsLoadingMore(false)
        setIsRefreshing(false)
        return
      }

      if (
        (mode === 'more' || mode === 'background') &&
        (requestRef.current || pendingSearchRef.current)
      ) {
        return
      }

      requestRef.current?.abort()

      const controller = new AbortController()
      requestRef.current = controller

      setIsLoading(mode === 'initial' || mode === 'search')
      setIsLoadingMore(mode === 'more')
      setIsRefreshing(mode === 'refresh')

      try {
        const { data } = await api.get(
          query ? '/products/search' : '/products/active',
          {
            signal: controller.signal,
            params: {
              cityId,
              page: pageNumber,
              pageSize: PAGE_SIZE,
              ...(query ? { query } : {}),
            },
          },
        )

        if (
          controller.signal.aborted ||
          requestRef.current !== controller ||
          query !== queryRef.current
        ) {
          return
        }

        const raw = data?.products ?? data?.data ?? data ?? []
        const fetched = normalizeProducts(raw)
        const pagination = data?.pagination ?? data?.meta
        const totalPages = Number(pagination?.totalPages ?? 0)

        setProducts((current) => {
          const merged = new Map<string, ProductDTO>()

          if (pageNumber > 1) {
            current.forEach((product) => merged.set(product.id, product))
          }

          fetched.forEach((product) => merged.set(product.id, product))

          return [...merged.values()]
        })

        setActiveQuery(query)
        setPage(pageNumber)
        setHasMore(
          totalPages > 0
            ? pageNumber < totalPages
            : Array.isArray(raw) && raw.length >= PAGE_SIZE,
        )
      } catch (error) {
        if (
          controller.signal.aborted ||
          requestRef.current !== controller ||
          mode === 'background'
        ) {
          return
        }

        toastRef.current.show({
          title:
            error instanceof AppError
              ? error.message
              : 'Erro ao carregar produtos.',
          placement: 'top',
          bgColor: 'red.500',
        })
      } finally {
        if (requestRef.current === controller) {
          requestRef.current = null
          setIsLoading(false)
          setIsLoadingMore(false)
          setIsRefreshing(false)
        }
      }
    },
    [cityId],
  )

  const searchProducts = useMemo(
    () =>
      debounce((query: string) => {
        pendingSearchRef.current = false
        void loadProducts(1, 'search', query)
      }, SEARCH_DEBOUNCE_MS),
    [loadProducts],
  )

  useFocusEffect(
    useCallback(() => {
      void loadProducts(1, 'initial')

      const focusTimer = setTimeout(() => {
        inputRef.current?.focus()
      }, 150)

      let previousState = AppState.currentState

      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active' && previousState !== 'active') {
          void loadProducts(1, 'background')
        }

        previousState = state
      })

      return () => {
        clearTimeout(focusTimer)
        subscription.remove()
        searchProducts.cancel()
        pendingSearchRef.current = false

        const request = requestRef.current
        requestRef.current = null
        request?.abort()
      }
    }, [loadProducts, searchProducts]),
  )

  function handleSearchChange(text: string) {
    const query = normalizeQuery(text)

    setSearchTerm(text)

    if (query === queryRef.current) return

    queryRef.current = query
    pendingSearchRef.current = Boolean(query)
    searchProducts.cancel()

    const request = requestRef.current
    requestRef.current = null
    request?.abort()

    setProducts([])
    setActiveQuery(query)
    setPage(1)
    setHasMore(false)
    setIsLoadingMore(false)
    setIsRefreshing(false)

    if (!query) {
      void loadProducts(1, 'search', '')
      return
    }

    setIsLoading(true)
    searchProducts(query)
  }

  function handleRefresh() {
    searchProducts.cancel()
    pendingSearchRef.current = false
    void loadProducts(1, 'refresh')
  }

  function handleLoadMore() {
    if (
      !hasMore ||
      isLoading ||
      isRefreshing ||
      requestRef.current ||
      pendingSearchRef.current
    ) {
      return
    }

    void loadProducts(page + 1, 'more', activeQuery)
  }

  const cartQuantityByProductId = useMemo(
    () => new Map(cartItems.map((item) => [item.productId, item.quantity])),
    [cartItems],
  )

  function getProductStoreId(product: ProductDTO) {
    return product.storeId ?? product.store?.id ?? null
  }

  function getCartQuantity(product: ProductDTO) {
    const storeId = getProductStoreId(product)

    if (!storeId || storeId !== activeStoreId) return 0

    return cartQuantityByProductId.get(product.id) ?? 0
  }

  async function updateProductQuantity(
    product: ProductDTO,
    action: 'increment' | 'decrement',
  ) {
    if (productLocksRef.current.has(product.id)) return

    const quantity = getCartQuantity(product)
    const storeId = getProductStoreId(product)

    if (action === 'decrement' && quantity <= 0) return

    if (action === 'increment') {
      if (!storeId) {
        toast.show({
          title: 'Não foi possível identificar a loja',
          description: 'Atualize a tela e tente novamente.',
          placement: 'top',
          bgColor: 'red.500',
        })
        return
      }

      const stock = Number(product.quantity ?? 0)

      if (!Number.isFinite(stock) || stock <= 0 || quantity >= stock) {
        toast.show({
          title: stock <= 0 ? 'Produto esgotado' : 'Estoque insuficiente',
          placement: 'top',
          bgColor: 'orange.500',
        })
        return
      }
    }

    productLocksRef.current.add(product.id)
    setUpdatingProductIds((current) => [...current, product.id])

    try {
      if (action === 'decrement') {
        await decrementProduct(product.id)
      } else if (quantity > 0) {
        await incrementProduct(product.id)
      } else if (storeId) {
        await addProductCart({
          productId: product.id,
          storeId,
          quantity: 1,
        })
      }
    } catch (error: any) {
      toast.show({
        title: 'Não foi possível atualizar o carrinho',
        description: error?.response?.data?.message ?? error?.message,
        placement: 'top',
        bgColor: 'red.500',
      })
    } finally {
      productLocksRef.current.delete(product.id)
      setUpdatingProductIds((current) =>
        current.filter((id) => id !== product.id),
      )
    }
  }

  return (
    <VStack flex={1} bg="#F8FAFC">
      <HomeScreen title="Pesquisar" />

      <Box px={3} pt={3} pb={2}>
        <HStack
          h={12}
          bg="white"
          borderRadius={16}
          px={3}
          alignItems="center"
          borderWidth={1}
          borderColor="coolGray.200"
          shadow={1}
        >
          <Icon
            as={MaterialIcons}
            name="search"
            size={5}
            color="coolGray.400"
            mr={2}
          />

          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Buscar por produto ou loja"
            placeholderTextColor="#94A3B8"
            value={searchTerm}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            autoCorrect={false}
          />

          {searchTerm.length > 0 && (
            <Pressable
              onPress={() => handleSearchChange('')}
              accessibilityRole="button"
              accessibilityLabel="Limpar busca"
              hitSlop={8}
            >
              <Icon
                as={MaterialIcons}
                name="close"
                size={5}
                color="coolGray.500"
              />
            </Pressable>
          )}
        </HStack>

        <HStack mt={2} justifyContent="space-between" alignItems="center">
          <Text fontSize="xs" color="coolGray.500">
            {activeQuery
              ? `${products.length} resultado(s) carregado(s)`
              : `${products.length} produto(s) carregado(s)`}
          </Text>

          {!activeQuery && (
            <Text fontSize="xs" color="blue.600" fontWeight="700">
              Todos os produtos
            </Text>
          )}
        </HStack>
      </Box>

      {isLoading && products.length === 0 ? (
        <Loading />
      ) : (
        <FlatList
          data={products}
          extraData={{ cartItems, activeStoreId, updatingProductIds }}
          keyExtractor={(item) => item.id}
          numColumns={3}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[
            styles.contentContainer,
            products.length === 0 && styles.emptyContainer,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
          renderItem={({ item }) => (
            <Box style={styles.cardWrapper}>
              <ProductCard
                data={item}
                cartQuantity={getCartQuantity(item)}
                isUpdating={updatingProductIds.includes(item.id)}
                onIncrement={() =>
                  void updateProductQuantity(item, 'increment')
                }
                onDecrement={() =>
                  void updateProductQuantity(item, 'decrement')
                }
                onPress={() =>
                  navigation.navigate('productDetails', { productId: item.id })
                }
              />
            </Box>
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.35}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          updateCellsBatchingPeriod={50}
          windowSize={7}
          removeClippedSubviews
          ListEmptyComponent={
            <VStack alignItems="center" mt={20} px={8}>
              <Icon
                as={MaterialIcons}
                name="search-off"
                size={16}
                color="coolGray.300"
              />

              <Text mt={4} fontSize="lg" fontWeight="700" color="coolGray.700">
                Nenhum produto encontrado
              </Text>

              <Text
                mt={1}
                fontSize="sm"
                textAlign="center"
                color="coolGray.500"
              >
                Tente buscar por outro nome ou confira a cidade selecionada.
              </Text>
            </VStack>
          }
          ListFooterComponent={
            isLoadingMore ? (
              <Box py={4}>
                <Loading />
              </Box>
            ) : null
          }
        />
      )}
    </VStack>
  )
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 0,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  contentContainer: {
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 120,
  },
  cardWrapper: {
    width: '32%',
    marginBottom: 8,
  },
  emptyContainer: {
    flexGrow: 1,
  },
})
