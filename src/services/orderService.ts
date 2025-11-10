import { api } from './api'

export type OrderItemRequest = {
  productId: string
  quantity: number
}

export type OrderItemResponse = {
  productId: string
  name: string
  image: string
  price: number
  quantity: number
  cashbackPercentage: number
  storeId: string
}

export type OrderResponse = {
  items: OrderItemResponse[]
  total: number
  cashbackTotal: number
}

export type CashbackBalanceResponse = {
  available: number
  pending: number
}

export type CashbackTransaction = {
  id: string
  type: 'credit' | 'debit'
  amount: number
  description: string
  createdAt: string
}

export type CreateOrderRequest = {
  storeId: string
  items: OrderItemRequest[]
}

async function getCurrentOrder(): Promise<OrderResponse> {
  const response = await api.get('/order')

  const items = response.data.orderItems.map((item: any) => {
    const product = item.product
    return {
      productId: item.productId,
      name: product?.name || 'Produto',
      image: product?.image || '',
      price: product?.price || 0,
      quantity: item.quantity,
      cashbackPercentage: product?.cashbackPercentage || 0,
      storeId: product?.storeId || '',
    }
  }) as OrderItemResponse[]

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0)

  const cashbackTotal = items.reduce(
    (acc, item) =>
      acc + (item.price * item.quantity * item.cashbackPercentage) / 100,
    0,
  )

  return {
    items,
    total,
    cashbackTotal,
  }
}

export async function fetchOrderById(orderId: string): Promise<OrderResponse> {
  const response = await api.get(`/orders/${orderId}`)

  const items = response.data.orderItems.map((item: any) => {
    const product = item.product
    return {
      productId: item.productId,
      name: product?.name || 'Produto',
      image: product?.image || '',
      price: product?.price || 0,
      quantity: item.quantity,
      cashbackPercentage: product?.cashbackPercentage || 0,
      storeId: product?.storeId || '',
    }
  }) as OrderItemResponse[]

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0)

  const cashbackTotal = items.reduce(
    (acc, item) =>
      acc + (item.price * item.quantity * item.cashbackPercentage) / 100,
    0,
  )

  return {
    items,
    total,
    cashbackTotal,
  }
}

export async function validateOrderWithReceipt(
  orderId: string,
  receipt: string,
) {
  await api.post(`/orders/${orderId}/validate`, {
    receipt,
  })
}

async function createOrder(data: CreateOrderRequest) {
  await api.post('/order', data)
}

async function clearOrder() {
  await api.delete('/order')
}

async function getCashbackBalance(): Promise<CashbackBalanceResponse> {
  const response = await api.get('/cashback/balance')
  return response.data
}

async function getCashbackTransactions(): Promise<CashbackTransaction[]> {
  const response = await api.get('/cashback/transactions')
  return response.data.transactions
}

async function getPendingCashback() {
  const response = await api.get('/orders/pending-cashback')
  return response.data.pendingCashback
}

async function useCashback(amount: number) {
  await api.post('/cashback/use', { amount })
}

export const orderService = {
  getCurrentOrder,
  fetchOrderById,
  validateOrderWithReceipt,
  createOrder,
  clearOrder,
  getCashbackBalance,
  getCashbackTransactions,
  getPendingCashback,
  useCashback,
}
