import { useEffect, useState } from 'react'
import { Box, Text, FlatList, VStack, useToast, Center } from 'native-base'
import { useNavigation, useRoute } from '@react-navigation/native'
import { LayoutAnimation, UIManager, Platform } from 'react-native'

import { api } from '@services/api'
import { AppError } from '@utils/AppError'

import { StorePromotionHeader } from '@components/Store/StorePromotionHeader'
import { StoreCategoryList } from '@components/Store/StoreCategoryList'
import { Group } from '@components/Product/Group'
import { ProductCard } from '@components/Product/ProductCard'
import { Loading } from '@components/Loading'

import { BannerDTO } from '@dtos/BannerDTO'
import { StoreDTO } from '@dtos/StoreDTO'
import { CategoryDTO } from '@dtos/CategoryDTO'
import { SubCategoryDTO } from '@dtos/SubCategoryDTO'
import { ProductDTO } from '@dtos/ProductDTO'
import { AppNavigatorRoutesProps } from '@routes/app.routes'

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

  const [store, setStore] = useState<StoreDTO | null>(null)
  const [banners, setBanners] = useState<BannerDTO[]>([])

  const [categories, setCategories] = useState<CategoryDTO[]>([])
  const [categorySelected, setCategorySelected] = useState<string | null>(null)

  const [subCategories, setSubCategories] = useState<SubCategoryDTO[]>([])
  const [subCategorySelected, setSubCategorySelected] = useState<string>('')

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
    let isActive = true

    async function loadStoreData() {
      try {
        setIsLoading(true)

        // 🔥 RESET COMPLETO (ESSENCIAL PARA TROCA DE LOJA)
        setStore(null)
        setBanners([])
        setCategories([])
        setCategorySelected(null)
        setSubCategories([])
        setSubCategorySelected('')
        setProducts([])

        const [storeRes, catRes, bannerRes] = await Promise.all([
          api.get(`/stores/${storeId}`),
          api.get(`/stores/${storeId}/categories`),
          api.get(`/banners/store/${storeId}`),
        ])

        if (!isActive) return

        setStore(storeRes.data)
        setCategories(catRes.data)
        setBanners(bannerRes.data)

        if (catRes.data?.length > 0) {
          setCategorySelected(catRes.data[0].id)
        }
      } catch (error) {
        if (!isActive) return

        toast.show({
          title:
            error instanceof AppError
              ? error.message
              : 'Erro ao carregar dados da loja',
          placement: 'top',
          bgColor: 'red.500',
        })
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    loadStoreData()

    return () => {
      isActive = false
    }
  }, [storeId])

  /* ==============================
     🧩 SUBCATEGORIAS
  ============================== */
  useEffect(() => {
    let isActive = true

    async function loadSubCategories() {
      if (!categorySelected) return

      try {
        setIsLoadingProducts(true)

        const response = await api.get(
          `/subcategories/category?categoryId=${categorySelected}`,
        )

        if (!isActive) return

        setSubCategories(response.data)

        if (response.data?.length > 0) {
          setSubCategorySelected(response.data[0].id)
        } else {
          setSubCategorySelected('')
          setProducts([])
        }
      } catch (error) {
        if (!isActive) return

        toast.show({
          title:
            error instanceof AppError
              ? error.message
              : 'Erro ao carregar subcategorias',
          placement: 'top',
          bgColor: 'red.500',
        })
      } finally {
        if (isActive) setIsLoadingProducts(false)
      }
    }

    loadSubCategories()

    return () => {
      isActive = false
    }
  }, [categorySelected])

  /* ==============================
     🛒 PRODUTOS
  ============================== */
  useEffect(() => {
    let isActive = true

    async function loadProducts() {
      if (!subCategorySelected) return

      try {
        setIsLoadingProducts(true)

        const response = await api.get(
          `/products/subcategory?subcategoryId=${subCategorySelected}&storeId=${storeId}`,
        )

        if (!isActive) return

        setProducts(response.data)
      } catch (error) {
        if (!isActive) return

        toast.show({
          title:
            error instanceof AppError
              ? error.message
              : 'Erro ao carregar produtos',
          placement: 'bottom-left',
          bgColor: 'red.500',
        })
      } finally {
        if (isActive) setIsLoadingProducts(false)
      }
    }

    loadProducts()

    return () => {
      isActive = false
    }
  }, [subCategorySelected, storeId])

  /* ==============================
     🖥️ LOADING
  ============================== */
  if (isLoading || !store) {
    return <Loading />
  }

  /* ==============================
     🧾 RENDER (EXPANSÃO INLINE MANTIDA)
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
        <Box bg="gray.100" borderRadius="2xl" borderBottomWidth={0.21}>
          <StoreCategoryList
            data={[item]}
            onPress={() => {
              animateLayout()
              setCategorySelected((prev) => (prev === item.id ? null : item.id))
            }}
          />

          {categorySelected === item.id && (
            <VStack
              ml={3}
              mr={3}
              mt={-2}
              bg="white"
              borderRadius="lg"
              shadow={1}
            >
              {subCategories.length > 0 ? (
                <FlatList
                  data={subCategories}
                  keyExtractor={(sub) => sub.id}
                  renderItem={({ item: sub }) => (
                    <Group
                      name={sub.name}
                      subcategory={sub.id}
                      isActive={subCategorySelected === sub.id}
                      onPress={() => {
                        animateLayout()
                        setSubCategorySelected(sub.id)
                      }}
                    />
                  )}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  _contentContainerStyle={{ px: 2 }}
                  mt={1}
                  mb={1}
                  maxH={12}
                />
              ) : (
                <Center mt={4}>
                  <Text color="red.600">Nenhuma subcategoria encontrada</Text>
                </Center>
              )}

              <VStack minH={120}>
                {isLoadingProducts ? (
                  <Loading />
                ) : (
                  <FlatList
                    data={products}
                    keyExtractor={(prod) => prod.id}
                    numColumns={2}
                    renderItem={({ item: prod }) => (
                      <Box mt={-2} ml={2}>
                        <ProductCard
                          product={prod}
                          onPress={() =>
                            navigation.navigate('productDetails', {
                              productId: prod.id,
                            })
                          }
                        />
                      </Box>
                    )}
                    _contentContainerStyle={{
                      paddingX: 8,
                      paddingBottom: 24,
                    }}
                    showsVerticalScrollIndicator={false}
                  />
                )}
              </VStack>
            </VStack>
          )}
        </Box>
      )}
    />
  )
}
