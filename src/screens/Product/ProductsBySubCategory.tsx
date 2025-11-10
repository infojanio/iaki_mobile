import { useEffect, useState } from 'react'
import {
  Box,
  FlatList,
  HStack,
  ScrollView,
  Text,
  VStack,
  useToast,
} from 'native-base'
import { useNavigation, useRoute } from '@react-navigation/native'
import { api } from '@services/api'
import { AppError } from '@utils/AppError'

import { SubCategoryDTO } from '@dtos/SubCategoryDTO'
import { ProductDTO } from '@dtos/ProductDTO'

import { SubCategoryFilter } from '@components/Category/SubCategoryFilter'
import { ProductCard } from '@components/Product/ProductCard'
import { Loading } from '@components/Loading'
import { HomeScreen } from '@components/HomeScreen'
import { AppNavigatorRoutesProps } from '@routes/app.routes'

type RouteParams = {
  categoryId: string
  subcategoryId?: string // <-- aceita opcional para já abrir filtrado
}

export function ProductsBySubCategory() {
  const toast = useToast()
  const route = useRoute()
  const {
    categoryId,
    subcategoryId: initialSubcategoryId,
  } = route.params as RouteParams

  const [subCategories, setSubCategories] = useState<SubCategoryDTO[]>([])
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(
    null,
  )

  const [products, setProducts] = useState<ProductDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const navigation = useNavigation<AppNavigatorRoutesProps>()

  function handleOpenProductDetails(productId: string) {
    navigation.navigate('productDetails', { productId })
  }

  async function fetchSubCategories() {
    try {
      const { data } = await api.get<SubCategoryDTO[]>(
        '/subcategories/category',
        {
          params: { categoryId },
        },
      )

      setSubCategories(data)

      // define a subcategoria selecionada:
      // 1) se veio pela rota e existe nessa categoria -> usa ela
      // 2) senão, usa a primeira da lista
      const existsFromRoute = initialSubcategoryId
        ? data.some((s) => s.id === initialSubcategoryId)
        : false

      const nextSelected =
        (existsFromRoute ? initialSubcategoryId : data[0]?.id) ?? null

      setSelectedSubCategory(nextSelected)
    } catch (error) {
      toast.show({
        title: 'Erro ao carregar subcategorias.',
        placement: 'top',
        bgColor: 'red.500',
      })
    }
  }

  async function fetchProductsBySubCategory(subcategoryId: string) {
    try {
      setIsLoading(true)
      const response = await api.get<ProductDTO[]>('/products/subcategory', {
        params: { subcategoryId },
      })
      setProducts(response.data)
    } catch (error) {
      const title =
        error instanceof AppError ? error.message : 'Erro ao buscar produtos.'
      toast.show({ title, placement: 'top', bgColor: 'red.500' })
    } finally {
      setIsLoading(false)
    }
  }

  // 1) carrega subcategorias quando a categoria muda
  useEffect(() => {
    fetchSubCategories()
    // limpa produtos enquanto decide a subcategoria selecionada
    setProducts([])
  }, [categoryId])

  // 2) sempre que a subcategoria selecionada mudar, busca os produtos
  useEffect(() => {
    if (selectedSubCategory) {
      fetchProductsBySubCategory(selectedSubCategory)
    }
  }, [selectedSubCategory])

  return (
    <VStack flex={1} bg="white" safeArea>
      <HomeScreen title="Produtos" />

      {/* Filtros de subcategorias (horizontal) */}
      <Box px={4} pt={4}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <HStack space={3}>
            {subCategories.map((sub) => (
              <SubCategoryFilter
                key={sub.id}
                title={sub.name}
                isActive={sub.id === selectedSubCategory}
                onPress={() => setSelectedSubCategory(sub.id)}
              />
            ))}
          </HStack>
        </ScrollView>
      </Box>

      {isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{
            justifyContent: 'space-between',
            paddingHorizontal: 16,
          }}
          contentContainerStyle={{ paddingBottom: 16, paddingTop: 8 }}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => handleOpenProductDetails(item.id)}
            />
          )}
          ListEmptyComponent={
            <Text textAlign="center" mt={10}>
              Nenhum produto encontrado para essa subcategoria.
            </Text>
          }
        />
      )}
    </VStack>
  )
}
