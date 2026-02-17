import React, { useEffect, useState, useContext } from 'react'
import { useNavigation } from '@react-navigation/native'
import {
  Box,
  Text,
  VStack,
  HStack,
  Image,
  Button,
  FlatList,
  Divider,
  ArrowBackIcon,
} from 'native-base'

import { api } from '@services/api'
import { formatCurrency } from '@utils/format'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { CartContext } from '@contexts/CartContext'

export function Checkout() {
  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const { cartItems, activeStoreName, syncOpenCart } = useContext(CartContext)

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    syncOpenCart()
  }, [])

  /* ======================
     Cálculos
  ====================== */
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )

  const total = subtotal

  // 🪙 1 ponto a cada R$ 10 pagos
  const pointsToEarn = Math.floor(total / 10)

  async function handleConfirmOrder() {
    if (cartItems.length === 0) return

    try {
      setLoading(true)

      const response = await api.post('/cart/checkout')

      const { orderId } = response.data

      await syncOpenCart()

      navigation.navigate('orderConfirmation', {
        orderId,
        pointsEarned: pointsToEarn,
      })
    } catch (err: any) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box flex={1} bg="white" px={4} py={6}>
      <ArrowBackIcon onPress={() => navigation.goBack()} />

      <Text fontSize="16" fontWeight="bold" mt={2} textAlign="center">
        Resumo do Pedido
      </Text>

      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.productId}
        renderItem={({ item }) => (
          <HStack space={4} alignItems="center" mb={4}>
            <Image
              source={{ uri: item.image }}
              alt={item.name}
              size="64px"
              borderRadius="md"
            />

            <VStack flex={1}>
              <Text fontWeight="semibold">{item.name}</Text>
              <Text color="gray.500">
                {item.quantity}x {formatCurrency(item.price)}
              </Text>
            </VStack>

            <Text fontWeight="bold">
              {formatCurrency(item.price * item.quantity)}
            </Text>
          </HStack>
        )}
      />

      {activeStoreName && (
        <Text fontSize="14" color="blue.700" mb={2}>
          Vendido por {activeStoreName}
        </Text>
      )}

      <Divider my={4} />

      <VStack space={2}>
        <HStack justifyContent="space-between">
          <Text>Subtotal</Text>
          <Text>{formatCurrency(subtotal)}</Text>
        </HStack>

        <HStack justifyContent="space-between">
          <Text fontWeight="bold">Total</Text>
          <Text fontWeight="bold">{formatCurrency(total)}</Text>
        </HStack>

        {/* 🔥 BLOCO DE PONTOS */}
        <Box
          bg="purple.50"
          p={4}
          borderRadius="lg"
          borderWidth={1}
          borderColor="purple.200"
          mt={3}
        >
          <Text color="purple.700" fontWeight="bold" fontSize="md">
            🪙 Você ganhará {pointsToEarn} pontos
          </Text>
          <Text fontSize="xs" color="purple.500">
            1 ponto a cada R$ 10 pagos
          </Text>
        </Box>

        <Button
          mt={6}
          colorScheme="blue"
          isLoading={loading}
          onPress={handleConfirmOrder}
          rounded="xl"
        >
          Confirmar Pedido
        </Button>
      </VStack>
    </Box>
  )
}
