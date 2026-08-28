import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { FlatList } from 'react-native'
import { Box, HStack, Spinner, Text, useToast, VStack } from 'native-base'

import { ListRenderItem, TouchableOpacity } from 'react-native'

import { useNavigation } from '@react-navigation/native'

import { ProductCard } from '@components/Product/ProductCard'

import { CartContext } from '@contexts/CartContext'

import { ProductDTO } from '@dtos/ProductDTO'

import { AppNavigatorRoutesProps } from '@routes/app.routes'

import { api } from '@services/api'

import { AppError } from '@utils/AppError'

export function ProductList() {
  const [products, setProducts] = useState<ProductDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)

  /*
   * Set possui busca mais eficiente que array.includes().
   *
   * Uma nova instância é criada em cada alteração para que o React
   * consiga identificar a mudança de estado.
   */
  const [updatingProductIds, setUpdatingProductIds] = useState<Set<string>>(
    () => new Set(),
  )

  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const {
    cartItems,
    activeStoreId,
    addProductCart,
    incrementProduct,
    decrementProduct,
  } = useContext(CartContext)

  const toast = useToast()

  /* =====================================
     CARREGAR PRODUTOS
  ===================================== */

  const fetchProductsList = useCallback(async () => {
    try {
      setIsLoading(true)

      const response = await api.get<ProductDTO[]>('/products')

      setProducts(response.data ?? [])
    } catch (error) {
      const isAppError = error instanceof AppError

      const title = isAppError
        ? error.message
        : 'Não foi possível carregar os produtos'

      toast.show({
        title,
        placement: 'top',
        bgColor: 'red.500',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchProductsList()
  }, [fetchProductsList])

  /* =====================================
     QUANTIDADES DO CARRINHO
  ===================================== */

  /*
   * Cria o mapa apenas quando cartItems ou activeStoreId mudar.
   *
   * Evita executar cartItems.find() para cada produto renderizado.
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
       * O IAki utiliza um carrinho ativo por loja.
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
    (productId: string) => {
      navigation.navigate('productDetails', {
        productId,
      })
    },
    [navigation],
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
        console.error('[ProductList] Produto sem storeId:', currentProduct)

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
           * Enviar product permite que o CartContext atualize
           * cartItems imediatamente.
           *
           * Dessa forma, não será necessário executar
           * GET /cart/store/:storeId depois do POST.
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
         * O CartContext também atualiza o incremento
         * otimisticamente, antes da resposta da API.
         */
        await incrementProduct(productId)
      } catch (error: any) {
        console.error('[ProductList] Erro ao adicionar produto:', {
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
         * O CartContext diminui a quantidade local imediatamente.
         * Em caso de falha, restaura o estado anterior.
         */
        await decrementProduct(productId)
      } catch (error: any) {
        console.error('[ProductList] Erro ao diminuir produto:', {
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
     RENDERIZAÇÃO DO PRODUTO
  ===================================== */

  const renderProduct: ListRenderItem<ProductDTO> = useCallback(
    ({ item }) => {
      return (
        <ProductCard
          product={item}
          cartQuantity={getCartQuantity(item)}
          isUpdating={isProductUpdating(item.id)}
          onIncrement={() => handleIncrementProduct(item)}
          onDecrement={() => handleDecrementProduct(item)}
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

  /* =====================================
     LOADING
  ===================================== */

  if (isLoading && products.length === 0) {
    return (
      <VStack
        height={210}
        bg="gray.100"
        alignItems="center"
        justifyContent="center"
      >
        <Spinner color="green.700" accessibilityLabel="Carregando produtos" />

        <Text mt={2} fontSize="xs" color="gray.500">
          Carregando produtos...
        </Text>
      </VStack>
    )
  }

  /* =====================================
     TELA
  ===================================== */

  return (
    <VStack flex={1} height={210} bg="gray.100" alignItems="center">
      <VStack>
        <VStack justifyContent="space-between" ml={1} mb={1}>
          <HStack justifyContent="space-between" mr={2}>
            <Text ml={2} fontSize="sm" color="black.200" fontWeight="semibold">
              Maiores Descontos
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Ver todos os produtos"
            >
              <Box
                mr={6}
                borderBottomWidth={3.5}
                borderColor="yellow.300"
                borderRadius="md"
              >
                <Text
                  ml={2}
                  fontSize="sm"
                  color="green.700"
                  fontWeight="semibold"
                >
                  Ver todos
                </Text>
              </Box>
            </TouchableOpacity>
          </HStack>

          <Box ml={2} width={8} height={1} bg="yellow.300" />
        </VStack>

        <FlatList
          horizontal
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={5}
          updateCellsBatchingPeriod={50}
          _contentContainerStyle={{
            marginLeft: 2,
            paddingBottom: 32,
          }}
          ListEmptyComponent={
            <Box minWidth={300} py={8} alignItems="center">
              <Text fontSize="sm" color="gray.500">
                Nenhum produto encontrado.
              </Text>
            </Box>
          }
        />
      </VStack>
    </VStack>
  )
}
