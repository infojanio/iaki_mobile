import { useCallback, useEffect, useState } from 'react'
import { HomeProduct } from '@components/Product/HomeProduct'
import {
  Text,
  Box,
  FlatList,
  HStack,
  Heading,
  VStack,
  useToast,
  Center,
} from 'native-base'
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native'
import { AppError } from '@utils/AppError'
import { api } from '@services/api'
import { Group } from '@components/Product/Group'
import { ProductDTO } from '@dtos/ProductDTO'
import { SubCategoryDTO } from '@dtos/SubCategoryDTO'
import { ProductCard } from '@components/Product/ProductCard'
import { Loading } from '@components/Loading'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { CategoryDTO } from '@dtos/CategoryDTO'

type RouteParamsProps = {
  categoryId: string
}

type Props = {
  subcategory: string
  data: ProductDTO[]
}

export function ProductBySubCategory() {
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState<CategoryDTO[]>([])

  const [subCategories, setSubCategories] = useState<SubCategoryDTO[]>([])
  const [products, setProducts] = useState<ProductDTO[]>([])

  const route = useRoute()
  const { categoryId } = route.params as RouteParamsProps

  console.log('ID =>', categoryId)
  //const [categorySelected, setCategorySelected] = useState(categoryId)
  const [subCategorySelected, setSubCategorySelected] = useState('')

  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const toast = useToast()

  function handleOpenProductDetails(productId: string) {
    navigation.navigate('productDetails', { productId })
  }

  async function fetchCategories() {
    try {
      setIsLoading(true)
      //      const response = await api.get(`/categories/${categoryId}`)
      const response = await api.get(`/categories/${categoryId}`)
      setCategories(response.data)
      console.log(response.data)
    } catch (error) {
      const isAppError = error instanceof AppError
      const title = isAppError
        ? error.message
        : 'Não foi possível carregar a categoria'

      toast.show({
        title,
        placement: 'top',
        bgColor: 'red.500',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Buscar subcategorias da categoria selecionada
  async function fetchSubCategories() {
    try {
      setIsLoading(true)
      console.log('Buscando subcategorias para a categoria:', categoryId)
      const response = await api.get('/subcategories')
      // const response = await api.get(`/subcategories/category/${categoryId}`) // CORRIGIDO
      setSubCategories(response.data)
      console.log('subcategorias carregadas no estado:', subCategories)
      if (response.data.length > 0) {
        setSubCategorySelected(response.data[0].id) // Seleciona a primeira subcategoria automaticamente
        console.log(
          'Subcategoria selecionada automaticamente:',
          response.data[0]?.id,
        )
      } else {
        setSubCategorySelected('') // Evita problemas caso não existam subcategorias
      }
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
      setIsLoading(false)
    }
  }

  // Buscar subcategorias da categoria selecionada
  async function fetchSubCategoriesByCategory() {
    try {
      setIsLoading(true)
      console.log('Buscando subcategorias para a categoria:', categoryId)
      //http://localhost:3333/subcategories/category?categoryId=41302d8e-8660-47c6-a604-4908aea64e35
      const response = await api.get(
        `/subcategories/category/?category_id=${categoryId}`,
      )
      setSubCategories(response.data)

      if (response.data.length > 0) {
        setSubCategorySelected(response.data[0].id) // Seleciona a primeira subcategoria automaticamente
        console.log('Subcategoria inicial:', response.data[0]?.id)
      } else {
        setSubCategorySelected('') // Evita problemas caso não existam subcategorias
      }
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
      setIsLoading(false)
    }
  }

  // Buscar produtos da subcategoria selecionada
  async function fetchProductsBySubcategory() {
    // if (!subCategorySelected) return
    try {
      setIsLoading(true)
      const response = await api.get(
        `/products/subcategory/?subcategory_id=${subCategorySelected}`,
      )
      setProducts(response.data)
      console.log('Produtos', response.data)
    } catch (error) {
      const isAppError = error instanceof AppError
      const title = isAppError
        ? error.message
        : 'Não foi possível carregar os exercícios'

      toast.show({
        title,
        placement: 'bottom-left',
        bgColor: 'red.500',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Atualiza as subcategorias sempre que a categoria mudar
  useEffect(() => {
    if (categoryId) {
      fetchCategories()
      //fetchSubCategories()
      fetchSubCategoriesByCategory()
    }
  }, [categoryId])

  const firstSubCategory = subCategories.length > 0 ? subCategories[0] : null

  // Atualiza os produtos quando a subcategoria mudar
  useFocusEffect(
    useCallback(() => {
      fetchProductsBySubcategory()
    }, [subCategorySelected]),
  )

  return (
    <VStack flex={1}>
      <HomeProduct />

      <Box flex={1} ml={-6} mt={-6}>
        {subCategories.length > 0 ? (
          <FlatList
            data={subCategories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Group
                name={item.name}
                subcategory={item.id}
                isActive={subCategorySelected === item.id}
                onPress={() => setSubCategorySelected(item.id)}
              />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            _contentContainerStyle={{ px: 8 }}
            mt={6}
            mb={2}
            maxH={12}
            minH={10}
          />
        ) : (
          <Center mt={6} mb={2}>
            <Text color={'red.600'} fontSize={14}>
              Nenhuma subcategoria encontrada!
            </Text>
          </Center>
        )}

        {isLoading ? (
          <Loading />
        ) : (
          <VStack flex={1} px={2} bg={'gray.200'}>
            <VStack px={6} bg={'gray.200'}>
              <HStack justifyContent="space-between" mb={5}>
                <Heading color={'gray.700'} fontSize={'md'}>
                  {subCategories.find((sub) => sub.id === subCategorySelected)
                    ?.name || 'Selecionar'}
                </Heading>

                <Text color="gray.700" fontSize={'md'}>
                  {products.length}
                </Text>
              </HStack>
            </VStack>

            <FlatList
              data={products}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ProductCard
                  product={item}
                  onPress={() => handleOpenProductDetails(item.id)}
                />
              )}
              numColumns={2}
              _contentContainerStyle={{
                marginLeft: 8,
                paddingBottom: 32,
              }}
              showsVerticalScrollIndicator={false}
            />
          </VStack>
        )}
      </Box>
    </VStack>
  )
}
