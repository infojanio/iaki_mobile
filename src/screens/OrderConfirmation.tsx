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
import { OrderDTO, OrderItemDTO } from '@dtos/OrderDTO'

type RootStackParamList = {
  OrderConfirmation: { orderId: string }
}

const DEFAULT_IMAGE = 'https://via.placeholder.com/80'

export function OrderConfirmation() {
  const route = useRoute<RouteProp<RootStackParamList, 'OrderConfirmation'>>()
  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const { orderId } = route.params

  const [order, setOrder] = useState<OrderDTO | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) return

      setLoading(true)

      try {
        const res = await api.get(`/orders/${orderId}`)
        const data = res.data

        // ✅ Mapper para OrderDTO (blindado para snake_case/camelCase)
        const mapped: OrderDTO = {
          id: data.id,
          store: {
            id: data.store?.id ?? data.storeId ?? '',
            name: data.store?.name ?? data.storeName ?? 'Loja não identificada',
          },
          totalAmount: Number(data.totalAmount ?? 0),
          discountApplied: Number(data.discountApplied ?? 0),
          status: data.status,
          created_at:
            data.created_at ?? data.createdAt ?? new Date().toISOString(),
          validated_at: data.validated_at ?? null,
          qrCodeUrl: data.qrCodeUrl ?? null,
          cashbackAmount: data.cashbackAmount,

          items: (data.items ?? []).map(
            (item: any): OrderItemDTO => ({
              id: item.id ?? `${data.id}-item-${item.product?.id ?? ''}`,
              quantity: Number(item.quantity ?? 0),
              product: {
                id: item.product?.id ?? item.productId ?? '',
                name: item.product?.name ?? 'Produto desconhecido',
                price: Number(item.product?.price ?? 0),
                image: item.product?.image ?? DEFAULT_IMAGE,
                cashbackPercentage: Number(
                  item.product?.cashbackPercentage ?? 0,
                ),
              },
            }),
          ),
        }

        setOrder(mapped)
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

  const usedCashback = order.discountApplied > 0

  const calculateTotalCashback = () => {
    if (usedCashback) return 0
    if (order.cashbackAmount !== undefined) return order.cashbackAmount

    return order.items.reduce((total, item) => {
      return (
        total +
        (item.product.price * item.quantity * item.product.cashbackPercentage) /
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

        {/* ✅ Loja */}
        <Text color="gray.600" fontSize="sm">
          Loja: {order.store.name}
        </Text>

        <Text color="gray.500">
          Data: {new Date(order.created_at).toLocaleDateString('pt-BR')}
        </Text>

        <Divider my={3} />

        <Text fontSize="lg" fontWeight="bold" mb={2}>
          Itens do Pedido
        </Text>

        {order.items.length > 0 ? (
          <VStack space={4}>
            {order.items.map((item: OrderItemDTO, index: number) => (
              <HStack
                key={`${order.id}-item-${index}`}
                space={3}
                alignItems="center"
              >
                <Image
                  source={{ uri: item.product.image ?? DEFAULT_IMAGE }}
                  alt={item.product.name}
                  size="sm"
                  borderRadius="md"
                />
                <VStack flex={1}>
                  <Text fontWeight="bold">{item.product.name}</Text>
                  <Text color="gray.500">
                    {item.quantity}x {formatCurrency(item.product.price)}
                  </Text>
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
                -{formatCurrency(order.discountApplied)} (
                {Math.round(
                  (order.discountApplied /
                    (order.totalAmount + order.discountApplied)) *
                    100,
                )}
                %)
              </Text>
            </HStack>
          )}

          <HStack justifyContent="space-between">
            <Text fontWeight="bold">Total do Pedido:</Text>
            <Text>{formatCurrency(order.totalAmount)}</Text>
          </HStack>

          <HStack justifyContent="space-between">
            <Text fontWeight="bold">Cashback Total:</Text>
            <Text color="green.600">
              {formatCurrency(calculateTotalCashback())}
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
