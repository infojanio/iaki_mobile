import { VStack, Text, Button, HStack } from 'native-base'
import { useContext, useMemo } from 'react'
import { useNavigation } from '@react-navigation/native'

import { CartContext } from '@contexts/CartContext'
import { HomeScreen } from '@components/HomeScreen'
import { ItemsCart } from '@components/Cart/ItemsCart'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { formatCurrency } from '@utils/format'

export function Cart() {
  const { cartItems, activeStoreId } = useContext(CartContext)
  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
  }, [cartItems])

  function handleGoToCheckout() {
    if (cartItems.length === 0) return

    if (!activeStoreId) {
      // proteção extra (debug-friendly)
      console.warn('[Cart] activeStoreId não definido')
      return
    }

    // ✅ Checkout NÃO recebe params
    navigation.navigate('checkout')
  }

  return (
    <VStack flex={1}>
      <HomeScreen title="Carrinho" />

      <VStack flex={1} bg="gray.100" p={4}>
        {cartItems.length === 0 ? (
          <Text textAlign="center" mt={10}>
            Seu carrinho está vazio.
          </Text>
        ) : (
          <>
            <ItemsCart />

            <HStack justifyContent="space-between" mb={4}>
              <Text bold fontSize="lg">
                Subtotal
              </Text>
              <Text bold fontSize="lg" color="green.600">
                {formatCurrency(subtotal)}
              </Text>
            </HStack>

            <Button colorScheme="green" onPress={handleGoToCheckout}>
              Próximo
            </Button>
          </>
        )}
      </VStack>
    </VStack>
  )
}
