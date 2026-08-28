import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { FlatList } from 'react-native'
import { Box, HStack, Icon, Text, VStack, useToast } from 'native-base'
import { TextInput, StyleSheet, Pressable, RefreshControl } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { MaterialIcons } from '@expo/vector-icons'
import debounce from 'lodash.debounce'

//add produto carrinho
import { CartContext } from '@contexts/CartContext'
import { AppNavigatorRoutesProps } from '@routes/app.routes'

import { api } from '@services/api'
import { AppError } from '@utils/AppError'
import { ProductDTO } from '@dtos/ProductDTO'
import { ProductCard } from '@components/ProductCard'
import { Loading } from '@components/Loading'
import { HomeScreen } from '@components/HomeScreen'
import { CityContext } from '@contexts/CityContext'

const PAGE_SIZE = 24
const SEARCH_DEBOUNCE_MS = 450

const removeAccents = (str: string) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const makeTmpId = (seed: string, page: number, idx: number) =>
  `tmp-${page}-${idx}-${(seed || 'x').slice(0, 6)}`

const normalizeProducts = (raw: ProductDTO[], currentPage: number) =>
  (raw || []).map((p, idx) => {
    const base = String((p as any)?.id ?? (p as any)?._id ?? '')
    const safeId = base || makeTmpId(p?.name ?? '', currentPage, idx)

    return {
      ...p,
      id: safeId,
    }
  })

