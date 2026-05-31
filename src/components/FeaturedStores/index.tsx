import { FlatList, Pressable } from 'react-native'
import { Box, HStack, VStack, Text, Image, Spinner } from 'native-base'

import { useNavigation } from '@react-navigation/native'
import { AppNavigatorRoutesProps } from '@routes/app.routes'

import { StoreDTO } from '@dtos/StoreDTO'

interface FeaturedStoresProps {
  stores: StoreDTO[]
  isLoading?: boolean
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

  function handleViewAllStores() {
    navigation.navigate('storeList')
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
      {/* HEADER */}
      <HStack justifyContent="space-between" alignItems="center" px={4} mb={3}>
        <Text fontSize="xl" fontWeight="700" color="gray.800">
          🏪 Lojas em destaque
        </Text>

        <Pressable onPress={handleViewAllStores}>
          <Text color="blue.600" fontWeight="600" fontSize="sm">
            Ver todas →
          </Text>
        </Pressable>
      </HStack>

      {/* LISTA */}
      <FlatList
        horizontal
        data={stores}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 8,
        }}
        renderItem={({ item }) => (
          <Pressable onPress={() => handleOpenStore(item.id)}>
            <Box
              w={280}
              bg="white"
              borderRadius={24}
              overflow="hidden"
              mr={4}
              shadow={2}
            >
              {/* BANNER */}
              <Image
                source={{
                  uri:
                    item.slug || item.avatar || 'https://placehold.co/600x300',
                }}
                alt={item.name}
                h={32}
                w="100%"
                resizeMode="cover"
              />

              {/* CONTEÚDO */}
              <Box px={4} pb={4}>
                {/* LOGO */}
                <Box mt={-10}>
                  <Image
                    source={{
                      uri: item.avatar || 'https://placehold.co/200',
                    }}
                    alt={item.name}
                    w={20}
                    h={20}
                    borderRadius={999}
                    borderWidth={4}
                    borderColor="white"
                    bg="white"
                  />
                </Box>

                {/* NOME */}
                <Text
                  mt={2}
                  fontSize="lg"
                  fontWeight="700"
                  color="gray.800"
                  numberOfLines={1}
                >
                  {item.name}
                </Text>

                {/* DESCRIÇÃO */}
                <Text fontSize="sm" color="gray.500" numberOfLines={1}>
                  Loja parceira IAki
                </Text>

                {/* CASHBACK */}
                <Box
                  mt={3}
                  alignSelf="flex-start"
                  bg="green.100"
                  px={3}
                  py={1}
                  borderRadius={999}
                >
                  <Text color="green.700" fontSize="xs" fontWeight="700">
                    💰 Acumule pontos!
                  </Text>
                </Box>
              </Box>
            </Box>
          </Pressable>
        )}
      />
    </VStack>
  )
}
