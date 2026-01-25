import { useEffect, useRef, useState } from 'react'
import {
  Box,
  Text,
  FlatList,
  VStack,
  useToast,
  Center,
  HStack,
} from 'native-base'
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

/* ==============================
   📐 CARROSSEL
============================== */
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
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  function animateLayout() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
  }

  /* =====================================================
     🔥 FETCH INICIAL — RESET TOTAL AO TROCAR DE LOJA
  ===================================================== */
  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoading(true)

        const [storeRes, catRes, bannerRes] = await Promise.all([
          api.get(`/stores/${storeId}`),
          api.get(`/stores/${storeId}/categories`),
          api.get(`/banners/store/${storeId}`),
        ])

        setStore(storeRes.data)
        setCategories(catRes.data)
        setBanners(bannerRes.data)

        // reset completo
        setCategorySelected(null)
        setSubCategories([])
        setSubCategorySelected(null)
        setProducts([])
      } catch {
        toast.show({
          title: 'Erro ao carregar loja',
          placement: 'top',
          bgColor: 'red.500',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [storeId])

  /* ==============================
     🧩 SUBCATEGORIAS
  ============================== */
  useEffect(() => {
    let active = true

    async function loadSubCategories() {
      if (!categorySelected) return

      try {
        setIsLoadingProducts(true)

        const { data } = await api.get<SubCategoryDTO[]>(
          '/subcategories/category',
          { params: { categoryId: categorySelected } },
        )

        if (!active) return

        setSubCategories(data)

        // 🔥 auto-seleciona primeira subcategoria
        setSubCategorySelected(data.length > 0 ? data[0].id : null)
        setProducts([])
      } catch {
        if (!active) return
        toast.show({
          title: 'Erro ao carregar subcategorias',
          placement: 'top',
          bgColor: 'red.500',
        })
      } finally {
        if (active) setIsLoadingProducts(false)
      }
    }

    loadSubCategories()

    return () => {
      active = false
    }
  }, [categorySelected])

  /* ==============================
     🛒 PRODUTOS
  ============================== */
  useEffect(() => {
    let active = true

    async function loadProducts() {
      if (!subCategorySelected) return

      try {
        setIsLoadingProducts(true)

        const { data } = await api.get<ProductDTO[]>('/products/subcategory', {
          params: {
            subcategoryId: subCategorySelected,
            storeId,
          },
        })

        if (!active) return
        setProducts(data)
      } catch (error) {
        if (!active) return

        toast.show({
          title:
            error instanceof AppError
              ? error.message
              : 'Erro ao carregar produtos',
          placement: 'bottom-left',
          bgColor: 'red.500',
        })
      } finally {
        if (active) setIsLoadingProducts(false)
      }
    }

    loadProducts()

    return () => {
      active = false
    }
  }, [subCategorySelected, storeId])

  /* ==============================
     🖥️ LOADING
  ============================== */
  if (isLoading || !store) {
    return <Loading />
  }

  /* ==============================
     🧾 RENDER
  ============================== */
  return (
    <FlatList
      data={categories}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <StorePromotionHeader store={store} banners={banners} />
      }
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <Box bg="gray.100" borderRadius="2xl">
          <StoreCategoryList
            data={[item]}
            onPress={() => {
              animateLayout()
              setCategorySelected((prev) => (prev === item.id ? null : item.id))
            }}
          />

          {categorySelected === item.id && (
            <VStack
              mx={3}
              mt={-2}
              bg="white"
              borderRadius="lg"
              shadow={1}
              pb={3}
            >
              {/* 🔹 SUBCATEGORIAS */}
              {subCategories.length > 0 ? (
                <FlatList
                  data={subCategories}
                  keyExtractor={(sub) => sub.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item: sub }) => (
                    <SubcategoryCard
                      name={sub.name}
                      subcategory={sub.id}
                      isActive={subCategorySelected === sub.id}
                      onPress={() => {
                        animateLayout()
                        setSubCategorySelected(sub.id)
                      }}
                    />
                  )}
                  _contentContainerStyle={{ px: 2 }}
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

              {/* 🔥 PRODUTOS — CARROSSEL */}
              {isLoadingProducts ? (
                <Loading />
              ) : (
                <Animated.FlatList
                  data={products}
                  keyExtractor={(prod) => prod.id}
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
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: true },
                  )}
                  renderItem={({ item: prod, index }) => {
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
                          transform: [{ scale }],
                        }}
                      >
                        <ProductCard
                          product={prod}
                          onPress={() =>
                            navigation.navigate('productDetails', {
                              productId: prod.id,
                            })
                          }
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
