import { useState, useCallback } from 'react'
import {
  Box,
  Text,
  FlatList,
  Button,
  VStack,
  HStack,
  Spinner,
  useToast,
  Image,
  Pressable,
} from 'native-base'
import { RefreshControl, Alert } from 'react-native'
import {
  useRoute,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native'
import { api } from '@services/api'
import { HomeScreen } from '@components/HomeScreen'
import { useStorePoints } from '@contexts/StorePointsContext'

interface Reward {
  id: string
  title: string
  description?: string
  pointsCost: number
  stock: number
  isActive: boolean
  image: string
}

interface PendingRedemption {
  id: string
  reward: {
    id: string
    title: string
    image?: string
  }
}

interface RouteParams {
  storeId: string
}

export function StoreRewardCatalog() {
  const route = useRoute()
  const navigation = useNavigation<any>()
  const { storeId } = route.params as RouteParams

  const toast = useToast()
  const { wallet, balance, fetchWallet } = useStorePoints()

  const [rewards, setRewards] = useState<Reward[]>([])
  const [pending, setPending] = useState<PendingRedemption[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'catalog' | 'pending'>('catalog')

  const fetchData = async () => {
    try {
      setLoading(true)

      await fetchWallet(storeId)

      const [rewardsResponse, pendingResponse] = await Promise.all([
        api.get(`/stores/${storeId}/rewards`),
        api.get(`/stores/${storeId}/rewards/redemptions/me`),
      ])

      setRewards(rewardsResponse.data)
      setPending(pendingResponse.data)
    } catch (error) {
      toast.show({
        title: 'Erro ao carregar dados',
        placement: 'top',
        bgColor: 'red.500',
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchData()
    }, [storeId]),
  )

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchData()
  }, [])

  const handleRedeem = async (rewardId: string) => {
    try {
      const response = await api.post(
        `/stores/${storeId}/rewards/${rewardId}/redeem`,
      )

      navigation.navigate('rewardQRCode', {
        redemptionId: response.data.redemptionId,
        storeId,
      })
    } catch (error: any) {
      Alert.alert(
        'Erro',
        error.response?.data?.message || 'Não foi possível resgatar.',
      )
    }
  }

  if (loading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Spinner size="lg" />
      </Box>
    )
  }

  return (
    <Box flex={1} bg="gray.200">
      <HomeScreen title="Brindes" />

      {/* 🧭 ABAS */}
      <Box mt={4} px={4}>
        <HStack
          bg="gray.100"
          rounded="full"
          p={1}
          justifyContent="space-between"
        >
          <Pressable
            flex={1}
            onPress={() => setActiveTab('catalog')}
            bg={activeTab === 'catalog' ? 'white' : 'transparent'}
            rounded="full"
            py={2}
            alignItems="center"
          >
            <Text
              fontWeight="bold"
              color={activeTab === 'catalog' ? 'purple.600' : 'gray.600'}
            >
              Catálogo
            </Text>
          </Pressable>

          <Pressable
            flex={1}
            onPress={() => setActiveTab('pending')}
            bg={activeTab === 'pending' ? 'white' : 'transparent'}
            rounded="full"
            py={2}
            alignItems="center"
          >
            <Text
              fontWeight="bold"
              color={activeTab === 'pending' ? 'purple.600' : 'gray.600'}
            >
              Escolhidos ({pending.length})
            </Text>
          </Pressable>
        </HStack>
      </Box>

      {/* 🎁 ABA CATÁLOGO */}
      {activeTab === 'catalog' && (
        <FlatList
          data={rewards.filter((r) => r.isActive)}
          keyExtractor={(item) => item.id}
          px={4}
          mt={4}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text textAlign="center" mt={10} color="gray.500">
              Nenhum brinde disponível.
            </Text>
          }
          renderItem={({ item }) => {
            const canRedeem = balance >= item.pointsCost && item.stock > 0
            const missingPoints = item.pointsCost - balance

            return (
              <Box
                bg="gray.100"
                rounded="3xl"
                shadow={3}
                mb={6}
                overflow="hidden"
              >
                {item.image && (
                  <Box height={180} bg="gray.200" borderWidth={0.24}>
                    <Image
                      source={{ uri: item.image }}
                      alt={item.title}
                      width="100%"
                      height="100%"
                      resizeMode="stretch"
                    />
                  </Box>
                )}

                <VStack p={5} space={3}>
                  <Text fontSize="lg" fontWeight="bold">
                    {item.title}
                  </Text>

                  {item.description && (
                    <Text fontSize="sm" color="gray.500">
                      {item.description}
                    </Text>
                  )}

                  {!canRedeem && item.stock > 0 && (
                    <Text fontSize="xs" color="red.400">
                      Faltam {missingPoints} pontos
                    </Text>
                  )}

                  <Button
                    mt={2}
                    bg={canRedeem ? 'purple.600' : 'red.400'}
                    isDisabled={!canRedeem}
                    onPress={() => handleRedeem(item.id)}
                    rounded="2xl"
                  >
                    {canRedeem ? 'Resgatar agora' : 'Pontos insuficientes'}
                  </Button>
                </VStack>
              </Box>
            )
          }}
        />
      )}

      {/* 🎟 ABA PENDENTES */}
      {activeTab === 'pending' && (
        <FlatList
          data={pending}
          keyExtractor={(item) => item.id}
          px={4}
          mt={4}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text textAlign="center" mt={10} color="gray.500">
              Nenhum brinde pendente.
            </Text>
          }
          renderItem={({ item }) => (
            <Box
              bg="orange.50"
              borderColor="orange.300"
              borderWidth={1}
              rounded="2xl"
              p={5}
              mb={4}
            >
              <HStack justifyContent="space-between" alignItems="center">
                <VStack flex={1}>
                  <Text bold>{item.reward.title}</Text>
                  <Text fontSize="xs" color="gray.500">
                    Aguardando validação
                  </Text>
                </VStack>

                <Button
                  size="sm"
                  bg="orange.500"
                  rounded="xl"
                  onPress={() =>
                    navigation.navigate('rewardQRCode', {
                      redemptionId: item.id,
                      storeId,
                    })
                  }
                >
                  Mostrar QR
                </Button>
              </HStack>
            </Box>
          )}
        />
      )}
    </Box>
  )
}
