import { FlatList, Pressable } from 'react-native'
import { Box, HStack, VStack, Text, Image, Spinner } from 'native-base'

import { MaterialIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'

import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { StoreDTO } from '@dtos/StoreDTO'

interface FeaturedStoresProps {
  stores: StoreDTO[]
  isLoading?: boolean
}

type StoreRatingProps = {
  rating?: number | null
  ratingCount?: number | null
}

function StoreRating({ rating, ratingCount }: StoreRatingProps) {
  const parsedRating = Number(rating)
  const parsedCount = Number(ratingCount)

  const count = Number.isFinite(parsedCount)
    ? Math.max(0, Math.floor(parsedCount))
    : 0

  const hasRating =
    count > 0 &&
    Number.isFinite(parsedRating) &&
    parsedRating >= 0 &&
    parsedRating <= 5

  if (!hasRating) {
    return (
      <HStack
        alignItems="center"
        space={1}
        accessibilityLabel="Loja ainda sem avaliações"
      >
        <MaterialIcons name="star-outline" size={17} color="#98A2B3" />

        <Text fontSize="xs" color="#667085">
          Sem avaliações
        </Text>
      </HStack>
    )
  }

  const formattedRating = parsedRating.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })

  const formattedCount = count.toLocaleString('pt-BR')

  return (
    <HStack
      alignItems="center"
      space={1.5}
      flexWrap="wrap"
      accessibilityLabel={`Nota ${formattedRating} de 5, com ${formattedCount} ${
        count === 1 ? 'avaliação' : 'avaliações'
      }`}
    >
      <Box bg="#FFFAEB" px={2} py={1} borderRadius={8}>
        <HStack alignItems="center" space={1}>
          <MaterialIcons name="star" size={16} color="#B77900" />

          <Text fontSize="xs" fontWeight="bold" color="#854A0E">
            {formattedRating}
          </Text>
        </HStack>
      </Box>

      <Text fontSize="xs" color="#667085">
        {formattedCount} {count === 1 ? 'avaliação' : 'avaliações'}
      </Text>
    </HStack>
  )
}

export function FeaturedStores({
  stores,
  isLoading = false,
}: FeaturedStoresProps) {
  const navigation = useNavigation<AppNavigatorRoutesProps>()

  function handleOpenStore(storeId: string) {
    navigation.navigate('storeProducts', {
      storeId,
    })
  }

  if (isLoading) {
    return (
      <Box py={6}>
        <Spinner color="blue.600" />
      </Box>
    )
  }

  if (!stores?.length) {
    return null
  }

  return (
    <VStack mt={5}>
      <HStack justifyContent="space-between" alignItems="center" px={4} mb={3}>
        <Text fontSize="xl" fontWeight="700" color="gray.800">
          🏪 Lojas Premium
        </Text>
      </HStack>

      <FlatList
        horizontal
        data={stores}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 12,
        }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleOpenStore(item.id)}
            accessibilityRole="button"
            accessibilityLabel={`Conhecer a loja ${item.name}`}
            style={({ pressed }) => ({
              marginRight: 16,
              opacity: pressed ? 0.9 : 1,
              transform: [
                {
                  scale: pressed ? 0.985 : 1,
                },
              ],
            })}
          >
            <Box
              w={280}
              bg="white"
              borderRadius={24}
              overflow="hidden"
              borderWidth={1}
              borderColor="#E8EBF2"
            >
              {/* BANNER */}

              {item.slug || item.avatar ? (
                <Image
                  source={{
                    uri: item.slug || item.avatar || '',
                  }}
                  alt={`Imagem da loja ${item.name}`}
                  h={32}
                  w="100%"
                  resizeMode="cover"
                  bg="#F0EDF8"
                />
              ) : (
                <Box
                  h={32}
                  w="100%"
                  bg="#F0EDF8"
                  alignItems="center"
                  justifyContent="center"
                >
                  <MaterialIcons name="storefront" size={44} color="#A89BC2" />
                </Box>
              )}

              <Box px={4} pb={4}>
                {/* LOGO */}

                <Box mt={-10} alignSelf="flex-start">
                  {item.avatar ? (
                    <Image
                      source={{
                        uri: item.avatar,
                      }}
                      alt={`Logo da loja ${item.name}`}
                      w={20}
                      h={20}
                      borderRadius={999}
                      borderWidth={4}
                      borderColor="white"
                      bg="white"
                      resizeMode="cover"
                    />
                  ) : (
                    <Box
                      w={20}
                      h={20}
                      borderRadius={999}
                      borderWidth={4}
                      borderColor="white"
                      bg="#F5F3FF"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <MaterialIcons
                        name="storefront"
                        size={30}
                        color="#7C3AED"
                      />
                    </Box>
                  )}
                </Box>

                {/* NOME */}

                <Text
                  mt={2}
                  fontSize="lg"
                  fontWeight="700"
                  color="#182230"
                  numberOfLines={1}
                >
                  {item.name}
                </Text>

                <Text mt={0.5} fontSize="xs" color="#667085" numberOfLines={1}>
                  Destaque IAkí
                </Text>

                {/* AVALIAÇÕES */}
                <HStack>
                  <Box mt={3} minHeight={8} justifyContent="center">
                    <StoreRating
                      rating={item.rating}
                      ratingCount={item.ratingCount}
                    />
                  </Box>

                  {/* PONTOS */}

                  <Box
                    mt={4}
                    ml={6}
                    alignSelf="flex-start"
                    bg="#F5F3FF"
                    px={2}
                    py={1}
                    borderRadius={10}
                  >
                    <HStack alignItems="center" space={1.5}>
                      <MaterialIcons name="stars" size={16} color="#7C3AHD" />

                      <Text color="#6D28D9" fontSize="xs" fontWeight="600">
                        Acumule pontos
                      </Text>
                    </HStack>
                  </Box>
                </HStack>
              </Box>
            </Box>
          </Pressable>
        )}
      />
    </VStack>
  )
}
