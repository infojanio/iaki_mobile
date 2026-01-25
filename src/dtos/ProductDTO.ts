// @dtos/ProductDTO.ts

export type ProductDTO = {
  id: string
  name: string

  description?: string | null
  price: number
  quantity: number
  image?: string
  cashback_percentage: number
  status: boolean

  // 🔑 loja (backend novo)
  store?: {
    id: string
    name?: string
    cityId: string
  }

  // 🔁 compatibilidade (backend antigo)
  store_id?: string

  subcategory_id?: string
  subcategory?: {
    id: string
    name: string
  }

  subcategoryName?: string
  categoryId?: string
}
