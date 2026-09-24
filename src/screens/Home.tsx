import React, { useCallback, useContext, useMemo, useState } from 'react'

import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'

import { useFocusEffect, useNavigation } from '@react-navigation/native'

import { api } from '@services/api'

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

type HomeItem = {
  id: string
}

const HOME_DATA: HomeItem[] = [
  {
    id: 'home-content',
  },
]

function isCanceledRequest(error: any) {
  return (
    error?.code === 'ERR_CANCELED' ||
    error?.name === 'CanceledError' ||
    error?.name === 'AbortError' ||
    error?.message === 'canceled'
  )
}

function extractArray<T>(data: any, property: string): T[] {
  const value = data?.[property] ?? data?.data ?? data ?? []

  return Array.isArray(value) ? value : []
}

export function Home() {
  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const { width } = useWindowDimensions()

  const { city } = useContext(CityContext)

  const { syncCartBadge } = useContext(CartContext)

  const [stores, setStores] = useState<StoreDTO[]>([])

  const [banners, setBanners] = useState<BannerDTO[]>([])

  const [reels, setReels] = useState<ReelDTO[]>([])

  const [rewards, setRewards] = useState<RewardDTO[]>([])

  const [isLoading, setIsLoading] = useState(true)

  const [isLoadingStores, setIsLoadingStores] = useState(false)

  const [isLoadingRewards, setIsLoadingRewards] = useState(false)

  /* =====================================
     RESPONSIVIDADE
  ===================================== */

  const responsive = useMemo(() => {
    const isSmall = width < 360

    const isLarge = width >= 420

    return {
      sectionGap: isSmall ? 6 : isLarge ? 12 : 8,

      footerMargin: isSmall ? 12 : 18,

      emptyPadding: isSmall ? 20 : 28,
    }
  }, [width])

  /* =====================================
     PRODUTO
  ===================================== */

  const handleOpenProductDetails = useCallback(
    (product: ProductDTO) => {
      if (!product?.id) {
        Alert.alert('Produto inválido', 'Não foi possível abrir este produto.')

        return
      }

      navigation.navigate('productDetails', {
        productId: product.id,
      })
    },
    [navigation],
  )

  /* =====================================
     BRINDE
  ===================================== */

  const handleOpenReward = useCallback(
    (reward: RewardDTO) => {
      if (!reward?.storeId) {
        Alert.alert(
          'Brinde indisponível',
          'Não foi possível identificar a loja deste brinde.',
        )

        return
      }

      navigation.navigate('storeRewardCatalog', {
        storeId: reward.storeId,

        storeName: reward.store?.name,
      })
    },
    [navigation],
  )

  /* =====================================
     CARREGAR HOME
  ===================================== */

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController()

      let active = true

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

          setIsLoadingStores(true)

          setIsLoadingRewards(true)

          /*
           * Cada bloco é independente.
           *
           * Se banner falhar,
           * as lojas continuam aparecendo.
           *
           * Se reels falharem,
           * os produtos continuam funcionando.
           */
          const results = await Promise.allSettled([
            api.get(`/stores/premium/city/${city.id}`, {
              signal: controller.signal,
            }),

            api.get(`/banners/premium/city/${city.id}`, {
              signal: controller.signal,
            }),

            api.get(`/reels/premium/city/${city.id}`, {
              signal: controller.signal,
            }),

            api.get(`/rewards/city/${city.id}`, {
              signal: controller.signal,
            }),
          ])

          if (!active || controller.signal.aborted) {
            return
          }

          /* ==========================
             LOJAS
          ========================== */

          const storesResult = results[0]

          if (storesResult.status === 'fulfilled') {
            setStores(extractArray<StoreDTO>(storesResult.value.data, 'stores'))
          } else if (!isCanceledRequest(storesResult.reason)) {
            console.error('[Home] Erro ao carregar lojas:', storesResult.reason)

            setStores([])
          }

          /* ==========================
             BANNERS
          ========================== */

          const bannersResult = results[1]

          if (bannersResult.status === 'fulfilled') {
            const data = extractArray<BannerDTO>(
              bannersResult.value.data,
              'banners',
            )

            /*
             * Limite para evitar
             * excesso de imagens na Home.
             */
            setBanners(data.slice(0, 8))
          } else if (!isCanceledRequest(bannersResult.reason)) {
            console.error(
              '[Home] Erro ao carregar banners:',
              bannersResult.reason,
            )

            setBanners([])
          }

          /* ==========================
             REELS
          ========================== */

          const reelsResult = results[2]

          if (reelsResult.status === 'fulfilled') {
            setReels(extractArray<ReelDTO>(reelsResult.value.data, 'reels'))
          } else if (!isCanceledRequest(reelsResult.reason)) {
            console.error('[Home] Erro ao carregar reels:', reelsResult.reason)

            setReels([])
          }

          /* ==========================
             BRINDES
          ========================== */

          const rewardsResult = results[3]

          if (rewardsResult.status === 'fulfilled') {
            setRewards(
              extractArray<RewardDTO>(rewardsResult.value.data, 'rewards'),
            )
          } else if (!isCanceledRequest(rewardsResult.reason)) {
            console.error(
              '[Home] Erro ao carregar brindes:',
              rewardsResult.reason,
            )

            setRewards([])
          }
        } catch (error: any) {
          if (isCanceledRequest(error)) {
            return
          }

          console.error('[Home] Erro inesperado:', {
            message: error?.message,

            code: error?.code,

            status: error?.response?.status,
          })
        } finally {
          if (active && !controller.signal.aborted) {
            setIsLoading(false)

            setIsLoadingStores(false)

            setIsLoadingRewards(false)
          }
        }
      }

      void loadHomeData()

      return () => {
        active = false

        controller.abort()
      }
    }, [city?.id]),
  )

  /* =====================================
     BADGE DO CARRINHO
  ===================================== */

  useFocusEffect(
    useCallback(() => {
      void syncCartBadge()
    }, [syncCartBadge]),
  )

  /* =====================================
     SEM CIDADE
  ===================================== */

  if (!city?.id) {
    return (
      <View style={styles.screen}>
        <HomeHeader />

        <SearchBar />

        <View
          style={[
            styles.emptyCity,

            {
              paddingHorizontal: responsive.emptyPadding,
            },
          ]}
        >
          <Text style={styles.emptyTitle}>Selecione uma cidade</Text>

          <Text style={styles.emptyDescription}>
            Escolha sua cidade para visualizar lojas, produtos e brindes
            disponíveis.
          </Text>
        </View>
      </View>
    )
  }

  /* =====================================
     LOADING
  ===================================== */

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <HomeHeader />

        <SearchBar />

        <View style={styles.loadingContainer}>
          <Loading />
        </View>
      </View>
    )
  }

  /* =====================================
     CONTEÚDO DA HOME
  ===================================== */

  const renderHomeContent = () => (
    <View
      style={{
        marginTop: responsive.sectionGap,
      }}
    >
      <StoreListContent
        insideScrollView
        stores={stores}
        isLoading={isLoadingStores}
      />
    </View>
  )

  /* =====================================
     TELA
  ===================================== */

  return (
    <View style={styles.screen}>
      <HomeHeader />

      <SearchBar />

      <FlatList
        data={HOME_DATA}
        keyExtractor={(item) => item.id}
        renderItem={renderHomeContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={3}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.homeContent}>
            {/* BANNERS */}

            <View style={styles.firstSection}>
              <Promotion banners={banners} />
            </View>

            {/* CATEGORIAS */}

            <View
              style={{
                marginTop: responsive.sectionGap,
              }}
            >
              <BusinessCategory />
            </View>

            {/* LOJAS EM DESTAQUE */}

            <View
              style={{
                marginTop: responsive.sectionGap,
              }}
            >
              <FeaturedStores
                stores={stores.slice(0, 10)}
                isLoading={isLoadingStores}
              />
            </View>

            {/* BRINDES */}

            <View
              style={{
                marginTop: responsive.sectionGap,
              }}
            >
              <HomeRewards
                rewards={rewards}
                isLoading={isLoadingRewards}
                onSeeAll={() => navigation.navigate('rewards')}
                onPressReward={handleOpenReward}
              />
            </View>

            {/* PRODUTOS COM DESCONTO */}

            <View
              style={{
                marginTop: responsive.sectionGap,
              }}
            >
              <ProductDiscount onPressProduct={handleOpenProductDetails} />
            </View>

            {/* REELS */}

            {reels.length > 0 ? (
              <View
                style={{
                  marginTop: responsive.sectionGap,
                }}
              >
                <Reel reels={reels} />
              </View>
            ) : null}

            {/* PRODUTOS POR QUANTIDADE */}

            <View
              style={{
                marginTop: responsive.sectionGap,
              }}
            >
              <ProductQuantity onPressProduct={handleOpenProductDetails} />
            </View>

            {/* BENEFÍCIOS */}

            <View
              style={{
                marginTop: responsive.sectionGap,
              }}
            >
              <BenefitsBar />
            </View>
          </View>
        }
        ListFooterComponent={
          <View
            style={{
              marginTop: responsive.footerMargin,
            }}
          >
            <CashbackRegulationCard />
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,

    backgroundColor: '#EFF6FF',
  },

  list: {
    flex: 1,

    width: '100%',
  },

  listContent: {
    width: '100%',

    paddingTop: 0,

    paddingBottom: 40,
  },

  homeContent: {
    width: '100%',

    /*
     * Nada de marginTop negativo.
     */
    marginTop: 0,

    paddingTop: 0,
  },

  firstSection: {
    width: '100%',

    marginTop: 0,

    paddingTop: 0,
  },

  emptyCity: {
    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',
  },

  emptyTitle: {
    fontSize: 18,

    fontWeight: '700',

    color: '#374151',

    textAlign: 'center',
  },

  emptyDescription: {
    maxWidth: 340,

    marginTop: 8,

    fontSize: 14,

    lineHeight: 20,

    color: '#6B7280',

    textAlign: 'center',
  },

  loadingContainer: {
    flex: 1,

    minHeight: 200,

    alignItems: 'center',

    justifyContent: 'center',
  },
})
