import { Box, Image, Text, VStack, Pressable, Badge } from 'native-base'
import { Dimensions } from 'react-native'
import { ProductDTO } from '@dtos/ProductDTO'

type Props = {
  data: ProductDTO
  onPress: () => void
}

const CARD_WIDTH = Dimensions.get('window').width * 0.35

export function ProductCard({ data, onPress }: Props) {
  const price = Number(data.price)
  const discountPercent = Number(data.cashbackPercentage ?? 0)

  const originalPrice =
    discountPercent > 0 ? price / (1 - discountPercent / 100) : price

  return (
    <Pressable onPress={onPress} mr={4}>
      <Box
        bg="white"
        borderRadius="xl"
        shadow={3}
        width={CARD_WIDTH}
        overflow="hidden"
      >
        {/* 🔥 Badge dentro do card */}
        {discountPercent > 0 && (
          <Badge
            position="absolute"
            top={4}
            right={6}
            bg="red.600"
            rounded="full"
            px={2}
            zIndex={20}
          >
            <Text color="white" fontSize="xs" fontWeight="bold">
              -{discountPercent}%
            </Text>
          </Badge>
        )}

        {/* 📷 Imagem responsiva */}
        <Image
          source={{ uri: data.image }}
          alt={data.name}
          width="50%"
          alignItems={'center'}
          marginTop={'2'}
          height={16}
          resizeMode="contain"
        />

        <VStack p={3}>
          <Text bold fontSize="sm" numberOfLines={1}>
            {data.name}
          </Text>

          {discountPercent > 0 ? (
            <>
              <Text fontSize="xs" color="gray.400" strikeThrough>
                R$ {originalPrice.toFixed(2)}
              </Text>

              <Text fontSize="lg" fontWeight="bold" color="red.600">
                R$ {price.toFixed(2)}
              </Text>
            </>
          ) : (
            <Text fontSize="lg" fontWeight="bold">
              R$ {price.toFixed(2)}
            </Text>
          )}
        </VStack>
      </Box>
    </Pressable>
  )
}
