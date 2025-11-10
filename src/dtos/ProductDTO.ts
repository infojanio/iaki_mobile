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

  // Campos opcionais úteis para o frontend
  subcategory?: {
    id: string
    name: string
  } // <- Quando o backend inclui dados da subcategoria (ideal)

  // Alternativo, usado para frontend se não trouxer relação completa
  subcategoryName?: string

  // Futuro: se quiser trabalhar com categorias diretamente
  categoryId?: string
}

// 🔹 Tipo para uso em telas onde subcategoryName é necessário (ex.: Search, agrupamento)
export type ProductWithSubcategory = ProductDTO & {
  subcategoryName: string // <- obrigatório nesse contexto
}

// 🔹 Tipo para resposta da API de produtos
export interface ProductsResponseDTO {
  data: ProductDTO[]
  // Inclua paginação se necessário: page, total, perPage, etc.
}

// 🔹 Tipo para filtros de produtos na busca
export interface ProductFiltersDTO {
  categoryId?: string
  subcategoryId?: string
  searchTerm?: string
  sortBy?: 'highestCashback' | 'default'
}
