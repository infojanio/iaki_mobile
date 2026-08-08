import { useCallback, useContext, useState } from 'react'

import { FlatList } from 'react-native'

import { Center, Text, VStack, useToast } from 'native-base'

import { useFocusEffect, useNavigation } from '@react-navigation/native'

import { api } from '@services/api'
import { AppError } from '@utils/AppError'

import { useAuth } from '@hooks/useAuth'

import { ProductDTO } from '@dtos/ProductDTO'
import { StoreDTO } from '@dtos/StoreDTO'
import { BannerDTO } from '@dtos/BannerDTO'
import { ReelDTO } from '@dtos/ReelDTO'
import { RewardDTO } from '@dtos/RewardDTO'

import { AppNavigatorRoutesProps } from '@routes/app.routes'

import { HomeHeader } from '@components/HomeHeader'
import { Promotion } from '@components/Promotion'
import { SearchBar } from '@components/SearchBar'
import { FeaturedStores } from '@components/FeaturedStores'
import { Loading } from '@components/Loading'
import { BenefitsBar } from '@components/BenefitsBar'
import { Reel } from '@components/Reel'
import { HomeRewards } from '@components/Reward/HomeRewards'

import { ProductDiscount } from './Product/ProductDiscount'

import { ProductQuantity } from './Product/ProductQuantity'

import { CashbackRegulationCard } from './CashbackRegulationCard'

import { BusinessCategory } from '@screens/BusinessCategory'

import { CityContext } from '@contexts/CityContext'

import { CartContext } from '@contexts/CartContext'
import { StoreListContent } from '@components/StoreListContent'

export function Home() {
  const toast = useToast()

  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const { city } = useContext(CityContext)

  const { syncCartBadge } = useContext(CartContext)

  useAuth()

  const [stores, setStores] = useState<StoreDTO[]>([])

  const [banners, setBanners] = useState<BannerDTO[]>([])

  const [reels, setReels] = useState<ReelDTO[]>([])

  const [rewards, setRewards] = useState<RewardDTO[]>([])

  const [isLoading, setIsLoading] = useState(true)

  const [isLoadingStores, setIsLoadingStores] = useState(false)

  const [isLoadingRewards, setIsLoadingRewards] = useState(false)

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

  function handleOpenReward(reward: RewardDTO) {
    if (!reward.storeId) {
      toast.show({
        title: 'Loja do brinde não encontrada.',
        placement: 'top',
        bgColor: 'orange.500',
      })

      return
    }

    navigation.navigate('storeRewardCatalog', {
      storeId: reward.storeId,
      storeName: reward.store?.name,
    })
  }
  async function loadPremiumBanners() {
    if (!city?.id) {
      setBanners([])
      return
    }

    try {
      const response = await api.get(`/banners/premium/city/${city.id}`)

      const fetchedBanners =
        response.data?.banners ?? response.data?.data ?? response.data ?? []

      setBanners(Array.isArray(fetchedBanners) ? fetchedBanners : [])
    } catch (error: any) {
      console.error('[Home] Erro ao carregar banners PREMIUM:', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      })

      setBanners([])
    }
  }

  async function loadPremiumStores() {
    if (!city?.id) {
      setStores([])
      setIsLoadingStores(false)
      return
    }

    try {
      setIsLoadingStores(true)

      const response = await api.get(`/stores/premium/city/${city.id}`)

      const fetchedStores =
        response.data?.stores ?? response.data?.data ?? response.data ?? []

      setStores(Array.isArray(fetchedStores) ? fetchedStores : [])
    } catch (error) {
      const title =
        error instanceof AppError
          ? error.message
          : 'Não foi possível carregar as lojas.'

      toast.show({
        title,
        placement: 'top',
        bgColor: 'red.500',
      })

      setStores([])
    } finally {
      setIsLoadingStores(false)
    }
  }

  async function loadPremiumReels() {
    if (!city?.id) {
      setReels([])
      return
    }

    try {
      const response = await api.get(`/reels/premium/city/${city.id}`)

      const fetchedReels =
        response.data?.reels ?? response.data?.data ?? response.data ?? []

      setReels(Array.isArray(fetchedReels) ? fetchedReels : [])
    } catch (error: any) {
      console.error('[Home] Erro ao carregar reels PREMIUM:', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      })

      setReels([])
    }
  }

  async function loadRewards() {
    if (!city?.id) {
      setRewards([])
      setIsLoadingRewards(false)
      return
    }

    try {
      setIsLoadingRewards(true)

      const response = await api.get(`/rewards/city/${city.id}`)

      const fetchedRewards =
        response.data?.rewards ?? response.data?.data ?? response.data ?? []

      setRewards(Array.isArray(fetchedRewards) ? fetchedRewards : [])
    } catch (error: any) {
      console.error('[Home] Erro ao carregar brindes:', {
        status: error?.response?.status,

        data: error?.response?.data,

        message: error?.message,
      })

      setRewards([])
    } finally {
      setIsLoadingRewards(false)
    }
  }

  async function loadHomeData() {
    if (!city?.id) {
      setStores([])
      setBanners([])
      setReels([])
      setRewards([])

      setIsLoadingStores(false)
      setIsLoadingRewards(false)
      setIsLoading(false)

      return
    }

    try {
      setIsLoading(true)

      await Promise.all([
        loadPremiumStores(),
        loadPremiumBanners(),
        loadPremiumReels(),
        loadRewards(),
      ])
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
    }, [syncCartBadge]),
  )

  if (!city?.id) {
    return (
      <VStack flex={1} bg="blue.50">
        <HomeHeader />

        <SearchBar />

        <Center flex={1} px={6}>
          <Text
            fontSize="lg"
            fontWeight="bold"
            color="coolGray.700"
            textAlign="center"
          >
            Selecione uma cidade
          </Text>

          <Text mt={2} color="coolGray.500" textAlign="center">
            Escolha sua cidade para visualizar lojas, produtos e brindes
            disponíveis.
          </Text>
        </Center>
      </VStack>
    )
  }

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
    <VStack flex={1} bg="blue.50">
      <HomeHeader />

      <SearchBar />

      <FlatList
        data={[{ id: 'home' }]}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        renderItem={() => (
          <StoreListContent
            insideScrollView
            stores={stores}
            isLoading={isLoadingStores}
          />
        )}
        ListHeaderComponent={
          <VStack bg="blue.50" mx={1}>
            <Promotion banners={banners} />

            <BusinessCategory />

            <FeaturedStores
              stores={stores.slice(0, 10)}
              isLoading={isLoadingStores}
            />

            <HomeRewards
              rewards={rewards}
              isLoading={isLoadingRewards}
              onSeeAll={() => navigation.navigate('rewards')}
              onPressReward={handleOpenReward}
            />

            <ProductDiscount onPressProduct={handleOpenProductDetails} />

            <Reel reels={reels} />

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
