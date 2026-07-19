import { useContext, useEffect, useRef, useState } from 'react'

import { Box, Text, FlatList, VStack, useToast, Center } from 'native-base'

import { useNavigation, useRoute } from '@react-navigation/native'

import {
  LayoutAnimation,
  UIManager,
  Platform,
  Animated,
  Dimensions,
} from 'react-native'

import { api } from '@services/api'
import { AppError } from '@utils/AppError'

import { StorePromotionHeader } from '@components/Store/StorePromotionHeader'

import { StoreCategoryList } from '@components/Store/StoreCategoryList'

import { SubcategoryCard } from '@components/Product/SubcategoryCard'

import { ProductCard } from '@components/Product/ProductCard'

import { Loading } from '@components/Loading'

import { BannerDTO } from '@dtos/BannerDTO'
import { StoreDTO } from '@dtos/StoreDTO'
import { CategoryDTO } from '@dtos/CategoryDTO'
import { SubCategoryDTO } from '@dtos/SubCategoryDTO'
import { ProductDTO } from '@dtos/ProductDTO'

import { AppNavigatorRoutesProps } from '@routes/app.routes'

import { CartContext } from '@contexts/CartContext'

const { width } = Dimensions.get('window')

const CARD_WIDTH = 150
const CARD_SPACING = 6
const SNAP_INTERVAL = CARD_WIDTH + CARD_SPACING

const SIDE_PADDING = (width - CARD_WIDTH) / 2

type RouteParams = {
  storeId: string
}

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

