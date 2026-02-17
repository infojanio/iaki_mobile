import React, { useEffect, useRef, useState } from 'react'
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
import { useRoute, useNavigation } from '@react-navigation/native'
import { Animated } from 'react-native'

import { api } from '@services/api'
import { formatCurrency } from '@utils/format'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { OrderDTO, OrderItemDTO } from '@dtos/OrderDTO'

const DEFAULT_IMAGE = 'https://via.placeholder.com/80'

export function OrderConfirmation() {
  const route = useRoute<any>()
  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const { orderId, pointsEarned = 0 } = route.params

  const [order, setOrder] = useState<OrderDTO | null>(null)
  const [loading, setLoading] = useState(true)

  const scaleAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 120,
      useNativeDriver: true,
    }).start()
  }, [])

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) return

      try {
        const res = await api.get(`/orders/${orderId}`)
        const data = res.data

        const mapped: OrderDTO = {
          id: data.id,
          store: {
            id: data.store?.id ?? '',
            name: data.store?.name ?? 'Loja não identificada',
          },
          totalAmount: Number(data.totalAmount ?? 0),
          discountApplied: Number(data.discountApplied ?? 0),
          status: data.status,
          created_at:
            data.created_at ?? data.createdAt ?? new Date().toISOString(),
          validated_at: data.validated_at ?? null,
          items: (data.items ?? []).map(
            (item: any): OrderItemDTO => ({
              id: item.id ?? `${data.id}-item-${item.product?.id ?? ''}`,
              quantity: Number(item.quantity ?? 0),
              product: {
                id: item.product?.id ?? '',
                name: item.product?.name ?? 'Produto desconhecido',
                price: Number(item.product?.price ?? 0),
                image: item.product?.image ?? DEFAULT_IMAGE,
                cashbackPercentage: 0,
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
        return 'Cancelado'
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

  return (
    <ScrollView flex={1} bg="gray.50" p={4}>
      <VStack space={6} bg="white" p={5} borderRadius="xl" shadow={2}>
        {/* 🎉 Header */}
        <HStack justifyContent="space-between" alignItems="center">
          <Text fontSize="xl" fontWeight="bold">
            🎉 Pedido Confirmado!
          </Text>
          <Badge colorScheme={getStatusColor(order.status)}>
            {getStatusText(order.status)}
          </Badge>
        </HStack>

        <Text color="gray.500">
          Pedido #{order.id.substring(0, 8).toUpperCase()}
        </Text>

        <Text color="gray.600" fontSize="sm">
          Loja: {order.store.name}
        </Text>

        <Text color="gray.500">
          Data: {new Date(order.created_at).toLocaleDateString('pt-BR')}
        </Text>

        {/* 🪙 BLOCO DE PONTOS */}
        <Box
          bg="purple.50"
          p={6}
          borderRadius="2xl"
          alignItems="center"
          borderWidth={1}
          borderColor="purple.200"
        >
          <Animated.View
            style={{
              transform: [{ scale: scaleAnim }],
            }}
          >
            <Text fontSize="60" fontWeight="bold" color="purple.600">
              +{pointsEarned}
            </Text>
          </Animated.View>

          <Text fontSize="md" color="purple.700" mt={2}>
            Pontos ganhos nesta compra 🪙
          </Text>

          <Text fontSize="xs" color="purple.500">
            Continue comprando para subir de nível 🚀
          </Text>
        </Box>

        <Divider />

        {/* 📦 Itens */}
        <Text fontSize="lg" fontWeight="bold">
          Itens do Pedido
        </Text>

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
              </VStack>

              <Text fontWeight="bold">
                {formatCurrency(item.product.price * item.quantity)}
              </Text>
            </HStack>
          ))}
        </VStack>

        <Divider />

        {/* 💰 Total */}
        <HStack justifyContent="space-between">
          <Text fontWeight="bold">Total Pago:</Text>
          <Text fontWeight="bold">{formatCurrency(order.totalAmount)}</Text>
        </HStack>

        <Button
          mt={4}
          colorScheme="blue"
          rounded="xl"
          onPress={() => navigation.navigate('home')}
        >
          Continuar Comprando 🚀
        </Button>

        <Button
          variant="outline"
          rounded="xl"
          onPress={() => navigation.navigate('orderHistory')}
        >
          Ver Histórico
        </Button>
      </VStack>
    </ScrollView>
  )
}
