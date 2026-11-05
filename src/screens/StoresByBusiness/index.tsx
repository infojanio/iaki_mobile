import { Box, Text, VStack, useToast } from 'native-base'
import { useCallback, useContext, useRef, useState } from 'react'
import {
  useFocusEffect,
  useRoute,
  useNavigation,
} from '@react-navigation/native'
import { AppState, FlatList } from 'react-native'

import { api } from '@services/api'
import { AppError } from '@utils/AppError'

import { StoreDTO } from '@dtos/StoreDTO'
import { Loading } from '@components/Loading'
import { StoreCard } from '@components/Store/StoreCard'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { CityContext } from '@contexts/CityContext'

import { HomeScreen } from '@components/HomeScreen'

type RouteParams = {
  businessCategoryId: string
}

export function StoresByBusiness() {
  const toast = useToast()
  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const route = useRoute()

  const { city } = useContext(CityContext)
  const { businessCategoryId } = route.params as RouteParams

  const [stores, setStores] = useState<StoreDTO[]>([])
  const [isLoading, setIsLoading] = useState(false)

  function handleOpenStore(storeId: string) {
    navigation.navigate('storeProducts', {
      storeId,
    })
  }

  const cityId = city?.id
  const requestIdRef = useRef(0)
  const [refreshing, setRefreshing] = useState(false)

  const fetchStores = useCallback(
    async (mode: 'loading' | 'refresh' | 'silent' = 'silent') => {
      const requestId = ++requestIdRef.current

      setIsLoading(mode === 'loading')
      setRefreshing(mode === 'refresh')

      if (!cityId || !businessCategoryId) {
        setStores([])
        setIsLoading(false)
        setRefreshing(false)
        return
      }

      try {
        const { data } = await api.get<StoreDTO[]>(
          `/stores/city/${cityId}/category/${businessCategoryId}`,
        )

        if (requestId === requestIdRef.current) {
          setStores(data)
        }
      } catch (error) {
        if (requestId !== requestIdRef.current || mode === 'silent') return

        toast.show({
          title:
            error instanceof AppError
              ? error.message
              : 'Não foi possível carregar as lojas',
          placement: 'top',
          bgColor: 'red.500',
        })
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false)
          setRefreshing(false)
        }
      }
    },
    [businessCategoryId, cityId, toast],
  )

  useFocusEffect(
    useCallback(() => {
      void fetchStores('loading')

      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') void fetchStores()
      })

      const interval = setInterval(() => {
        if (AppState.currentState === 'active') void fetchStores()
      }, 15_000)

      return () => {
        requestIdRef.current += 1
        subscription.remove()
        clearInterval(interval)
      }
    }, [fetchStores]),
  )

  return (
    <VStack flex={1} bg="gray.100" safeArea>
      <HomeScreen title="Estabelecimentos" />

      {isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 8 }}
          refreshing={refreshing}
          onRefresh={() => void fetchStores('refresh')}
          renderItem={({ item }) => (
            <StoreCard store={item} onPress={() => handleOpenStore(item.id)} />
          )}
          ListEmptyComponent={
            <Box mt={2}>
              <Text textAlign="center">
                Nenhuma loja encontrada para essa categoria.
              </Text>
            </Box>
          }
        />
      )}
    </VStack>
  )
}
