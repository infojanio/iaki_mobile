import { useCallback, useState } from 'react'

import {
  LayoutAnimation,
  Platform,
  RefreshControl,
  UIManager,
} from 'react-native'

import {
  Box,
  Center,
  Divider,
  HStack,
  Pressable,
  ScrollView,
  Spinner,
  Text,
  VStack,
  useToast,
} from 'native-base'

import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Coins,
  Gift,
  History,
  MinusCircle,
  PlusCircle,
  Store,
  TrendingDown,
  TrendingUp,
  UserRound,
} from 'lucide-react-native'

import { useFocusEffect, useNavigation } from '@react-navigation/native'

import { BackHome } from '@components/BackHome'
import { UserPhoto } from '@components/HomeHeader/UserPhoto'

import { useAuth } from '@hooks/useAuth'

import { AppNavigatorRoutesProps } from '@routes/app.routes'

import { api } from '@services/api'

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

type StoreWithPoints = {
  storeId: string
  storeName: string
  storeAvatar?: string | null
  balance: number
}

type WalletTransactionType = 'EARN' | 'SPEND' | 'ADJUST'

type WalletTransaction = {
  id: string
  type: WalletTransactionType
  points: number
  note?: string | null
  createdAt: string
}

type StoreWallet = {
  id?: string
  storeId?: string
  userId?: string
  balance: number
  earned: number
  spent: number
  transactions?: WalletTransaction[]
}

type UserProfile = {
  id: string
  name: string
  email: string
  avatar?: string | null
}

function toSafeNumber(value?: number | string | null) {
  const numericValue = Number(value ?? 0)

  return Number.isFinite(numericValue) ? numericValue : 0
}

function formatPoints(value?: number | string | null) {
  return toSafeNumber(value).toLocaleString('pt-BR')
}