export function StoreProducts() {
  const toast = useToast()

  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const route = useRoute()

  const { storeId } = route.params as RouteParams

  const {
    cartItems,
    activeStoreId,
    addProductCart,
    incrementProduct,
    decrementProduct,
  } = useContext(CartContext)

  const scrollX = useRef(new Animated.Value(0)).current

  const [store, setStore] = useState<StoreDTO | null>(null)

  const [banners, setBanners] = useState<BannerDTO[]>([])

  const [categories, setCategories] = useState<CategoryDTO[]>([])

  const [categorySelected, setCategorySelected] = useState<string | null>(null)

  const [subCategories, setSubCategories] = useState<SubCategoryDTO[]>([])

  const [subCategorySelected, setSubCategorySelected] = useState<string | null>(
    null,
  )

  const [products, setProducts] = useState<ProductDTO[]>([])

  const [updatingProductIds, setUpdatingProductIds] = useState<string[]>([])

  const [isLoading, setIsLoading] = useState(true)

  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  function animateLayout() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
  }

  function handleOpenProductDetails(productId: string) {
    navigation.navigate('productDetails', {
      productId,
    })
  }

  function getCartQuantity(productId: string) {
    /*
     * Essa tela contém somente produtos
     * da loja recebida pela rota.
     */
    if (activeStoreId !== storeId) {
      return 0
    }

    return (
      cartItems.find((cartItem) => cartItem.productId === productId)
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

    const stockQuantity = Number(currentProduct.quantity ?? 0)

    const cartQuantity = getCartQuantity(currentProduct.id)

    if (stockQuantity <= 0) {
      toast.show({
        title: 'Produto esgotado',
        description: 'Este produto não possui estoque disponível.',
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
          storeId,
          quantity: 1,
        })
      } else {
        await incrementProduct(currentProduct.id)
      }
    } catch (error: any) {
      console.error(
        '[StoreProducts] Erro ao adicionar:',
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

    const cartQuantity = getCartQuantity(currentProduct.id)

    if (cartQuantity <= 0) {
      return
    }

    try {
      setProductUpdating(currentProduct.id, true)

      await decrementProduct(currentProduct.id)
    } catch (error: any) {
      console.error(
        '[StoreProducts] Erro ao diminuir:',
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

  useEffect(() => {
    let active = true

    async function loadInitialData() {
      try {
        setIsLoading(true)

        const [storeResponse, categoriesResponse, bannersResponse] =
          await Promise.all([
            api.get(`/stores/${storeId}`),

            api.get(`/stores/${storeId}/categories`),

            api.get(`/stores/${storeId}/banners`),
          ])

        if (!active) {
          return
        }

        setStore(storeResponse.data)

        setCategories(categoriesResponse.data ?? [])

        setBanners(bannersResponse.data ?? [])

        setCategorySelected(null)
        setSubCategories([])
        setSubCategorySelected(null)
        setProducts([])
      } catch (error) {
        if (!active) {
          return
        }

        console.error('[StoreProducts] Erro inicial:', error)

        toast.show({
          title: 'Erro ao carregar loja',
          placement: 'top',
          bgColor: 'red.500',
        })
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadInitialData()

    return () => {
      active = false
    }
  }, [storeId])

  useEffect(() => {
    let active = true

    async function loadSubCategories() {
      if (!categorySelected) {
        setSubCategories([])
        setSubCategorySelected(null)
        setProducts([])

        return
      }

      try {
        setIsLoadingProducts(true)

        const { data } = await api.get<SubCategoryDTO[]>(
          '/subcategories/category',
          {
            params: {
              categoryId: categorySelected,
            },
          },
        )

        if (!active) {
          return
        }

        const fetchedSubcategories = data ?? []

        setSubCategories(fetchedSubcategories)

        setSubCategorySelected(
          fetchedSubcategories.length > 0 ? fetchedSubcategories[0].id : null,
        )

        setProducts([])
      } catch (error) {
        if (!active) {
          return
        }

        console.error('[StoreProducts] Erro nas subcategorias:', error)

        toast.show({
          title: 'Erro ao carregar subcategorias',
          placement: 'top',
          bgColor: 'red.500',
        })

        setSubCategories([])
        setSubCategorySelected(null)
        setProducts([])
      } finally {
        if (active) {
          setIsLoadingProducts(false)
        }
      }
    }

    loadSubCategories()

    return () => {
      active = false
    }
  }, [categorySelected])

  useEffect(() => {
    let active = true

    async function loadProducts() {
      if (!subCategorySelected) {
        setProducts([])
        return
      }

      try {
        setIsLoadingProducts(true)

        const { data } = await api.get<ProductDTO[]>('/products/subcategory', {
          params: {
            subcategoryId: subCategorySelected,
            storeId,
          },
        })

        if (!active) {
          return
        }

        setProducts(data ?? [])
      } catch (error) {
        if (!active) {
          return
        }

        console.error('[StoreProducts] Erro nos produtos:', error)

        toast.show({
          title:
            error instanceof AppError
              ? error.message
              : 'Erro ao carregar produtos',
          placement: 'top',
          bgColor: 'red.500',
        })

        setProducts([])
      } finally {
        if (active) {
          setIsLoadingProducts(false)
        }
      }
    }

    loadProducts()

    return () => {
      active = false
    }
  }, [subCategorySelected, storeId])

  if (isLoading || !store) {
    return <Loading />
  }

  return (
    <FlatList
      data={categories}
      keyExtractor={(category) => category.id}
      ListHeaderComponent={
        <StorePromotionHeader store={store} banners={banners} />
      }
      contentContainerStyle={{
        paddingBottom: 24,
      }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item: category }) => (
        <Box bg="gray.100" borderRadius="2xl">
          <StoreCategoryList
            data={[category]}
            onPress={() => {
              animateLayout()

              setCategorySelected((currentCategoryId) =>
                currentCategoryId === category.id ? null : category.id,
              )
            }}
          />

          {categorySelected === category.id && (
            <VStack
              mx={3}
              mt={-2}
              bg="white"
              borderRadius="lg"
              shadow={1}
              pb={3}
            >
              {subCategories.length > 0 ? (
                <FlatList
                  data={subCategories}
                  keyExtractor={(subcategory) => subcategory.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item: subcategory }) => (
                    <SubcategoryCard
                      name={subcategory.name}
                      subcategory={subcategory.id}
                      isActive={subCategorySelected === subcategory.id}
                      onPress={() => {
                        animateLayout()

                        setSubCategorySelected(subcategory.id)
                      }}
                    />
                  )}
                  _contentContainerStyle={{
                    px: 2,
                  }}
                  mt={2}
                  mb={2}
                  maxH={12}
                />
              ) : (
                <Center mt={4}>
                  <Text color="coolGray.500">
                    Nenhuma subcategoria encontrada
                  </Text>
                </Center>
              )}

              {isLoadingProducts ? (
                <Loading />
              ) : (
                <Animated.FlatList
                  data={products}
                  extraData={{
                    cartItems,
                    activeStoreId,
                    updatingProductIds,
                  }}
                  keyExtractor={(product) => product.id}
                  horizontal
                  snapToInterval={SNAP_INTERVAL}
                  decelerationRate="fast"
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingHorizontal: SIDE_PADDING,
                    paddingTop: 8,
                    paddingBottom: 16,
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
                  renderItem={({ item: product, index }) => {
                    const inputRange = [
                      (index - 1) * SNAP_INTERVAL,

                      index * SNAP_INTERVAL,

                      (index + 1) * SNAP_INTERVAL,
                    ]

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
                          alignItems: 'center',
                          transform: [{ scale }],
                        }}
                      >
                        <ProductCard
                          product={product}
                          cartQuantity={getCartQuantity(product.id)}
                          isUpdating={isProductUpdating(product.id)}
                          onIncrement={() => handleIncrementProduct(product)}
                          onDecrement={() => handleDecrementProduct(product)}
                          onPress={() => handleOpenProductDetails(product.id)}
                        />
                      </Animated.View>
                    )
                  }}
                  ListEmptyComponent={
                    <Text textAlign="center" mt={6}>
                      Nenhum produto encontrado.
                    </Text>
                  }
                />
              )}
            </VStack>
          )}
        </Box>
      )}
    />
  )
}
