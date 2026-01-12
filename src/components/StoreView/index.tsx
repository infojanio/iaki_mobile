import { useContext, useEffect, useState } from 'react'
import { Box, FlatList, Text, VStack, useToast } from 'native-base'
import { useRoute, useNavigation } from '@react-navigation/native'

import { api } from '@services/api'
import { AppError } from '@utils/AppError'

import { StoreDTO } from '@dtos/StoreDTO'
import { Loading } from '@components/Loading'
import { HomeScreen } from '@components/HomeScreen'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { CityContext } from '@contexts/CityContext'
import { StoreCard } from '@components/Store/StoreCard'

type RouteParams = {
  businessCategoryId: string
}

export function StoreView() {
  const toast = useToast()
  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const route = useRoute()

  const { city } = useContext(CityContext)
  const { businessCategoryId } = route.params as RouteParams

  const [stores, setStores] = useState<StoreDTO[]>([])
  const [isLoading, setIsLoading] = useState(false)

  function handleOpenStore(storeId: string) {
    navigation.navigate('storeProducts', {
      storeId,
    })
  }

  async function fetchStores() {
    if (!businessCategoryId || !city?.id) {
      setStores([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)

      const response = await api.get(
        `/stores/city/${city?.id}/category/${businessCategoryId}`,
      )

      //const response = await api.get(`/stores/business/:categoryId/city/:cityId}`)

      setStores(response.data)
    } catch (error) {
      const title =
        error instanceof AppError
          ? error.message
          : 'Não foi possível carregar as lojas'

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
    fetchStores()
  }, [businessCategoryId, city?.id])

  return (
    <VStack flex={1} bg="gray.100" safeArea>
      {isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <StoreCard store={item} onPress={() => handleOpenStore(item.id)} />
          )}
          ListEmptyComponent={
            <Box mt={10}>
              <Text textAlign="center">
                Nenhuma loja encontrada para essa categoria.
              </Text>
            </Box>
          }
        />
      )}
    </VStack>
  )
}
