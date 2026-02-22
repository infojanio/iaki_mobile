import { TouchableOpacity, TouchableOpacityProps } from 'react-native'
import { VStack, Image, Text, Center, Box, Badge } from 'native-base'

import { api } from '@services/api'
import { ProductDTO } from '@dtos/ProductDTO'

export type ProductCardProps = TouchableOpacityProps & {
  product: ProductDTO
}

export function ProductCard({ product, ...rest }: ProductCardProps) {
  const price = Number(product.price)
  const discountPercent = Number(product.cashbackPercentage ?? 0)

  const originalPrice =
    discountPercent > 0 ? price / (1 - discountPercent / 100) : price
  /*
  const discountValue = (price * discountPercent) / 100
  const finalPrice = price + discountValue
  */
  return (
    <TouchableOpacity {...rest}>
      <VStack
        mr={1}
        mt={3}
        bg="white"
        alignItems={'normal'}
        w={120}
        h={180}
        minW={24}
        rounded="md"
        mb="1"
        borderWidth={3.5}
        borderColor={'gray.100'}
      >
        <Center>
          <VStack mt="1" mb="1">
            <Image
              marginTop={1}
              w={90}
              h={70}
              source={{
                uri: product.image, //busca a URL da imagem
                //uri: `${api.defaults.baseURL}/images/thumb/${data.image}`, //busca o arquivo salvo no banco
              }}
              alt="Imagem"
              rounded="3xl"
              resizeMode="contain"
            />
          </VStack>
          <Center>
            <Text
              ml={2}
              mr={2}
              fontSize="14"
              color="black"
              fontFamily="heading"
              numberOfLines={1}
            >
              {product.name}
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
          </Center>

          <Box bg="red.500" rounded="md" pl="1" pr="1">
            <Text fontSize="13" color="gray.100" numberOfLines={1}>
              {product.quantity} unidades
            </Text>
          </Box>
        </Center>
      </VStack>
    </TouchableOpacity>
  )
}
