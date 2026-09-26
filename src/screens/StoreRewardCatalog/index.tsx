import React, { useCallback, useMemo, useRef, useState } from 'react'

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ListRenderItemInfo,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'

import { MaterialIcons } from '@expo/vector-icons'

import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native'

import { api } from '@services/api'

import { HomeScreen } from '@components/HomeScreen'

import { useStorePoints } from '@contexts/StorePointsContext'

/* ======================================================
   TYPES
====================================================== */

interface Reward {
  id: string
  title: string
  description?: string
  pointsCost: number
  stock: number
  isActive: boolean
  image?: string | null
}

interface PendingRedemption {
  id: string

  reward: {
    id: string
    title: string
    image?: string | null
  }
}

interface RouteParams {
  storeId: string
}

type ActiveTab = 'catalog' | 'pending'

type RewardImageProps = {
  image?: string | null
  size?: 'large' | 'small'
}

/* ======================================================
   HELPERS
====================================================== */

function safeNumber(value: unknown, fallback = 0) {
  const number = Number(value)

  return Number.isFinite(number) ? number : fallback
}

function isCanceledRequest(error: any) {
  return (
    error?.code === 'ERR_CANCELED' ||
    error?.name === 'CanceledError' ||
    error?.name === 'AbortError' ||
    error?.message === 'canceled'
  )
}

function getImageUri(image?: string | null) {
  if (!image) {
    return null
  }

  const value = String(image).trim()

  if (!value) {
    return null
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }

  const baseURL = api.defaults.baseURL?.replace(/\/+$/, '')

  if (!baseURL) {
    return null
  }

  const normalized = value.replace(/^\/+/, '')

  if (normalized.startsWith('uploads/')) {
    return `${baseURL}/${normalized}`
  }

  return `${baseURL}/uploads/${normalized}`
}

/* ======================================================
   IMAGE
====================================================== */

function RewardImage({ image, size = 'large' }: RewardImageProps) {
  const [hasError, setHasError] = React.useState(false)

  React.useEffect(() => {
    setHasError(false)
  }, [image])

  const uri = useMemo(() => getImageUri(image), [image])

  const isSmall = size === 'small'

  const imageStyle = isSmall ? styles.pendingImage : styles.rewardImage

  const fallbackStyle = isSmall
    ? styles.pendingImageFallback
    : styles.rewardImageFallback

  if (!uri || hasError) {
    return (
      <View style={fallbackStyle}>
        <MaterialIcons name="redeem" size={isSmall ? 28 : 48} color="#9CA3AF" />
      </View>
    )
  }

  return (
    <Image
      source={{
        uri,
      }}
      style={imageStyle}
      resizeMode="contain"
      resizeMethod="resize"
      fadeDuration={0}
      onError={() => {
        setHasError(true)
      }}
    />
  )
}

/* ======================================================
   SCREEN
====================================================== */

