import { useEffect, useState } from 'react'

import { HStack, VStack, useToast } from 'native-base'

import { FlatList } from 'react-native'

import { useNavigation, useRoute } from '@react-navigation/native'

import { api } from '@services/api'

import { AppError } from '@utils/AppError'

import { CategoryCard } from '@components/Category/CategoryCard'

import { AppNavigatorRoutesProps } from '@routes/app.routes'

import { CategoryDTO } from '@dtos/CategoryDTO'

import { Loading } from '@components/Loading'

type RouteParamsProps = {
  storeId: string
}

export function Category() {
  const [categories, setCategories] = useState<CategoryDTO[]>([])

  const [isLoading, setIsLoading] = useState(true)

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  )

  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const route = useRoute()

  const { storeId } = route.params as RouteParamsProps

  const toast = useToast()

  function handleOpenSubCategories(categoryId: string) {
    setSelectedCategoryId(categoryId)

    navigation.navigate('productsBySubCategory', {
      categoryId,
      storeId,
    })
  }

  async function fetchCategories() {
    try {
      setIsLoading(true)

      const response = await api.get<CategoryDTO[]>(
        `/stores/${storeId}/categories`,
      )

      setCategories(response.data ?? [])
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
    if (!storeId) {
      return
    }

    fetchCategories()
  }, [storeId])

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
            contentContainerStyle={{
              paddingHorizontal: 8,
              paddingVertical: 8,
            }}
          />
        </VStack>
      )}
    </HStack>
  )
}
