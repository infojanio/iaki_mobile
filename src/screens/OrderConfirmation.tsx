import React, { useEffect, useState } from 'react'
import {
  Box,
  Text,
  VStack,
  HStack,
  ScrollView,
  Image,
  Button,
  Spinner,
  Badge,
  Divider,
} from 'native-base'
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native'
import { api } from '@services/api'
import { formatCurrency } from '@utils/format'
import { AppNavigatorRoutesProps } from '@routes/app.routes'

type RootStackParamList = {
  OrderConfirmation: { orderId: string }
}

interface Product {
  id: string
  name: string
  price: number
  image: string
  cashback_percentage: number
}

interface OrderItem {
  id: string
  quantity: number
  product: Product
}

interface OrderData {
  id: string
  totalAmount: number
  discountApplied?: number
  status: string
  validated_at: string | null
  createdAt: string
  items: OrderItem[]
}

export function OrderConfirmation() {
  const route = useRoute<RouteProp<RootStackParamList, 'OrderConfirmation'>>()
  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const { orderId } = route.params

  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) {
        console.error('ID do pedido não fornecido.')
        return
      }

      setLoading(true)

      try {
        const res = await api.get(`/orders/${orderId}`)
        console.log('Resposta da API:', res.data)

        // Ajuste para a estrutura de resposta esperada
        const orderData = res.data.orders?.[0] // Acessa o primeiro pedido do array

        if (!orderData) {
          throw new Error('Pedido não encontrado na resposta')
        }

        setOrder({
          id: orderData.id,
          totalAmount: orderData.totalAmount,
          discountApplied: orderData.discountApplied ?? 0,
          status: orderData.status,
          validated_at: orderData.validated_at,
          createdAt: orderData.createdAt,
          items: orderData.items.map((item: any) => ({
            id: item.id || Math.random().toString(36).substring(7), // ID fallback
            quantity: item.quantity,
            product: {
              id: item.product?.id || item.productId?.id || '',
              name:
                item.product?.name ||
                item.productId?.name ||
                'Produto desconhecido',
              price: item.product?.price || item.productId?.price || 0,
              image:
                item.product?.image ||
                item.productId?.image ||
                'https://via.placeholder.com/80',
              cashback_percentage:
                item.product?.cashback_percentage ||
                item.productId?.cashback_percentage ||
                0,
            },
          })),
        })
      } catch (err) {
        console.error('Erro ao buscar pedido:', err)
        setOrder(null)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning'
      case 'VALIDATED':
        return 'success'
      case 'EXPIRED':
        return 'error'
      default:
        return 'coolGray'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendente'
      case 'VALIDATED':
        return 'Validado'
      case 'EXPIRED':
        return 'Expirado'
      default:
        return status
    }
  }

  if (loading) {
    return <Spinner size="lg" mt={8} />
  }

  if (!order) {
    return (
      <Box flex={1} alignItems="center" justifyContent="center" p={4}>
        <Text fontSize="lg" color="gray.500">
          Pedido não encontrado ou erro ao carregar.
        </Text>
        <Button mt={4} onPress={() => navigation.goBack()}>
          Voltar
        </Button>
      </Box>
    )
  }

  const usedCashback = (order.discountApplied ?? 0) > 0

  const calculateTotalCashback = () => {
    return order.items.reduce((total, item) => {
      return (
        total +
        (item.product.price *
          item.quantity *
          item.product.cashback_percentage) /
          100
      )
    }, 0)
  }

  return (
    <ScrollView flex={1} bg="gray.50" p={4}>
      <VStack space={4} bg="white" p={4} borderRadius="md" shadow={1}>
        <HStack justifyContent="space-between" alignItems="center">
          <Text fontSize="xl" fontWeight="bold">
            Pedido Confirmado!
          </Text>
          <Badge colorScheme={getStatusColor(order.status)}>
            {getStatusText(order.status)}
          </Badge>
        </HStack>

        <Text color="gray.500">
          Número do pedido: #{order.id.substring(0, 8).toUpperCase()}
        </Text>
        <Text color="gray.500">
          Data: {new Date(order.createdAt).toLocaleDateString('pt-BR')}
        </Text>

        <Divider my={3} />

        <Text fontSize="lg" fontWeight="bold" mb={2}>
          Itens do Pedido
        </Text>

        {order.items.length > 0 ? (
          <VStack space={4}>
            {order.items.map((item) => (
              <HStack
                key={`${item.id}-${item.product.id}`}
                space={3}
                alignItems="center"
              >
                <Image
                  source={{
                    uri: item.product.image || 'https://via.placeholder.com/80',
                  }}
                  alt={item.product.name}
                  size="sm"
                  borderRadius="md"
                />
                <VStack flex={1}>
                  <Text fontWeight="bold">{item.product.name}</Text>
                  <HStack justifyContent="space-between">
                    <Text color="gray.500">
                      {item.quantity}x {formatCurrency(item.product.price)}
                    </Text>
                  </HStack>
                  <Text fontWeight="bold" textAlign="right">
                    Subtotal:{' '}
                    {formatCurrency(item.product.price * item.quantity)}
                  </Text>
                </VStack>
              </HStack>
            ))}
          </VStack>
        ) : (
          <Text color="gray.500" textAlign="center" py={4}>
            Nenhum item encontrado neste pedido.
          </Text>
        )}

        <Divider my={3} />

        <VStack space={2}>
          {usedCashback && (
            <HStack justifyContent="space-between">
              <Text fontWeight="bold" color="orange.600">
                Desconto aplicado:
              </Text>
              <Text color="orange.600">
                -{formatCurrency(order.discountApplied ?? 0)} (
                {Math.round(
                  ((order.discountApplied ?? 0) /
                    (order.totalAmount + (order.discountApplied ?? 0))) *
                    100,
                )}
                %)
              </Text>
            </HStack>
          )}

          <HStack justifyContent="space-between">
            <Text fontWeight="bold">Total do Pedido:</Text>
            <Text>{formatCurrency(order.totalAmount ?? 0)}</Text>
          </HStack>

          <HStack justifyContent="space-between">
            <Text fontWeight="bold">Cashback Total:</Text>
            <Text color="green.600">
              {usedCashback
                ? formatCurrency(0)
                : formatCurrency(calculateTotalCashback())}
            </Text>
          </HStack>
        </VStack>

        <Button
          mt={6}
          colorScheme="blue"
          onPress={() => navigation.navigate('orderHistory')}
        >
          Ver Histórico de Pedidos
        </Button>
      </VStack>
    </ScrollView>
  )
}
