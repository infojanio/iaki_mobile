import { VStack, Text, Button, HStack, useToast } from 'native-base'
import { useCallback, useContext, useMemo, useState } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'

import { CartContext } from '@contexts/CartContext'
import { HomeScreen } from '@components/HomeScreen'
import { ItemsCart } from '@components/Cart/ItemsCart'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { formatCurrency } from '@utils/format'

export function Cart() {
  const { cartItems, checkout, activeStoreId, syncOpenCart } =
    useContext(CartContext)

  const toast = useToast()
  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
  }, [cartItems])

  async function handleCheckout() {
    if (cartItems.length === 0 || isSubmitting) return

    try {
      setIsSubmitting(true)
      await checkout()
      navigation.navigate('orderHistory')
    } catch {
      toast.show({
        title: 'Erro',
        description: 'Não foi possível finalizar o pedido',
        placement: 'top',
        bgColor: 'red.500',
      })
    } finally {
      setIsSubmitting(false)
    }
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

            <Button
              colorScheme="green"
              onPress={handleCheckout}
              isLoading={isSubmitting}
            >
              Finalizar pedido
            </Button>
          </>
        )}
      </VStack>
    </VStack>
  )
}
