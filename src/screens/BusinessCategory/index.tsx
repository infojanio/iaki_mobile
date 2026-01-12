import { useContext, useEffect, useState } from 'react'
import { FlatList, HStack, VStack, useToast } from 'native-base'

import { api } from '@services/api'
import { AppError } from '@utils/AppError'

import { BusinessCategoryDTO } from '@dtos/BusinessCategoryDTO'
import { Loading } from '@components/Loading'

import { CityContext } from '@contexts/CityContext'
import { useNavigation } from '@react-navigation/native'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { BusinessCategoryCard } from './BusinessCategoryCard'

type RouteParamsProps = {
  businessCategoryId: string
  //  companyId: string
}

type Props = {
  category: string
  data: BusinessCategoryDTO[]
}

export function BusinessCategory() {
  const { city } = useContext(CityContext)
  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const toast = useToast()

  const [businessCategories, setBusinessCategories] = useState<
    BusinessCategoryDTO[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBusinessCategoryId, setSelectedBusinessCategoryId] = useState<
    string | null
  >(null)

  function handleOpenStores(businessCategoryId: string) {
    setSelectedBusinessCategoryId(businessCategoryId)
    // 🔜 próximo passo
    navigation.navigate('storesByBusiness', { businessCategoryId })
  }

  async function fetchBusinessCategories() {
    if (!city?.id) {
      setBusinessCategories([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)

      const response = await api.get(`/business-categories/city/${city.id}`)

      setBusinessCategories(response.data)
    } catch (error) {
      const isAppError = error instanceof AppError
      const title = isAppError
        ? error.message
        : 'Não foi possível carregar as categorias da cidade'

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
    setSelectedBusinessCategoryId(null) // 🔄 reset ao trocar cidade
    fetchBusinessCategories()
  }, [city?.id])

  if (isLoading) {
    return <Loading />
  }

  if (!businessCategories.length) {
    return null
  }

  return (
    <HStack>
      <VStack flex={1}>
        <FlatList
          data={businessCategories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BusinessCategoryCard
              data={item}
              isSelected={item.id === selectedBusinessCategoryId}
              onPress={() => handleOpenStores(item.id)}
            />
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          _contentContainerStyle={{ px: 2 }}
          mt={2}
          mb={2}
        />
      </VStack>
    </HStack>
  )
}
