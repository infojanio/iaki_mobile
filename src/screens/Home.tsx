import { useCallback, useContext, useState } from 'react'
import { FlatList } from 'react-native'
import { VStack, useToast } from 'native-base'
import { useFocusEffect, useNavigation } from '@react-navigation/native'

import { api } from '@services/api'
import { AppError } from '@utils/AppError'

import { useAuth } from '@hooks/useAuth'

import { ProductDTO } from '@dtos/ProductDTO'
import { StoreDTO } from '@dtos/StoreDTO'

import { AppNavigatorRoutesProps } from '@routes/app.routes'

import { HomeHeader } from '@components/HomeHeader'
import { Promotion } from '@components/Promotion'
import { SearchBar } from '@components/SearchBar'
import { FeaturedStores } from '@components/FeaturedStores'
import { Loading } from '@components/Loading'
import { BenefitsBar } from '@components/BenefitsBar'
import { Reel } from '@components/Reel'

import { ProductDiscount } from './Product/ProductDiscount'
import { ProductQuantity } from './Product/ProductQuantity'
import { CashbackRegulationCard } from './CashbackRegulationCard'
import { BusinessCategory } from '@screens/BusinessCategory'
import { StoreList } from './StoreList'

import { CityContext } from '@contexts/CityContext'
import { CartContext } from '@contexts/CartContext'

export function Home() {
  const toast = useToast()

  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const { city, cityBanners } = useContext(CityContext)
  const { syncCartBadge } = useContext(CartContext)

  useAuth()

  const [products, setProducts] = useState<ProductDTO[]>([])
  const [stores, setStores] = useState<StoreDTO[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingStores, setIsLoadingStores] = useState(false)

  function handleOpenProductDetails(product: ProductDTO) {
    if (!product.id) {
      toast.show({
        title: 'Erro',
        description: 'Produto inválido.',
        placement: 'top',
        bgColor: 'red.500',
      })

      return
    }

    navigation.navigate('productDetails', {
      productId: product.id,
    })
  }

  async function fetchProducts() {
    try {
      const response = await api.get('/products')
      setProducts(response.data)
    } catch (error) {
      const title =
        error instanceof AppError
          ? error.message
          : 'Não foi possível carregar os produtos.'

      toast.show({
        title,
        placement: 'top',
        bgColor: 'red.500',
      })
    }
  }

  async function fetchStores() {
    try {
      if (!city?.id) {
        setStores([])
        return
      }

      setIsLoadingStores(true)

      const response = await api.get(`/stores/city/${city.id}`)

      setStores(response.data.stores ?? response.data)
    } finally {
      setIsLoadingStores(false)
    }
  }

  async function loadHomeData() {
    try {
      setIsLoading(true)

      await Promise.all([fetchProducts(), fetchStores()])
    } finally {
      setIsLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadHomeData()
    }, [city?.id]),
  )

  useFocusEffect(
    useCallback(() => {
      syncCartBadge()
    }, [city?.id]),
  )

  if (isLoading) {
    return (
      <VStack flex={1} bg="blue.100">
        <HomeHeader />
        <SearchBar />
        <Loading />
      </VStack>
    )
  }

  return (
    <VStack flex={1} bg="blue.100">
      <HomeHeader />
      <SearchBar />

      <FlatList
        data={[{ id: 'home' }]}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={() => (
          <StoreList stores={stores} isLoading={isLoadingStores} />
        )}
        ListHeaderComponent={
          <VStack bg="blue.50" mx={1}>
            <Promotion banners={cityBanners} />

            <BusinessCategory />

            <FeaturedStores
              stores={stores.slice(0, 10)}
              isLoading={isLoadingStores}
            />

            <ProductDiscount onPressProduct={handleOpenProductDetails} />

            <Reel />

            <ProductQuantity onPressProduct={handleOpenProductDetails} />

            <BenefitsBar />
          </VStack>
        }
        ListFooterComponent={<CashbackRegulationCard />}
        contentContainerStyle={{
          paddingBottom: 40,
        }}
      />
    </VStack>
  )
}
