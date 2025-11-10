import { useEffect, useState } from 'react'
import { FlatList, HStack, VStack, useToast } from 'native-base'

import { api } from '@services/api'
import { AppError } from '@utils/AppError'

import { CategoryCard } from '@components/Category/CategoryCard'

import { useNavigation, useRoute } from '@react-navigation/native'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { CategoryDTO } from '@dtos/CategoryDTO'
import { Loading } from '@components/Loading'

type RouteParamsProps = {
  categoryId: string
  //  companyId: string
}

type Props = {
  category: string
  data: CategoryDTO[]
}

export function Category() {
  const [categories, setCategories] = useState<CategoryDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  )

  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const toast = useToast()

  function handleOpenSubCategories(categoryId: string, subcategoryId?: string) {
    setSelectedCategoryId(categoryId)
    navigation.navigate('productsBySubCategory', { categoryId, subcategoryId })
  }

  //listar as categorias
  async function fetchCategories() {
    try {
      setIsLoading(true)
      //const response = await api.get(`/companies/company/?company_id=${companyId}`,
      const response = await api.get(`/categories`)

      //const response = await api.get('/categories/category/?category_id=${categoryId}')

      setCategories(response.data)
      // console.log(response.data)
    } catch (error) {
      const isAppError = error instanceof AppError
      const title = isAppError
        ? error.message
        : 'Não foi possível carregar as categorias cadastradas'

      toast.show({
        title,
        placement: 'top',
        bgColor: 'red.500',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  return (
    <HStack>
      {isLoading ? (
        <Loading />
      ) : (
        <VStack flex={1}>
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CategoryCard
                data={item}
                isSelected={item.id === selectedCategoryId}
                onPress={() => handleOpenSubCategories(item.id)}
              />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            _contentContainerStyle={{ px: 2 }}
            mt={2}
            mb={2}
          />
        </VStack>
      )}
    </HStack>
  )
}
