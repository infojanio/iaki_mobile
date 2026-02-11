// @dtos/ProductDTO.ts

export type ProductDTO = {
  id: string
  name: string

  description?: string | null
  price: number
  quantity: number
  image?: string
  cashbackPercentage: number
  status: boolean

  // 🔑 loja (backend novo)
  store?: {
    id: string
    name?: string
    cityId: string
  }

  // 🔁 compatibilidade (backend antigo)
  storeId?: string

  subcategoryId?: string
  subcategory?: {
    id: string
    name: string
  }

  subcategoryName?: string
  categoryId?: string
}
