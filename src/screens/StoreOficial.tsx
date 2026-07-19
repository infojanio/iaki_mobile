import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useContext,
} from 'react'
import { FlatList, TextInput, StyleSheet } from 'react-native'
import { Box, HStack, Text, useToast } from 'native-base'
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native'

import debounce from 'lodash.debounce'

import { api } from '@services/api'
import { AppError } from '@utils/AppError'

import { ProductDTO } from '@dtos/ProductDTO'
import { StoreDTO } from '@dtos/StoreDTO'

//add produto carrinho
import { CartContext } from '@contexts/CartContext'
import { AppNavigatorRoutesProps } from '@routes/app.routes'

import { ProductCard } from '@components/Product/ProductCard'
import { StoreHeader } from '@components/Store/StoreHeader'
import { Loading } from '@components/Loading'

import { Reel } from '@components/Reel'
import { StoreList } from './StoreList'
import { Promotion } from '@components/Promotion'
import { SeparatorItem } from '@components/SeparatorItem'
import { SubCategoryDTO } from '@dtos/SubCategoryDTO'
import { CategoryDTO } from '@dtos/CategoryDTO'

// -------------------- utils --------------------
const removeAccents = (str: string) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const INITIAL_SUGGESTIONS = 5
const PAGE_SIZE = 10

const makeTmpId = (seed: string, page: number, idx: number) =>
  `tmp-${page}-${idx}-${(seed || 'x').slice(0, 6)}`

const normalizeProducts = (raw: ProductDTO[], currentPage: number) =>
  (raw || []).map((p, idx) => {
    const base = String((p as any)?.id ?? (p as any)?._id ?? '')
    const safeId = base || makeTmpId(p?.name ?? '', currentPage, idx)
    return { ...p, id: safeId }
  })

