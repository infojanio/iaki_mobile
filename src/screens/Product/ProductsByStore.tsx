import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { FlatList } from 'react-native'
import { Box, Text, useToast, VStack } from 'native-base'

import { ListRenderItem } from 'react-native'

import { useNavigation, useRoute } from '@react-navigation/native'

import { BackHome } from '@components/BackHome'
import { Loading } from '@components/Loading'
import { ProductCard } from '@components/Product/ProductCard'
import { StoreFilter } from '@components/Store/StoreFilter'

import { CartContext } from '@contexts/CartContext'

import { ProductDTO } from '@dtos/ProductDTO'
import { StoreDTO } from '@dtos/StoreDTO'

import { AppNavigatorRoutesProps } from '@routes/app.routes'

import { api } from '@services/api'

import { AppError } from '@utils/AppError'

type RouteParams = {
  businessCategoryId: string
  storeId?: string
}

export function ProductsByStore() {
  const route = useRoute()

  const { businessCategoryId, storeId: initialStoreId } =
    route.params as RouteParams

  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const toast = useToast()

  const {
    cartItems,
    activeStoreId,
    addProductCart,
    incrementProduct,
    decrementProduct,
  } = useContext(CartContext)

  const [stores, setStores] = useState<StoreDTO[]>([])

  const [selectedStore, setSelectedStore] = useState<string | null>(null)

  const [products, setProducts] = useState<ProductDTO[]>([])

  const [isLoadingStores, setIsLoadingStores] = useState(true)

  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  /*
   * Set possui busca mais eficiente do que array.includes().
   */
  const [updatingProductIds, setUpdatingProductIds] = useState<Set<string>>(
    () => new Set(),
  )

  /* =====================================
     CARREGAR LOJAS
  ===================================== */

  useEffect(() => {
    const controller = new AbortController()

    async function fetchStores() {
      try {
        setIsLoadingStores(true)
        setSelectedStore(null)
        setStores([])
        setProducts([])

        const response = await api.get<StoreDTO[]>(
          '/stores/business-category',
          {
            params: {
              businessCategoryId,
            },
            signal: controller.signal,
          },
        )

        if (controller.signal.aborted) {
          return
        }

        const loadedStores = response.data ?? []

        setStores(loadedStores)

        /*
         * Se a loja recebida pela rota pertence à categoria,
         * ela será selecionada. Caso contrário, utiliza a primeira.
         */
        const initialStoreExists = initialStoreId
          ? loadedStores.some((store) => store.id === initialStoreId)
          : false

        const nextSelectedStore = initialStoreExists
          ? initialStoreId!
          : (loadedStores[0]?.id ?? null)

        setSelectedStore(nextSelectedStore)
      } catch (error: any) {
        if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
          return
        }

        console.error('[ProductsByStore] Erro ao carregar lojas:', error)

        toast.show({
          title: 'Erro ao carregar lojas.',
          placement: 'top',
          bgColor: 'red.500',
        })

        setStores([])
        setSelectedStore(null)
        setProducts([])
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingStores(false)
        }
      }
    }

    fetchStores()

    return () => {
      controller.abort()
    }
  }, [businessCategoryId, initialStoreId, toast])

  /* =====================================
     CARREGAR PRODUTOS DA LOJA
  ===================================== */

  useEffect(() => {
    const controller = new AbortController()

    async function fetchProductsByStore() {
      if (!selectedStore) {
        setProducts([])
        setIsLoadingProducts(false)

        return
      }

      try {
        setIsLoadingProducts(true)

        /*
         * Limpa os produtos anteriores para não exibir itens
         * de outra loja durante a nova requisição.
         */
        setProducts([])

        const response = await api.get<ProductDTO[]>(
          '/products/business-category',
          {
            params: {
              storeId: selectedStore,
            },
            signal: controller.signal,
          },
        )

        if (controller.signal.aborted) {
          return
        }

        setProducts(response.data ?? [])
      } catch (error: any) {
        if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
          return
        }

        const title =
          error instanceof AppError ? error.message : 'Erro ao buscar produtos.'

        console.error('[ProductsByStore] Erro ao carregar produtos:', {
          storeId: selectedStore,
          status: error?.response?.status,
          data: error?.response?.data,
          message: error?.message,
        })

        toast.show({
          title,
          placement: 'top',
          bgColor: 'red.500',
        })

        setProducts([])
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingProducts(false)
        }
      }
    }

    fetchProductsByStore()

    /*
     * Ao trocar rapidamente de loja, cancela a requisição
     * anterior. Isso impede produtos da loja anterior de
     * sobrescreverem a loja atual.
     */
    return () => {
      controller.abort()
    }
  }, [selectedStore, toast])

  /* =====================================
     MAPA DE QUANTIDADES DO CARRINHO
  ===================================== */

  const cartQuantityByProductId = useMemo(() => {
    const quantities = new Map<string, number>()

    if (!activeStoreId) {
      return quantities
    }

    for (const cartItem of cartItems) {
      if (cartItem.storeId === activeStoreId) {
        quantities.set(cartItem.productId, cartItem.quantity)
      }
    }

    return quantities
  }, [activeStoreId, cartItems])

  const getProductStoreId = useCallback((currentProduct: ProductDTO) => {
    return currentProduct.storeId ?? currentProduct.store?.id ?? null
  }, [])

  const getCartQuantity = useCallback(
    (currentProduct: ProductDTO) => {
      const productStoreId = getProductStoreId(currentProduct)

      if (!productStoreId || activeStoreId !== productStoreId) {
        return 0
      }

      return cartQuantityByProductId.get(currentProduct.id) ?? 0
    },
    [activeStoreId, cartQuantityByProductId, getProductStoreId],
  )

  /* =====================================
     CONTROLE DE ATUALIZAÇÃO
  ===================================== */

  const isProductUpdating = useCallback(
    (productId: string) => {
      return updatingProductIds.has(productId)
    },
    [updatingProductIds],
  )

  const setProductUpdating = useCallback(
    (productId: string, updating: boolean) => {
      setUpdatingProductIds((current) => {
        const updated = new Set(current)

        if (updating) {
          updated.add(productId)
        } else {
          updated.delete(productId)
        }

        return updated
      })
    },
    [],
  )

  /* =====================================
     NAVEGAÇÃO E SELEÇÃO
  ===================================== */

  const handleOpenProductDetails = useCallback(
    (productId: string) => {
      navigation.navigate('productDetails', {
        productId,
      })
    },
    [navigation],
  )

  const handleSelectStore = useCallback(
    (storeId: string) => {
      if (storeId === selectedStore) {
        return
      }

      setSelectedStore(storeId)
    },
    [selectedStore],
  )

  /* =====================================
     ADICIONAR / INCREMENTAR
  ===================================== */

  const handleIncrementProduct = useCallback(
    async (currentProduct: ProductDTO) => {
      const productId = currentProduct.id

      if (isProductUpdating(productId)) {
        return
      }

      const productStoreId = getProductStoreId(currentProduct)

      if (!productStoreId) {
        console.error('[ProductsByStore] Produto sem storeId:', currentProduct)

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

      setProductUpdating(productId, true)

      try {
        if (cartQuantity === 0) {
          /*
           * O objeto product permite que CartContext atualize
           * cartItems imediatamente.
           *
           * Dessa maneira não é necessário buscar novamente
           * o carrinho depois do POST.
           */
          await addProductCart({
            productId,
            storeId: productStoreId,
            quantity: 1,

            product: {
              id: productId,
              name: currentProduct.name,
              image: currentProduct.image,
              price: Number(currentProduct.price ?? 0),
              cashbackPercentage: Number(
                currentProduct.cashbackPercentage ?? 0,
              ),
              quantity: stockQuantity,
            },
          })

          return
        }

        await incrementProduct(productId)
      } catch (error: any) {
        console.error('[ProductsByStore] Erro ao adicionar:', {
          productId,
          status: error?.response?.status,
          data: error?.response?.data,
          message: error?.message,
        })

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
        setProductUpdating(productId, false)
      }
    },
    [
      addProductCart,
      getCartQuantity,
      getProductStoreId,
      incrementProduct,
      isProductUpdating,
      setProductUpdating,
      toast,
    ],
  )

  /* =====================================
     DECREMENTAR
  ===================================== */

  const handleDecrementProduct = useCallback(
    async (currentProduct: ProductDTO) => {
      const productId = currentProduct.id

      if (isProductUpdating(productId)) {
        return
      }

      const cartQuantity = getCartQuantity(currentProduct)

      if (cartQuantity <= 0) {
        return
      }

      setProductUpdating(productId, true)

      try {
        await decrementProduct(productId)
      } catch (error: any) {
        console.error('[ProductsByStore] Erro ao diminuir:', {
          productId,
          status: error?.response?.status,
          data: error?.response?.data,
          message: error?.message,
        })

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
        setProductUpdating(productId, false)
      }
    },
    [
      decrementProduct,
      getCartQuantity,
      isProductUpdating,
      setProductUpdating,
      toast,
    ],
  )

  /* =====================================
     RENDERIZAÇÃO DAS LOJAS
  ===================================== */

  const renderStore: ListRenderItem<StoreDTO> = useCallback(
    ({ item }) => {
      return (
        <StoreFilter
          title={item.name}
          isActive={item.id === selectedStore}
          onPress={() => handleSelectStore(item.id)}
        />
      )
    },
    [handleSelectStore, selectedStore],
  )

  /* =====================================
     RENDERIZAÇÃO DOS PRODUTOS
  ===================================== */

  const renderProduct: ListRenderItem<ProductDTO> = useCallback(
    ({ item }) => {
      return (
        <Box>
          <ProductCard
            product={item}
            cartQuantity={getCartQuantity(item)}
            isUpdating={isProductUpdating(item.id)}
            onIncrement={() => handleIncrementProduct(item)}
            onDecrement={() => handleDecrementProduct(item)}
            onPress={() => handleOpenProductDetails(item.id)}
          />
        </Box>
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

  /* =====================================
     TELA
  ===================================== */

  return (
    <VStack flex={1} bg="white" safeArea>
      <BackHome title="Produtos" />

      <Box pt={4} minH={16}>
        {isLoadingStores ? (
          <Box px={4}>
            <Text color="gray.500" fontSize="sm">
              Carregando lojas...
            </Text>
          </Box>
        ) : stores.length > 0 ? (
          <FlatList
            horizontal
            data={stores}
            keyExtractor={(item) => item.id}
            renderItem={renderStore}
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={6}
            maxToRenderPerBatch={6}
            windowSize={5}
            contentContainerStyle={{
              paddingHorizontal: 16,
              gap: 12,
            }}
          />
        ) : (
          <Text px={4} color="gray.500" fontSize="sm">
            Nenhuma loja encontrada nessa categoria.
          </Text>
        )}
      </Box>

      {isLoadingProducts ? (
        <Loading />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={50}
          windowSize={7}
          columnWrapperStyle={{
            justifyContent: 'space-between',
            paddingHorizontal: 16,
          }}
          contentContainerStyle={{
            paddingBottom: 16,
            paddingTop: 8,
            flexGrow: products.length === 0 ? 1 : 0,
          }}
          ListEmptyComponent={
            <Box flex={1} alignItems="center" justifyContent="center" px={6}>
              <Text textAlign="center" color="gray.500">
                {selectedStore
                  ? 'Nenhum produto encontrado para essa loja.'
                  : 'Selecione uma loja para visualizar os produtos.'}
              </Text>
            </Box>
          }
        />
      )}
    </VStack>
  )
}
