import { FlatList as RNFlatList, RefreshControl } from 'react-native'

import { VStack, Box, Text, Pressable, Icon, Image, HStack } from 'native-base'

import { useNavigation } from '@react-navigation/native'

import { Image as ImageIcon } from 'lucide-react-native'

import { Loading } from '@components/Loading'
import { RatingStars } from '@components/RatingStars'

import { StoreDTO } from '@dtos/StoreDTO'

import { AppNavigatorRoutesProps } from '@routes/app.routes'

type Props = {
  insideScrollView?: boolean
  stores: StoreDTO[]
  isLoading?: boolean
  refreshing?: boolean
  onRefresh?: () => void | Promise<void>
}

export function StoreListContent({
  insideScrollView = false,
  stores,
  isLoading = false,
  refreshing = false,
  onRefresh,
}: Props) {
  const navigation = useNavigation<AppNavigatorRoutesProps>()

  function handleOpenSubCategories(storeId: string, categoryId: string) {
    navigation.navigate('productsBySubCategory', {
      storeId,
      categoryId,
      screenkey: `${storeId}-${categoryId}-${Date.now()}`,
    } as any)
  }

  if (isLoading) {
    return <Loading />
  }

  return (
    <VStack flex={1} bg="blue.50" mb={2}>
      <RNFlatList
        data={stores}
        keyExtractor={(store) => store.id}
        scrollEnabled={!insideScrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          !insideScrollView && onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
        ListHeaderComponent={
          <HStack
            px={4}
            pt={4}
            pb={4}
            justifyContent="space-between"
            alignItems="center"
          >
            <Text fontSize="md" fontWeight="700" color="coolGray.800">
              ⭐ Lojas em destaque
            </Text>

            <Text fontSize="sm" color="blue.600" fontWeight="600">
              {stores.length} {stores.length === 1 ? 'loja' : 'lojas'}
            </Text>
          </HStack>
        }
        ListEmptyComponent={
          <Box px={4} mt={8}>
            <Box bg="white" borderRadius={24} p={6} alignItems="center">
              <Text fontSize="md" fontWeight="700" color="coolGray.700">
                Nenhuma loja PREMIUM encontrada
              </Text>

              <Text
                mt={2}
                fontSize="sm"
                color="coolGray.500"
                textAlign="center"
              >
                Ainda não há lojas em destaque nesta cidade.
              </Text>
            </Box>
          </Box>
        }
        contentContainerStyle={{
          paddingBottom: 20,
        }}
        ItemSeparatorComponent={() => <Box h={2} />}
        renderItem={({ item: store }) => (
          <Box mx={4} bg="white" borderRadius={24} shadow={2} px={4} py={3}>
            <VStack space={3}>
              <HStack justifyContent="space-between" alignItems="center">
                <Text
                  flex={1}
                  fontSize="sm"
                  fontWeight="700"
                  color="coolGray.800"
                  numberOfLines={1}
                >
                  {store.name}
                </Text>

                <Box ml={2} px={2} py={1} borderRadius="full" bg="yellow.100">
                  <Text fontSize="2xs" color="yellow.800" fontWeight="700">
                    PREMIUM
                  </Text>
                </Box>
              </HStack>

              <RatingStars rating={store.rating} count={store.ratingCount} />

              {Array.isArray(store.categories) &&
              store.categories.length > 0 ? (
                <RNFlatList
                  data={store.categories}
                  horizontal
                  keyExtractor={(category) => `${store.id}-${category.id}`}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingTop: 2,
                    paddingRight: 8,
                  }}
                  renderItem={({ item: category }) => (
                    <Pressable
                      onPress={() =>
                        handleOpenSubCategories(store.id, category.id)
                      }
                      _pressed={{
                        opacity: 0.7,
                      }}
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
                          {category.image ? (
                            <Image
                              source={{
                                uri: category.image,
                              }}
                              alt={category.name}
                              w="100%"
                              h="100%"
                              resizeMode="stretch"
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
                          {category.name}
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
