import React, { useEffect, useState, useContext, useCallback } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
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
import { CartContext } from '@contexts/CartContext'

export function Checkout() {
  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const toast = useToast()

  const { user } = useAuth()
  const { cartItems, activeStoreId, activeStoreName, syncOpenCart } =
    useContext(CartContext)

  const [loading, setLoading] = useState(false)
  const [useCashback, setUseCashback] = useState(false)
  const [cashbackBalance, setCashbackBalance] = useState(0)
  const [orders, setOrders] = useState<any[]>([])

  /* ======================
     Segurança de contexto
  ====================== */
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

  const cashbackToReceive = Number(
    cartItems
      .reduce(
        (sum, item) =>
          sum + (item.price * item.quantity * item.cashback_percentage) / 100,
        0,
      )
      .toFixed(2),
  )

  const cashbackUsed = useCashback ? Math.min(cashbackBalance, subtotal) : 0

  const total = subtotal - cashbackUsed

  const hasPending = orders.some((order) => order.status === 'PENDING')

  /* ======================
     Saldo (POR LOJA) + histórico
  ====================== */
  useFocusEffect(
    useCallback(() => {
      async function fetchData() {
        if (!activeStoreId) return

        try {
          const [balanceRes, ordersRes] = await Promise.all([
            // ✅ SALDO APENAS DA LOJA ATIVA
            api.get(`/cashbacks/balance/${activeStoreId}`),

            api.get('/orders/history'),
          ])

          const balance = balanceRes.data.balance ?? 0

          setCashbackBalance(balance)
          setOrders(ordersRes.data.orders ?? [])

          // 🔒 segurança: se não tem saldo, desliga o switch
          if (balance <= 0) {
            setUseCashback(false)
          }
        } catch (error) {
          toast.show({
            title: 'Erro',
            description: 'Não foi possível carregar o saldo da loja.',
            bgColor: 'red.500',
            placement: 'top',
          })
        }
      }

      fetchData()
    }, [activeStoreId]),
  )

  /* ======================
     Confirmar pedido
  ====================== */
  async function handleConfirmOrder() {
    if (cartItems.length === 0) return

    if (useCashback && cashbackBalance <= 0) {
      Alert.alert(
        'Saldo insuficiente',
        'Você não possui saldo de cashback nesta loja.',
      )
      return
    }

    try {
      setLoading(true)

      console.log('[CHECKOUT]', {
        activeStoreId,
        cartItemsLength: cartItems.length,
        cashbackUsed,
      })

      const response = await api.post('/cart/checkout', {
        useCashback,
      })

      const { orderId } = response.data

      await syncOpenCart()

      navigation.navigate('orderConfirmation', {
        orderId,
        cashbackEarned: cashbackToReceive,
      })
    } catch (err: any) {
      Alert.alert(
        'Erro',
        err?.response?.data?.message || 'Erro ao confirmar o pedido.',
      )
    } finally {
      setLoading(false)
    }
  }

  /* ======================
     Render
  ====================== */
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

      <VStack space={3}>
        <Text fontSize="lg" fontWeight="bold">
          Saldo disponível nesta loja: {formatCurrency(cashbackBalance)}
        </Text>

        <HStack alignItems="center" space={3}>
          <Switch
            isChecked={useCashback}
            isDisabled={cashbackBalance <= 0 || hasPending || !activeStoreId}
            onToggle={setUseCashback}
          />
          <Text>Usar cashback como desconto</Text>
        </HStack>

        {hasPending && (
          <Text color="red.500">
            ⚠️ Finalize o último pedido antes de criar outro.
          </Text>
        )}
      </VStack>

      <Divider my={4} />

      <VStack space={2}>
        <HStack justifyContent="space-between">
          <Text>Subtotal</Text>
          <Text>{formatCurrency(subtotal)}</Text>
        </HStack>

        {useCashback && (
          <HStack justifyContent="space-between">
            <Text>Desconto (cashback)</Text>
            <Text color="green.600">- {formatCurrency(cashbackUsed)}</Text>
          </HStack>
        )}

        <HStack justifyContent="space-between">
          <Text fontWeight="bold">Total</Text>
          <Text fontWeight="bold">{formatCurrency(total)}</Text>
        </HStack>

        <Text color="green.600">
          Cashback esperado: {formatCurrency(cashbackToReceive)}
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
