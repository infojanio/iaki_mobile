// @dtos/ProductDTO.ts

export type ProductDTO = {
  id: string
  name: string
  description: string
  price: number
  quantity: number
  image: string
  cashback_percentage: number
  store_id: string
  subcategory_id: string
  status: boolean

  // 🔹 NOVO: relação mínima da loja (ESSENCIAL)
  store?: {
    id: string
    name?: string
    cityId: string
  }

  subcategory?: {
    id: string
    name: string
  }

  subcategoryName?: string
  categoryId?: string
}
