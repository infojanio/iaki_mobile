import React from 'react'
import { Center, HStack, Icon, useTheme, Text, VStack, Box } from 'native-base'
import { MaterialIcons } from '@expo/vector-icons'
import { ButtonBack } from '@components/ButtonBack'

type Props = {
  price: number
  quantity: number
  title: string
  productId: string
}

export function HomeCart({ title, price, quantity, productId }: Props) {
  const { sizes } = useTheme()

  return (
    <VStack>
      <HStack
        bg="gray.200"
        paddingTop={2}
        justifyContent="space-between"
        alignItems="center"
        borderBottomWidth={0.2}
      >
        {/* 🔥 Agora passando destino */}
        <ButtonBack route="productDetails" params={{ productId }} />

        <HStack mr={16} alignContent="space-between">
          <Text
            ml={10}
            fontWeight="semibold"
            fontSize={18}
            color="black"
            flexShrink={1}
          >
            {title}
          </Text>

          <Text ml={16} fontWeight="semibold" fontSize={18} color="black">
            R$ {price.toFixed(2)}
          </Text>
        </HStack>

        <VStack mr={2} alignItems="center" justifyContent="center">
          <Center mr={1} bg="red.500" borderRadius="full" padding={1}>
            <Text fontSize={12} fontWeight="bold" color="white">
              {quantity}
            </Text>
          </Center>

          <Box mt={-2} mr={4}>
            <Icon
              as={<MaterialIcons name="shopping-cart" />}
              size={7}
              color="green.700"
            />
          </Box>
        </VStack>
      </HStack>
    </VStack>
  )
}
