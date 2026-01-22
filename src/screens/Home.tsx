import { useCallback, useContext, useEffect, useState } from 'react'
import { Box, VStack, useToast, ScrollView, HStack } from 'native-base'

import { useFocusEffect, useNavigation } from '@react-navigation/native'

import { AppError } from '@utils/AppError'
import { api } from '@services/api'
import { useAuth } from '@hooks/useAuth'

import { ProductDTO } from '@dtos/ProductDTO'
import { AppNavigatorRoutesProps } from '@routes/app.routes'

import { HomeHeader } from '@components/HomeHeader'
import { Promotion } from '@components/Promotion'
import { Loading } from '@components/Loading'

import { CashbackRegulationCard } from './CashbackRegulationCard'
import { CartContext } from '@contexts/CartContext'
import { Reel } from '@components/Reel'
import { CategoryList } from './CategoryList'
import { ProductCashback } from './Product/ProductCashback'
import { ProductQuantity } from './Product/ProductQuantity'
import { LocationSelector } from '@components/LocationSelector'
import { BusinessCategory } from '@screens/BusinessCategory'
import { Category } from '@components/Category'
import { StoreList } from './StoreList'
import { CityContext } from '@contexts/CityContext'

export function Home() {
  const { fetchCart } = useContext(CartContext)
  const { setCurrentStoreId } = useContext(CartContext)

  const { cityBanners } = useContext(CityContext)
  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const toast = useToast()

  const { city } = useContext(CityContext)
  const { syncOpenCart } = useContext(CartContext)

  const [products, setProducts] = useState<ProductDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { userId } = useAuth()

  function handleOpenProductDetails(product: ProductDTO) {
    const storeId = product.store_id

    if (!storeId) {
      toast.show({
        title: 'Erro',
        description: 'Não foi possível identificar a loja do produto.',
        placement: 'top',
        bgColor: 'red.500',
      })
      return
    }

    setCurrentStoreId(storeId)
    navigation.navigate('productDetails', { productId: product.id })
  }

  async function fetchProducts() {
    try {
      setIsLoading(true)
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
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    console.log('[Home] city:', city)
  }, [city])

  /* Efeito para carregar o carrinho inicial
  useEffect(() => {
    syncOpenCart()
  }, [])
*/

  useFocusEffect(
    useCallback(() => {
      fetchProducts()
    }, []),
  )

  return (
    <VStack flex={1} bg="gray.100">
      <Box>
        <HomeHeader />
      </Box>

      {isLoading ? (
        <Loading />
      ) : (
        <ScrollView flex={1} showsVerticalScrollIndicator={false}>
          <VStack flex={1} pt={1} bg="gray.100" pb={8}>
            <BusinessCategory />
            <Promotion banners={cityBanners} />

            <StoreList category={''} data={[]} />

            {/* IMPORTANTE: componentes abaixo devem usar handleOpenProductDetails */}
            <ProductCashback onPressProduct={handleOpenProductDetails} />
            <Reel />
            <ProductQuantity onPressProduct={handleOpenProductDetails} />

            <CashbackRegulationCard />
          </VStack>
        </ScrollView>
      )}
    </VStack>
  )
}
