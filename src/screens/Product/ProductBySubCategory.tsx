import { useCallback, useContext, useMemo, useState } from 'react'

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

import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native'

import { HomeProduct } from '@components/Product/HomeProduct'
import { Loading } from '@components/Loading'
import { ProductCard } from '@components/Product/ProductCard'
import { SubcategoryCard } from '@components/Product/SubcategoryCard'

import { CartContext } from '@contexts/CartContext'

import { ProductDTO } from '@dtos/ProductDTO'
import { SubCategoryDTO } from '@dtos/SubCategoryDTO'

import { AppNavigatorRoutesProps } from '@routes/app.routes'

import { api } from '@services/api'

import { AppError } from '@utils/AppError'

type RouteParamsProps = {
  categoryId: string
}

export function ProductBySubCategory() {
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

  const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(true)

  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  const [subCategories, setSubCategories] = useState<SubCategoryDTO[]>([])

  const [products, setProducts] = useState<ProductDTO[]>([])

  const [subCategorySelected, setSubCategorySelected] = useState('')

  /*
   * Set oferece busca mais eficiente do que array.includes().
   */
  const [updatingProductIds, setUpdatingProductIds] = useState<Set<string>>(
    () => new Set(),
  )

  /* =====================================
     SUBCATEGORIAS
  ===================================== */

  const fetchSubCategoriesByCategory = useCallback(async () => {
    if (!categoryId) {
      setSubCategories([])
      setSubCategorySelected('')
      setIsLoadingSubcategories(false)

      return
    }

    try {
      setIsLoadingSubcategories(true)

      const response = await api.get<SubCategoryDTO[]>(
        '/subcategories/category',
        {
          params: {
            categoryId,
          },
        },
      )

      const loadedSubcategories = response.data ?? []

      setSubCategories(loadedSubcategories)

      setSubCategorySelected((currentSelected) => {
        const selectedStillExists = loadedSubcategories.some(
          (subcategory) => subcategory.id === currentSelected,
        )

        if (selectedStillExists) {
          return currentSelected
        }

        return loadedSubcategories[0]?.id ?? ''
      })

      if (loadedSubcategories.length === 0) {
        setProducts([])
      }
    } catch (error) {
      const title =
        error instanceof AppError
          ? error.message
          : 'Erro ao carregar subcategorias'

      toast.show({
        title,
        placement: 'top',
        bgColor: 'red.500',
      })

      setSubCategories([])
      setSubCategorySelected('')
      setProducts([])
    } finally {
      setIsLoadingSubcategories(false)
    }
  }, [categoryId, toast])

  /*
   * Atualiza as subcategorias ao entrar na tela ou
   * quando categoryId mudar.
   */
  useFocusEffect(
    useCallback(() => {
      fetchSubCategoriesByCategory()
    }, [fetchSubCategoriesByCategory]),
  )

  /* =====================================
     PRODUTOS
  ===================================== */

  const fetchProductsBySubcategory = useCallback(async () => {
    /*
     * Impede a chamada:
     * /products/subcategory?subcategoryId=
     */
    if (!subCategorySelected) {
      setProducts([])
      setIsLoadingProducts(false)

      return
    }

    try {
      setIsLoadingProducts(true)

      const response = await api.get<ProductDTO[]>('/products/subcategory', {
        params: {
          subcategoryId: subCategorySelected,
        },
      })

      setProducts(response.data ?? [])
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
    } finally {
      setIsLoadingProducts(false)
    }
  }, [subCategorySelected, toast])

  /*
   * Atualiza os produtos ao entrar na tela ou quando
   * o usuário selecionar outra subcategoria.
   */
  useFocusEffect(
    useCallback(() => {
      fetchProductsBySubcategory()
    }, [fetchProductsBySubcategory]),
  )

  /* =====================================
     MAPA DE QUANTIDADES DO CARRINHO
  ===================================== */

  /*
   * Evita executar cartItems.find() para cada produto
   * renderizado na lista.
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
     CONTROLE DE PRODUTOS EM ATUALIZAÇÃO
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
        console.error(
          '[ProductBySubCategory] Produto sem storeId:',
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
           * O produto completo permite que CartContext atualize
           * cartItems imediatamente, sem executar depois:
           *
           * GET /cart/store/:storeId
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
        console.error('[ProductBySubCategory] Erro ao adicionar:', {
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
         * CartContext atualiza a quantidade local antes
         * de aguardar o backend.
         */
        await decrementProduct(productId)
      } catch (error: any) {
        console.error('[ProductBySubCategory] Erro ao diminuir:', {
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
     SUBCATEGORIA SELECIONADA
  ===================================== */

  const selectedSubcategoryName = useMemo(() => {
    return (
      subCategories.find(
        (subcategory) => subcategory.id === subCategorySelected,
      )?.name ?? 'Selecionar'
    )
  }, [subCategories, subCategorySelected])

  const handleSelectSubcategory = useCallback(
    (subcategoryId: string) => {
      if (subcategoryId === subCategorySelected) {
        return
      }

      /*
       * Evita mostrar produtos da subcategoria anterior enquanto
       * a nova requisição está em andamento.
       */
      setProducts([])
      setSubCategorySelected(subcategoryId)
    },
    [subCategorySelected],
  )

  /* =====================================
     RENDERIZAÇÃO DAS LISTAS
  ===================================== */

  const renderSubcategory: ListRenderItem<SubCategoryDTO> = useCallback(
    ({ item }) => {
      return (
        <SubcategoryCard
          name={item.name}
          subcategory={item.id}
          isActive={subCategorySelected === item.id}
          onPress={() => handleSelectSubcategory(item.id)}
        />
      )
    },
    [handleSelectSubcategory, subCategorySelected],
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
        {isLoadingSubcategories ? (
          <Center mt={6} mb={2} minH={12}>
            <Loading />
          </Center>
        ) : subCategories.length > 0 ? (
          <FlatList
            horizontal
            data={subCategories}
            keyExtractor={(item) => item.id}
            renderItem={renderSubcategory}
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
          <Center mt={6} mb={2} minH={12}>
            <Text color="red.600" fontSize={14}>
              Nenhuma subcategoria encontrada!
            </Text>
          </Center>
        )}

        {isLoadingProducts ? (
          <Loading />
        ) : (
          <VStack flex={1} px={2} bg="gray.200">
            <VStack px={6} bg="gray.200">
              <HStack justifyContent="space-between" mb={5}>
                <Heading color="gray.700" fontSize="md">
                  {selectedSubcategoryName}
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
