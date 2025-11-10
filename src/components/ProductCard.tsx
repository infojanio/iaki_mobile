import { Box, HStack, Image, Text, VStack, Pressable } from 'native-base'
import { ProductDTO } from '@dtos/ProductDTO'

type Props = {
  data: ProductDTO
  onPress: () => void
}

export function ProductCard({ data, onPress }: Props) {
  const cashbackValue = (Number(data.price) * data.cashback_percentage) / 100

  return (
    <Pressable onPress={onPress} mr={2}>
      <Box
        bg="white"
        borderRadius="lg"
        shadow={2}
        mb={4}
        overflow="hidden"
        p={2}
      >
        <HStack space={3} alignItems="center">
          <Image
            source={{ uri: data.image }}
            alt={data.name}
            w={70}
            h={70}
            borderRadius="md"
            resizeMode="cover"
          />

          <VStack flex={1}>
            <Text bold fontSize="md">
              {data.name}
            </Text>
            <Text color="gray.600">R$ {Number(data.price).toFixed(2)}</Text>
            <Text color="green.500" fontWeight="bold">
              Cashback R$ {cashbackValue.toFixed(2)}
            </Text>
          </VStack>
        </HStack>
      </Box>
    </Pressable>
  )
}
