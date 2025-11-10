import { TouchableOpacity, TouchableOpacityProps } from 'react-native'
import { VStack, Image, Text, Center, Box } from 'native-base'

import { api } from '@services/api'
import { ProductDTO } from '@dtos/ProductDTO'

export type ProductCardProps = TouchableOpacityProps & {
  product: ProductDTO
}

export function ProductCard({ product, ...rest }: ProductCardProps) {
  return (
    <TouchableOpacity {...rest}>
      <VStack
        mr={1}
        mt={3}
        bg="white"
        alignItems={'normal'}
        w={150}
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
              resizeMode="stretch"
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
          </Center>

          <Box bg="red.500" rounded="md" pl="1" pr="1">
            <Text fontSize="13" color="gray.100" numberOfLines={1}>
              {product.quantity} unidades
            </Text>
          </Box>
          <Center h={10} w={32}>
            <Text
              color={'black'}
              fontWeight={'bold'}
              fontSize="16"
              numberOfLines={2}
            >
              R$ {Number(product.price).toFixed(2)}
            </Text>

            <Box bg="green.500" rounded="md" pl="1" pr="1">
              <Text fontSize="14" color="gray.100" numberOfLines={1}>
                {product.cashback_percentage}% cashback
              </Text>
            </Box>
          </Center>
        </Center>
      </VStack>
    </TouchableOpacity>
  )
}
