import { useCallback, useContext, useEffect, useState } from 'react'
import { Box, VStack, useToast, ScrollView } from 'native-base'
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
import { Reel } from '@components/Reel'
import { CategoryList } from './CategoryList'
import { ProductCashback } from './Product/ProductCashback'
import { ProductQuantity } from './Product/ProductQuantity'
import { BusinessCategory } from '@screens/BusinessCategory'
import { StoreList } from './StoreList'

import { CityContext } from '@contexts/CityContext'
import { CartContext } from '@contexts/CartContext'
import { ProductDiscount } from './Product/ProductDiscount'

export function Home() {
  const { city } = useContext(CityContext)
  const { syncCartBadge } = useContext(CartContext)
  const { cityBanners } = useContext(CityContext)

  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const toast = useToast()

  const [products, setProducts] = useState<ProductDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { userId } = useAuth()

  /* ==============================
     🔗 ABRIR PRODUTO
     (SEM lógica de loja/carrinho)
  ============================== */
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

  /* ==============================
     📦 FETCH PRODUTOS HOME
  ============================== */
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

  /* ==============================
     🔄 CARREGAMENTO AO FOCUS
  ============================== */
  useFocusEffect(
    useCallback(() => {
      fetchProducts()
    }, []),
  )

  useFocusEffect(
    useCallback(() => {
      syncCartBadge()
    }, [city?.id]),
  )

  /* ==============================
     🖥️ RENDER
  ============================== */
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

            <StoreList />

            {/* Produtos clicáveis */}
            <ProductDiscount onPressProduct={handleOpenProductDetails} />
            <Reel />
            <ProductQuantity onPressProduct={handleOpenProductDetails} />

            <CashbackRegulationCard />
          </VStack>
        </ScrollView>
      )}
    </VStack>
  )
}