// -------------------- component --------------------
export function StoreProducts() {
  const toast = useToast()
  const route = useRoute()

  const { storeId } = route.params as { storeId: string }
  const inputRef = useRef<TextInput>(null)
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

  const [store, setStore] = useState<StoreDTO | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [products, setProducts] = useState<ProductDTO[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isSearching, setIsSearching] = useState(false)

  const [categories, setCategories] = useState<CategoryDTO[]>([])
  const [categorySelected, setCategorySelected] = useState<string | null>(null)
  const [subCategories, setSubCategories] = useState<SubCategoryDTO[]>([])
  const [subCategorySelected, setSubCategorySelected] = useState<string>('')

  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  // -------------------- focus input --------------------
  useFocusEffect(
    useCallback(() => {
      setTimeout(() => inputRef.current?.focus(), 100)
    }, []),
  )

  // -------------------- navigation --------------------
  const handleOpenProductDetails = (productId: string) => {
    navigation.navigate('productDetails', { productId })
  }

  // -------------------- fetch store --------------------
  const fetchStore = useCallback(async () => {
    try {
      const response = await api.get(`/stores/${storeId}`)
      setStore(response.data)
    } catch {
      toast.show({
        title: 'Erro ao carregar dados da loja',
        placement: 'top',
        bgColor: 'red.500',
      })
    }
  }, [storeId, toast])

  // -------------------- initial products --------------------
  const fetchInitialSuggestions = useCallback(async () => {
    setIsLoading(true)
    setHasMore(true)

    try {
      const res = await api.get(`/stores/${storeId}/products`, {
        params: { page: 1, limit: INITIAL_SUGGESTIONS },
      })

      const fetched = normalizeProducts(res.data?.products || [], 1)
      setProducts(fetched)
      setHasMore(fetched.length >= INITIAL_SUGGESTIONS)
    } catch (error) {
      const title =
        error instanceof AppError ? error.message : 'Erro ao carregar produtos.'

      toast.show({ title, placement: 'top', bgColor: 'red.500' })
      setProducts([])
      setHasMore(false)
    } finally {
      setIsLoading(false)
      setHasLoaded(true)
    }
  }, [storeId, toast])

  // -------------------- pagination --------------------
  const fetchMore = useCallback(
    async (currentPage: number) => {
      try {
        const res = await api.get(`/stores/${storeId}/products`, {
          params: { page: currentPage, limit: PAGE_SIZE },
        })

        const fetched = normalizeProducts(res.data?.products || [], currentPage)
        setProducts((prev) => [...prev, ...fetched])
        setHasMore(fetched.length >= PAGE_SIZE)
      } catch {
        setHasMore(false)
      } finally {
        setIsLoadingMore(false)
      }
    },
    [storeId],
  )

  // -------------------- search --------------------
  const searchProducts = useCallback(
    debounce(async (query: string) => {
      try {
        setIsSearching(true)
        setIsLoading(true)

        const response = await api.get(`/stores/${storeId}/products/search`, {
          params: { query },
        })

        const fetched = normalizeProducts(response.data?.products || [], 1)
        setProducts(fetched)
        setHasMore(false)
      } catch (error) {
        const title =
          error instanceof AppError ? error.message : 'Erro ao buscar produtos.'

        toast.show({ title, placement: 'top', bgColor: 'red.500' })
        setProducts([])
      } finally {
        setIsLoading(false)
        setHasLoaded(true)
        setIsLoadingMore(false)
      }
    }, 500),
    [storeId, toast],
  )

  // -------------------- search subcategorias por categoria --------------------
  async function fetchSubCategoriesByCategory(categoryId: string) {
    try {
      setIsLoadingProducts(true)

      const response = await api.get(
        `/subcategories/category/?categoryId=${categoryId}`,
      )

      setSubCategories(response.data)

      if (response.data.length > 0) {
        setSubCategorySelected(response.data[0].id)
      } else {
        setSubCategorySelected('')
      }
    } catch (error) {
      toast.show({
        title:
          error instanceof AppError
            ? error.message
            : 'Erro ao carregar subcategorias',
        placement: 'top',
        bgColor: 'red.500',
      })
    } finally {
      setIsLoadingProducts(false)
    }
  }

  //buscar produtos por subcategoria
  async function fetchProductsBySubcategory(subcategoryId: string) {
    if (!subcategoryId) return

    try {
      setIsLoadingProducts(true)

      const response = await api.get(
        `/products/subcategory/?subcategoryId=${subcategoryId}`,
      )

      setProducts(response.data)
    } catch (error) {
      toast.show({
        title:
          error instanceof AppError
            ? error.message
            : 'Erro ao carregar produtos',
        placement: 'bottom-left',
        bgColor: 'red.500',
      })
    } finally {
      setIsLoadingProducts(false)
    }
  }

  // -------------------- infinite scroll --------------------
  const handleLoadMore = () => {
    if (isLoadingMore || !hasMore || isSearching) return

    setIsLoadingMore(true)
    const next = page + 1
    setPage(next)
    fetchMore(next)
  }

  // -------------------- init --------------------
  useEffect(() => {
    fetchStore()
    fetchInitialSuggestions()
  }, [fetchStore, fetchInitialSuggestions])

  useEffect(() => {
    if (categorySelected) {
      fetchSubCategoriesByCategory(categorySelected)
    }
  }, [categorySelected])

  useEffect(() => {
    if (subCategorySelected) {
      fetchProductsBySubcategory(subCategorySelected)
    }
  }, [subCategorySelected])

  // -------------------- loading guard --------------------
  if (!store || (!hasLoaded && isLoading)) {
    return <Loading />
  }

  //funções para adicionar e remover produtos diretamente no carrinho:
  function getProductStoreId(currentProduct: ProductDTO) {
    return currentProduct.storeId ?? currentProduct.store?.id ?? null
  }

  function getCartQuantity(currentProduct: ProductDTO) {
    const productStoreId = getProductStoreId(currentProduct)

    if (!productStoreId || activeStoreId !== productStoreId) {
      return 0
    }

    return (
      cartItems.find((cartItem) => cartItem.productId === currentProduct.id)
        ?.quantity ?? 0
    )
  }

  function isProductUpdating(productId: string) {
    return updatingProductIds.includes(productId)
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

  // -------------------- render --------------------
  return (
    <FlatList
      data={products}
      extraData={{
        cartItems,
        activeStoreId,
        updatingProductIds,
      }}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.columnWrapper}
      contentContainerStyle={styles.contentContainer}
      onEndReached={!isSearching ? handleLoadMore : null}
      onEndReachedThreshold={0.1}
      ListHeaderComponent={
        <>
          {/* Store header */}
          <StoreHeader store={store} />
          <SeparatorItem />

          <Promotion />
          <StoreList category={''} data={[]} />

          <Reel />
          {/* Search */}
        </>
      }
      renderItem={({ item }) => (
        <ProductCard
          product={item}
          cartQuantity={getCartQuantity(item)}
          isUpdating={isProductUpdating(item.id)}
          onIncrement={() => handleIncrementProduct(item)}
          onDecrement={() => handleDecrementProduct(item)}
          onPress={() => handleOpenProductDetails(item.id)}
        />
      )}
      ListEmptyComponent={
        isLoading ? (
          <Loading />
        ) : (
          <Text textAlign="center" mt={10}>
            Busque produtos navegando por categoria.
          </Text>
        )
      }
      ListFooterComponent={isLoadingMore ? <Loading /> : null}
    />
  )
}

// -------------------- styles --------------------
const styles = StyleSheet.create({
  input: {
    height: 50,
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 8,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  contentContainer: {
    paddingBottom: 16,
  },
})
