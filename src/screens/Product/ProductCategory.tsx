import { useCallback, useContext, useEffect, useMemo, useState } from 'react'

import {
  Box,
  Center,
  FlatList,
  Heading,
  HStack,
  Text,
  useToast,
  VStack,
} from 'native-base'

import { ListRenderItem } from 'react-native'

import { useNavigation, useRoute } from '@react-navigation/native'

import { HomeProduct } from '@components/Product/HomeProduct'
import { Loading } from '@components/Loading'
import { ProductCard } from '@components/Product/ProductCard'
import { SubcategoryCard } from '@components/Product/SubcategoryCard'

import { CartContext } from '@contexts/CartContext'

import { ProductDTO } from '@dtos/ProductDTO'

import { AppNavigatorRoutesProps } from '@routes/app.routes'

import { api } from '@services/api'

import { AppError } from '@utils/AppError'

type RouteParamsProps = {
  categoryId: string
}

export function ProductCategory() {
  const route = useRoute()

  const { categoryId } = route.params as RouteParamsProps

  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const toast = useToast()

  const {
    cartItems,
    activeStoreId,
    addProductCart,
    incrementProduct,
    decrementProduct,
  } = useContext(CartContext)

  const [isLoading, setIsLoading] = useState(true)

  const [products, setProducts] = useState<ProductDTO[]>([])

  /*
   * Mantido para preservar o seletor horizontal existente.
   */
  const [productSelected, setProductSelected] = useState('')

  /*
   * Set possui busca mais eficiente do que array.includes().
   */
  const [updatingProductIds, setUpdatingProductIds] = useState<Set<string>>(
    () => new Set(),
  )

  /* =====================================
     CARREGAR PRODUTOS
  ===================================== */

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true)

      /*
       * Mantém a rota já utilizada pelo projeto.
       *
       * Se o backend possuir uma rota por categoria,
       * ela poderá substituir esta chamada posteriormente.
       */
      const response = await api.get<ProductDTO[]>('/products')

      const loadedProducts = response.data ?? []

      /*
       * Correção:
       * anteriormente os produtos eram salvos em categories,
       * fazendo products permanecer vazio.
       */
      setProducts(loadedProducts)

      setProductSelected((currentSelected) => {
        const selectedStillExists = loadedProducts.some(
          (product) => product.id === currentSelected,
        )

        if (selectedStillExists) {
          return currentSelected
        }

        return loadedProducts[0]?.id ?? ''
      })
    } catch (error) {
      const title =
        error instanceof AppError
          ? error.message
          : 'Não foi possível carregar os produtos'

      toast.show({
        title,
        placement: 'top',
        bgColor: 'red.500',
      })

      setProducts([])
      setProductSelected('')
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts, categoryId])

  /* =====================================
     MAPA DE QUANTIDADES DO CARRINHO
  ===================================== */

  /*
   * Evita executar cartItems.find() para cada produto
   * durante cada renderização da lista.
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
        console.error('[ProductCategory] Produto sem storeId:', currentProduct)

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
           * Enviar o produto completo permite a atualização
           * imediata de cartItems no CartContext.
           *
           * Assim, não é executado o GET do carrinho depois
           * do POST da primeira inclusão.
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
        console.error('[ProductCategory] Erro ao adicionar:', {
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
        console.error('[ProductCategory] Erro ao diminuir:', {
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
     PRODUTO SELECIONADO
  ===================================== */

  const selectedProductName = useMemo(() => {
    return (
      products.find((product) => product.id === productSelected)?.name ??
      'Produtos'
    )
  }, [productSelected, products])

  const handleSelectProduct = useCallback((productId: string) => {
    setProductSelected(productId)
  }, [])

  /* =====================================
     RENDERIZAÇÃO DAS LISTAS
  ===================================== */

  const renderProductSelector: ListRenderItem<ProductDTO> = useCallback(
    ({ item }) => {
      return (
        <SubcategoryCard
          name={item.name}
          subcategory={item.id}
          isActive={productSelected === item.id}
          onPress={() => handleSelectProduct(item.id)}
        />
      )
    },
    [handleSelectProduct, productSelected],
  )

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
     TELA
  ===================================== */

  return (
    <VStack flex={1}>
      <HomeProduct />

      <Box flex={1} ml={-6} mt={-6}>
        {isLoading ? (
          <Loading />
        ) : products.length > 0 ? (
          <FlatList
            horizontal
            data={products}
            keyExtractor={(item) => item.id}
            renderItem={renderProductSelector}
            showsHorizontalScrollIndicator={false}
            _contentContainerStyle={{
              px: 8,
            }}
            mt={6}
            mb={2}
            maxH={12}
            minH={10}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            windowSize={5}
          />
        ) : (
          <Center mt={6} mb={2}>
            <Text color="red.600" fontSize={14}>
              Nenhum produto encontrado!
            </Text>
          </Center>
        )}

        {!isLoading && (
          <VStack flex={1} px={2} bg="gray.200">
            <VStack px={6} bg="gray.200">
              <HStack justifyContent="space-between" mb={5}>
                <Heading color="gray.700" fontSize="md">
                  {selectedProductName}
                </Heading>

                <Text color="gray.700" fontSize="md">
                  {products.length}
                </Text>
              </HStack>
            </VStack>

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
              _contentContainerStyle={{
                marginLeft: 8,
                paddingBottom: 32,
              }}
              ListEmptyComponent={
                <Center py={10}>
                  <Text color="gray.500" fontSize="sm">
                    Nenhum produto encontrado.
                  </Text>
                </Center>
              }
            />
          </VStack>
        )}
      </Box>
    </VStack>
  )
}