export function StoreRewardCatalog() {
  const route = useRoute()

  const navigation = useNavigation<any>()

  const { storeId } = route.params as RouteParams

  const { balance, fetchWallet } = useStorePoints()

  /* ====================================================
     STATES
  ==================================================== */

  const [rewards, setRewards] = useState<Reward[]>([])

  const [pending, setPending] = useState<PendingRedemption[]>([])

  const [loading, setLoading] = useState(true)

  const [refreshing, setRefreshing] = useState(false)

  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog')

  const [redeemingId, setRedeemingId] = useState<string | null>(null)

  /* ====================================================
     REQUEST CONTROL
  ==================================================== */

  const controllerRef = useRef<AbortController | null>(null)

  const requestIdRef = useRef(0)

  /* ====================================================
     REWARDS ATIVOS
  ==================================================== */

  const activeRewards = useMemo(() => {
    return rewards
      .filter((reward) => reward.isActive)
      .sort((a, b) => safeNumber(a.pointsCost) - safeNumber(b.pointsCost))
  }, [rewards])

  /* ====================================================
     CARREGAR DADOS
  ==================================================== */

  const fetchData = useCallback(
    async (showMainLoading = false) => {
      if (!storeId) {
        return
      }

      controllerRef.current?.abort()

      const controller = new AbortController()

      controllerRef.current = controller

      const requestId = ++requestIdRef.current

      try {
        if (showMainLoading) {
          setLoading(true)
        }

        const [rewardsResponse, pendingResponse] = await Promise.all([
          api.get(`/stores/${storeId}/rewards`, {
            signal: controller.signal,
          }),

          api.get(`/stores/${storeId}/rewards/redemptions/me`, {
            signal: controller.signal,
          }),
        ])

        if (requestId !== requestIdRef.current) {
          return
        }

        const rewardsData =
          rewardsResponse.data?.rewards ?? rewardsResponse.data ?? []

        const pendingData =
          pendingResponse.data?.redemptions ?? pendingResponse.data ?? []

        setRewards(Array.isArray(rewardsData) ? rewardsData : [])

        setPending(Array.isArray(pendingData) ? pendingData : [])

        /*
         * Atualiza saldo também,
         * mas uma falha isolada
         * no wallet não derruba
         * o catálogo inteiro.
         */
        try {
          await fetchWallet(storeId)
        } catch (walletError) {
          console.warn(
            '[StoreRewardCatalog] Erro ao atualizar carteira:',
            walletError,
          )
        }
      } catch (error: any) {
        if (isCanceledRequest(error)) {
          return
        }

        console.error('[StoreRewardCatalog] Erro ao carregar:', {
          message: error?.message,

          code: error?.code,

          status: error?.response?.status,

          data: error?.response?.data,
        })

        Alert.alert(
          'Não foi possível carregar',
          error?.response?.data?.message ??
            'Verifique sua conexão e tente novamente.',
        )
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)

          setRefreshing(false)
        }
      }
    },
    [fetchWallet, storeId],
  )

  /* ====================================================
     FOCO
  ==================================================== */

  useFocusEffect(
    useCallback(() => {
      void fetchData(true)

      return () => {
        controllerRef.current?.abort()

        requestIdRef.current += 1
      }
    }, [fetchData]),
  )

  /* ====================================================
     REFRESH
  ==================================================== */

  const onRefresh = useCallback(() => {
    setRefreshing(true)

    void fetchData(false)
  }, [fetchData])

  /* ====================================================
     RESGATAR
  ==================================================== */

  const redeemReward = useCallback(
    async (reward: Reward) => {
      if (redeemingId || !storeId) {
        return
      }

      try {
        setRedeemingId(reward.id)

        const response = await api.post(
          `/stores/${storeId}/rewards/${reward.id}/redeem`,
        )

        const redemptionId =
          response.data?.redemptionId ?? response.data?.redemption?.id

        if (!redemptionId) {
          throw new Error(
            'O resgate foi realizado, mas não foi possível obter o código.',
          )
        }

        /*
         * Atualiza saldo/listas antes
         * de abrir o QR Code.
         */
        try {
          await fetchWallet(storeId)
        } catch {
          // Não impede abertura do QR.
        }

        navigation.navigate('rewardQRCode', {
          redemptionId,
          storeId,
        })
      } catch (error: any) {
        console.error('[StoreRewardCatalog] Erro ao resgatar:', {
          rewardId: reward.id,

          message: error?.message,

          status: error?.response?.status,

          data: error?.response?.data,
        })

        Alert.alert(
          'Não foi possível resgatar',
          error?.response?.data?.message ??
            error?.message ??
            'Tente novamente.',
        )
      } finally {
        setRedeemingId(null)
      }
    },
    [fetchWallet, navigation, redeemingId, storeId],
  )

  const handleRedeem = useCallback(
    (reward: Reward) => {
      const pointsCost = safeNumber(reward.pointsCost)

      const currentBalance = safeNumber(balance)

      if (reward.stock <= 0) {
        Alert.alert(
          'Brinde esgotado',
          'Este brinde não possui estoque disponível no momento.',
        )

        return
      }

      if (currentBalance < pointsCost) {
        const missing = Math.max(0, pointsCost - currentBalance)

        Alert.alert(
          'Você ainda não tem pontos suficientes',
          `Faltam ${missing} pontos para resgatar este brinde.`,
        )

        return
      }

      Alert.alert(
        'Resgatar brinde',
        `Deseja usar ${pointsCost} pontos para resgatar "${reward.title}"?`,
        [
          {
            text: 'Agora não',

            style: 'cancel',
          },

          {
            text: 'Resgatar',

            onPress: () => {
              void redeemReward(reward)
            },
          },
        ],
      )
    },
    [balance, redeemReward],
  )

  /* ====================================================
     ABRIR QR PENDENTE
  ==================================================== */

  const handleOpenPending = useCallback(
    (redemptionId: string) => {
      navigation.navigate('rewardQRCode', {
        redemptionId,
        storeId,
      })
    },
    [navigation, storeId],
  )

  /* ====================================================
     CARD DO CATÁLOGO
  ==================================================== */

  const renderReward = useCallback(
    ({ item }: ListRenderItemInfo<Reward>) => {
      const currentBalance = safeNumber(balance)

      const pointsCost = safeNumber(item.pointsCost)

      const stock = safeNumber(item.stock)

      const canRedeem = currentBalance >= pointsCost && stock > 0

      const missingPoints = Math.max(0, pointsCost - currentBalance)

      const isRedeeming = redeemingId === item.id

      return (
        <View style={styles.rewardCard}>
          {/* IMAGEM */}

          <View style={styles.rewardImageArea}>
            <RewardImage image={item.image} />

            {/* PONTOS */}

            <View style={styles.pointsBadge}>
              <MaterialIcons name="stars" size={17} color="#7C3AED" />

              <Text style={styles.pointsBadgeText}>{pointsCost} pts</Text>
            </View>

            {/* ESTOQUE */}

            {stock <= 0 ? (
              <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockText}>Esgotado</Text>
              </View>
            ) : null}
          </View>

          {/* CONTEÚDO */}

          <View style={styles.rewardContent}>
            <Text numberOfLines={2} style={styles.rewardTitle}>
              {item.title}
            </Text>

            {item.description ? (
              <Text numberOfLines={3} style={styles.rewardDescription}>
                {item.description}
              </Text>
            ) : null}

            {/* STATUS */}

            <View style={styles.rewardInfoRow}>
              {stock > 0 ? (
                <View style={styles.stockContainer}>
                  <MaterialIcons name="inventory-2" size={15} color="#6B7280" />

                  <Text style={styles.stockText}>
                    {stock} {stock === 1 ? 'disponível' : 'disponíveis'}
                  </Text>
                </View>
              ) : (
                <Text style={styles.unavailableText}>Indisponível</Text>
              )}

              {!canRedeem && stock > 0 ? (
                <Text style={styles.missingPointsText}>
                  Faltam {missingPoints} pts
                </Text>
              ) : null}
            </View>

            {/* BOTÃO */}

            <Pressable
              disabled={!canRedeem || redeemingId !== null}
              onPress={() => handleRedeem(item)}
              style={({ pressed }) => [
                styles.redeemButton,

                canRedeem
                  ? styles.redeemButtonAvailable
                  : styles.redeemButtonDisabled,

                pressed && canRedeem && styles.pressed,
              ]}
            >
              {isRedeeming ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialIcons
                    name={canRedeem ? 'redeem' : 'lock-outline'}
                    size={19}
                    color={canRedeem ? '#FFFFFF' : '#9CA3AF'}
                  />

                  <Text
                    style={[
                      styles.redeemButtonText,

                      !canRedeem && styles.redeemButtonTextDisabled,
                    ]}
                  >
                    {stock <= 0
                      ? 'Brinde esgotado'
                      : canRedeem
                        ? 'Resgatar agora'
                        : 'Pontos insuficientes'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      )
    },
    [balance, handleRedeem, redeemingId],
  )

  /* ====================================================
     CARD PENDENTE
  ==================================================== */

  const renderPending = useCallback(
    ({ item }: ListRenderItemInfo<PendingRedemption>) => {
      return (
        <View style={styles.pendingCard}>
          <RewardImage image={item.reward?.image} size="small" />

          <View style={styles.pendingContent}>
            <Text numberOfLines={2} style={styles.pendingTitle}>
              {item.reward?.title ?? 'Brinde'}
            </Text>

            <View style={styles.pendingStatusRow}>
              <View style={styles.pendingDot} />

              <Text style={styles.pendingStatus}>Aguardando validação</Text>
            </View>

            <Pressable
              onPress={() => handleOpenPending(item.id)}
              style={({ pressed }) => [
                styles.qrButton,

                pressed && styles.pressed,
              ]}
            >
              <MaterialIcons name="qr-code-2" size={20} color="#FFFFFF" />

              <Text style={styles.qrButtonText}>Mostrar QR Code</Text>
            </Pressable>
          </View>
        </View>
      )
    },
    [handleOpenPending],
  )

  /* ====================================================
     LOADING
  ==================================================== */

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingIcon}>
          <MaterialIcons name="redeem" size={40} color="#7C3AED" />
        </View>

        <ActivityIndicator size="large" color="#7C3AED" />

        <Text style={styles.loadingTitle}>Carregando seus brindes</Text>

        <Text style={styles.loadingDescription}>Só um instante...</Text>
      </View>
    )
  }

  /* ====================================================
     HEADER DAS LISTAS
  ==================================================== */

  const listHeader = (
    <>
      {/* SALDO */}

      <View style={styles.walletCard}>
        <View style={styles.walletIconContainer}>
          <MaterialIcons name="stars" size={31} color="#7C3AED" />
        </View>

        <View style={styles.walletContent}>
          <Text style={styles.walletLabel}>Seu saldo nesta loja</Text>

          <View style={styles.walletBalanceRow}>
            <Text style={styles.walletBalance}>{safeNumber(balance)}</Text>

            <Text style={styles.walletPoints}>pontos</Text>
          </View>

          <Text style={styles.walletHint}>
            Troque seus pontos por recompensas
          </Text>
        </View>
      </View>

      {/* ABAS */}

      <View style={styles.tabsContainer}>
        <Pressable
          onPress={() => setActiveTab('catalog')}
          style={({ pressed }) => [
            styles.tab,

            activeTab === 'catalog' && styles.tabActive,

            pressed && styles.tabPressed,
          ]}
        >
          <MaterialIcons
            name="redeem"
            size={19}
            color={activeTab === 'catalog' ? '#7C3AED' : '#6B7280'}
          />

          <Text
            style={[
              styles.tabText,

              activeTab === 'catalog' && styles.tabTextActive,
            ]}
          >
            Brindes
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('pending')}
          style={({ pressed }) => [
            styles.tab,

            activeTab === 'pending' && styles.tabActive,

            pressed && styles.tabPressed,
          ]}
        >
          <MaterialIcons
            name="confirmation-number"
            size={19}
            color={activeTab === 'pending' ? '#7C3AED' : '#6B7280'}
          />

          <Text
            style={[
              styles.tabText,

              activeTab === 'pending' && styles.tabTextActive,
            ]}
          >
            Meus resgates
          </Text>

          {pending.length > 0 ? (
            <View style={styles.pendingCount}>
              <Text style={styles.pendingCountText}>{pending.length}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {/* TÍTULO DA SEÇÃO */}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {activeTab === 'catalog'
            ? 'Escolha seu brinde'
            : 'Resgates aguardando validação'}
        </Text>

        <Text style={styles.sectionSubtitle}>
          {activeTab === 'catalog'
            ? 'Use seus pontos e aproveite as recompensas disponíveis.'
            : 'Apresente o QR Code na loja para concluir o resgate.'}
        </Text>
      </View>
    </>
  )

  /* ====================================================
     SCREEN
  ==================================================== */

  return (
    <View style={styles.container}>
      <HomeScreen title="Brindes" />

      {activeTab === 'catalog' ? (
        <FlatList
          data={activeRewards}
          keyExtractor={(item) => item.id}
          renderItem={renderReward}
          ListHeaderComponent={listHeader}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#7C3AED']}
              tintColor="#7C3AED"
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <MaterialIcons name="card-giftcard" size={44} color="#9CA3AF" />
              </View>

              <Text style={styles.emptyTitle}>Nenhum brinde disponível</Text>

              <Text style={styles.emptyDescription}>
                Novas recompensas podem aparecer em breve. Continue acumulando
                pontos.
              </Text>
            </View>
          }
          ListFooterComponent={<View style={styles.footerSpace} />}
        />
      ) : (
        <FlatList
          data={pending}
          keyExtractor={(item) => item.id}
          renderItem={renderPending}
          ListHeaderComponent={listHeader}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#7C3AED']}
              tintColor="#7C3AED"
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <MaterialIcons name="qr-code-2" size={44} color="#9CA3AF" />
              </View>

              <Text style={styles.emptyTitle}>Nenhum resgate pendente</Text>

              <Text style={styles.emptyDescription}>
                Quando você escolher um brinde, ele aparecerá aqui até ser
                validado pela loja.
              </Text>
            </View>
          }
          ListFooterComponent={<View style={styles.footerSpace} />}
        />
      )}
    </View>
  )
}

