import React, { useEffect, useState, useContext } from 'react'
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native'
import { useCallback } from 'react'
import {
  Box,
  Text,
  VStack,
  HStack,
  Image,
  Button,
  FlatList,
  Divider,
  useToast,
  ArrowBackIcon,
  Switch,
} from 'native-base'
import { Alert } from 'react-native'
import { api } from '@services/api'
import { useAuth } from '@hooks/useAuth'
import { formatCurrency } from '@utils/format'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { StorageCartProps } from '@storage/storageCart'
import { CartContext } from '@contexts/CartContext'

interface CartItem {
  id: string
  product: {
    id: string
    name: string
    price: number
    image: string
    cashback_percentage: number
    storeId: string
  }
  quantity: number
}

type CheckoutScreenRouteParams = {
  cart: StorageCartProps[]
}

export function Checkout() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [useCashback, setUseCashback] = useState(false)
  const [cashbackBalance, setCashbackBalance] = useState(0)
  const [discountApplied, setDiscountApplied] = useState(0)
  const [orders, setOrders] = useState<any[]>([])

  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const route = useRoute()
  const { user } = useAuth()
  const { cart } = route.params as CheckoutScreenRouteParams
  const { clearCart } = useContext(CartContext)
  const toast = useToast()

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  )

  const effectiveDiscount = Math.min(discountApplied, subtotal)
  const totalAmount = subtotal - effectiveDiscount

  const cashbackToReceive = parseFloat(
    cartItems
      .reduce(
        (sum, item) =>
          sum +
          (item.product.price *
            item.quantity *
            item.product.cashback_percentage) /
            100,
        0,
      )
      .toFixed(2),
  )

  const hasPending = orders.some((order) => order.status === 'PENDING')

  useEffect(() => {
    setUseCashback(false)
    setDiscountApplied(0)
  }, [cart])

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const [balanceRes, ordersRes] = await Promise.all([
            api.get('/users/balance'),
            api.get('/orders/history', { params: { user_id: user.id } }),
          ])

          const balance = balanceRes.data.balance || 0
          const userOrders = ordersRes.data.orders || []

          setCashbackBalance(balance)
          setOrders(userOrders)

          const hasPendingCashbackOrder = userOrders.some(
            (order: any) =>
              order.status === 'PENDING' && order.use_cashback === true,
          )

          if (hasPendingCashbackOrder) {
            setUseCashback(false)
            setDiscountApplied(0)
          }
        } catch (error) {
          console.error('Erro ao carregar saldo/pedidos:', error)
        }
      }

      fetchData()
    }, [user.id]),
  )

  useEffect(() => {
    if (cart && Array.isArray(cart)) {
      const formatted = cart.map((item) => ({
        id: item.productId,
        quantity: Number(item.quantity),
        product: {
          id: item.productId,
          name: item.name,
          price: item.price,
          image: item.image,
          cashback_percentage: item.cashback_percentage ?? 0,
          storeId: item.storeId ?? '',
        },
      }))
      setCartItems(formatted)
    }
  }, [cart])

  async function handleConfirmOrder() {
    if (useCashback && cashbackBalance <= 0) {
      Alert.alert(
        'Erro',
        'Você não possui saldo suficiente de cashback para este pedido.',
      )
      setUseCashback(false)
      setDiscountApplied(0)
      return
    }

    if (!user?.id || cartItems.length === 0) return
    setLoading(true)

    try {
      const storeIds = Array.from(
        new Set(cartItems.map((item) => item.product.storeId)),
      )
      if (storeIds.length > 1) {
        Alert.alert('Erro', 'Seu carrinho contém itens de diferentes lojas.')
        return
      }

      const discount = useCashback
        ? parseFloat(Math.min(cashbackBalance, subtotal).toFixed(2))
        : 0
      const total = parseFloat((subtotal - discount).toFixed(2))

      const payload = {
        user_id: user.id,
        store_id: storeIds[0],
        items: cartItems.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          subtotal: parseFloat((item.quantity * item.product.price).toFixed(2)),
        })),
        discountApplied: discount,
        totalAmount: total,
        use_cashback: useCashback,
      }

      const response = await api.post('/orders', payload)
      const updatedBalance = await api.get('/users/balance')
      setCashbackBalance(updatedBalance.data.balance)

      const orderId = response.data.order?.id
      await clearCart()
      setUseCashback(false)
      setDiscountApplied(0)

      navigation.navigate('orderConfirmation', {
        orderId,
        cashbackEarned: cashbackToReceive,
        cashbackUsed: useCashback ? discount : 0,
      })
    } catch (err) {
      console.error('Aguarde o último pedido ser validado!', err)
      const error = err as any
      Alert.alert(
        'Erro',
        error?.response?.data?.message || 'Erro ao confirmar o pedido',
      )
      setUseCashback(false)
      setDiscountApplied(0)
    } finally {
      setLoading(false)
    }
  }

  const isCashbackSwitchDisabled = cashbackBalance <= 0 || hasPending

  return (
    <Box flex={1} bg="white" px={4} py={6}>
      <ArrowBackIcon onPress={() => navigation.goBack()} />
      <Text fontSize="16" fontWeight="bold" mt={2} textAlign="center">
        Resumo do Pedido
      </Text>

      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <HStack space={4} alignItems="center" mb={4}>
            <Image
              source={{ uri: item.product.image }}
              alt={item.product.name}
              size="64px"
              borderRadius="md"
            />
            <VStack flex={1}>
              <Text fontWeight="semibold">{item.product.name}</Text>
              <Text color="gray.500">
                {item.quantity}x {formatCurrency(Number(item.product.price))}
              </Text>
            </VStack>
            <Text fontWeight="bold">
              {formatCurrency(item.product.price * item.quantity)}
            </Text>
          </HStack>
        )}
      />

      <Divider my={4} />

      <VStack space={3} mb={4}>
        <Text fontSize="lg" fontWeight="bold">
          Saldo disponível: {formatCurrency(cashbackBalance)}
        </Text>

        <HStack alignItems="center" space={3}>
          <Switch
            isChecked={useCashback}
            isDisabled={isCashbackSwitchDisabled}
            onToggle={(value) => {
              if (value) {
                if (cashbackBalance <= 0) {
                  toast.show({
                    title: 'Saldo insuficiente',
                    description:
                      'Você não possui saldo de cashback disponível.',
                  })
                  return
                }
                const maxDiscount = Math.min(cashbackBalance, subtotal)
                setDiscountApplied(maxDiscount)
                setUseCashback(true)
                toast.show({
                  title: 'Cashback aplicado!',
                  description: `Desconto de ${formatCurrency(
                    maxDiscount,
                  )} aplicado.`,
                })
              } else {
                setDiscountApplied(0)
                setUseCashback(false)
                toast.show({
                  title: 'Cashback removido',
                  description: 'O desconto foi removido do seu pedido.',
                })
              }
            }}
          />
          <Text>Usar cashback como desconto</Text>
        </HStack>

        {useCashback && (
          <Text color="green.600">
            Desconto aplicado: {formatCurrency(discountApplied)}
          </Text>
        )}

        {hasPending && (
          <Text fontSize="16" color="red.500">
            Valide sua última compra na loja física.
          </Text>
        )}
      </VStack>

      <Divider my={4} />

      <VStack>
        <Box bg="gray.100">
          <HStack justifyContent="space-between">
            <Text fontSize="md">Subtotal:</Text>
            <Text fontSize="md">{formatCurrency(subtotal)}</Text>
          </HStack>

          {useCashback && (
            <HStack justifyContent="space-between">
              <Text fontSize="md">Desconto (cashback):</Text>
              <Text fontSize="md" color="green.600">
                -{formatCurrency(effectiveDiscount)}
              </Text>
            </HStack>
          )}
        </Box>

        <HStack justifyContent="space-between" mt={2}>
          <Text fontSize="16" fontWeight="bold">
            Total:
          </Text>
          <Text fontSize="18" fontWeight="bold">
            {formatCurrency(totalAmount)}
          </Text>
        </HStack>

        <Text fontSize="md" color="green.600" mt={2}>
          {useCashback
            ? 'Pagamento com cashback!'
            : `Cashback esperado: ${formatCurrency(cashbackToReceive)}`}
        </Text>

        <Button
          mt={6}
          colorScheme="blue"
          isLoading={loading}
          onPress={handleConfirmOrder}
          isDisabled={loading || cartItems.length === 0 || hasPending}
          rounded="xl"
        >
          Confirmar Pedido
        </Button>
      </VStack>
    </Box>
  )
}
