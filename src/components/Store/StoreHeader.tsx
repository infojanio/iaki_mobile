import { Box, Text, VStack, HStack, Image } from 'native-base'
import { MaterialIcons } from '@expo/vector-icons'
import { StoreDTO } from '@dtos/StoreDTO'

type Props = {
  store: StoreDTO
}

export function StoreHeader({ store }: Props) {
  return (
    <Box>
      {/* Avatar / imagem da loja */}
      <Image source={{ uri: store.avatar }} alt={store.name} h={180} w="100%" />

      {/* Card flutuante */}
      <Box
        bg="white"
        opacity={0.96}
        mx={4}
        mt={-10}
        p={4}
        borderRadius="xl"
        shadow={3}
      >
        <VStack space={1}>
          <Text fontSize="md" color="gray.800" fontWeight="bold">
            {store.name}
          </Text>

          {!!store.city && (
            <Text fontSize="sm" color="gray.700">
              {store.city.name} · {store.city.uf}
            </Text>
          )}

          {!!store.street && (
            <Text fontSize="sm" color="gray.700">
              {store.street}
            </Text>
          )}

          {/* Avaliação */}
          {typeof store.rating === 'number' && (
            <HStack alignItems="center" space={1} mt={2}>
              <MaterialIcons name="star" size={16} color="#FBBF24" />
              <Text fontSize="sm" fontWeight="bold">
                {store.rating.toFixed(1)}
              </Text>
              <Text fontSize="xs" color="gray.500">
                ({store.ratingCount ?? 0})
              </Text>
            </HStack>
          )}

          {/* Status */}
          <Text
            mt={2}
            fontSize="sm"
            fontWeight="bold"
            color={store.isActive ? 'green.600' : 'red.500'}
          >
            {store.isActive ? 'Loja disponível' : 'Loja indisponível'}
          </Text>
        </VStack>
      </Box>
    </Box>
  )
}