export function SearchProducts() {
  const toast = useToast()
  const inputRef = useRef<TextInput>(null)

  const { city } = useContext(CityContext)

  //add produto carrinho
  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const {
    cartItems,
    activeStoreId,
    addProductCart,
    incrementProduct,
    decrementProduct,
  } = useContext(CartContext)

  const [updatingProductIds, setUpdatingProductIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [products, setProducts] = useState<ProductDTO[]>([])

  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const requestControllerRef = useRef<AbortController | null>(null)
  const requestSequenceRef = useRef(0)
  const loadingMoreRef = useRef(false)

  //add produto carrinho
  const handleOpenProductDetails = (productId: string) => {
    navigation.navigate('productDetails', { productId })
  }

  useFocusEffect(
    useCallback(() => {
      setTimeout(() => inputRef.current?.focus(), 150)
    }, []),
  )

  const loadProducts = useCallback(
    async (pageNumber = 1, shouldRefresh = false, query = activeQuery) => {
      if (!city?.id) {
        setProducts([])
        setIsLoading(false)
        return
      }

      if (pageNumber > 1 && loadingMoreRef.current) return

      if (pageNumber === 1) requestControllerRef.current?.abort()

      const controller = new AbortController()
      requestControllerRef.current = controller
      const requestSequence = ++requestSequenceRef.current

      try {
        if (pageNumber === 1 && !shouldRefresh) {
          setIsLoading(true)
        }

        if (pageNumber > 1) {
          loadingMoreRef.current = true
          setIsLoadingMore(true)
        }

        const response = await api.get(
          query ? '/products/search' : '/products/active',
          {
            signal: controller.signal,
            params: {
              cityId: city.id,
              page: pageNumber,
              pageSize: PAGE_SIZE,
              ...(query ? { query } : {}),
            },
          },
        )

        if (requestSequence !== requestSequenceRef.current) return

        const responseData =
          response.data?.products ?? response.data?.data ?? response.data ?? []
        const fetched = normalizeProducts(
          Array.isArray(responseData) ? responseData : [],
          pageNumber,
        )

        setProducts((current) => {
          if (pageNumber === 1) return fetched

          const knownIds = new Set(current.map((product) => product.id))
          return [
            ...current,
            ...fetched.filter((product) => !knownIds.has(product.id)),
          ]
        })

        const pagination = response.data?.pagination ?? response.data?.meta
        const totalPages = Number(pagination?.totalPages ?? 0)

        setHasMore(
          totalPages > 0
            ? pageNumber < totalPages
            : fetched.length === PAGE_SIZE,
        )
        setPage(pageNumber)
      } catch (error: any) {
        if (
          error?.name === 'CanceledError' ||
          error?.name === 'AbortError' ||
          error?.code === 'ERR_CANCELED'
        ) {
          return
        }

        const title =
          error instanceof AppError
            ? error.message
            : 'Erro ao carregar produtos.'

        toast.show({
          title,
          placement: 'top',
          bgColor: 'red.500',
        })

        if (pageNumber === 1) {
          setProducts([])
        }

        setHasMore(false)
      } finally {
        if (requestSequence === requestSequenceRef.current) {
          setIsLoading(false)
          setIsLoadingMore(false)
          setIsRefreshing(false)
        }

        loadingMoreRef.current = false
      }
    },
    [activeQuery, city?.id, toast],
  )

  const searchProducts = useMemo(
    () =>
      debounce((query: string) => {
        setActiveQuery(query)
        setIsSearching(Boolean(query))
        setPage(1)
        setHasMore(true)
        void loadProducts(1, false, query)
      }, SEARCH_DEBOUNCE_MS),
    [loadProducts],
  )

  function handleSearchChange(text: string) {
    setSearchTerm(text)

    const formattedQuery = removeAccents(text.trim())

    if (!formattedQuery) {
      searchProducts.cancel()
      setActiveQuery('')
      setIsSearching(false)
      setHasMore(true)
      void loadProducts(1, false, '')
      return
    }

    searchProducts(formattedQuery)
  }

  function handleClearSearch() {
    setSearchTerm('')
    searchProducts.cancel()
    setActiveQuery('')
    setIsSearching(false)
    setHasMore(true)
    void loadProducts(1, false, '')
  }

  function handleLoadMore() {
    if (loadingMoreRef.current || isLoading || !hasMore) return

    void loadProducts(page + 1, false, activeQuery)
  }

  async function handleRefresh() {
    setIsRefreshing(true)
    searchProducts.cancel()
    setHasMore(true)
    await loadProducts(1, true, activeQuery)
  }

  useEffect(() => {
    setSearchTerm('')
    setActiveQuery('')
    setIsSearching(false)
    setPage(1)
    setHasMore(true)
    void loadProducts(1, false, '')

    return () => {
      searchProducts.cancel()
      requestControllerRef.current?.abort()
    }
  }, [city?.id])

  const cartQuantityByProductId = useMemo(() => {
    const quantities = new Map<string, number>()

    if (!activeStoreId) return quantities

    cartItems.forEach((item) => {
      quantities.set(item.productId, item.quantity)
    })

    return quantities
  }, [activeStoreId, cartItems])

  const updatingProductIdSet = useMemo(
    () => new Set(updatingProductIds),
    [updatingProductIds],
  )

  //funções para adicionar e remover produtos diretamente no carrinho:
  function getProductStoreId(currentProduct: ProductDTO) {
    return currentProduct.storeId ?? currentProduct.store?.id ?? null
  }

  function getCartQuantity(currentProduct: ProductDTO) {
    const productStoreId = getProductStoreId(currentProduct)

    if (!productStoreId || activeStoreId !== productStoreId) {
      return 0
    }

    return cartQuantityByProductId.get(currentProduct.id) ?? 0
  }

  function isProductUpdating(productId: string) {
    return updatingProductIdSet.has(productId)
  }

  function setProductUpdating(productId: string, updating: boolean) {
    setUpdatingProductIds((current) => {
      if (updating) {
        if (current.includes(productId)) {
          return current
        }

        return [...current, productId]
      }

      return current.filter((id) => id !== productId)
    })
  }

  async function handleIncrementProduct(currentProduct: ProductDTO) {
    if (isProductUpdating(currentProduct.id)) {
      return
    }

    const productStoreId = getProductStoreId(currentProduct)

    if (!productStoreId) {
      console.error('[SearchProducts] Produto sem storeId:', currentProduct)

      toast.show({
        title: 'Não foi possível identificar a loja',
        description: 'Atualize a tela e tente novamente.',
        placement: 'top',
        bgColor: 'red.500',
      })

      return
    }

    const stockQuantity = Number(currentProduct.quantity ?? 0)

    const cartQuantity = getCartQuantity(currentProduct)

    if (stockQuantity <= 0) {
      toast.show({
        title: 'Produto esgotado',
        placement: 'top',
        bgColor: 'orange.500',
      })

      return
    }

    if (cartQuantity >= stockQuantity) {
      toast.show({
        title: 'Estoque insuficiente',
        description: 'Quantidade máxima disponível atingida.',
        placement: 'top',
        bgColor: 'orange.500',
      })

      return
    }

    try {
      setProductUpdating(currentProduct.id, true)

      if (cartQuantity === 0) {
        await addProductCart({
          productId: currentProduct.id,
          storeId: productStoreId,
          quantity: 1,
        })
      } else {
        await incrementProduct(currentProduct.id)
      }
    } catch (error: any) {
      console.error(
        '[SearchProducts] Erro ao adicionar:',
        error?.response?.status,
        error?.response?.data,
        error?.message,
      )

      toast.show({
        title: 'Erro ao adicionar produto',
        description:
          error?.response?.data?.message ??
          error?.message ??
          'Não foi possível adicionar o produto.',
        placement: 'top',
        bgColor: 'red.500',
      })
    } finally {
      setProductUpdating(currentProduct.id, false)
    }
  }

  async function handleDecrementProduct(currentProduct: ProductDTO) {
    if (isProductUpdating(currentProduct.id)) {
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
      console.error(
        '[SearchProducts] Erro ao diminuir:',
        error?.response?.status,
        error?.response?.data,
        error?.message,
      )

      toast.show({
        title: 'Erro ao atualizar produto',
        description:
          error?.response?.data?.message ??
          error?.message ??
          'Não foi possível diminuir a quantidade.',
        placement: 'top',
        bgColor: 'red.500',
      })
    } finally {
      setProductUpdating(currentProduct.id, false)
    }
  }

  return (
    <VStack flex={1} bg="#F8FAFC">
      <HomeScreen title="Pesquisar" />

      <Box px={3} pt={3} pb={2} bg="#F8FAFC">
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
            placeholder="Buscar produtos no IAki"
            placeholderTextColor="#94A3B8"
            value={searchTerm}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            autoCorrect={false}
          />

          {searchTerm.length > 0 && (
            <Pressable onPress={handleClearSearch}>
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
            {isSearching
              ? `${products.length} resultado(s) encontrados`
              : `${products.length} produto(s) carregados`}
          </Text>

          {!isSearching && (
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
          extraData={{
            cartItems,
            activeStoreId,
            updatingProductIds,
          }}
          keyExtractor={(item) => item.id}
          numColumns={3}
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
                isUpdating={isProductUpdating(item.id)}
                onIncrement={() => handleIncrementProduct(item)}
                onDecrement={() => handleDecrementProduct(item)}
                onPress={() => handleOpenProductDetails(item.id)}
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
                Tente buscar por outro nome ou confira se a cidade selecionada
                possui produtos cadastrados.
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
