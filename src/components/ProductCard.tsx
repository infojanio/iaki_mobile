import {
  Box,
  Image,
  Text,
  VStack,
  Pressable,
  Badge,
  HStack,
  Center,
  Icon,
  Spinner,
} from 'native-base'

import { Dimensions, TouchableOpacity } from 'react-native'

import { Feather } from '@expo/vector-icons'

import { ProductDTO } from '@dtos/ProductDTO'

type Props = {
  data: ProductDTO

  cartQuantity?: number
  isUpdating?: boolean

  onPress: () => void
  onIncrement: () => void
  onDecrement: () => void
}

const CARD_WIDTH = Dimensions.get('window').width * 0.35

export function ProductCard({
  data,
  cartQuantity = 0,
  isUpdating = false,
  onPress,
  onIncrement,
  onDecrement,
}: Props) {
  const price = Number(data.price)

  /*
   * Apesar do campo ainda se chamar cashbackPercentage,
   * no aplicativo ele representa o percentual de desconto.
   */
  const discountPercent = Number(data.cashbackPercentage ?? 0)

  const stockQuantity = Number(data.quantity ?? 0)

  const originalPrice =
    discountPercent > 0 ? price / (1 - discountPercent / 100) : price

  const hasStock = stockQuantity > 0

  const reachedStockLimit = hasStock && cartQuantity >= stockQuantity

  function handleIncrement() {
    if (!hasStock || reachedStockLimit || isUpdating) {
      return
    }

    if (typeof onIncrement !== 'function') {
      console.error('[DiscountProductCard] onIncrement não informado', {
        productId: data.id,
        productName: data.name,
      })

      return
    }

    onIncrement()
  }

  function handleDecrement() {
    if (cartQuantity <= 0 || isUpdating) {
      return
    }

    if (typeof onDecrement !== 'function') {
      console.error('[DiscountProductCard] onDecrement não informado', {
        productId: data.id,
        productName: data.name,
      })

      return
    }

    onDecrement()
  }

  return (
    <VStack
      mr={1}
      ml={-0.5}
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
      {discountPercent > 0 && (
        <Badge
          position="absolute"
          top={2}
          right={2}
          bg="blue.600"
          rounded="full"
          px={2}
          zIndex={20}
        >
          <Text color="white" fontSize="xs" fontWeight="bold">
            -{discountPercent}%
          </Text>
        </Badge>
      )}

      {/* Área que abre os detalhes */}
      <Pressable
        onPress={onPress}
        _pressed={{
          opacity: 0.8,
        }}
      >
        <Center pt={3}>
          <Image
            source={{
              uri: data.image,
            }}
            alt={data.name}
            width="80%"
            height={16}
            resizeMode="contain"
          />
        </Center>

        <VStack px={3} pt={2}>
          <Text bold fontSize="sm" numberOfLines={1} textAlign="center">
            {data.name}
          </Text>

          {discountPercent > 0 ? (
            <Center>
              <Text
                color={'red.500'}
                fontSize={10}
                numberOfLines={1}
                textAlign="center"
              >
                {data.store?.name}
              </Text>
              <Text fontSize="xs" color="gray.400" strikeThrough>
                R$ {originalPrice.toFixed(2)}
              </Text>

              <Text fontSize="lg" fontWeight="bold" color="blue.600">
                R$ {price.toFixed(2)}
              </Text>
            </Center>
          ) : (
            <Text textAlign="center" fontSize="lg" fontWeight="bold">
              R$ {price.toFixed(2)}
            </Text>
          )}
        </VStack>
      </Pressable>

      {/* Estoque */}
      <Center mt={1}>
        <Box
          px={2}
          py={0.5}
          rounded="md"
          bg={hasStock ? 'blue.500' : 'gray.400'}
        >
          <Text color="white" fontSize="xs" numberOfLines={1}>
            {hasStock ? `${stockQuantity} unidades` : 'Produto esgotado'}
          </Text>
        </Box>
      </Center>

      {/* Botões do carrinho */}
      <Center flex={1} mt={2} mb={3}>
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
            <TouchableOpacity onPress={handleDecrement} activeOpacity={0.7}>
              <Center w={9} h={9} rounded="full" bg="gray.200">
                <Icon as={Feather} name="minus" color="gray.700" size="sm" />
              </Center>
            </TouchableOpacity>

            <Text
              minW={5}
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

        {reachedStockLimit && cartQuantity > 0 && (
          <Text mt={1} px={1} fontSize="2xs" color="red.500" textAlign="center">
            Limite de estoque atingido
          </Text>
        )}
      </Center>
    </VStack>
  )
}
