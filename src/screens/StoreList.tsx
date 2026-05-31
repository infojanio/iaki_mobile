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
import { CategoryDTO } from '@dtos/CategoryDTO'
import { RatingStars } from '@components/RatingStars'
import { HomeScreen } from '@components/HomeScreen'

type Props = {
  insideScrollView?: boolean
}

export function StoreList({ insideScrollView = true }: Props) {
  const [stores, setStores] = useState<StoreDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const { city } = useContext(CityContext)
  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const toast = useToast()

  async function loadStores(showLoader = true) {
    if (!city?.id) {
      setStores([])
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
    /**
     * 🔥 FORÇA REMOUNT DA TELA
     * Isso garante que ProductsBySubCategory
     * atualize corretamente ao trocar de loja
     */
    navigation.navigate('productsBySubCategory', {
      storeId,
      categoryId,
      screenkey: `${storeId}-${categoryId}-${Date.now()}`, // 👈 chave única
    } as any)
  }

  if (isLoading) return <Loading />

  return (
    <VStack flex={1} bg="coolGray.50" py={2}>
      <HomeScreen title="Voltar" />

      <HStack
        px={4}
        pt={2}
        pb={3}
        justifyContent="space-between"
        alignItems="center"
      >
        <Text fontSize="xl" fontWeight="700" color="coolGray.800">
          🏪 Lojas Parceiras
        </Text>

        <Text fontSize="sm" color="blue.600" fontWeight="600">
          {stores.length} lojas
        </Text>
      </HStack>

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
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 120,
        }}
        ItemSeparatorComponent={() => <Box h={4} />}
        renderItem={({ item: store }) => (
          <Box bg="white" borderRadius={24} shadow={2} px={4} py={4}>
            <VStack space={3}>
              <Text fontSize="lg" fontWeight="700">
                {store.name}
              </Text>

              <RatingStars rating={store.rating} count={store.ratingCount} />

              {store.categories?.length ? (
                <RNFlatList
                  data={store.categories}
                  horizontal
                  keyExtractor={(cat) => cat.id}
                  showsHorizontalScrollIndicator={false}
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
                              source={{
                                uri: cat.image,
                              }}
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
