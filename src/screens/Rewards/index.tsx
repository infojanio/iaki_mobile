import { useCallback, useContext, useMemo, useState } from 'react'

import { FlatList, RefreshControl, TextInput } from 'react-native'

import { Box, Center, Spinner, Text, VStack, useToast } from 'native-base'

import { useFocusEffect, useNavigation } from '@react-navigation/native'

import { api } from '@services/api'

import { CityContext } from '@contexts/CityContext'

import { RewardDTO } from '@dtos/RewardDTO'

import { AppNavigatorRoutesProps } from '@routes/app.routes'

import { HomeScreen } from '@components/HomeScreen'

import { RewardCard } from '@components/Reward/RewardCard'

export function Rewards() {
  const toast = useToast()

  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const { city } = useContext(CityContext)

  const [rewards, setRewards] = useState<RewardDTO[]>([])

  const [search, setSearch] = useState('')

  const [isLoading, setIsLoading] = useState(true)

  const [refreshing, setRefreshing] = useState(false)

  /* ======================================================
     CARREGAR BRINDES
  ====================================================== */

  const loadRewards = useCallback(async () => {
    if (!city?.id) {
      setRewards([])
      setIsLoading(false)
      setRefreshing(false)

      return
    }

    try {
      const response = await api.get(`/rewards/city/${city.id}`)

      const responseRewards =
        response.data?.rewards ?? response.data?.data ?? response.data ?? []

      setRewards(Array.isArray(responseRewards) ? responseRewards : [])
    } catch (error: any) {
      console.error('[Rewards] Erro ao carregar brindes:', {
        status: error?.response?.status,

        data: error?.response?.data,

        message: error?.message,
      })

      setRewards([])

      toast.show({
        title: 'Não foi possível carregar os brindes.',

        description: error?.response?.data?.message,

        placement: 'top',

        bgColor: 'red.500',
      })
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [city?.id, toast])

  /* ======================================================
     ATUALIZAR AO ENTRAR NA TELA
  ====================================================== */

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true)

      loadRewards()
    }, [loadRewards]),
  )

  /* ======================================================
     FILTRAR BRINDES
  ====================================================== */

  const filteredRewards = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR')

    return rewards.filter((reward) => {
      const isAvailable = reward.isActive && Number(reward.stock ?? 0) > 0

      if (!isAvailable) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      const rewardName = reward.title?.toLocaleLowerCase('pt-BR') ?? ''

      const storeName = reward.store?.name?.toLocaleLowerCase('pt-BR') ?? ''

      return (
        rewardName.includes(normalizedSearch) ||
        storeName.includes(normalizedSearch)
      )
    })
  }, [rewards, search])

  /* ======================================================
     ABRIR LOJA DO BRINDE
  ====================================================== */

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

  /* ======================================================
     REFRESH
  ====================================================== */

  async function handleRefresh() {
    setRefreshing(true)

    await loadRewards()
  }

  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <VStack flex={1} bg="coolGray.50">
      <HomeScreen title="Brindes" />

      {/* CABEÇALHO */}

      <Box px={4} pt={3} pb={2}>
        <Text fontSize="xl" fontWeight="bold" color="coolGray.800">
          Troque seus pontos
        </Text>

        <Text mt={1} fontSize="sm" color="coolGray.500">
          Brindes disponíveis nas lojas de {city?.name ?? 'sua cidade'}.
        </Text>

        {/* BUSCA */}

        <Box
          mt={4}
          bg="white"
          borderWidth={1}
          borderColor="coolGray.300"
          borderRadius="xl"
          height={46}
          px={4}
          justifyContent="center"
        >
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar brinde ou loja"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
            style={{
              flex: 1,
              fontSize: 14,
              color: '#1F2937',
              paddingVertical: 0,
            }}
          />
        </Box>
      </Box>

      {/* LOADING */}

      {isLoading ? (
        <Center flex={1}>
          <Spinner size="lg" color="purple.500" />

          <Text mt={3} color="coolGray.500">
            Carregando brindes...
          </Text>
        </Center>
      ) : (
        /* LISTA */

        <FlatList
          data={filteredRewards}
          numColumns={2}
          keyExtractor={(reward) => reward.id}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={{
            paddingHorizontal: 12,

            paddingTop: 12,

            paddingBottom: 40,

            flexGrow: filteredRewards.length === 0 ? 1 : undefined,
          }}
          columnWrapperStyle={{
            justifyContent: 'space-between',
          }}
          ItemSeparatorComponent={() => <Box height={14} />}
          renderItem={({ item }) => (
            <Box width="48%">
              <RewardCard
                reward={item}
                width="100%"
                onPress={() => handleOpenReward(item)}
              />
            </Box>
          )}
          ListEmptyComponent={
            <Center flex={1} px={6} py={16}>
              <Text
                fontSize="lg"
                fontWeight="bold"
                color="coolGray.700"
                textAlign="center"
              >
                Nenhum brinde encontrado
              </Text>

              <Text
                mt={2}
                fontSize="sm"
                color="coolGray.500"
                textAlign="center"
              >
                {search.trim()
                  ? 'Nenhum brinde ou loja corresponde à sua busca.'
                  : `Ainda não há brindes disponíveis para ${
                      city?.name ?? 'esta cidade'
                    }.`}
              </Text>
            </Center>
          }
        />
      )}
    </VStack>
  )
}
