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
      borderRadius="xl"
      shadow={1}
      minH={230}
      bg="white"
      rounded="lg"
      borderWidth={2}
      borderColor="gray.100"
    >
      {/* Área que abre os detalhes */}
      <TouchableOpacity
        {...rest}
        activeOpacity={0.8}
        style={{
          width: '100%',
          alignItems: 'center',
        }}
      >
        <Center width="100%">
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

          <Text
            mt={1}
            px={2}
            minH={6}
            fontSize="sm"
            color="black"
            fontFamily="heading"
            numberOfLines={1}
            textAlign="center"
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
            <Text fontSize="lg" fontWeight="bold" color="gray.800">
              R$ {price.toFixed(2)}
            </Text>
          )}
        </Center>
      </TouchableOpacity>

      {/* Informação de estoque */}
      <Center mt={1}>
        <Box
          bg={hasStock ? 'red.500' : 'gray.400'}
          rounded="md"
          px={2}
          py={0.5}
        >
          <Text fontSize="xs" color="white" numberOfLines={1}>
            {hasStock ? `${stockQuantity} unidades` : 'Produto esgotado'}
          </Text>
        </Box>
      </Center>

      {/* Controles do carrinho */}
      <Center flex={1} mt={2} mb={2}>
        {isUpdating ? (
          <Center h={10}>
            <Spinner
              size="sm"
              color="blue.600"
              accessibilityLabel="Atualizando produto"
            />
          </Center>
        ) : cartQuantity === 0 ? (
          <TouchableOpacity
            onPress={handleIncrement}
            disabled={!hasStock}
            activeOpacity={hasStock ? 0.7 : 1}
            accessibilityLabel={`Adicionar ${product.name}`}
          >
            <Center
              w={12}
              h={10}
              rounded="lg"
              bg={hasStock ? 'blue.600' : 'gray.300'}
            >
              <Icon as={Feather} name="plus" color="white" size="md" />
            </Center>
          </TouchableOpacity>
        ) : (
          <HStack alignItems="center" justifyContent="center" space={2}>
            <TouchableOpacity
              onPress={handleDecrement}
              activeOpacity={0.7}
              accessibilityLabel={`Remover uma unidade de ${product.name}`}
            >
              <Center w={9} h={9} rounded="full" bg="gray.200">
                <Icon as={Feather} name="minus" color="gray.700" size="sm" />
              </Center>
            </TouchableOpacity>

            <Text
              minW={6}
              textAlign="center"
              fontSize="md"
              fontWeight="bold"
              color="gray.800"
            >
              {cartQuantity}
            </Text>

            <TouchableOpacity
              onPress={handleIncrement}
              disabled={reachedStockLimit}
              activeOpacity={reachedStockLimit ? 1 : 0.7}
              accessibilityLabel={`Adicionar mais uma unidade de ${product.name}`}
            >
              <Center
                w={9}
                h={9}
                rounded="full"
                bg={reachedStockLimit ? 'gray.300' : 'blue.600'}
              >
                <Icon as={Feather} name="plus" color="white" size="sm" />
              </Center>
            </TouchableOpacity>
          </HStack>
        )}

        {reachedStockLimit && cartQuantity > 0 && hasStock && (
          <Text mt={1} fontSize="2xs" color="red.500" textAlign="center">
            Limite de estoque
          </Text>
        )}
      </Center>
    </VStack>
  )
}
