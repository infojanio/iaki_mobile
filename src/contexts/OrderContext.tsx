import { createContext, ReactNode, useEffect, useState } from 'react'
import { orderService } from '@services/orderService'

type OrderItem = {
  productId: string
  name: string
  image: string
  price: number
  quantity: number
  cashbackPercentage: number
  storeId: string
}

type OrderContextData = {
  orderItems: OrderItem[]

  fetchOrder: () => Promise<void>
}

export const OrderContext = createContext({} as OrderContextData)

type OrderProviderProps = {
  children: ReactNode
}

export function OrderProvider({ children }: OrderProviderProps) {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])

  async function fetchOrder() {
    try {
      const backendOrder = await orderService.getCurrentOrder()

      // Garante que cada item tenha o storeId corretamente
      const formattedOrder = backendOrder.items.map((item: any) => ({
        productId: item.productId,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        cashbackPercentage: item.cashbackPercentage ?? 0,
        storeId: item.storeId ?? '', // Garante que o storeId sempre exista
      }))

      setOrderItems(formattedOrder)
    } catch (error) {
      console.error('Erro ao carregar o pedido:', error)
      setOrderItems([]) // fallback para evitar estado indefinido
    }
  }

  useEffect(() => {
    fetchOrder()
  }, [])

  return (
    <OrderContext.Provider value={{ orderItems, fetchOrder }}>
      {children}
    </OrderContext.Provider>
  )
}
