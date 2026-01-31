// src/dtos/OrderDTO.ts

export interface OrderProductDTO {
  id: string
  name: string
  price: number
  image: string | null
  cashback_percentage: number
}

export interface OrderItemDTO {
  id: string
  quantity: number
  product: OrderProductDTO
}

export interface OrderStoreDTO {
  id: string
  name: string
}

export interface OrderDTO {
  id: string
  store: OrderStoreDTO

  totalAmount: number
  discountApplied: number
  status: 'PENDING' | 'VALIDATED' | 'EXPIRED'

  created_at: string
  validated_at?: string | null

  qrCodeUrl?: string | null
  cashbackAmount?: number

  items: OrderItemDTO[]
}
