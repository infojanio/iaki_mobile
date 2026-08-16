import { useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { Box, FlatList, HStack, Text, useToast, VStack } from 'native-base'

import { ListRenderItem, TouchableOpacity } from 'react-native'

import { useNavigation } from '@react-navigation/native'

import { ProductCard } from '@components/ProductCard'

import { CartContext } from '@contexts/CartContext'
import { CityContext } from '@contexts/CityContext'

import { ProductDTO } from '@dtos/ProductDTO'

import { AppNavigatorRoutesProps } from '@routes/app.routes'

import { api } from '@services/api'

import { AppError } from '@utils/AppError'

type Props = {
  onPressProduct: (product: ProductDTO) => void
}

export function ProductDiscount({ onPressProduct }: Props) {
  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const toast = useToast()

  const { city } = useContext(CityContext)

  const {
    cartItems,
    activeStoreId,
    addProductCart,
    incrementProduct,
    decrementProduct,
  } = useContext(CartContext)

  const [products, setProducts] = useState<ProductDTO[]>([])

  const [isLoading, setIsLoading] = useState(true)

  /*
   * Set possui busca mais eficiente do que array.includes().
   */
  const [updatingProductIds, setUpdatingProductIds] = useState<Set<string>>(
    () => new Set(),
  )

  /* =====================================
     CARREGAR PRODUTOS
  ===================================== */

  const fetchProductsByDiscount = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setIsLoading(true)

        /*
         * Mantém o endpoint atual para não comprometer
         * a compatibilidade com o backend.
         */
        const response = await api.get<ProductDTO[]>('/products/cashback', {
          signal,
        })

        setProducts(response.data ?? [])
      } catch (error: any) {
        /*
         * Não apresenta erro quando a requisição foi cancelada
         * porque o componente saiu da tela.
         */
        if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
          return
        }

        const title =
          error instanceof AppError
            ? error.message
            : 'Não foi possível carregar os produtos com desconto.'

        toast.show({
          title,
          placement: 'top',
          bgColor: 'red.500',
        })

        setProducts([])
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false)
        }
      }
    },
    [toast],
  )

  useEffect(() => {
    const controller = new AbortController()

    fetchProductsByDiscount(controller.signal)

    return () => {
      controller.abort()
    }
  }, [fetchProductsByDiscount])

  /* =====================================
     FILTRO POR CIDADE
  ===================================== */

  const filteredProducts = useMemo(() => {
    if (!city?.id) {
      return []
    }

    return products.filter((product) => product.store?.cityId === city.id)
  }, [city?.id, products])

  /* =====================================
     MAPA DE QUANTIDADES DO CARRINHO
  ===================================== */

  /*
   * Evita executar cartItems.find() para cada produto
   * renderizado na FlatList.
   */
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

      /*
       * O IAki mantém um carrinho ativo por loja.
       */
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
     NAVEGAÇÃO
  ===================================== */

  const handleOpenProductDetails = useCallback(
    (currentProduct: ProductDTO) => {
      /*
       * Mantém a callback recebida pela tela disponível para
       * qualquer comportamento definido pelo componente pai.
       */
      onPressProduct(currentProduct)

      navigation.navigate('productDetails', {
        productId: currentProduct.id,
      })
    },
    [navigation, onPressProduct],
  )

  const handleOpenAllProduct = useCallback(() => {
    navigation.navigate('allProductsDiscount')
  }, [navigation])

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
        console.error('[ProductDiscount] Produto sem storeId:', currentProduct)

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
           * Envia o produto completo para que CartContext
           * atualize cartItems imediatamente.
           *
           * Isso elimina o GET do carrinho depois do POST.
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

        /*
         * O incremento também é otimista dentro
         * do CartContext.
         */
        await incrementProduct(productId)
      } catch (error: any) {
        console.error('[ProductDiscount] Erro ao adicionar:', {
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
        /*
         * CartContext diminui a quantidade local antes
         * de aguardar a resposta da API.
         */
        await decrementProduct(productId)
      } catch (error: any) {
        console.error('[ProductDiscount] Erro ao diminuir:', {
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
     RENDERIZAÇÃO
  ===================================== */

  const renderProduct: ListRenderItem<ProductDTO> = useCallback(
    ({ item }) => {
      return (
        <Box position="relative">
          <ProductCard
            data={item}
            cartQuantity={getCartQuantity(item)}
            isUpdating={isProductUpdating(item.id)}
            onIncrement={() => handleIncrementProduct(item)}
            onDecrement={() => handleDecrementProduct(item)}
            onPress={() => handleOpenProductDetails(item)}
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

  /*
   * A seção não ocupa espaço enquanto carrega, quando nenhuma
   * cidade foi selecionada ou quando não há produtos disponíveis.
   */
  if (isLoading || !city?.id || filteredProducts.length === 0) {
    return null
  }

  return (
    <VStack bg="gray.100" mt={2}>
      <VStack px={4} mb={2}>
        <HStack justifyContent="space-between" alignItems="center">
          <Text fontSize="md" fontWeight="semibold">
            🔥 Maiores Descontos
          </Text>

          <TouchableOpacity
            onPress={handleOpenAllProduct}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Ver todos os produtos com desconto"
          >
            <Box
              borderBottomWidth={3}
              borderColor="red.400"
              borderRadius="md"
              px={1}
            >
              <Text fontSize="sm" color="red.600" fontWeight="semibold">
                Ver todos
              </Text>
            </Box>
          </TouchableOpacity>
        </HStack>

        <Box mt={1} width={24} height={1} bg="red.400" />
      </VStack>

      <FlatList
        horizontal
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={50}
        windowSize={5}
        contentContainerStyle={{
          paddingLeft: 12,
          paddingBottom: 32,
        }}
      />
    </VStack>
  )
}
