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

  async function fetchStore() {
    try {
      const response = await api.get(`/stores/${storeId}`)
      setStore(response.data)
    } catch {
      toast.show({
        title: 'Erro ao carregar loja',
        placement: 'top',
        bgColor: 'red.500',
      })
    }
  }

  async function fetchCategories() {
    try {
      const response = await api.get(`/stores/${storeId}/categories`)
      setCategories(response.data)
    } catch {
      toast.show({
        title: 'Erro ao carregar categorias',
        placement: 'top',
        bgColor: 'red.500',
      })
    }
  }

  async function fetchBannersByStore() {
    try {
      const response = await api.get(`/banners/store/${storeId}`)
      setBanners(response.data)
    } catch (error) {
      toast.show({
        title:
          error instanceof AppError
            ? error.message
            : 'Erro ao carregar banners da loja',
        placement: 'top',
        bgColor: 'red.500',
      })
    }
  }

  async function fetchSubCategoriesByCategory(categoryId: string) {
    try {
      setIsLoadingProducts(true)

      const response = await api.get(
        `/subcategories/category?categoryId=${categoryId}`,
      )

      setSubCategories(response.data)
      setSubCategorySelected(response.data?.[0]?.id ?? '')
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

  async function fetchProductsBySubcategory(subcategoryId: string) {
    if (!subcategoryId) return

    try {
      setIsLoadingProducts(true)

      const response = await api.get(
        `/products/subcategory?subcategoryId=${subcategoryId}`,
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

  useEffect(() => {
    Promise.all([
      fetchStore(),
      fetchCategories(),
      fetchBannersByStore(),
    ]).finally(() => setIsLoading(false))
  }, [])

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

  if (isLoading || !store) {
    return <Loading />
  }

  return (
    <FlatList
      data={categories}
      keyExtractor={(item, index) => item.id ?? `category-${index}`}
      ListHeaderComponent={
        <StorePromotionHeader store={store} banners={banners} />
      }
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <Box bg={'gray.100'} borderRadius={'2xl'} borderBottomWidth={0.21}>
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
                  keyExtractor={(sub, index) => sub.id ?? `sub-${index}`}
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
                    keyExtractor={(prod, index) => prod.id ?? `prod-${index}`}
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
