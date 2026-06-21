import { useCallback, useContext, useEffect, useState } from 'react'
import { RefreshControl, FlatList as RNFlatList } from 'react-native'
import {
  VStack,
  Box,
  Text,
  Pressable,
  Icon,
  useToast,
  Image,
  HStack,
} from 'native-base'
import { useNavigation } from '@react-navigation/native'
import { Image as ImageIcon } from 'lucide-react-native'

import { api } from '@services/api'
import { CityContext } from '@contexts/CityContext'
import { AppError } from '@utils/AppError'
import { Loading } from '@components/Loading'

import { StoreDTO } from '@dtos/StoreDTO'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { RatingStars } from '@components/RatingStars'
import { HomeScreen } from '@components/HomeScreen'

type Props = {
  insideScrollView?: boolean
}

export function StoreList({ insideScrollView = false }: Props) {
  const [stores, setStores] = useState<StoreDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const { city } = useContext(CityContext)
  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const toast = useToast()

  async function loadStores(showLoader = true) {
    if (!city?.id) {
      setStores([])
      setIsLoading(false)
      return
    }

    try {
      if (showLoader) setIsLoading(true)

      const response = await api.get(`/stores/city/${city.id}`)
      setStores(response.data)
    } catch (error) {
      const title =
        error instanceof AppError
          ? error.message
          : 'Não foi possível carregar lojas.'

      toast.show({
        title,
        placement: 'top',
        bgColor: 'red.500',
      })
    } finally {
      if (showLoader) setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStores(true)
  }, [city?.id])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadStores(false)
    setRefreshing(false)
  }, [city?.id])

  function handleOpenSubCategories(storeId: string, categoryId: string) {
    navigation.navigate('productsBySubCategory', {
      storeId,
      categoryId,
      screenkey: `${storeId}-${categoryId}-${Date.now()}`,
    } as any)
  }

  if (isLoading) return <Loading />

  return (
    <VStack flex={1} bg="coolGray.50">
      <HomeScreen title="Lojas" />
      <RNFlatList
        data={stores}
        keyExtractor={(item) => item.id}
        scrollEnabled={!insideScrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          !insideScrollView ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
        ListHeaderComponent={
          <>
            <HStack
              px={4}
              pt={4}
              pb={3}
              justifyContent="space-between"
              alignItems="center"
            >
              <Text fontSize="md" fontWeight="700" color="coolGray.800">
                🏪 Pesquise por categoria
              </Text>

              <Text fontSize="sm" color="blue.600" fontWeight="600">
                {stores.length} lojas
              </Text>
            </HStack>
          </>
        }
        ListEmptyComponent={
          <Box px={4} mt={8}>
            <Box bg="white" borderRadius={24} p={6} alignItems="center">
              <Text fontSize="md" fontWeight="700" color="coolGray.700">
                Nenhuma loja encontrada
              </Text>

              <Text
                mt={2}
                fontSize="sm"
                color="coolGray.500"
                textAlign="center"
              >
                Ainda não há estabelecimentos cadastrados para esta cidade.
              </Text>
            </Box>
          </Box>
        }
        contentContainerStyle={{
          paddingBottom: 120,
        }}
        ItemSeparatorComponent={() => <Box h={2} />}
        renderItem={({ item: store }) => (
          <Box mx={4} bg="white" borderRadius={24} shadow={2} px={4} py={2}>
            <VStack space={3}>
              <Text fontSize="sm" fontWeight="700" color="coolGray.800">
                {store.name}
              </Text>

              <RatingStars rating={store.rating} count={store.ratingCount} />

              {store.categories?.length ? (
                <RNFlatList
                  data={store.categories}
                  horizontal
                  keyExtractor={(cat) => cat.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingTop: 2,
                  }}
                  renderItem={({ item: cat }) => (
                    <Pressable
                      onPress={() => handleOpenSubCategories(store.id, cat.id)}
                    >
                      <VStack width={90} mr={4} alignItems="center">
                        <Box
                          width={90}
                          height={70}
                          borderRadius={20}
                          bg="coolGray.100"
                          overflow="hidden"
                          alignItems="center"
                          justifyContent="center"
                        >
                          {cat.image ? (
                            <Image
                              source={{ uri: cat.image }}
                              alt={cat.name}
                              w="100%"
                              h="100%"
                              resizeMode="cover"
                            />
                          ) : (
                            <Icon
                              as={ImageIcon}
                              size="6"
                              color="coolGray.500"
                            />
                          )}
                        </Box>

                        <Text
                          mt={2}
                          fontSize="xs"
                          textAlign="center"
                          numberOfLines={1}
                          color="coolGray.700"
                        >
                          {cat.name}
                        </Text>
                      </VStack>
                    </Pressable>
                  )}
                />
              ) : (
                <Text fontSize="xs" color="coolGray.500">
                  Sem categorias disponíveis.
                </Text>
              )}
            </VStack>
          </Box>
        )}
      />
    </VStack>
  )
}
