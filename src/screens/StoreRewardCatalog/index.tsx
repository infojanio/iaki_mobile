import { useEffect, useState, useCallback } from 'react'
import {
  Box,
  Text,
  FlatList,
  Button,
  VStack,
  HStack,
  Spinner,
  useToast,
  Divider,
  Pressable,
  Badge,
} from 'native-base'
import { RefreshControl, Alert } from 'react-native'
import { useRoute, useFocusEffect } from '@react-navigation/native'
import { api } from '@services/api'
import { HomeScreen } from '@components/HomeScreen'

interface Reward {
  id: string
  title: string
  description?: string
  pointsCost: number
  stock: number
  isActive: boolean
}

interface Wallet {
  balance: number
  earned: number
  spent: number
  transactions?: any[]
}

interface RouteParams {
  storeId: string
}

export function StoreRewardCatalog() {
  const route = useRoute()
  const { storeId } = route.params as RouteParams

  const toast = useToast()

  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      const [walletResponse, rewardsResponse] = await Promise.all([
        api.get(`/stores/${storeId}/points/me`),
        api.get(`/stores/${storeId}/rewards`),
      ])

      setWallet(walletResponse.data)
      setRewards(rewardsResponse.data)
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

  const handleRedeem = async (rewardId: string, pointsCost: number) => {
    try {
      await api.post(`/stores/${storeId}/rewards/${rewardId}/redeem`)

      toast.show({
        title: '🎉 Brinde resgatado com sucesso!',
        placement: 'top',
        bgColor: 'green.500',
      })

      // Atualiza carteira automaticamente
      fetchData()
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
    <Box flex={1} bg="gray.50">
      <HomeScreen title="Catálogo de Brindes" />

      {/* 🪙 Saldo */}
      <Box mx={4} mt={4} p={6} bg="purple.600" rounded="2xl" shadow={3}>
        <Text color="purple.100" fontSize="sm">
          Seus pontos disponíveis
        </Text>

        <Text fontSize="4xl" fontWeight="bold" color="white" mt={1}>
          {wallet?.balance ?? 0}
        </Text>

        <HStack justifyContent="space-between" mt={4}>
          <VStack>
            <Text fontSize="xs" color="purple.200">
              Acumulado
            </Text>
            <Text fontWeight="bold" color="green.200">
              {wallet?.earned ?? 0}
            </Text>
          </VStack>

          <VStack>
            <Text fontSize="xs" color="purple.200">
              Utilizado
            </Text>
            <Text fontWeight="bold" color="red.200">
              {wallet?.spent ?? 0}
            </Text>
          </VStack>
        </HStack>
      </Box>

      <Divider my={6} />

      {/* 🎁 Lista de brindes */}
      <FlatList
        data={rewards.filter((r) => r.isActive)}
        keyExtractor={(item) => item.id}
        px={4}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text textAlign="center" mt={10} color="gray.500">
            Nenhum brinde disponível no momento.
          </Text>
        }
        renderItem={({ item }) => {
          const canRedeem =
            wallet?.balance !== undefined &&
            wallet.balance >= item.pointsCost &&
            item.stock > 0

          return (
            <Box bg="white" p={5} rounded="2xl" shadow={2} mb={4}>
              <VStack space={3}>
                <HStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="md" fontWeight="bold">
                    {item.title}
                  </Text>

                  {item.stock <= 0 && (
                    <Badge colorScheme="coolGray">Esgotado</Badge>
                  )}
                </HStack>

                {item.description && (
                  <Text fontSize="sm" color="gray.500">
                    {item.description}
                  </Text>
                )}

                <Text fontSize="lg" fontWeight="bold" color="purple.600">
                  {item.pointsCost} pontos
                </Text>

                <Button
                  mt={2}
                  bg={canRedeem ? 'purple.600' : 'gray.300'}
                  _pressed={{ opacity: 0.8 }}
                  isDisabled={!canRedeem}
                  onPress={() => handleRedeem(item.id, item.pointsCost)}
                  rounded="xl"
                >
                  {canRedeem ? 'Resgatar' : 'Pontos insuficientes'}
                </Button>
              </VStack>
            </Box>
          )
        }}
      />
    </Box>
  )
}
