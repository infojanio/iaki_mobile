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

/* ==============================
   🧾 ROTAS
============================== */
type RouteParams = {
  categoryId: string
  storeId: string
  screenkey: string
  subcategoryId?: string // opcional para já abrir filtrado
}

type FetchProductsParams = {
  subcategoryId: string
  storeId: string
}

export function ProductsBySubCategory() {
  const toast = useToast()
  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const route = useRoute()

  const {
    storeId,
    categoryId,
    screenkey,
    subcategoryId: initialSubcategoryId,
  } = route.params as RouteParams

  /* ==============================
     🧠 ESTADOS
  ============================== */
  const [subCategories, setSubCategories] = useState<SubCategoryDTO[]>([])
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(
    null,
  )

  const [products, setProducts] = useState<ProductDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)

  /* ==============================
     🔗 ABRIR PRODUTO
  ============================== */
  function handleOpenProductDetails(productId: string) {
    navigation.navigate('productDetails', { productId })
  }

  /* ==============================
     📦 SUBCATEGORIAS DA CATEGORIA
  ============================== */
  async function fetchSubCategories() {
    try {
      const { data } = await api.get<SubCategoryDTO[]>(
        '/subcategories/category',
        {
          params: { categoryId },
        },
      )

      setSubCategories(data)

      // 🔑 define subcategoria selecionada:
      // 1) se veio pela rota e existe → usa
      // 2) senão, usa a primeira
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

  /* ==============================
     🛒 PRODUTOS (SUBCATEGORIA + LOJA)
  ============================== */
  async function fetchProductsBySubCategory({
    subcategoryId,
    storeId,
  }: FetchProductsParams) {
    try {
      setIsLoading(true)

      const response = await api.get<ProductDTO[]>('/products/subcategory', {
        params: {
          subcategoryId,
          storeId, // 🔥 FILTRO ESSENCIAL
        },
      })

      setProducts(response.data)
    } catch (error) {
      const title =
        error instanceof AppError ? error.message : 'Erro ao buscar produtos.'

      toast.show({
        title,
        placement: 'top',
        bgColor: 'red.500',
      })
    } finally {
      setIsLoading(false)
    }
  }

  /* ==============================
     🔄 EFEITOS
  ============================== */

  // 1️⃣ Carrega subcategorias ao mudar a categoria
  useEffect(() => {
    // 🔥 reset completo da tela
    setSubCategories([])
    setProducts([])
    setSelectedSubCategory(null)

    fetchSubCategories()
  }, [categoryId, storeId, screenkey])

  // 2️⃣ Carrega produtos ao mudar subcategoria
  useEffect(() => {
    if (!selectedSubCategory) return

    fetchProductsBySubCategory({
      subcategoryId: selectedSubCategory,
      storeId,
    })
  }, [selectedSubCategory, storeId])

  /* ==============================
     🖥️ RENDER
  ============================== */
  return (
    <VStack flex={1} bg="white" safeArea>
      <HomeScreen title="Produtos" />

      {/* 🔍 Filtro de subcategorias */}
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

      {/* 📦 LISTA DE PRODUTOS */}
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
