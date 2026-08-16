import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  Animated,
  FlatList,
  ListRenderItem,
  useWindowDimensions,
} from 'react-native'

import { Box, Text, useToast, VStack } from 'native-base'

import { useNavigation, useRoute } from '@react-navigation/native'

import { BackHome } from '@components/BackHome'
import { Loading } from '@components/Loading'
import { ProductCard } from '@components/Product/ProductCard'
import { SubCategoryFilter } from '@components/Category/SubCategoryFilter'

import { CartContext } from '@contexts/CartContext'

import { ProductDTO } from '@dtos/ProductDTO'
import { SubCategoryDTO } from '@dtos/SubCategoryDTO'

import { AppNavigatorRoutesProps } from '@routes/app.routes'

import { api } from '@services/api'

import { AppError } from '@utils/AppError'

/* =====================================
   CONFIGURAÇÃO DO CARROSSEL
===================================== */

const CARD_WIDTH = 160
const CARD_SPACING = 4
const SNAP_INTERVAL = CARD_WIDTH + CARD_SPACING

/* =====================================
   ROTAS
===================================== */

type RouteParams = {
  categoryId: string
  storeId: string
  screenkey: string
  subcategoryId?: string
  storeName?: string
}

export function ProductsBySubCategory() {
  const route = useRoute()

  const {
    storeId,
    categoryId,
    screenkey,
    subcategoryId: initialSubcategoryId,
    storeName,
  } = route.params as RouteParams

  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const toast = useToast()

  const { width: screenWidth } = useWindowDimensions()

  const {
    cartItems,
    activeStoreId,
    addProductCart,
    incrementProduct,
    decrementProduct,
  } = useContext(CartContext)

  const [subCategories, setSubCategories] = useState<SubCategoryDTO[]>([])

  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(
    null,
  )

  const [products, setProducts] = useState<ProductDTO[]>([])

  const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(true)

  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  /*
   * Set oferece busca mais eficiente que array.includes().
   */
  const [updatingProductIds, setUpdatingProductIds] = useState<Set<string>>(
    () => new Set(),
  )

  const scrollX = useRef(new Animated.Value(0)).current

  /*
   * Recalcula corretamente o espaçamento se o aparelho
   * mudar de orientação ou tamanho de janela.
   */
  const sidePadding = useMemo(() => {
    return Math.max(0, (screenWidth - CARD_WIDTH) / 2)
  }, [screenWidth])

  /* =====================================
     CARREGAR SUBCATEGORIAS
  ===================================== */

  useEffect(() => {
    const controller = new AbortController()

    async function fetchSubCategories() {
      try {
        setIsLoadingSubcategories(true)
        setSubCategories([])
        setProducts([])
        setSelectedSubCategory(null)

        const response = await api.get<SubCategoryDTO[]>(
          '/subcategories/category',
          {
            params: {
              categoryId,
            },
            signal: controller.signal,
          },
        )

        if (controller.signal.aborted) {
          return
        }

        const loadedSubcategories = response.data ?? []

        setSubCategories(loadedSubcategories)

        const initialSubcategoryExists = initialSubcategoryId
          ? loadedSubcategories.some(
              (subcategory) => subcategory.id === initialSubcategoryId,
            )
          : false

        const nextSelectedSubcategory = initialSubcategoryExists
          ? initialSubcategoryId!
          : (loadedSubcategories[0]?.id ?? null)

        setSelectedSubCategory(nextSelectedSubcategory)

        /*
         * Evita loading infinito quando a categoria
         * não possui subcategorias.
         */
        if (!nextSelectedSubcategory) {
          setIsLoadingProducts(false)
        }
      } catch (error: any) {
        if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
          return
        }

        console.error(
          '[ProductsBySubCategory] Erro ao carregar subcategorias:',
          error,
        )

        toast.show({
          title: 'Erro ao carregar subcategorias.',
          placement: 'top',
          bgColor: 'red.500',
        })

        setSubCategories([])
        setSelectedSubCategory(null)
        setProducts([])
        setIsLoadingProducts(false)
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingSubcategories(false)
        }
      }
    }

    fetchSubCategories()

    return () => {
      controller.abort()
    }
  }, [categoryId, initialSubcategoryId, screenkey, storeId, toast])

  /* =====================================
     CARREGAR PRODUTOS
  ===================================== */

  useEffect(() => {
    const controller = new AbortController()

    async function fetchProductsBySubcategory() {
      if (!selectedSubCategory) {
        setProducts([])
        setIsLoadingProducts(false)

        return
      }

      try {
        setIsLoadingProducts(true)

        /*
         * Limpa os produtos da subcategoria anterior enquanto
         * carrega a nova seleção.
         */
        setProducts([])

        const response = await api.get<ProductDTO[]>('/products/subcategory', {
          params: {
            subcategoryId: selectedSubCategory,
            storeId,
          },
          signal: controller.signal,
        })

        if (controller.signal.aborted) {
          return
        }

        setProducts(response.data ?? [])

        /*
         * Retorna o carrossel para o primeiro produto.
         */
        scrollX.setValue(0)
      } catch (error: any) {
        if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
          return
        }

        const title =
          error instanceof AppError ? error.message : 'Erro ao buscar produtos.'

        console.error('[ProductsBySubCategory] Erro ao carregar produtos:', {
          storeId,
          subcategoryId: selectedSubCategory,
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

    fetchProductsBySubcategory()

    /*
     * Impede a resposta da subcategoria anterior de
     * sobrescrever a seleção atual.
     */
    return () => {
      controller.abort()
    }
  }, [scrollX, selectedSubCategory, storeId, toast])

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

  const handleSelectSubcategory = useCallback(
    (subcategoryId: string) => {
      if (subcategoryId === selectedSubCategory) {
        return
      }

      setSelectedSubCategory(subcategoryId)
    },
    [selectedSubCategory],
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
        console.error(
          '[ProductsBySubCategory] Produto sem storeId:',
          currentProduct,
        )

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
           * Enviar product permite que CartContext atualize
           * cartItems imediatamente, eliminando a busca
           * completa do carrinho após o POST.
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
        console.error('[ProductsBySubCategory] Erro ao adicionar:', {
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
        console.error('[ProductsBySubCategory] Erro ao diminuir:', {
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
     RENDERIZAR SUBCATEGORIAS
  ===================================== */

  const renderSubcategory: ListRenderItem<SubCategoryDTO> = useCallback(
    ({ item }) => {
      return (
        <SubCategoryFilter
          title={item.name}
          isActive={item.id === selectedSubCategory}
          onPress={() => handleSelectSubcategory(item.id)}
        />
      )
    },
    [handleSelectSubcategory, selectedSubCategory],
  )

  /* =====================================
     RENDERIZAR PRODUTOS
  ===================================== */

  const renderProduct: ListRenderItem<ProductDTO> = useCallback(
    ({ item, index }) => {
      const inputRange = [
        (index - 1) * SNAP_INTERVAL,
        index * SNAP_INTERVAL,
        (index + 1) * SNAP_INTERVAL,
      ]

      /*
       * Somente transform é animado pelo driver nativo.
       *
       * shadowOpacity foi mantido fixo porque não é uma
       * propriedade segura para useNativeDriver.
       */
      const scale = scrollX.interpolate({
        inputRange,
        outputRange: [0.9, 1, 0.9],
        extrapolate: 'clamp',
      })

      return (
        <Animated.View
          style={{
            width: CARD_WIDTH,
            marginRight: CARD_SPACING,
            transform: [
              {
                scale,
              },
            ],
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 6,
            },
            shadowRadius: 10,
            shadowOpacity: 0.25,
            elevation: 6,
          }}
        >
          <ProductCard
            product={item}
            cartQuantity={getCartQuantity(item)}
            isUpdating={isProductUpdating(item.id)}
            onIncrement={() => handleIncrementProduct(item)}
            onDecrement={() => handleDecrementProduct(item)}
            onPress={() => handleOpenProductDetails(item.id)}
          />
        </Animated.View>
      )
    },
    [
      getCartQuantity,
      handleDecrementProduct,
      handleIncrementProduct,
      handleOpenProductDetails,
      isProductUpdating,
      scrollX,
    ],
  )

  /* =====================================
     LAYOUT FIXO DO CARROSSEL
  ===================================== */

  const getProductItemLayout = useCallback(
    (_data: ArrayLike<ProductDTO> | null | undefined, index: number) => {
      return {
        length: SNAP_INTERVAL,
        offset: SNAP_INTERVAL * index,
        index,
      }
    },
    [],
  )

  /* =====================================
     TELA
  ===================================== */

  return (
    <VStack flex={1} bg="white">
      <BackHome title="Produtos" />

      {storeName ? (
        <Box
          bg="white"
          px={4}
          py={2}
          borderBottomWidth={1}
          borderColor="coolGray.100"
        >
          <Text fontSize="sm" fontWeight="bold" color="coolGray.600">
            Loja
          </Text>

          <Text fontSize="md" fontWeight="700">
            {storeName}
          </Text>
        </Box>
      ) : null}

      <Box pt={3} minH={14}>
        {isLoadingSubcategories ? (
          <Text px={4} color="gray.500" fontSize="sm">
            Carregando subcategorias...
          </Text>
        ) : subCategories.length > 0 ? (
          <FlatList
            horizontal
            data={subCategories}
            keyExtractor={(item) => item.id}
            renderItem={renderSubcategory}
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={7}
            maxToRenderPerBatch={7}
            windowSize={5}
            ItemSeparatorComponent={() => <Box width={3} />}
            contentContainerStyle={{
              paddingHorizontal: 16,
            }}
          />
        ) : (
          <Text px={4} color="gray.500" fontSize="sm">
            Nenhuma subcategoria encontrada.
          </Text>
        )}
      </Box>

      {isLoadingProducts ? (
        <Loading />
      ) : (
        <Animated.FlatList
          horizontal
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          getItemLayout={getProductItemLayout}
          snapToInterval={SNAP_INTERVAL}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={50}
          windowSize={5}
          contentContainerStyle={{
            paddingHorizontal: sidePadding,
            paddingTop: 16,
            paddingBottom: 32,
          }}
          onScroll={Animated.event(
            [
              {
                nativeEvent: {
                  contentOffset: {
                    x: scrollX,
                  },
                },
              },
            ],
            {
              useNativeDriver: true,
            },
          )}
          scrollEventThrottle={16}
          ListEmptyComponent={
            <Box width={screenWidth} alignItems="center" px={8}>
              <Text textAlign="center" mt={10} color="gray.500">
                {selectedSubCategory
                  ? 'Nenhum produto encontrado para essa subcategoria.'
                  : 'Selecione uma subcategoria para visualizar os produtos.'}
              </Text>
            </Box>
          }
        />
      )}
    </VStack>
  )
}