/* ======================================================
   STYLES
====================================================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7FB',
  },

  listContent: {
    paddingHorizontal: 16,

    paddingBottom: 24,
  },

  /* ==================================================
       WALLET
    ================================================== */

  walletCard: {
    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 14,

    padding: 18,

    borderRadius: 20,

    backgroundColor: '#FFFFFF',

    borderWidth: StyleSheet.hairlineWidth,

    borderColor: '#E9E5F5',

    elevation: 2,
  },

  walletIconContainer: {
    width: 58,

    height: 58,

    borderRadius: 18,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#F3E8FF',
  },

  walletContent: {
    flex: 1,

    marginLeft: 14,
  },

  walletLabel: {
    fontSize: 12,

    fontWeight: '500',

    color: '#6B7280',
  },

  walletBalanceRow: {
    flexDirection: 'row',

    alignItems: 'baseline',

    marginTop: 1,
  },

  walletBalance: {
    fontSize: 30,

    lineHeight: 36,

    fontWeight: '800',

    color: '#4C1D95',
  },

  walletPoints: {
    marginLeft: 6,

    fontSize: 14,

    fontWeight: '600',

    color: '#7C3AED',
  },

  walletHint: {
    marginTop: 2,

    fontSize: 11,

    color: '#9CA3AF',
  },

  /* ==================================================
       TABS
    ================================================== */

  tabsContainer: {
    flexDirection: 'row',

    marginTop: 16,

    padding: 4,

    borderRadius: 16,

    backgroundColor: '#ECEEF3',
  },

  tab: {
    flex: 1,

    minHeight: 44,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 8,

    borderRadius: 13,
  },

  tabActive: {
    backgroundColor: '#FFFFFF',

    elevation: 1,
  },

  tabPressed: {
    opacity: 0.7,
  },

  tabText: {
    marginLeft: 6,

    fontSize: 13,

    fontWeight: '600',

    color: '#6B7280',
  },

  tabTextActive: {
    color: '#6D28D9',
  },

  pendingCount: {
    minWidth: 20,

    height: 20,

    marginLeft: 5,

    paddingHorizontal: 5,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 10,

    backgroundColor: '#7C3AED',
  },

  pendingCountText: {
    fontSize: 10,

    fontWeight: '800',

    color: '#FFFFFF',
  },

  /* ==================================================
       SECTION
    ================================================== */

  sectionHeader: {
    paddingTop: 22,

    paddingBottom: 12,
  },

  sectionTitle: {
    fontSize: 19,

    fontWeight: '800',

    color: '#1F2937',
  },

  sectionSubtitle: {
    marginTop: 4,

    fontSize: 12,

    lineHeight: 18,

    color: '#6B7280',
  },

  /* ==================================================
       REWARD CARD
    ================================================== */

  rewardCard: {
    marginBottom: 16,

    overflow: 'hidden',

    borderRadius: 20,

    backgroundColor: '#FFFFFF',

    borderWidth: StyleSheet.hairlineWidth,

    borderColor: '#E5E7EB',

    elevation: 2,
  },

  rewardImageArea: {
    height: 190,

    alignItems: 'center',

    justifyContent: 'center',

    position: 'relative',

    backgroundColor: '#FAFAFB',
  },

  rewardImage: {
    width: '100%',

    height: '100%',
  },

  rewardImageFallback: {
    width: '100%',

    height: '100%',

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#F3F4F6',
  },

  pointsBadge: {
    position: 'absolute',

    top: 12,

    right: 12,

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 11,

    paddingVertical: 7,

    borderRadius: 20,

    backgroundColor: '#FFFFFF',

    elevation: 2,
  },

  pointsBadgeText: {
    marginLeft: 4,

    fontSize: 13,

    fontWeight: '800',

    color: '#6D28D9',
  },

  outOfStockBadge: {
    position: 'absolute',

    top: 12,

    left: 12,

    paddingHorizontal: 10,

    paddingVertical: 6,

    borderRadius: 15,

    backgroundColor: '#FEE2E2',
  },

  outOfStockText: {
    fontSize: 11,

    fontWeight: '700',

    color: '#B91C1C',
  },

  rewardContent: {
    padding: 16,
  },

  rewardTitle: {
    fontSize: 17,

    lineHeight: 22,

    fontWeight: '800',

    color: '#1F2937',
  },

  rewardDescription: {
    marginTop: 6,

    fontSize: 13,

    lineHeight: 19,

    color: '#6B7280',
  },

  rewardInfoRow: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    marginTop: 14,
  },

  stockContainer: {
    flexDirection: 'row',

    alignItems: 'center',
  },

  stockText: {
    marginLeft: 5,

    fontSize: 11,

    color: '#6B7280',
  },

  unavailableText: {
    fontSize: 11,

    fontWeight: '600',

    color: '#DC2626',
  },

  missingPointsText: {
    fontSize: 11,

    fontWeight: '700',

    color: '#D97706',
  },

  redeemButton: {
    minHeight: 50,

    marginTop: 16,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 14,
  },

  redeemButtonAvailable: {
    backgroundColor: '#7C3AED',
  },

  redeemButtonDisabled: {
    backgroundColor: '#F1F2F4',
  },

  redeemButtonText: {
    marginLeft: 7,

    fontSize: 14,

    fontWeight: '800',

    color: '#FFFFFF',
  },

  redeemButtonTextDisabled: {
    color: '#9CA3AF',
  },

  /* ==================================================
       PENDING
    ================================================== */

  pendingCard: {
    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 12,

    padding: 14,

    borderRadius: 18,

    backgroundColor: '#FFFFFF',

    borderWidth: StyleSheet.hairlineWidth,

    borderColor: '#E5E7EB',

    elevation: 1,
  },

  pendingImage: {
    width: 82,

    height: 82,

    borderRadius: 14,

    backgroundColor: '#F8F8FA',
  },

  pendingImageFallback: {
    width: 82,

    height: 82,

    borderRadius: 14,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#F3F4F6',
  },

  pendingContent: {
    flex: 1,

    marginLeft: 14,
  },

  pendingTitle: {
    fontSize: 15,

    lineHeight: 20,

    fontWeight: '700',

    color: '#1F2937',
  },

  pendingStatusRow: {
    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 6,
  },

  pendingDot: {
    width: 7,

    height: 7,

    marginRight: 6,

    borderRadius: 4,

    backgroundColor: '#F59E0B',
  },

  pendingStatus: {
    fontSize: 11,

    color: '#92400E',
  },

  qrButton: {
    alignSelf: 'flex-start',

    minHeight: 38,

    marginTop: 11,

    paddingHorizontal: 13,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 11,

    backgroundColor: '#7C3AED',
  },

  qrButtonText: {
    marginLeft: 6,

    fontSize: 12,

    fontWeight: '700',

    color: '#FFFFFF',
  },

  /* ==================================================
       EMPTY
    ================================================== */

  emptyContainer: {
    alignItems: 'center',

    paddingHorizontal: 28,

    paddingTop: 45,

    paddingBottom: 60,
  },

  emptyIcon: {
    width: 80,

    height: 80,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 40,

    backgroundColor: '#F3F4F6',
  },

  emptyTitle: {
    marginTop: 17,

    fontSize: 17,

    fontWeight: '800',

    color: '#374151',

    textAlign: 'center',
  },

  emptyDescription: {
    maxWidth: 290,

    marginTop: 7,

    fontSize: 13,

    lineHeight: 19,

    color: '#9CA3AF',

    textAlign: 'center',
  },

  /* ==================================================
       LOADING
    ================================================== */

  loadingScreen: {
    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 30,

    backgroundColor: '#F6F7FB',
  },

  loadingIcon: {
    width: 74,

    height: 74,

    marginBottom: 18,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 24,

    backgroundColor: '#F3E8FF',
  },

  loadingTitle: {
    marginTop: 14,

    fontSize: 16,

    fontWeight: '700',

    color: '#374151',
  },

  loadingDescription: {
    marginTop: 4,

    fontSize: 12,

    color: '#9CA3AF',
  },

  footerSpace: {
    height: 24,
  },

  pressed: {
    opacity: 0.72,

    transform: [
      {
        scale: 0.99,
      },
    ],
  },
})
