import { TouchableOpacity, TouchableOpacityProps } from 'react-native'

import {
  VStack,
  Image,
  Text,
  Center,
  Box,
  HStack,
  Icon,
  Spinner,
} from 'native-base'

import { Feather } from '@expo/vector-icons'

import { ProductDTO } from '@dtos/ProductDTO'

export type ProductCardProps = TouchableOpacityProps & {
  product: ProductDTO
  cartQuantity?: number
  isUpdating?: boolean
  onIncrement: () => void
  onDecrement: () => void
}

export function ProductCard({
  product,
  cartQuantity = 0,
  isUpdating = false,
  onIncrement,
  onDecrement,
  ...rest
}: ProductCardProps) {
  const price = Number(product.price)

  const discountPercent = Number(product.cashbackPercentage ?? 0)

  const stockQuantity = Number(product.quantity ?? 0)

  const originalPrice =
    discountPercent > 0 ? price / (1 - discountPercent / 100) : price

  const hasStock = stockQuantity > 0

  const reachedStockLimit = cartQuantity >= stockQuantity

  function handleIncrement() {
    if (!hasStock || reachedStockLimit || isUpdating) {
      return
    }

    onIncrement()
  }

  function handleDecrement() {
    if (cartQuantity <= 0 || isUpdating) {
      return
    }

    onDecrement()
  }

  return (
    <VStack
      mr={1}
      mt={1}
      mb={1}
      w={120}
      minH={230}
      bg="white"
      borderRadius="xl"
      borderWidth={2}
      borderColor="gray.100"
      shadow={1}
    >
      {/* ÁREA QUE ABRE OS DETALHES */}

      <TouchableOpacity
        {...rest}
        activeOpacity={0.8}
        style={{
          width: '100%',
          alignItems: 'center',
        }}
      >
        <Center width="100%">
          {/* LOJA */}

          <Text
            maxW="100%"
            px={2}
            borderBottomWidth={2}
            borderColor="green.500"
            fontSize={10}
            numberOfLines={1}
            textAlign="center"
          >
            {product.store?.name}
          </Text>

          {/* IMAGEM */}

          <Image
            mt={2}
            w={100}
            h={70}
            source={{
              uri: product.image,
            }}
            alt={`Imagem do produto ${product.name}`}
            rounded="lg"
            resizeMode="contain"
          />

          {/* NOME */}

          <Text
            mt={1}
            px={2}
            width="100%"
            minH={6}
            fontSize="sm"
            color="black"
            fontFamily="heading"
            numberOfLines={1}
            textAlign="center"
          >
            {product.name}
          </Text>

          {/* PREÇO */}

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
            <Text fontSize="lg" fontWeight="bold" color="gray.800">
              R$ {price.toFixed(2)}
            </Text>
          )}
        </Center>
      </TouchableOpacity>

      {/* ESTOQUE */}

      <Center mt={1} px={2}>
        <Box
          maxW="100%"
          bg={hasStock ? 'red.500' : 'gray.400'}
          rounded="md"
          px={2}
          py={0.5}
        >
          <Text
            fontSize="xs"
            color="white"
            numberOfLines={1}
            textAlign="center"
          >
            {hasStock ? `${stockQuantity} unidades` : 'Produto esgotado'}
          </Text>
        </Box>
      </Center>

      {/* CONTROLES DO CARRINHO */}

      <Box flex={1} width="100%" px={2} mt={2} mb={2} justifyContent="center">
        {isUpdating ? (
          <Center h={8}>
            <Spinner
              size="sm"
              color="blue.600"
              accessibilityLabel="Atualizando produto"
            />
          </Center>
        ) : cartQuantity === 0 ? (
          /* BOTÃO INICIAL + */

          <Center width="100%">
            <TouchableOpacity
              onPress={handleIncrement}
              disabled={!hasStock}
              activeOpacity={hasStock ? 0.7 : 1}
              accessibilityLabel={`Adicionar ${product.name}`}
            >
              <Center
                w={12}
                h={8}
                rounded="lg"
                bg={hasStock ? 'blue.600' : 'gray.300'}
              >
                <Icon as={Feather} name="plus" color="white" size="md" />
              </Center>
            </TouchableOpacity>
          </Center>
        ) : (
          /* - QUANTIDADE + */

          <HStack
            width="100%"
            alignItems="center"
            justifyContent="space-between"
          >
            {/* MENOS */}

            <TouchableOpacity
              onPress={handleDecrement}
              activeOpacity={0.7}
              accessibilityLabel={`Remover uma unidade de ${product.name}`}
            >
              <Center w={8} h={8} rounded="full" bg="gray.200">
                <Icon as={Feather} name="minus" color="gray.700" size="sm" />
              </Center>
            </TouchableOpacity>

            {/* QUANTIDADE */}

            <Center w={6} h={8}>
              <Text
                textAlign="center"
                fontSize="md"
                fontWeight="bold"
                color="gray.800"
                numberOfLines={1}
              >
                {cartQuantity}
              </Text>
            </Center>

            {/* MAIS */}

            <TouchableOpacity
              onPress={handleIncrement}
              disabled={reachedStockLimit}
              activeOpacity={reachedStockLimit ? 1 : 0.7}
              accessibilityLabel={`Adicionar mais uma unidade de ${product.name}`}
            >
              <Center
                w={8}
                h={8}
                rounded="full"
                bg={reachedStockLimit ? 'gray.300' : 'blue.600'}
              >
                <Icon as={Feather} name="plus" color="white" size="sm" />
              </Center>
            </TouchableOpacity>
          </HStack>
        )}

        {/* LIMITE DE ESTOQUE */}

        {reachedStockLimit && cartQuantity > 0 && hasStock && (
          <Text
            mt={1}
            px={1}
            fontSize="2xs"
            color="red.500"
            textAlign="center"
            numberOfLines={1}
          >
            Limite de estoque
          </Text>
        )}
      </Box>
    </VStack>
  )
}
