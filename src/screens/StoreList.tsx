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
    <VStack flex={1} bg="coolGray.50" px={3} py={2}>
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
        renderItem={({ item: store }) => (
          <Box bg="white" rounded="2xl" shadow="1" px={3} py={3} mb={3}>
            <Text fontSize="14" fontStyle="italic" fontWeight="700" mb={2}>
              {store.name}
            </Text>

            {store.categories?.length ? (
              <RNFlatList
                data={store.categories}
                keyExtractor={(cat: CategoryDTO) => cat.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item: cat }) => (
                  <Pressable
                    onPress={() => handleOpenSubCategories(store.id, cat.id)}
                  >
                    <VStack mr={6} width={84} alignItems="center">
                      <Box
                        bg="coolGray.100"
                        rounded="xl"
                        width={90}
                        height={60}
                        alignItems="center"
                        justifyContent="center"
                      >
                        {cat.image ? (
                          <Image
                            source={{ uri: cat.image }}
                            alt={cat.name}
                            width="100%"
                            height="100%"
                            borderRadius="3xl"
                            resizeMode="cover"
                          />
                        ) : (
                          <Icon as={ImageIcon} size="6" color="coolGray.500" />
                        )}
                      </Box>

                      <Text
                        mt={1}
                        fontSize="xs"
                        numberOfLines={1}
                        textAlign="center"
                      >
                        {cat.name}
                      </Text>
                    </VStack>
                  </Pressable>
                )}
              />
            ) : (
              <Text fontSize="xs" color="coolGray.500">
                Sem categorias.
              </Text>
            )}
          </Box>
        )}
      />
    </VStack>
  )
}