function formatTransactionDate(value?: string | null) {
  if (!value) {
    return 'Data não informada'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Data inválida'
  }

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function ProfileWallet() {
  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const toast = useToast()

  const { user } = useAuth()

  const [stores, setStores] = useState<StoreWithPoints[]>([])

  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)

  const [wallet, setWallet] = useState<StoreWallet | null>(null)

  const [loadingStoreId, setLoadingStoreId] = useState<string | null>(null)

  const [isInitialLoading, setIsInitialLoading] = useState(true)

  const [isRefreshing, setIsRefreshing] = useState(false)

  const [userView, setUserView] = useState<UserProfile | null>(null)

  const fetchUserProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/users/profile')

      setUserView(data?.user ?? data ?? null)
    } catch (error) {
      console.error('[ProfileWallet] Erro ao carregar perfil:', error)
    }
  }, [])

  const fetchStoresWithPoints = useCallback(async () => {
    const { data } = await api.get('/users/me/stores-with-points')

    const storesData = data?.stores ?? data?.data ?? data ?? []

    setStores(Array.isArray(storesData) ? storesData : [])
  }, [])

  const loadScreen = useCallback(
    async (refreshing = false) => {
      try {
        if (refreshing) {
          setIsRefreshing(true)
        } else {
          setIsInitialLoading(true)
        }

        await Promise.all([fetchUserProfile(), fetchStoresWithPoints()])
      } catch (error: any) {
        console.error('[ProfileWallet] Erro ao carregar tela:', {
          status: error?.response?.status,
          data: error?.response?.data,
          message: error?.message,
        })

        toast.show({
          title:
            error?.response?.data?.message ??
            'Não foi possível carregar seus pontos.',
          placement: 'top',
          bgColor: 'red.500',
        })
      } finally {
        setIsInitialLoading(false)
        setIsRefreshing(false)
      }
    },
    [fetchStoresWithPoints, fetchUserProfile, toast],
  )

  const loadWallet = useCallback(
    async (storeId: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)

      if (selectedStoreId === storeId) {
        setSelectedStoreId(null)
        setWallet(null)

        return
      }

      try {
        setSelectedStoreId(storeId)
        setWallet(null)
        setLoadingStoreId(storeId)

        const { data } = await api.get(`/stores/${storeId}/points/me`)

        const walletData = data?.wallet ?? data?.data ?? data

        setWallet({
          ...walletData,

          balance: toSafeNumber(walletData?.balance),

          earned: toSafeNumber(walletData?.earned),

          spent: toSafeNumber(walletData?.spent),

          transactions: Array.isArray(walletData?.transactions)
            ? walletData.transactions
            : [],
        })
      } catch (error: any) {
        console.error('[ProfileWallet] Erro ao carregar carteira:', {
          status: error?.response?.status,
          data: error?.response?.data,
          message: error?.message,
        })

        setSelectedStoreId(null)
        setWallet(null)

        toast.show({
          title:
            error?.response?.data?.message ??
            'Não foi possível carregar a carteira.',
          placement: 'top',
          bgColor: 'red.500',
        })
      } finally {
        setLoadingStoreId(null)
      }
    },
    [selectedStoreId, toast],
  )

  useFocusEffect(
    useCallback(() => {
      void loadScreen()
    }, [loadScreen]),
  )

  const displayName = userView?.name ?? user?.name ?? 'Usuário'

  const displayEmail = userView?.email ?? user?.email ?? ''

  const displayAvatar = userView?.avatar ?? user?.avatar

  if (isInitialLoading) {
    return (
      <Center flex={1} bg="coolGray.50">
        <Spinner size="lg" color="primary.600" />

        <Text mt={3} color="coolGray.500">
          Carregando seus pontos...
        </Text>
      </Center>
    )
  }

  return (
    <Box flex={1} bg="coolGray.50">
      <BackHome title="Meus Pontos" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 48,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              void loadScreen(true)
            }}
          />
        }
      >
        {/* PERFIL */}

        <Pressable
          mt={4}
          mb={6}
          onPress={() => navigation.navigate('profileEdit')}
          accessibilityLabel="Editar perfil"
          _pressed={{
            opacity: 0.85,
          }}
        >
          <HStack
            bg="white"
            p={4}
            borderRadius="2xl"
            borderWidth={1}
            borderColor="coolGray.200"
            shadow={1}
            alignItems="center"
            space={3}
          >
            <UserPhoto
              source={
                displayAvatar
                  ? {
                      uri: displayAvatar,
                    }
                  : undefined
              }
              alt="Foto do usuário"
              size={12}
            />

            <VStack flex={1} space={0.5}>
              <Text fontSize="lg" fontWeight="bold" color="coolGray.800">
                {displayName}
              </Text>

              <Text fontSize="xs" color="coolGray.500" numberOfLines={1}>
                {displayEmail}
              </Text>

              <Text
                mt={1}
                fontSize="xs"
                color="primary.600"
                fontWeight="medium"
              >
                Toque para editar o perfil
              </Text>
            </VStack>

            <ChevronRight size={20} color="#9CA3AF" />
          </HStack>
        </Pressable>

        {/* TÍTULO DA SEÇÃO */}

        <HStack mb={3} justifyContent="space-between" alignItems="center">
          <VStack>
            <Text fontSize="xl" fontWeight="bold" color="coolGray.800">
              Pontos por loja
            </Text>

            <Text fontSize="sm" color="coolGray.500">
              Consulte seus saldos e recompensas
            </Text>
          </VStack>

          {stores.length > 0 && (
            <Center
              minWidth={9}
              height={9}
              px={2}
              bg="primary.100"
              borderRadius="full"
            >
              <Text color="primary.700" fontWeight="bold">
                {stores.length}
              </Text>
            </Center>
          )}
        </HStack>

        {/* ESTADO VAZIO */}

        {stores.length === 0 ? (
          <Center
            mt={3}
            p={8}
            bg="white"
            borderRadius="2xl"
            borderWidth={1}
            borderColor="coolGray.200"
          >
            <Center width={16} height={16} bg="primary.100" borderRadius="full">
              <Coins size={30} color="#6D28D9" />
            </Center>

            <Text
              mt={4}
              fontSize="md"
              fontWeight="bold"
              color="coolGray.800"
              textAlign="center"
            >
              Você ainda não possui pontos
            </Text>

            <Text mt={2} fontSize="sm" color="coolGray.500" textAlign="center">
              Compre nas lojas parceiras e acumule pontos para trocar por
              brindes.
            </Text>
          </Center>
        ) : (
          <VStack space={4}>
            {stores.map((store) => {
              const isOpen = selectedStoreId === store.storeId

              const isLoadingWallet = loadingStoreId === store.storeId

              return (
                <Box key={store.storeId}>
                  {/* CARTÃO DA LOJA */}

                  <Pressable
                    onPress={() => loadWallet(store.storeId)}
                    isDisabled={loadingStoreId !== null}
                    accessibilityLabel={`Abrir carteira da loja ${store.storeName}`}
                    _pressed={{
                      opacity: 0.85,
                    }}
                  >
                    <HStack
                      bg="white"
                      p={4}
                      borderRadius="2xl"
                      borderWidth={1}
                      borderColor={isOpen ? 'primary.300' : 'coolGray.200'}
                      shadow={isOpen ? 2 : 1}
                      alignItems="center"
                      space={3}
                    >
                      <Center
                        width={12}
                        height={12}
                        bg={isOpen ? 'primary.600' : 'primary.100'}
                        borderRadius="full"
                      >
                        <Store
                          size={22}
                          color={isOpen ? '#FFFFFF' : '#6D28D9'}
                        />
                      </Center>

                      <VStack flex={1} space={0.5}>
                        <Text
                          fontSize="md"
                          fontWeight="bold"
                          color="coolGray.800"
                          numberOfLines={1}
                        >
                          {store.storeName}
                        </Text>

                        <Text fontSize="xs" color="coolGray.500">
                          {isOpen
                            ? 'Carteira aberta'
                            : 'Toque para ver detalhes'}
                        </Text>
                      </VStack>

                      <VStack alignItems="flex-end" space={1}>
                        <Box
                          px={3}
                          py={1.5}
                          bg="primary.100"
                          borderRadius="full"
                        >
                          <Text
                            color="primary.700"
                            fontSize="sm"
                            fontWeight="bold"
                          >
                            {formatPoints(store.balance)} pts
                          </Text>
                        </Box>

                        {isLoadingWallet ? (
                          <Spinner size="sm" color="primary.600" />
                        ) : isOpen ? (
                          <ChevronUp size={18} color="#6B7280" />
                        ) : (
                          <ChevronDown size={18} color="#6B7280" />
                        )}
                      </VStack>
                    </HStack>
                  </Pressable>

                  {/* CONTEÚDO EXPANDIDO */}

                  {isOpen && (
                    <Box mt={3}>
                      {isLoadingWallet ? (
                        <Center py={8} bg="white" borderRadius="2xl">
                          <Spinner color="primary.600" />

                          <Text mt={2} fontSize="sm" color="coolGray.500">
                            Carregando carteira...
                          </Text>
                        </Center>
                      ) : wallet ? (
                        <VStack space={4}>
                          {/* CARTEIRA */}

                          <Box
                            position="relative"
                            overflow="hidden"
                            bg="primary.600"
                            px={5}
                            py={6}
                            borderRadius="3xl"
                            shadow={3}
                          >
                            {/* DETALHES DECORATIVOS */}

                            <Box
                              position="absolute"
                              top={-10}
                              right={-8}
                              width={28}
                              height={28}
                              borderRadius="full"
                              bg="whiteAlpha.100"
                            />

                            <Box
                              position="absolute"
                              bottom={-14}
                              left={-8}
                              width={24}
                              height={24}
                              borderRadius="full"
                              bg="whiteAlpha.100"
                            />

                            <HStack
                              justifyContent="space-between"
                              alignItems="flex-start"
                            >
                              <VStack>
                                <Text
                                  color="primary.100"
                                  fontSize="sm"
                                  fontWeight="medium"
                                >
                                  Saldo disponível
                                </Text>

                                <HStack mt={1} alignItems="baseline" space={2}>
                                  <Text
                                    fontSize="4xl"
                                    fontWeight="bold"
                                    color="white"
                                  >
                                    {formatPoints(wallet.balance)}
                                  </Text>

                                  <Text color="primary.100" fontWeight="medium">
                                    pontos
                                  </Text>
                                </HStack>
                              </VStack>

                              <Center
                                width={11}
                                height={11}
                                bg="whiteAlpha.200"
                                borderRadius="full"
                              >
                                <Coins size={23} color="#FFFFFF" />
                              </Center>
                            </HStack>

                            <HStack mt={6} space={3}>
                              <HStack
                                flex={1}
                                p={3}
                                bg="whiteAlpha.200"
                                borderRadius="xl"
                                alignItems="center"
                                space={2}
                              >
                                <TrendingUp size={19} color="#BBF7D0" />

                                <VStack>
                                  <Text color="primary.100" fontSize="xs">
                                    Acumulado
                                  </Text>

                                  <Text color="white" fontWeight="bold">
                                    {formatPoints(wallet.earned)}
                                  </Text>
                                </VStack>
                              </HStack>

                              <HStack
                                flex={1}
                                p={3}
                                bg="whiteAlpha.200"
                                borderRadius="xl"
                                alignItems="center"
                                space={2}
                              >
                                <TrendingDown size={19} color="#FECACA" />

                                <VStack>
                                  <Text color="primary.100" fontSize="xs">
                                    Utilizado
                                  </Text>

                                  <Text color="white" fontWeight="bold">
                                    {formatPoints(wallet.spent)}
                                  </Text>
                                </VStack>
                              </HStack>
                            </HStack>
                          </Box>

                          {/* CTA PRINCIPAL DE BRINDES */}

                          <Pressable
                            onPress={() =>
                              navigation.navigate('storeRewardCatalog', {
                                storeId: store.storeId,
                              })
                            }
                            accessibilityLabel={`Ver brindes da loja ${store.storeName}`}
                            _pressed={{
                              opacity: 0.82,
                            }}
                          >
                            <HStack
                              bg="amber.400"
                              p={4}
                              minHeight={88}
                              borderRadius="2xl"
                              shadow={3}
                              borderWidth={1}
                              borderColor="amber.500"
                              alignItems="center"
                              space={3}
                            >
                              <Center
                                width={14}
                                height={14}
                                bg="white"
                                borderRadius="full"
                                shadow={1}
                              >
                                <Gift size={28} color="#B45309" />
                              </Center>

                              <VStack flex={1} space={1}>
                                <Text
                                  fontSize="lg"
                                  fontWeight="bold"
                                  color="amber.900"
                                >
                                  Ver brindes da loja
                                </Text>

                                <Text fontSize="sm" color="amber.800">
                                  Use seus pontos para resgatar recompensas
                                </Text>
                              </VStack>

                              <Center
                                width={9}
                                height={9}
                                bg="amber.500"
                                borderRadius="full"
                              >
                                <ChevronRight size={22} color="#78350F" />
                              </Center>
                            </HStack>
                          </Pressable>

                          {/* HISTÓRICO */}

                          <Box
                            bg="white"
                            p={5}
                            borderRadius="2xl"
                            borderWidth={1}
                            borderColor="coolGray.200"
                            shadow={1}
                          >
                            <HStack mb={4} alignItems="center" space={2}>
                              <Center
                                width={9}
                                height={9}
                                bg="coolGray.100"
                                borderRadius="full"
                              >
                                <History size={18} color="#4B5563" />
                              </Center>

                              <VStack>
                                <Text
                                  fontSize="md"
                                  fontWeight="bold"
                                  color="coolGray.800"
                                >
                                  Histórico de pontos
                                </Text>

                                <Text fontSize="xs" color="coolGray.500">
                                  Últimas movimentações
                                </Text>
                              </VStack>
                            </HStack>

                            {!wallet.transactions?.length ? (
                              <Center py={5}>
                                <Text
                                  fontSize="sm"
                                  color="coolGray.500"
                                  textAlign="center"
                                >
                                  Nenhuma movimentação encontrada.
                                </Text>
                              </Center>
                            ) : (
                              wallet.transactions.map((item, index) => {
                                const isEarn = item.type === 'EARN'

                                const isSpend = item.type === 'SPEND'

                                const isPositiveAdjustment =
                                  item.type === 'ADJUST' && item.points >= 0

                                const isPositive =
                                  isEarn || isPositiveAdjustment

                                const transactionLabel = isEarn
                                  ? 'Pontos ganhos'
                                  : isSpend
                                    ? 'Resgate de pontos'
                                    : 'Ajuste de saldo'

                                const pointsPrefix = isPositive ? '+' : '-'

                                const pointsColor = isPositive
                                  ? 'green.600'
                                  : 'red.600'

                                return (
                                  <VStack key={item.id}>
                                    <HStack
                                      py={3}
                                      alignItems="center"
                                      space={3}
                                    >
                                      <Center
                                        width={10}
                                        height={10}
                                        bg={
                                          isPositive ? 'green.100' : 'red.100'
                                        }
                                        borderRadius="full"
                                      >
                                        {isPositive ? (
                                          <PlusCircle
                                            size={19}
                                            color="#16A34A"
                                          />
                                        ) : (
                                          <MinusCircle
                                            size={19}
                                            color="#DC2626"
                                          />
                                        )}
                                      </Center>

                                      <VStack flex={1} space={0.5}>
                                        <Text
                                          fontSize="sm"
                                          fontWeight="medium"
                                          color="coolGray.800"
                                        >
                                          {transactionLabel}
                                        </Text>

                                        <Text
                                          fontSize="xs"
                                          color="coolGray.500"
                                        >
                                          {formatTransactionDate(
                                            item.createdAt,
                                          )}
                                        </Text>

                                        {item.note && (
                                          <Text
                                            fontSize="xs"
                                            color="coolGray.500"
                                            numberOfLines={1}
                                          >
                                            {item.note}
                                          </Text>
                                        )}
                                      </VStack>

                                      <Text
                                        fontSize="md"
                                        fontWeight="bold"
                                        color={pointsColor}
                                      >
                                        {pointsPrefix}
                                        {formatPoints(Math.abs(item.points))}
                                      </Text>
                                    </HStack>

                                    {index <
                                      wallet.transactions!.length - 1 && (
                                      <Divider />
                                    )}
                                  </VStack>
                                )
                              })
                            )}
                          </Box>
                        </VStack>
                      ) : null}
                    </Box>
                  )}
                </Box>
              )
            })}
          </VStack>
        )}
      </ScrollView>
    </Box>
  )
}
